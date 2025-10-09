import { openDatabase } from '../db.js';
import { createAIProvider, type AIProvider } from './providers.js';

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

  async synthesizeLiteratureReview(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for synthesis';

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year || 'Unknown'}\nVenue: ${paper.venue || 'Unknown'}\nAbstract: ${paper.abstract || 'No abstract available'}\n`,
      )
      .join('\n');

    const prompt = `Synthesize a comprehensive literature review from the following research papers. Organize by themes, identify trends, controversies, and research gaps. Be academic and objective:

${context}

Structure your response as:
1. **Overview**: Brief summary of the research area
2. **Key Themes**: Main research directions and findings
3. **Methodological Approaches**: Common methods and techniques used
4. **Trends and Evolution**: How the field has developed over time
5. **Controversies and Debates**: Areas of disagreement or uncertainty
6. **Research Gaps**: What questions remain unanswered
7. **Future Directions**: Promising areas for future research`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  async extractMethodology(paperId: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const paper = db.prepare('select title, abstract from papers where id = ?').get(paperId) as
      | { title: string; abstract: string | null }
      | undefined;

    if (!paper) return 'Paper not found';

    const context = `${paper.title}\n\n${paper.abstract || ''}`;
    const prompt = `Extract and analyze the research methodology from this paper. Focus on:

1. **Research Design**: Experimental, observational, theoretical, review, etc.
2. **Data Collection**: Methods, sources, sample size, duration
3. **Analysis Techniques**: Statistical methods, tools, frameworks used
4. **Validation**: How results were validated and reliability measures
5. **Limitations**: Any acknowledged limitations or constraints

Be specific and cite evidence from the text where possible:`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  async identifyResearchGaps(paperIds: string[]): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue from papers where id in (' +
          paperIds.map(() => '?').join(',') +
          ')',
      )
      .all(paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for gap analysis';

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title} (${paper.year})\n${paper.abstract || ''}\n`,
      )
      .join('\n');

    const prompt = `Analyze the provided research papers to identify significant research gaps and unanswered questions. Consider:

1. **Methodological Gaps**: Areas where current methods fall short
2. **Empirical Gaps**: Understudied phenomena or populations
3. **Theoretical Gaps**: Missing conceptual frameworks or models
4. **Application Gaps**: Real-world problems not addressed by current research
5. **Interdisciplinary Gaps**: Opportunities for cross-field integration
6. **Scale and Scope Gaps**: Issues of generalizability or depth

Prioritize gaps that appear most significant and feasible to address:

${context}`;

    return this.aiProvider.answerQuestion(prompt, context);
  }

  async generateResearchProposal(currentPapers: string[], gap: string): Promise<string> {
    if (!this.canUseAI()) return 'AI features not available in free tier';

    const papers = db
      .prepare(
        'select title, abstract, authors, year, venue from papers where id in (' +
          currentPapers.map(() => '?').join(',') +
          ')',
      )
      .all(currentPapers) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
    }>;

    if (papers.length === 0) return 'No papers found for proposal generation';

    const context = papers
      .map(
        (paper, index) =>
          `[${index + 1}] ${paper.title} (${paper.year})\n${paper.abstract || ''}\n`,
      )
      .join('\n');

    const prompt = `Based on the identified research gap: "${gap}"

Generate a structured research proposal that addresses this gap. Use the provided papers as foundation and justification:

${context}

Structure the proposal as:
1. **Research Question**: Clear, focused question addressing the gap
2. **Background & Significance**: Why this research matters
3. **Literature Foundation**: How existing work supports this direction
4. **Proposed Methodology**: Research design and methods
5. **Expected Contributions**: What new knowledge will be created
6. **Timeline**: Realistic 6-12 month research plan
7. **Potential Challenges**: Anticipated difficulties and solutions

Make it specific, actionable, and grounded in the existing literature.`;

    return this.aiProvider.answerQuestion(prompt, context);
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
