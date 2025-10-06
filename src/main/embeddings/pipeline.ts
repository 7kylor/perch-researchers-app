import { openDatabase } from '../db';
import { randomUUID } from 'node:crypto';

const db = openDatabase();

export type Chunk = {
  id: string;
  paperId: string;
  content: string;
  startIndex: number;
  endIndex: number;
};

export async function chunkText(text: string, paperId: string, chunkSize = 512): Promise<Chunk[]> {
  const words = text.split(/\s+/);
  const chunks: Chunk[] = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunkWords = words.slice(i, i + chunkSize);
    const content = chunkWords.join(' ');

    chunks.push({
      id: randomUUID(),
      paperId,
      content,
      startIndex: i,
      endIndex: i + chunkWords.length,
    });
  }

  return chunks;
}

export async function generateEmbeddings(
  chunks: Chunk[],
  model = 'all-MiniLM-L6-v2',
): Promise<
  Array<{
    chunkId: string;
    vector: number[];
    model: string;
    dim: number;
  }>
> {
  // For now, we'll use a simple hash-based embedding
  // In a real implementation, this would call an embedding model
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    vector: generateSimpleEmbedding(chunk.content),
    model,
    dim: 384, // Standard for MiniLM
  }));
}

function generateSimpleEmbedding(text: string): number[] {
  // Simple hash-based embedding for demo purposes
  // In production, use a proper embedding model like sentence-transformers
  const hash = text.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const vector: number[] = [];
  for (let i = 0; i < 384; i++) {
    // Generate pseudo-random but deterministic values based on text hash
    const seed = hash + i;
    vector.push((Math.sin(seed) * 0.5 + 0.5) * 2 - 1); // Normalize to [-1, 1]
  }

  return vector;
}

export async function storeEmbeddings(
  embeddings: Array<{
    chunkId: string;
    vector: number[];
    model: string;
    dim: number;
  }>,
  paperId: string,
): Promise<void> {
  const stmt = db.prepare(`
    insert into embeddings (id, paperId, chunkId, vector, model, dim, createdAt)
    values (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const embedding of embeddings) {
    stmt.run(
      randomUUID(),
      paperId,
      embedding.chunkId,
      JSON.stringify(embedding.vector),
      embedding.model,
      embedding.dim,
      new Date().toISOString(),
    );
  }
}

export async function processPaperForEmbeddings(paperId: string, text: string): Promise<void> {
  const chunks = await chunkText(text, paperId);
  const embeddings = await generateEmbeddings(chunks);

  // Store chunks in a temporary table or use them directly
  await storeEmbeddings(embeddings, paperId);
}

export async function searchSimilarPapers(
  query: string,
  _limit = 10,
): Promise<
  Array<{
    paperId: string;
    score: number;
  }>
> {
  // For now, return empty results since we don't have real embeddings
  // In production, this would use vector similarity search
  return [];
}
