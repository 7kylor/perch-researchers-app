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
