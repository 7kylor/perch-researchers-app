// PDF rendering worker using MuPDF.js
// - Moves parsing and rendering off the UI thread
// - Caches per-page DisplayLists with a small LRU policy

/// <reference lib="webworker" />
//

// Use runtime dynamic import to set locateFile for WASM in Vite/web worker
import type * as MuTypes from 'mupdf';

let mupdfRT: typeof import('mupdf') | null = null;
async function ensureMuPDF(): Promise<typeof import('mupdf')> {
  if (mupdfRT) return mupdfRT;
  // Let MuPDF's wasm loader compute the URL from import.meta.url (works under Vite without deep import)
  (
    globalThis as unknown as {
      $libmupdf_wasm_Module?: { locateFile?: (p: string, prefix?: string) => string };
    }
  ).$libmupdf_wasm_Module = {
    locateFile: (p: string, prefix?: string) => {
      if (p.endsWith('.wasm')) {
        // In Vite dev, serve from /@fs absolute path to ensure correct MIME and availability
        const isHttp = (
          globalThis as unknown as { location?: { protocol?: string } }
        ).location?.protocol?.startsWith('http');
        if (isHttp) {
          const devFs = '/@fs/Users/taher/researchers-app/node_modules/mupdf/dist/mupdf-wasm.wasm';
          const origin =
            (globalThis as unknown as { location?: { origin?: string } }).location?.origin || '';
          return new URL(devFs, origin).href;
        }
        try {
          return new URL(p, prefix || import.meta.url).href;
        } catch {
          return p;
        }
      }
      return p;
    },
  };
  mupdfRT = await import('mupdf');
  return mupdfRT;
}

type WorkerRequest =
  | { id: number; type: 'open'; payload: { bytes: ArrayBuffer } }
  | { id: number; type: 'getPageInfo'; payload: { pageIndex: number } }
  | { id: number; type: 'buildDisplayList'; payload: { pageIndex: number } }
  | {
      id: number;
      type: 'renderPage';
      payload: { pageIndex: number; scale: number };
    }
  | { id: number; type: 'search'; payload: { pageIndex: number; query: string } }
  | {
      id: number;
      type: 'renderTile';
      payload: {
        pageIndex: number;
        scale: number;
        tileRect: { x: number; y: number; width: number; height: number };
      };
    }
  | {
      id: number;
      type: 'stHighlight';
      payload: { pageIndex: number; p: [number, number]; q: [number, number] };
    }
  | {
      id: number;
      type: 'stCopy';
      payload: { pageIndex: number; p: [number, number]; q: [number, number] };
    }
  | { id: number; type: 'destroy'; payload?: Record<string, never> };

type WorkerResponse =
  | { id: number; result: unknown; error?: undefined }
  | { id: number; error: string; result?: undefined };

// Simple LRU cache for DisplayLists
class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map = new Map<K, V>();

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    // refresh key
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V, onEvict?: (val: V) => void): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    }
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value as K;
      const oldestVal = this.map.get(oldestKey) as V;
      this.map.delete(oldestKey);
      if (onEvict) onEvict(oldestVal);
    }
  }

  delete(key: K, onDelete?: (val: V) => void): void {
    const val = this.map.get(key);
    if (val !== undefined) {
      this.map.delete(key);
      if (onDelete) onDelete(val);
    }
  }

  clear(onClear?: (val: V) => void): void {
    if (onClear) {
      for (const v of this.map.values()) onClear(v);
    }
    this.map.clear();
  }
}

let doc: MuTypes.PDFDocument | null = null;
const displayListCache = new LRUCache<number, MuTypes.DisplayList>(8);
const structuredTextCache = new LRUCache<number, MuTypes.StructuredText>(8);

function post(message: WorkerResponse, transfer?: (ArrayBuffer | SharedArrayBuffer)[]): void {
  (globalThis as unknown as { postMessage: (msg: unknown, t?: unknown[]) => void }).postMessage(
    message,
    (transfer as unknown as unknown[]) || [],
  );
}

function destroyDisplayList(dl: MuTypes.DisplayList | undefined): void {
  try {
    dl?.destroy?.();
  } catch {
    // ignore
  }
}

function destroyDoc(): void {
  try {
    displayListCache.clear(destroyDisplayList);
    structuredTextCache.clear((st) => {
      try {
        st?.destroy?.();
      } catch {
        // ignore
      }
    });
    doc?.destroy?.();
  } catch {
    // ignore
  } finally {
    doc = null;
  }
}

