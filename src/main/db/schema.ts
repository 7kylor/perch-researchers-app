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
