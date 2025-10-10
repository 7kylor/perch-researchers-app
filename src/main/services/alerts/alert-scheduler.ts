import { openDatabase } from '../../db.js';
import { academicDatabaseService } from '../academic-databases.js';

export type AlertFrequency = 'daily' | 'weekly' | 'monthly';

export class AlertSchedulerService {
  private readonly db = openDatabase();

  async runAlert(alertId: string): Promise<number> {
    const alert = this.db
      .prepare('select id, queryId from research_alerts where id = ? and enabled = 1')
      .get(alertId) as { id: string; queryId: string } | undefined;
    if (!alert) return 0;

    const queryRow = this.db
      .prepare('select query, filters from search_queries where id = ?')
      .get(alert.queryId) as { query: string; filters: string } | undefined;
    if (!queryRow) return 0;

    const query = queryRow.query;
    const res = await academicDatabaseService.searchAllDatabases(query, 20);

    // Insert new alert results if not already present for this paper
    let inserted = 0;
    for (const p of res.papers) {
      const pid = this.findOrCreatePaperId(p);
      const exists = this.db
        .prepare('select 1 from alert_results where alertId = ? and paperId = ? limit 1')
        .get(alertId, pid) as unknown | undefined;
      if (!exists) {
        this.db
          .prepare(
            'insert into alert_results (id, alertId, paperId, discoveredAt, read) values (?, ?, ?, ?, ?)',
          )
          .run(crypto.randomUUID(), alertId, pid, new Date().toISOString(), 0);
        inserted++;
      }
    }

    this.db
      .prepare('update research_alerts set lastChecked = ? where id = ?')
      .run(new Date().toISOString(), alertId);
    return inserted;
  }

  private findOrCreatePaperId(p: {
    title: string;
    authors: string[];
    venue?: string;
    year?: number;
    doi?: string;
    source?: string;
    abstract?: string;
    url?: string;
  }): string {
    const row = this.db
      .prepare('select id from papers where lower(title) = ? limit 1')
      .get(p.title.toLowerCase()) as { id: string } | undefined;
    if (row?.id) return row.id;
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `insert into papers (id, title, authors, venue, year, doi, source, abstract, status, textHash, addedAt, updatedAt)
         values (@id, @title, @authors, @venue, @year, @doi, @source, @abstract, @status, @textHash, @addedAt, @updatedAt)`,
      )
      .run({
        id,
        title: p.title,
        authors: JSON.stringify(p.authors),
        venue: p.venue ?? null,
        year: p.year ?? null,
        doi: p.doi ?? null,
        source: p.source ?? null,
        abstract: p.abstract ?? null,
        status: 'to_read',
        textHash: '',
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    return id;
  }
}

export const alertSchedulerService = new AlertSchedulerService();
