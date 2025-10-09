export type EmbeddingModel = 'BAAI/bge-base-en-v1.5' | 'thenlper/gte-small';

export async function generateEmbeddings(
  texts: string[],
  providerUrl: string,
  model: EmbeddingModel,
): Promise<number[][]> {
  const res = await fetch(`${providerUrl}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: texts }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Embeddings service error: ${res.status} ${res.statusText} ${errText}`);
  }
  const json = (await res.json()) as { data?: Array<{ embedding: number[] }> };
  return (json.data || []).map((d) => d.embedding);
}
