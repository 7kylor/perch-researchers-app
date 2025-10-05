import React from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker
GlobalWorkerOptions.workerSrc = workerSrc as unknown as string;

type Props = { filePath: string; paperId: string };

export function PdfReader({ filePath, paperId }: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [pageNum, setPageNum] = React.useState(1);
  const [numPages, setNumPages] = React.useState<number>(1);
  const [drag, setDrag] = React.useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );

  const render = React.useCallback(async () => {
    const data = await window.api.files.read(filePath);
    const pdf = await getDocument({ data }).promise;
    setNumPages(pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
      canvas,
    }).promise;
  }, [filePath, pageNum]);

  React.useEffect(() => {
    void render();
  }, [render]);

  return (
    <div>
      <div className="grid">
        <button type="button" className="btn" onClick={() => setPageNum((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <div className="muted">
          {pageNum} / {numPages}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
        >
          Next
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', borderRadius: 8 }}
          onMouseDown={(e) => {
            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            setDrag({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: 0, h: 0 });
          }}
          onMouseMove={(e) => {
            if (!drag) return;
            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            setDrag({
              ...drag,
              w: e.clientX - rect.left - drag.x,
              h: e.clientY - rect.top - drag.y,
            });
          }}
          onMouseUp={async (e) => {
            if (!drag) return;
            const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
            const normalized = {
              x: drag.x / rect.width,
              y: drag.y / rect.height,
              width: drag.w / rect.width,
              height: drag.h / rect.height,
            };
            setDrag(null);
            await window.api.annotations.add({
              paperId,
              page: pageNum,
              color: '#ffda79',
              tags: [],
              anchors: { region: { page: pageNum, ...normalized } },
            });
          }}
        />
        {drag && (
          <div
            style={{
              position: 'absolute',
              left: drag.x,
              top: drag.y,
              width: drag.w,
              height: drag.h,
              border: '2px solid #ffda79',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
