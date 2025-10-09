import { ipcMain } from 'electron';
import { TextDecoder } from 'node:util';
import { openDatabase } from './db.js';
import { randomUUID } from 'node:crypto';
import type { Paper } from '../shared/types.js';
import { importByDOI, importPDF } from './ingest/importer.js';
import { PDFImportManager } from './ingest/pdf-import.js';
import { URLPaperDetector } from './ingest/url-paper-detector.js';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { processPaperForEmbeddings, searchSimilarPapers } from './embeddings/pipeline.js';
import { llamaServerManager, type LlamaServerConfig } from './local-ai/llama-server.js';
import { createRAGSystem } from './ai/rag.js';
import { processPaperOCR } from './ocr/batch.js';
import { randomUUID as uuidv4 } from 'node:crypto';
import {
  BUILTIN_ALL,
  BUILTIN_RECENT,
  BUILTIN_CATEGORIES,
  type CategoryCount,
  type SidebarListResponse,
  type SidebarNode,
  type SidebarPrefs,
} from '../shared/sidebar.js';

const db = openDatabase();

// Simple entitlement gating (placeholder for real licensing)
let isPro = false;

function insertPaper(payload: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>): string {
  const now = new Date().toISOString();
  const id = randomUUID();
  const stmt = db.prepare(
    `insert into papers (id, title, authors, venue, year, doi, source, abstract, status, filePath, textHash, addedAt, updatedAt)
     values (@id, @title, @authors, @venue, @year, @doi, @source, @abstract, @status, @filePath, @textHash, @addedAt, @updatedAt)`,
  );
  stmt.run({
    id,
    title: payload.title,
    authors: JSON.stringify(payload.authors),
    venue: payload.venue ?? null,
    year: payload.year ?? null,
    doi: payload.doi ?? null,
    source: payload.source ?? null,
    abstract: payload.abstract ?? null,
    status: payload.status,
    filePath: payload.filePath ?? null,
    textHash: payload.textHash,
    addedAt: now,
    updatedAt: now,
  });
  return id;
}

ipcMain.handle('papers:add', (_e, payload: Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>) =>
  insertPaper(payload),
);

type DBPaperRow = Omit<Paper, 'authors'> & { authors: string };

ipcMain.handle('papers:search', (_e, query: string) => {
  const trimmedQuery = query?.trim();
  const safe = trimmedQuery ? sanitizeForFts(trimmedQuery) : null;
  let rows: DBPaperRow[] = [];

  if (safe) {
    try {
      // Try FTS search first
      rows = db
        .prepare(
          `select p.* from papers p
           join papers_fts f on f.rowid = p.rowid
           where f match ?
           order by p.addedAt desc`,
        )
        .all(safe) as DBPaperRow[];
    } catch {
      rows = [];
    }

    // If no results from FTS, try fallback LIKE search
    if (rows.length === 0) {
      const likeQuery = `%${trimmedQuery.toLowerCase()}%`;
      try {
        // Extract authors from JSON for better matching
        rows = db
          .prepare(
            `select * from papers
             where lower(title) like ?
             or lower(replace(replace(replace(authors, '"', ''), '[', ''), ']', '')) like ?
             or lower(abstract) like ?
             order by addedAt desc limit 50`,
          )
          .all(likeQuery, likeQuery, likeQuery) as DBPaperRow[];
      } catch {
        rows = [];
      }
    }
  } else {
    // No search query, return all papers
    rows = db.prepare(`select * from papers order by addedAt desc limit 50`).all() as DBPaperRow[];
  }

  return rows.map(
    (r: DBPaperRow): Paper => ({
      ...r,
      authors: JSON.parse(r.authors),
    }),
  );
});

ipcMain.handle('import:doi', async (_e, doi: string) => {
  const partial = await importByDOI(doi);
  return insertPaper(partial);
});

ipcMain.handle('import:pdf', async (_e, absPath: string) => {
  const partial = await importPDF(absPath);
  return insertPaper(partial);
});

