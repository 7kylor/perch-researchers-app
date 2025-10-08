import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { createHash } from 'node:crypto';
import type { Paper } from '../../shared/types.js';
import { fetchCrossrefByDOI } from './crossref.js';

export type ImportResult = { id: string };

export async function importByDOI(
  doi: string,
): Promise<Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>> {
  const work = await fetchCrossrefByDOI(doi);
  if (!work) throw new Error('DOI not found');
  const year = work.issued?.['date-parts']?.[0]?.[0];
  const title = work.title?.[0] ?? doi;
  const authors = (work.author ?? []).map((a) => [a.family, a.given].filter(Boolean).join(', '));
  return {
    title,
    authors,
    venue: work.container_title?.[0],
    year,
    doi,
    source: 'crossref',
    abstract: work.abstract,
    status: 'to_read',
    filePath: undefined,
    textHash: createHash('sha256').update(title).digest('hex'),
  };
}

export async function importPDF(
  absPath: string,
): Promise<Omit<Paper, 'id' | 'addedAt' | 'updatedAt'>> {
  const basename = path.basename(absPath);
  const bytes = await fs.promises.readFile(absPath);
  const textHash = createHash('sha256').update(bytes).digest('hex');
  // Copy into app data folder for managed storage
  const destDir = path.join(app.getPath('userData'), 'files');
  await fs.promises.mkdir(destDir, { recursive: true });
  const dest = path.join(destDir, `${textHash}.pdf`);
  if (!fs.existsSync(dest)) await fs.promises.copyFile(absPath, dest);
  return {
    title: basename,
    authors: [],
    venue: undefined,
    year: undefined,
    doi: undefined,
    source: 'pdf',
    abstract: undefined,
    status: 'to_read',
    filePath: dest,
    textHash,
  };
}
