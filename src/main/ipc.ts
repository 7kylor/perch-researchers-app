import { ipcMain } from 'electron';
import { openDatabase } from './db';
import { randomUUID } from 'node:crypto';
import type { Paper } from '../shared/types';
import { importByDOI, importPDF } from './ingest/importer';
import { PDFImportManager, PDFImportProgress } from './ingest/pdf-import';
import fs from 'node:fs';
import { processPaperForEmbeddings, searchSimilarPapers } from './embeddings/pipeline';
import { createRAGSystem } from './ai/rag';
import { processPaperOCR } from './ocr/batch';

const db = openDatabase();

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
  const safe = sanitizeForFts(query);
  const rows = safe
    ? (db
        .prepare(
          `select p.* from papers p
           join papers_fts f on f.rowid = p.rowid
           where papers_fts match ?
           order by p.addedAt desc`,
        )
        .all(safe) as DBPaperRow[])
    : (db.prepare(`select * from papers order by addedAt desc limit 50`).all() as DBPaperRow[]);
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

ipcMain.handle('ocr:process', async (_e, paperId: string, pdfPath: string) => {
  return await processPaperOCR(paperId, pdfPath);
});

// PDF Import handlers
const pdfImportManager = PDFImportManager.getInstance();

ipcMain.handle(
  'pdf:import-from-url',
  async (_e, url: string, onProgress?: (progress: PDFImportProgress) => void) => {
    return await pdfImportManager.importFromUrl(url, onProgress);
  },
);

ipcMain.handle(
  'pdf:import-from-file',
  async (_e, filePath: string, onProgress?: (progress: PDFImportProgress) => void) => {
    return await pdfImportManager.importFromLocalFile(filePath, onProgress);
  },
);

ipcMain.handle('pdf:cancel-import', async (_e, importId: string) => {
  return pdfImportManager.cancelImport(importId);
});

ipcMain.handle('pdf:get-active-imports', () => {
  return pdfImportManager.getActiveImports();
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
  // Quote tokens and AND them for precise matching
  return tokens.map((t) => `"${t}"`).join(' AND ');
}
