import { openDatabase } from '../../db.js';
import { createAIProvider, type AIProvider } from '../../ai/providers.js';

export class ReportGeneratorService {
  private readonly db = openDatabase();
  private readonly ai: AIProvider;

  constructor(aiType: 'openai' | 'local' = 'local', apiKey?: string) {
    this.ai = createAIProvider(aiType, apiKey);
  }

  async generate(
    paperIds: string[],
    options?: { sections?: string[] },
  ): Promise<{ content: string }> {
    if (paperIds.length === 0) return { content: 'No papers selected.' };
    const rows = this.db
      .prepare(
        `select title, abstract, authors, year, venue, doi from papers where id in (${paperIds
          .map(() => '?')
          .join(',')})`,
      )
      .all(...paperIds) as Array<{
      title: string;
      abstract: string | null;
      authors: string;
      year: number | null;
      venue: string | null;
      doi: string | null;
    }>;

    const context = rows
      .map(
        (p, i) =>
          `[${i + 1}] ${p.title}\nAuthors: ${p.authors}\nYear: ${p.year ?? 'Unknown'}\nVenue: ${p.venue ?? 'Unknown'}\nDOI: ${p.doi ?? 'N/A'}\nAbstract: ${p.abstract ?? ''}`,
      )
      .join('\n\n');

    const sections = options?.sections ?? [
      'Background and Motivation',
      'Methods and Datasets',
      'Findings and Evidence (with tables where helpful)',
      'Gaps and Future Work',
      'Conclusion',
    ];

    const prompt = `Synthesize a systematic research report from the following ${rows.length} papers.
Provide sentence-level citations like [1], [2] that refer to the numbered list.

PAPERS:
${context}

SECTIONS:
${sections.map((s) => `- ${s}`).join('\n')}

REQUIREMENTS:
- Use formal academic tone.
- Support each claim with sentence-level citations [n].
- Present key results in concise tables where applicable.
- End with actionable recommendations for researchers.`;

    const content = await this.ai.answerQuestion(prompt, context);
    try {
      const reportId = crypto.randomUUID();
      this.db
        .prepare(
          'insert into research_reports (id, title, paperIds, sections, createdAt, updatedAt, content) values (?, ?, ?, ?, ?, ?, ?)',
        )
        .run(
          reportId,
          `Report (${rows.length} papers)`,
          JSON.stringify(paperIds),
          JSON.stringify(sections),
          new Date().toISOString(),
          new Date().toISOString(),
          content,
        );
      this.db
        .prepare('insert into notebooks (id, type, title, refId, createdAt) values (?, ?, ?, ?, ?)')
        .run(
          crypto.randomUUID(),
          'report',
          `Report (${rows.length} papers)`,
          reportId,
          new Date().toISOString(),
        );
    } catch {
      // ignore
    }
    return { content };
  }
}

export const reportGeneratorService = new ReportGeneratorService();
