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

    -- Saved searches
    create table if not exists search_queries (
      id text primary key,
      name text not null,
      query text not null,
      filters text not null,
      createdAt text not null
    );

    -- Research alerts configuration
    create table if not exists research_alerts (
      id text primary key,
      queryId text not null,
      frequency text not null,
      enabled integer not null,
      lastChecked text
    );
    create index if not exists idx_research_alerts_query on research_alerts(queryId);

    -- Alert results
    create table if not exists alert_results (
      id text primary key,
      alertId text not null,
      paperId text not null,
      discoveredAt text not null,
      read integer not null default 0
    );
    create index if not exists idx_alert_results_alert on alert_results(alertId);
    create index if not exists idx_alert_results_paper on alert_results(paperId);

    -- Extraction templates
    create table if not exists extraction_templates (
      id text primary key,
      name text not null,
      columns text not null,
      createdAt text not null
    );

    -- Extracted data per paper and template
    create table if not exists paper_extractions (
      id text primary key,
      paperId text not null,
      templateId text not null,
      row text not null,
      provenance text not null,
      quality real,
      createdAt text not null
    );
    create index if not exists idx_paper_extractions_paper on paper_extractions(paperId);
    create index if not exists idx_paper_extractions_template on paper_extractions(templateId);

    -- Research reports
    create table if not exists research_reports (
      id text primary key,
      title text not null,
      paperIds text not null,
      sections text not null,
      createdAt text not null,
      updatedAt text not null
    );

    -- Screening decisions and criteria
    create table if not exists screening_decisions (
      id text primary key,
      paperId text not null,
      stage text not null,
      decision text not null,
      reason text,
      decidedAt text not null
    );
    create index if not exists idx_screening_decisions_paper on screening_decisions(paperId);

    create table if not exists screening_criteria (
      id text primary key,
      name text not null,
      description text,
      stage text not null
    );

    -- Notebooks index (reports, extractions, saved searches)
    create table if not exists notebooks (
      id text primary key,
      type text not null,
      title text not null,
      refId text,
      createdAt text not null
    );
    create index if not exists idx_notebooks_created on notebooks(createdAt);
  `);

  // Ensure papers table has annotations column (SQLite lacks IF NOT EXISTS for columns)
  try {
    const columns = db.prepare(`PRAGMA table_info(papers)`).all() as Array<{ name: string }>;
    const hasAnnotations = columns.some((c) => c.name === 'annotations');
    if (!hasAnnotations) {
      db.exec(`ALTER TABLE papers ADD COLUMN annotations text`);
    }
    const rrCols = db.prepare(`PRAGMA table_info(research_reports)`).all() as Array<{
      name: string;
    }>;
    const hasContent = rrCols.some((c) => c.name === 'content');
    if (!hasContent) {
      db.exec(`ALTER TABLE research_reports ADD COLUMN content text`);
    }
  } catch {
    // Best-effort; ignore if pragma/alter not supported
  }
  return db as unknown as Database.Database;
}
