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
      title, abstract, content='papers', content_rowid='rowid'
    );
    create trigger if not exists papers_fts_ai after insert on papers begin
      insert into papers_fts(rowid, title, abstract) values (new.rowid, new.title, new.abstract);
    end;
    create trigger if not exists papers_fts_ad after delete on papers begin
      insert into papers_fts(papers_fts, rowid, title, abstract) values ('delete', old.rowid, old.title, old.abstract);
    end;
    create trigger if not exists papers_fts_au after update on papers begin
      insert into papers_fts(papers_fts, rowid, title, abstract) values ('delete', old.rowid, old.title, old.abstract);
      insert into papers_fts(rowid, title, abstract) values (new.rowid, new.title, new.abstract);
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

    create virtual table if not exists embeddings_vss using vss0(
      vector(384),
      paperId unindexed,
      chunkId unindexed,
      model unindexed,
      dim unindexed,
      createdAt unindexed
    );
    create trigger if not exists embeddings_vss_ai after insert on embeddings begin
      insert into embeddings_vss(rowid, vector) values (new.rowid, new.vector);
    end;
    create trigger if not exists embeddings_vss_ad after delete on embeddings begin
      insert into embeddings_vss(embeddings_vss, rowid, vector) values ('delete', old.rowid, old.vector);
    end;
  `);
  return db as unknown as Database.Database;
}