ipcMain.handle('papers:get', (_e, id: string) => {
  const row = db.prepare(`select * from papers where id = ?`).get(id) as DBPaperRow | undefined;

  if (!row) return null;
  return { ...row, authors: JSON.parse(row.authors) } as Paper;
});

ipcMain.handle('papers:delete', (_e, id: string) => {
  // First delete all annotations for this paper
  db.prepare(`delete from annotations where paperId = ?`).run(id);
  // Then delete the paper
  db.prepare(`delete from papers where id = ?`).run(id);
  return true;
});

ipcMain.handle('file:read', async (_e, absPath: string) => {
  return fs.promises.readFile(absPath);
});

ipcMain.handle('file:write', async (_e, absPath: string, data: ArrayBuffer | string) => {
  if (typeof data === 'string') {
    await fs.promises.writeFile(absPath, data);
  } else {
    await fs.promises.writeFile(absPath, Buffer.from(data as ArrayBuffer));
  }
  return true;
});

ipcMain.handle(
  'annotations:add',
  (
    _e,
    payload: {
      paperId: string;
      page: number;
      color: string;
      note?: string;
      tags: string[];
      anchors: { region?: { page: number; x: number; y: number; width: number; height: number } };
    },
  ) => {
    const id = randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      `insert into annotations (id, paperId, page, color, note, tags, anchors, createdAt)
             values (@id, @paperId, @page, @color, @note, @tags, @anchors, @createdAt)`,
    ).run({
      id,
      paperId: payload.paperId,
      page: payload.page,
      color: payload.color,
      note: payload.note ?? null,
      tags: JSON.stringify(payload.tags),
      anchors: JSON.stringify(payload.anchors),
      createdAt: now,
    });
    return id;
  },
);

type DBAnnotationRow = {
  id: string;
  paperId: string;
  page: number;
  color: string;
  note?: string;
  tags: string;
  anchors: string;
  createdAt: string;
};

ipcMain.handle('annotations:getByPaper', (_e, paperId: string) => {
  const rows = db
    .prepare(`select * from annotations where paperId = ? order by page, createdAt`)
    .all(paperId) as DBAnnotationRow[];
  return rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags),
    anchors: JSON.parse(r.anchors),
  }));
});

ipcMain.handle(
  'annotations:update',
  (
    _e,
    id: string,
    updates: Partial<{
      color: string;
      note?: string;
      tags: string[];
    }>,
  ) => {
    const fields: string[] = [];
    const values: Record<string, unknown> = { id };

    if (updates.color) {
      fields.push('color = @color');
      values['color'] = updates.color;
    }
    if (updates.note !== undefined) {
      fields.push('note = @note');
      values['note'] = updates.note ?? null;
    }
    if (updates.tags) {
      fields.push('tags = @tags');
      values['tags'] = JSON.stringify(updates.tags);
    }

    if (fields.length > 0) {
      db.prepare(`update annotations set ${fields.join(', ')} where id = @id`).run(values);
    }
  },
);

ipcMain.handle('annotations:delete', (_e, id: string) => {
  db.prepare(`delete from annotations where id = ?`).run(id);
});

ipcMain.handle('embeddings:process', async (_e, paperId: string, text: string) => {
  await processPaperForEmbeddings(paperId, text);
});

ipcMain.handle('search:similar', async (_e, query: string, limit = 10) => {
  return await searchSimilarPapers(query, limit);
});

// RAG system instance (global for the app)
let ragSystem: ReturnType<typeof createRAGSystem> | null = null;

ipcMain.handle('ai:init', (_e, type: 'openai' | 'local', apiKey?: string) => {
  ragSystem = createRAGSystem(type, apiKey);
});

ipcMain.handle('ai:summarize', async (_e, paperId: string) => {
  if (!ragSystem) return 'AI not initialized';
  ragSystem.incrementUsage();
  return await ragSystem.summarizePaper(paperId);
});

ipcMain.handle('ai:question', async (_e, question: string, paperId?: string) => {
  if (!ragSystem) return 'AI not initialized';
  ragSystem.incrementUsage();
  return await ragSystem.answerQuestion(question, paperId);
});

