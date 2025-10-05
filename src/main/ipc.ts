import { ipcMain } from 'electron';
import { openDatabase } from './db';
import { randomUUID } from 'node:crypto';
import type { Paper } from '../shared/types';
import { importByDOI, importPDF } from './ingest/importer';

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