async function ensureDisplayList(pageIndex: number): Promise<MuTypes.DisplayList> {
  const cached = displayListCache.get(pageIndex);
  if (cached) return cached;

  if (!doc) throw new Error('Document not opened');
  const page = doc.loadPage(pageIndex);
  try {
    const dl = page.toDisplayList(true);
    displayListCache.set(pageIndex, dl, destroyDisplayList);
    return dl;
  } finally {
    page.destroy();
  }
}

async function renderDisplayListToRGBA(
  dl: MuTypes.DisplayList,
  scale: number,
): Promise<{ width: number; height: number; rgba: Uint8Array }> {
  const _mupdf = await ensureMuPDF();
  const m = _mupdf.Matrix.scale(scale, scale);
  const pix = dl.toPixmap(m, _mupdf.ColorSpace.DeviceBGR, true);
  const width = pix.getWidth();
  const height = pix.getHeight();
  // Normalize to tightly packed RGBA with no extra stride
  const rgbaClamped = (pix as unknown as { getPixels: () => Uint8ClampedArray }).getPixels();
  const stride = (pix as unknown as { getStride: () => number }).getStride();
  const components = (
    pix as unknown as { getNumberOfComponents: () => number }
  ).getNumberOfComponents();
  const hasAlpha = (pix as unknown as { getAlpha: () => number }).getAlpha() ? true : false;
  const out = new Uint8Array(width * height * 4);
  const bpp = components + (hasAlpha ? 1 : 0);
  if (bpp === 4) {
    // Assume source is BGRA; convert to RGBA
    for (let row = 0; row < height; row++) {
      const srcRow = row * stride;
      const dstRow = row * width * 4;
      for (let x = 0; x < width; x++) {
        const s = srcRow + x * 4;
        const d = dstRow + x * 4;
        out[d + 0] = rgbaClamped[s + 2] ?? 0; // R
        out[d + 1] = rgbaClamped[s + 1] ?? 0; // G
        out[d + 2] = rgbaClamped[s + 0] ?? 0; // B
        out[d + 3] = rgbaClamped[s + 3] ?? 255; // A
      }
    }
  } else if (bpp === 3) {
    // Assume source is BGR; convert to RGBA
    for (let row = 0; row < height; row++) {
      const srcRow = row * stride;
      const dstRow = row * width * 4;
      for (let x = 0; x < width; x++) {
        const s = srcRow + x * 3;
        const d = dstRow + x * 4;
        out[d + 0] = rgbaClamped[s + 2] ?? 0;
        out[d + 1] = rgbaClamped[s + 1] ?? 0;
        out[d + 2] = rgbaClamped[s + 0] ?? 0;
        out[d + 3] = 255;
      }
    }
  } else {
    // Unexpected layout; copy safely
    for (let row = 0; row < height; row++) {
      const srcRow = row * stride;
      const dstRow = row * width * 4;
      for (let x = 0; x < width; x++) {
        const s = srcRow + x * bpp;
        const d = dstRow + x * 4;
        out[d + 0] = rgbaClamped[s + 0] ?? 0;
        out[d + 1] = rgbaClamped[s + 1] ?? 0;
        out[d + 2] = rgbaClamped[s + 2] ?? 0;
        out[d + 3] = bpp > 3 ? (rgbaClamped[s + 3] ?? 255) : 255;
      }
    }
  }
  pix.destroy();
  return { width, height, rgba: out };
}

function getPageSizePts(idx: number): { widthPts: number; heightPts: number } {
  if (!doc) throw new Error('Document not opened');
  const page = doc.loadPage(idx);
  try {
    const bounds = page.getBounds();
    const widthPts = bounds[2] - bounds[0];
    const heightPts = bounds[3] - bounds[1];
    return { widthPts, heightPts };
  } finally {
    page.destroy();
  }
}

async function ensureStructuredText(pageIndex: number): Promise<MuTypes.StructuredText> {
  const cache = structuredTextCache.get(pageIndex);
  if (cache) return cache;
  if (!doc) throw new Error('Document not opened');
  const page = doc.loadPage(pageIndex);
  try {
    const st = page.toStructuredText('preserve-spans');
    structuredTextCache.set(pageIndex, st, (s) => {
      try {
        s?.destroy?.();
      } catch {
        // ignore
      }
    });
    return st;
  } finally {
    page.destroy();
  }
}