ipcMain.handle('ai:related', async (_e, query: string) => {
  if (!ragSystem) return [];
  ragSystem.incrementUsage();
  return await ragSystem.generateRelatedPapers(query);
});

ipcMain.handle('ai:usage', () => {
  return ragSystem?.getUsageCount() || 0;
});

// Local AI: llama.cpp server controls
ipcMain.handle('local-ai:start', async (_e, cfg: LlamaServerConfig) => {
  if (!isPro) throw new Error('Pro required for local AI');
  await llamaServerManager.start(cfg);
  return llamaServerManager.url;
});

ipcMain.handle('local-ai:stop', async () => {
  await llamaServerManager.stop();
  return true;
});

ipcMain.handle('local-ai:status', async () => {
  return { running: llamaServerManager.isRunning(), url: llamaServerManager.url };
});

// Local AI: download GGUF model
ipcMain.handle(
  'local-ai:download-model',
  async (
    e,
    payload: {
      url: string;
      destDir: string;
    },
  ) => {
    const { url, destDir } = payload;
    const downloadId = uuidv4();
    const fileName = path.basename(new URL(url).pathname);
    await fs.promises.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, fileName);

    const webContents = e.sender;
    webContents.send('local-ai:download:started', { id: downloadId, fileName, destPath });

    await new Promise<void>((resolve, reject) => {
      https
        .get(url, (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            // Handle redirect
            https.get(res.headers.location, (redir) => handleStream(redir)).on('error', reject);
            return;
          }
          handleStream(res);
        })
        .on('error', (err) => reject(err));

      function handleStream(res: any) {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }
        const total = Number(res.headers['content-length'] || 0);
        let received = 0;
        const file = fs.createWriteStream(destPath);
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (total > 0) {
            const pct = Math.round((received / total) * 100);
            webContents.send('local-ai:download:progress', {
              id: downloadId,
              received,
              total,
              percent: pct,
            });
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
        file.on('error', (err) => reject(err));
      }
    });

    e.sender.send('local-ai:download:done', { id: downloadId, filePath: destPath });
    return destPath;
  },
);

// --------------------------------------
// AI Chat Streaming (OpenAI-compatible)
// --------------------------------------
const chatControllers = new Map<string, AbortController>();

