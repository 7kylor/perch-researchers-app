import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';

const DB_FILE = 'library.db';

function getDbPath(): string {
  const dir = app.getPath('userData');
  return path.join(dir, DB_FILE);
}

export function openDatabase(): Database.Database {
  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.exec(`
    create table if not exists papers (
      id text primary key,
      title text not null,
      authors text not null,
      venue text,
      year integer,
      doi text,
      source text,
      abstract text,
      status text not null,
      filePath text,
      textHash text not null,
      addedAt text not null,
      updatedAt text not null
    );
    create table if not exists annotations (
      id text primary key,
      paperId text not null,
      page integer,
      color text not null,
      note text,
      tags text not null,
      anchors text not null,
      createdAt text not null
    );
    create virtual table if not exists papers_fts using fts5(
      title, authors, abstract, content='papers', content_rowid='rowid'
    );
    -- Rebuild FTS table to include authors column for existing data
    insert into papers_fts(papers_fts) values('rebuild');
    create trigger if not exists papers_fts_ai after insert on papers begin
      insert into papers_fts(rowid, title, authors, abstract)
      values (new.rowid, new.title, coalesce(replace(replace(replace(new.authors, '"', ''), '[', ''), ']', ''), ''), new.abstract);
    end;
    create trigger if not exists papers_fts_ad after delete on papers begin
      insert into papers_fts(papers_fts, rowid, title, authors, abstract)
      values ('delete', old.rowid, old.title, coalesce(replace(replace(replace(old.authors, '"', ''), '[', ''), ']', ''), ''), old.abstract);
    end;
    create trigger if not exists papers_fts_au after update on papers begin
      insert into papers_fts(papers_fts, rowid, title, authors, abstract)
      values ('delete', old.rowid, old.title, coalesce(replace(replace(replace(old.authors, '"', ''), '[', ''), ']', ''), ''), old.abstract);
      insert into papers_fts(rowid, title, authors, abstract)
      values (new.rowid, new.title, coalesce(replace(replace(replace(new.authors, '"', ''), '[', ''), ']', ''), ''), new.abstract);
    end;

    create table if not exists embeddings (
      id text primary key,
      paperId text not null,
      chunkId text not null,
      vector text not null,
      model text not null,
      dim integer not null,
      createdAt text not null
    );

    -- Sidebar: hierarchical nodes (folders, labels)
    create table if not exists sidebar_nodes (
      id text primary key,
      parentId text,
      type text not null,
      name text not null,
      iconKey text,
      colorHex text,
      orderIndex integer not null,
      createdAt text not null,
      updatedAt text not null
    );
    create index if not exists idx_sidebar_nodes_parent on sidebar_nodes(parentId);
    create index if not exists idx_sidebar_nodes_order on sidebar_nodes(parentId, orderIndex);

    -- Mapping papers to label nodes
    create table if not exists paper_categories (
      paperId text not null,
      nodeId text not null,
      createdAt text not null,
      primary key (paperId, nodeId)
    );
    create index if not exists idx_paper_categories_node on paper_categories(nodeId);
    create index if not exists idx_paper_categories_paper on paper_categories(paperId);

    -- Sidebar preferences (singleton row: id = 'default')
    create table if not exists sidebar_prefs (
      id text primary key,
      payload text not null,
      updatedAt text not null
    );
  `);

  // Ensure papers table has annotations column (SQLite lacks IF NOT EXISTS for columns)
  try {
    const columns = db.prepare(`PRAGMA table_info(papers)`).all() as Array<{ name: string }>;
    const hasAnnotations = columns.some((c) => c.name === 'annotations');
    if (!hasAnnotations) {
      db.exec(`ALTER TABLE papers ADD COLUMN annotations text`);
    }
  } catch {
    // Best-effort; ignore if pragma/alter not supported
  }
  return db as unknown as Database.Database;
}
