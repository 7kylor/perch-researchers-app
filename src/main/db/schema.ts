import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const papers = sqliteTable('papers', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  authors: text('authors').notNull(), // JSON string
  venue: text('venue'),
  year: integer('year'),
  doi: text('doi'),
  source: text('source'),
  abstract: text('abstract'),
  status: text('status').notNull(),
  filePath: text('filePath'),
  textHash: text('textHash').notNull(),
  annotations: text('annotations'), // JSON string of page annotations
  addedAt: text('addedAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const annotations = sqliteTable('annotations', {
  id: text('id').primaryKey().notNull(),
  paperId: text('paperId').notNull(),
  page: integer('page'),
  color: text('color').notNull(),
  note: text('note'),
  tags: text('tags').notNull(), // JSON string
  anchors: text('anchors').notNull(), // JSON string
  createdAt: text('createdAt').notNull(),
});

export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey().notNull(),
  paperId: text('paperId').notNull(),
  chunkId: text('chunkId').notNull(),
  vector: text('vector').notNull(), // JSON string of float array
  model: text('model').notNull(),
  dim: integer('dim').notNull(),
  createdAt: text('createdAt').notNull(),
});

// Sidebar schemas
export const sidebarNodes = sqliteTable('sidebar_nodes', {
  id: text('id').primaryKey().notNull(),
  parentId: text('parentId'),
  type: text('type').notNull(), // 'folder' | 'label'
  name: text('name').notNull(),
  iconKey: text('iconKey'),
  colorHex: text('colorHex'),
  orderIndex: integer('orderIndex').notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const paperCategories = sqliteTable('paper_categories', {
  paperId: text('paperId').notNull(),
  nodeId: text('nodeId').notNull(),
  createdAt: text('createdAt').notNull(),
});

export const sidebarPrefs = sqliteTable('sidebar_prefs', {
  id: text('id').primaryKey().notNull(), // singleton: 'default'
  payload: text('payload').notNull(), // JSON of SidebarPrefs
  updatedAt: text('updatedAt').notNull(),
});

// Citation management tables
export const citations = sqliteTable('citations', {
  id: text('id').primaryKey().notNull(),
  paperId: text('paperId').notNull(), // Paper that contains this citation
  citedPaperId: text('citedPaperId'), // If citing another paper in the library
  title: text('title').notNull(),
  authors: text('authors').notNull(), // JSON string array
  year: integer('year'),
  venue: text('venue'),
  doi: text('doi'),
  url: text('url'),
  citationStyle: text('citationStyle').notNull(), // 'apa', 'mla', 'ieee', etc.
  formattedCitation: text('formattedCitation').notNull(),
  rawCitation: text('rawCitation'), // Original citation text found in paper
  context: text('context'), // Surrounding text where citation was found
  pageNumber: integer('pageNumber'),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

export const citationStyles = sqliteTable('citation_styles', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  format: text('format').notNull(), // Template for formatting citations
  example: text('example').notNull(),
  createdAt: text('createdAt').notNull(),
});

// Bibliography collections
export const bibliographies = sqliteTable('bibliographies', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  citationStyle: text('citationStyle').notNull(),
  paperIds: text('paperIds').notNull(), // JSON string array of paper IDs
  generatedContent: text('generatedContent'), // Generated bibliography text
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
});

// Citation extraction jobs
export const citationExtractionJobs = sqliteTable('citation_extraction_jobs', {
  id: text('id').primaryKey().notNull(),
  paperId: text('paperId').notNull(),
  status: text('status').notNull(), // 'pending', 'processing', 'completed', 'failed'
  progress: integer('progress').notNull().default(0),
  totalCitations: integer('totalCitations').default(0),
  extractedCitations: integer('extractedCitations').default(0),
  error: text('error'),
  startedAt: text('startedAt'),
  completedAt: text('completedAt'),
});

// Reading session tracking for analytics
export const readingSessions = sqliteTable('reading_sessions', {
  id: text('id').primaryKey().notNull(),
  paperId: text('paperId').notNull(),
  startedAt: text('startedAt').notNull(),
  endedAt: text('endedAt'),
  duration: integer('duration'), // in minutes
  pagesRead: integer('pagesRead'),
  annotationsCreated: integer('annotationsCreated'),
  status: text('status').notNull(), // 'active', 'completed', 'abandoned'
});
