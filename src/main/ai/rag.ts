import { openDatabase } from '../db';
import { createAIProvider, type AIProvider } from './providers';

const db = openDatabase();

export class RAGSystem {
  private aiProvider: AIProvider;
  private usageCount = 0;
  private readonly maxUsage = 5; // Free tier limit

  constructor(aiType: 'openai' | 'local' = 'local', apiKey?: string) {
    this.aiProvider = createAIProvider(aiType, apiKey);
  }

  async summarizePaper(paperId: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const paper = db.prepare('select title, abstract from papers where id = ?').get(paperId) as
      | { title: string; abstract: string | null }
      | undefined;

    if (!paper) return 'Paper not found';

    const text = `${paper.title}\n\n${paper.abstract || ''}`;
    return this.aiProvider.summarize(text);
  }

  async answerQuestion(question: string, paperId?: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    let context = '';

    if (paperId) {
      // Answer based on specific paper
      const paper = db.prepare('select title, abstract from papers where id = ?').get(paperId) as
        | { title: string; abstract: string | null }
        | undefined;

      if (paper) {
        context = `${paper.title}\n\n${paper.abstract || ''}`;
      }
    } else {
      // Answer based on all papers (RAG)
      const papers = db.prepare('select title, abstract from papers').all() as Array<{
        title: string;
        abstract: string | null;
      }>;

      context = papers.map((p) => `${p.title}\n${p.abstract || ''}`).join('\n\n');
    }

    return this.aiProvider.answerQuestion(question, context);
  }

  async generateRelatedPapers(
    query: string,
  ): Promise<Array<{ paperId: string; title: string; score: number }>> {
    if (!this.canUseAI()) return [];

    // Simple similarity search using embeddings
    const papers = db.prepare('select id, title from papers').all() as Array<{
      id: string;
      title: string;
    }>;

    const queryEmbedding = await this.aiProvider.generateEmbeddings([query]);
    const _queryVector = queryEmbedding[0];

    // For now, return papers with simple text similarity
    return papers
      .map((paper) => ({
        paperId: paper.id,
        title: paper.title,
        score: this.calculateSimilarity(query, paper.title),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private canUseAI(): boolean {
    return this.usageCount < this.maxUsage;
  }

  incrementUsage(): void {
    this.usageCount++;
  }

  getUsageCount(): number {
    return this.usageCount;
  }

  private calculateSimilarity(query: string, text: string): number {
    // Simple Jaccard similarity for demo
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const textWords = new Set(text.toLowerCase().split(/\s+/));

    const intersection = new Set([...queryWords].filter((x) => textWords.has(x)));
    const union = new Set([...queryWords, ...textWords]);

    return intersection.size / union.size;
  }
}

export function createRAGSystem(aiType: 'openai' | 'local' = 'local', apiKey?: string): RAGSystem {
  return new RAGSystem(aiType, apiKey);
}
