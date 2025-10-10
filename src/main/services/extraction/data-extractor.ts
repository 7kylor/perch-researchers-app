import { openDatabase } from '../../db.js';
import type { ExtractionTemplate, PaperExtractionRow } from '../../../shared/types.js';
import { createAIProvider, type AIProvider } from '../../ai/providers.js';

type ExtractJobStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed';

export class DataExtractorService {
  private readonly db = openDatabase();
  private readonly ai: AIProvider;
  private readonly jobs = new Map<string, { status: ExtractJobStatus; progress: number }>();

  constructor(aiType: 'openai' | 'local' = 'local', apiKey?: string) {
    this.ai = createAIProvider(aiType, apiKey);
  }

  getJob(jobId: string): { status: ExtractJobStatus; progress: number } | null {
    return this.jobs.get(jobId) ?? null;
  }

  cancel(jobId: string): void {
    const j = this.jobs.get(jobId);
    if (j) j.status = 'cancelled';
  }

  async extractForPaper(
    paperId: string,
    template: ExtractionTemplate,
  ): Promise<PaperExtractionRow> {
    const row = this.db.prepare('select title, abstract from papers where id = ?').get(paperId) as
      | { title: string; abstract: string | null }
      | undefined;
    if (!row) throw new Error('Paper not found');
    const context = `${row.title}\n\n${row.abstract ?? ''}`;
    const values: Record<string, string | number | boolean | null> = {};
    const provenance: Record<
      string,
      {
        quote?: { exact: string; prefix?: string; suffix?: string };
        page?: number;
        confidence?: number;
      }
    > = {};

    for (const col of template.columns) {
      const prompt = `Extract the following field strictly from the context. Respond with only the value. If unknown, return NULL.
Field: ${col.name}
Type: ${col.type}${col.options && col.options.length > 0 ? `\nAllowed Values: ${col.options.join(', ')}` : ''}
Instruction: ${col.prompt}\n`;
      const answer = await this.ai.answerQuestion(prompt, context);
      const trimmed = answer.trim();
      let parsed: string | number | boolean | null = trimmed;
      if (/^null$/i.test(trimmed)) parsed = null;
      else if (col.type === 'number') {
        const n = Number(trimmed.replace(/[^0-9+\-.]/g, ''));
        parsed = Number.isFinite(n) ? n : null;
      } else if (col.type === 'boolean') {
        parsed = /^(yes|true)$/i.test(trimmed)
          ? true
          : /^(no|false)$/i.test(trimmed)
            ? false
            : null;
      }
      values[col.id] = parsed;
      provenance[col.id] = { confidence: 0.7 };
    }

    const out: PaperExtractionRow = {
      id: crypto.randomUUID(),
      paperId,
      templateId: template.id,
      values,
      provenance,
      quality: this.estimateQuality(values),
      createdAt: new Date().toISOString(),
    };

    this.db
      .prepare(
        `insert into paper_extractions (id, paperId, templateId, row, provenance, quality, createdAt)
         values (@id, @paperId, @templateId, @row, @provenance, @quality, @createdAt)`,
      )
      .run({
        id: out.id,
        paperId: out.paperId,
        templateId: out.templateId,
        row: JSON.stringify(out.values),
        provenance: JSON.stringify(out.provenance),
        quality: out.quality ?? null,
        createdAt: out.createdAt,
      });
    return out;
  }

  async batchExtract(
    jobId: string,
    paperIds: string[],
    template: ExtractionTemplate,
  ): Promise<Array<PaperExtractionRow>> {
    this.jobs.set(jobId, { status: 'running', progress: 0 });
    const results: Array<PaperExtractionRow> = [];
    for (let i = 0; i < paperIds.length; i++) {
      const job = this.jobs.get(jobId);
      if (!job || job.status === 'cancelled') break;
      try {
        const pid = paperIds[i];
        if (!pid) continue;
        const row = await this.extractForPaper(pid, template);
        results.push(row);
      } catch {
        // continue
      }
      const progress = Math.round(((i + 1) / paperIds.length) * 100);
      this.jobs.set(jobId, { status: 'running', progress });
    }
    const job = this.jobs.get(jobId);
    if (job && job.status !== 'cancelled')
      this.jobs.set(jobId, { status: 'completed', progress: 100 });
    return results;
  }

  private estimateQuality(values: Record<string, unknown>): number {
    const total = Object.keys(values).length;
    const nonNull = Object.values(values).filter((v) => v !== null && v !== '').length;
    return total > 0 ? nonNull / total : 0;
  }
}

export const dataExtractorService = new DataExtractorService();
