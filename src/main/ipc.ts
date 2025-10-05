import { ipcMain } from 'electron';
import { openDatabase } from './db';
import { randomUUID } from 'node:crypto';
import type { Paper } from '../shared/types';
import { importByDOI, importPDF } from './ingest/importer';
import fs from 'node:fs';
import { randomUUID as uuid } from 'node:crypto';

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
    const id = uuid();
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

ipcMain.handle('annotations:getByPaper', (_e, paperId: string) => {
  const rows = db.prepare(`select * from annotations where paperId = ? order by page, createdAt`).all(paperId);
  return rows.map((r) => ({
    ...r,
    tags: JSON.parse(r.tags as string),
    anchors: JSON.parse(r.anchors as string)
  }));
});

ipcMain.handle('annotations:update', (_e, id: string, updates: Partial<{
  color: string;
  note?: string;
  tags: string[];
}>) => {
  const fields: string[] = [];
  const values: Record<string, unknown> = { id };

  if (updates.color) {
    fields.push('color = @color');
    values.color = updates.color;
  }
  if (updates.note !== undefined) {
    fields.push('note = @note');
    values.note = updates.note ?? null;
  }
  if (updates.tags) {
    fields.push('tags = @tags');
    values.tags = JSON.stringify(updates.tags);
  }

  if (fields.length > 0) {
    db.prepare(`update annotations set ${fields.join(', ')} where id = @id`).run(values);
  }
});

ipcMain.handle('annotations:delete', (_e, id: string) => {
  db.prepare(`delete from annotations where id = ?`).run(id);
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