ipcMain.handle(
  'ai:chat:start',
  async (
    e,
    params: {
      mode: 'openai' | 'local';
      apiKey?: string;
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      temperature?: number;
    },
  ) => {
    if (!isPro && params.mode === 'local') throw new Error('Pro required for local chat');
    const chatId = uuidv4();
    const controller = new AbortController();
    chatControllers.set(chatId, controller);

    // Async stream without blocking the handler
    void (async () => {
      const webContents = e.sender;
      try {
        if (params.mode === 'openai') {
          if (!params.apiKey) throw new Error('OpenAI API key required');
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${params.apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: params.messages,
              temperature: params.temperature ?? 0.2,
              stream: true,
            }),
            signal: controller.signal,
          });
          await streamSSE(res, (delta) => {
            webContents.send('ai:chat:chunk', { chatId, delta });
          });
          webContents.send('ai:chat:done', { chatId });
        } else {
          // local llama.cpp
          const status = { running: llamaServerManager.isRunning(), url: llamaServerManager.url };
          if (!status.running || !status.url) throw new Error('Local LLM not running');
          const res = await fetch(`${status.url}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'local',
              messages: params.messages,
              temperature: params.temperature ?? 0.2,
              stream: true,
            }),
            signal: controller.signal,
          });
          await streamSSE(res, (delta) => {
            webContents.send('ai:chat:chunk', { chatId, delta });
          });
          webContents.send('ai:chat:done', { chatId });
        }
      } catch (err) {
        const message = (err as Error)?.message || 'Unknown error';
        webContents.send('ai:chat:error', { chatId, error: message });
      } finally {
        chatControllers.delete(chatId);
      }
    })();

    return chatId;
  },
);

ipcMain.handle('ai:chat:stop', async (_e, chatId: string) => {
  const ctrl = chatControllers.get(chatId);
  if (ctrl) ctrl.abort();
  return true;
});

async function streamSSE(
  res: globalThis.Response,
  onDelta: (delta: string) => void,
): Promise<void> {
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Stream error: ${res.status} ${res.statusText} ${errText}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line && line.startsWith('data:')) {
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const obj = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = obj.choices?.[0]?.delta?.content ?? '';
          if (delta) onDelta(delta);
        } catch {
          // ignore
        }
      }
      newlineIndex = buffer.indexOf('\n');
    }
  }
}

// --------------------------------------
// Licensing (placeholder)
// --------------------------------------
ipcMain.handle('license:set', (_e, pro: boolean) => {
  isPro = !!pro;
});

ipcMain.handle('license:get', () => {
  return { pro: isPro };
});

ipcMain.handle('ocr:process', async (_e, paperId: string, pdfPath: string) => {
  return await processPaperOCR(paperId, pdfPath);
});

// PDF Import handlers
const pdfImportManager = PDFImportManager.getInstance();
const urlPaperDetector = new URLPaperDetector();

ipcMain.handle('pdf:import-from-url', async (_e, url: string) => {
  return await pdfImportManager.importFromUrl(url);
});

ipcMain.handle('pdf:import-from-file', async (_e, filePath: string) => {
  return await pdfImportManager.importFromLocalFile(filePath);
});

ipcMain.handle('pdf:cancel-import', async (_e, importId: string) => {
  return pdfImportManager.cancelImport(importId);
});

ipcMain.handle('pdf:get-active-imports', () => {
  return pdfImportManager.getActiveImports();
});

// URL Paper Detection handlers
ipcMain.handle('url:detect-paper', async (_e, url: string) => {
  return await urlPaperDetector.detectFromUrl(url);
});

ipcMain.handle('url:detect-arxiv-id', async (_e, arxivId: string) => {
  return await urlPaperDetector.detectFromArxivId(arxivId);
});

// Dialog handlers
ipcMain.handle('dialog:showOpenDialog', async (_e, options: Electron.OpenDialogOptions) => {
  const { dialog } = await import('electron');
  return await dialog.showOpenDialog(options);
});

function sanitizeForFts(input: string): string | null {
  const normalized = input
    .toLowerCase()
    // Replace any non-letter/number with space to avoid FTS syntax errors
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  if (!normalized) return null;
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  // Use OR matching for more flexible search results
  // Quote each token to handle special characters and phrases
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(' OR ');
}

// --------------------------------------
// Sidebar IPC handlers
// --------------------------------------
function nowIso(): string {
  return new Date().toISOString();
}

function getSidebarNodes(): SidebarNode[] {
  const rows = db
    .prepare(
      `select id, parentId, type, name, iconKey, colorHex, orderIndex, createdAt, updatedAt from sidebar_nodes order by parentId asc, orderIndex asc`,
    )
    .all() as SidebarNode[];
  return rows;
}

function getSidebarPrefs(): SidebarPrefs {
  const row = db
    .prepare(`select payload, updatedAt from sidebar_prefs where id = 'default'`)
    .get() as { payload: string; updatedAt: string } | undefined;
  if (!row) {
    const payload: SidebarPrefs = {
      collapsedNodeIds: [],
      sidebarCollapsed: false,
      version: 1,
      updatedAt: nowIso(),
    };
    db.prepare(
      `insert into sidebar_prefs (id, payload, updatedAt) values ('default', @payload, @updatedAt)`,
    ).run({
      payload: JSON.stringify(payload),
      updatedAt: payload.updatedAt,
    });
    return payload;
  }
  return { ...(JSON.parse(row.payload) as SidebarPrefs), updatedAt: row.updatedAt };
}

function computeCounts(): CategoryCount[] {
  const counts: CategoryCount[] = [];
  // Built-ins
  const allCount = db.prepare(`select count(1) as c from papers`).get() as { c: number };
  counts.push({ nodeId: BUILTIN_ALL, paperCount: allCount.c });
  const recentCount = db
    .prepare(`select count(1) as c from papers where addedAt >= date('now', '-30 days')`)
    .get() as { c: number };
  counts.push({ nodeId: BUILTIN_RECENT, paperCount: recentCount.c });
  const unfiledCount = db
    .prepare(
      `select count(1) as c from papers p left join paper_categories pc on p.id = pc.paperId where pc.paperId is null`,
    )
    .get() as { c: number };
  counts.push({ nodeId: BUILTIN_CATEGORIES, paperCount: unfiledCount.c });

  // Labels
  const byNode = db
    .prepare(`select nodeId, count(1) as c from paper_categories group by nodeId`)
    .all() as Array<{ nodeId: string; c: number }>;
  for (const row of byNode) counts.push({ nodeId: row.nodeId, paperCount: row.c });
  return counts;
}

ipcMain.handle('sidebar:list', (): SidebarListResponse => {
  return { nodes: getSidebarNodes(), prefs: getSidebarPrefs(), counts: computeCounts() };
});

ipcMain.handle(
  'sidebar:create',
  (
    _e,
    partial: Partial<SidebarNode> & {
      type: 'folder' | 'label';
      name: string;
      parentId?: string | null;
    },
  ) => {
    const id = randomUUID();
    const now = nowIso();
    const parentId: string | null = partial.parentId ?? null;
    let orderIndex = 0;
    if (parentId === null) {
      const row = db
        .prepare(
          `select coalesce(max(orderIndex), -1) + 1 as nextIdx from sidebar_nodes where parentId is null`,
        )
        .get() as { nextIdx: number } | undefined;
      orderIndex = row?.nextIdx ?? 0;
    } else {
      const row = db
        .prepare(
          `select coalesce(max(orderIndex), -1) + 1 as nextIdx from sidebar_nodes where parentId = @parentId`,
        )
        .get({ parentId }) as { nextIdx: number } | undefined;
      orderIndex = row?.nextIdx ?? 0;
    }
    db.prepare(
      `insert into sidebar_nodes (id, parentId, type, name, iconKey, colorHex, orderIndex, createdAt, updatedAt)
       values (@id, @parentId, @type, @name, @iconKey, @colorHex, @orderIndex, @createdAt, @updatedAt)`,
    ).run({
      id,
      parentId,
      type: partial.type,
      name: partial.name,
      iconKey: partial.iconKey ?? null,
      colorHex: partial.colorHex ?? null,
      orderIndex,
      createdAt: now,
      updatedAt: now,
    });
    return db
      .prepare(
        `select id, parentId, type, name, iconKey, colorHex, orderIndex, createdAt, updatedAt from sidebar_nodes where id = ?`,
      )
      .get(id) as SidebarNode;
  },
);

ipcMain.handle(
  'sidebar:update',
  (_e, id: string, updates: Partial<Pick<SidebarNode, 'name' | 'iconKey' | 'colorHex'>>) => {
    const fields: string[] = [];
    const values: Record<string, unknown> = { id, updatedAt: nowIso() };
    if (updates.name !== undefined) {
      fields.push('name = @name');
      values['name'] = updates.name;
    }
    if (updates.iconKey !== undefined) {
      fields.push('iconKey = @iconKey');
      values['iconKey'] = updates.iconKey;
    }
    if (updates.colorHex !== undefined) {
      fields.push('colorHex = @colorHex');
      values['colorHex'] = updates.colorHex;
    }
    fields.push('updatedAt = @updatedAt');
    if (fields.length > 0) {
      db.prepare(`update sidebar_nodes set ${fields.join(', ')} where id = @id`).run(values);
    }
  },
);

ipcMain.handle('sidebar:delete', (_e, id: string) => {
  function deleteRecursive(nodeId: string): void {
    const childIds = db
      .prepare(`select id from sidebar_nodes where parentId = ?`)
      .all(nodeId) as Array<{ id: string }>;
    for (const c of childIds) deleteRecursive(c.id);
    db.prepare(`delete from paper_categories where nodeId = ?`).run(nodeId);
    db.prepare(`delete from sidebar_nodes where id = ?`).run(nodeId);
  }
  deleteRecursive(id);
});

ipcMain.handle('sidebar:move', (_e, id: string, newParentId: string | null, newIndex: number) => {
  const now = nowIso();
  let siblings: Array<{ id: string }>;
  if (newParentId === null) {
    siblings = db
      .prepare(`select id from sidebar_nodes where parentId is null order by orderIndex asc`)
      .all() as Array<{ id: string }>;
  } else {
    siblings = db
      .prepare(`select id from sidebar_nodes where parentId = @parentId order by orderIndex asc`)
      .all({ parentId: newParentId }) as Array<{ id: string }>;
  }
  const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length));
  for (let i = clampedIndex; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling) {
      db.prepare(
        `update sidebar_nodes set orderIndex = orderIndex + 1, updatedAt = @now where id = @id`,
      ).run({
        id: sibling.id,
        now,
      });
    }
  }
  db.prepare(
    `update sidebar_nodes set parentId = @parentId, orderIndex = @orderIndex, updatedAt = @now where id = @id`,
  ).run({ id, parentId: newParentId, orderIndex: clampedIndex, now });
});

ipcMain.handle('sidebar:prefs:get', () => getSidebarPrefs());
ipcMain.handle('sidebar:prefs:set', (_e, prefs: SidebarPrefs) => {
  db.prepare(
    `insert into sidebar_prefs (id, payload, updatedAt) values ('default', @payload, @updatedAt)
     on conflict(id) do update set payload = excluded.payload, updatedAt = excluded.updatedAt`,
  ).run({ payload: JSON.stringify(prefs), updatedAt: prefs.updatedAt });
});

// --------------------------------------
// Paper listing by category
// --------------------------------------
function getDescendantLabelNodeIds(rootId: string): string[] {
  // BFS through sidebar_nodes, collecting labels under root
  const labels: string[] = [];
  const queue: string[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const rows = db
      .prepare(`select id, type from sidebar_nodes where parentId is ?`)
      .all(current) as Array<{ id: string; type: 'folder' | 'label' }>;
    for (const r of rows) {
      if (r.type === 'label') labels.push(r.id);
      if (r.type === 'folder') queue.push(r.id);
    }
  }
  return labels;
}

ipcMain.handle('papers:listByCategory', (_e, nodeId: string, limit = 50) => {
  let rows: DBPaperRow[] = [];
  if (nodeId === BUILTIN_ALL) {
    rows = db
      .prepare(`select * from papers order by addedAt desc limit ?`)
      .all(limit) as DBPaperRow[];
  } else if (nodeId === BUILTIN_RECENT) {
    rows = db
      .prepare(
        `select * from papers where addedAt >= date('now', '-30 days') order by addedAt desc limit ?`,
      )
      .all(limit) as DBPaperRow[];
  } else if (nodeId === BUILTIN_CATEGORIES) {
    rows = db
      .prepare(
        `select p.* from papers p left join paper_categories pc on p.id = pc.paperId where pc.paperId is null order by p.addedAt desc limit ?`,
      )
      .all(limit) as DBPaperRow[];
  } else {
    const node = db.prepare(`select id, type from sidebar_nodes where id = ?`).get(nodeId) as
      | { id: string; type: 'folder' | 'label' }
      | undefined;
    if (!node) return [];
    let labelIds: string[] = [];
    if (node.type === 'label') labelIds = [node.id];
    else labelIds = getDescendantLabelNodeIds(node.id);
    if (labelIds.length === 0) return [];
    const placeholders = labelIds.map(() => '?').join(',');
    rows = db
      .prepare(
        `select distinct p.* from papers p join paper_categories pc on p.id = pc.paperId where pc.nodeId in (${placeholders}) order by p.addedAt desc limit ?`,
      )
      .all(...labelIds, limit) as DBPaperRow[];
  }
  return rows.map((r) => ({ ...r, authors: JSON.parse(r.authors) }) as Paper);
});