function _extractTileRGBA(
  full: { width: number; height: number; rgba: Uint8Array },
  tile: { x: number; y: number; width: number; height: number },
): { width: number; height: number; rgba: Uint8Array } {
  const bytesPerPixel = 4;
  const { width: fullW, height: fullH, rgba } = full;
  const { x, y, width, height } = tile;
  const clampedX = Math.max(0, Math.min(x, fullW));
  const clampedY = Math.max(0, Math.min(y, fullH));
  const clampedW = Math.max(0, Math.min(width, fullW - clampedX));
  const clampedH = Math.max(0, Math.min(height, fullH - clampedY));
  const out = new Uint8Array(clampedW * clampedH * bytesPerPixel);
  if (clampedW === 0 || clampedH === 0) return { width: 0, height: 0, rgba: out };
  for (let row = 0; row < clampedH; row++) {
    const srcStart = ((clampedY + row) * fullW + clampedX) * bytesPerPixel;
    const srcEnd = srcStart + clampedW * bytesPerPixel;
    const dstStart = row * clampedW * bytesPerPixel;
    out.set(rgba.subarray(srcStart, srcEnd), dstStart);
  }
  return { width: clampedW, height: clampedH, rgba: out };
}

// In web worker context, MessageEvent is available at runtime but may not be in TS lib without DOM lib.
// Use a loose type to avoid TS complaining while keeping runtime behavior.
globalThis.onmessage = async (e: unknown) => {
  const data = (e as { data: WorkerRequest }).data;
  const { id, type, payload } = data;
  try {
    switch (type) {
      case 'open': {
        destroyDoc();
        {
          const mupdf = await ensureMuPDF();
          doc = mupdf.PDFDocument.openDocument(payload.bytes as ArrayBuffer, 'application/pdf');
        }
        const pageCount = doc.countPages();
        post({ id, result: { pageCount } });
        break;
      }
      case 'getPageInfo': {
        const { widthPts, heightPts } = getPageSizePts(payload.pageIndex);
        post({ id, result: { widthPts, heightPts } });
        break;
      }
      case 'buildDisplayList': {
        const dl = await ensureDisplayList(payload.pageIndex);
        // keep in cache; return true
        post({ id, result: !!dl });
        break;
      }
      case 'renderPage': {
        const _m = await ensureMuPDF();
        const dl = await ensureDisplayList(payload.pageIndex);
        const m = _m.Matrix.scale(payload.scale, payload.scale);
        const pix = dl.toPixmap(m, _m.ColorSpace.DeviceRGB, true);
        const width = pix.getWidth();
        const height = pix.getHeight();
        const png = (pix as unknown as { asPNG: () => Uint8Array }).asPNG();
        pix.destroy();
        post({ id, result: { width, height, png } }, [png.buffer as unknown as ArrayBuffer]);
        break;
      }
      case 'renderTile': {
        const dl = await ensureDisplayList(payload.pageIndex);
        const full = await renderDisplayListToRGBA(dl, payload.scale);
        const tileOut = _extractTileRGBA(full, payload.tileRect);
        post({ id, result: tileOut }, [tileOut.rgba.buffer as unknown as ArrayBuffer]);
        break;
      }
      case 'search': {
        if (!doc) throw new Error('Document not opened');
        const page = doc.loadPage(payload.pageIndex);
        try {
          const quads = page.search(payload.query) || [];
          post({ id, result: quads });
        } finally {
          page.destroy();
        }
        break;
      }
      case 'stHighlight': {
        const st = await ensureStructuredText(payload.pageIndex);
        const quads = st.highlight(payload.p, payload.q) || [];
        post({ id, result: quads });
        break;
      }
      case 'stCopy': {
        const st = await ensureStructuredText(payload.pageIndex);
        const text = st.copy(payload.p, payload.q) || '';
        post({ id, result: text });
        break;
      }
      case 'destroy': {
        destroyDoc();
        post({ id, result: true });
        break;
      }
      default:
        post({ id, error: `Unknown request type: ${String(type as unknown as string)}` });
    }
  } catch (err) {
    post({ id, error: (err as Error)?.message || String(err) });
  }
};
