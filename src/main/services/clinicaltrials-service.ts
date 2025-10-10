import fetch from 'node-fetch';
import type { AcademicPaper } from '../../shared/types.js';

export type ClinicalTrialsSearchResult = {
  papers: AcademicPaper[];
  totalResults: number;
  searchTime: number;
};

export class ClinicalTrialsService {
  private readonly baseUrl = 'https://clinicaltrials.gov/api/v2/studies';

  async search(query: string, limit = 20, page = 1): Promise<ClinicalTrialsSearchResult> {
    const start = Date.now();
    const pageSize = Math.max(1, Math.min(limit, 100));
    const pageParam = Math.max(1, page);
    const url = `${this.baseUrl}?query.term=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${pageParam}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return { papers: [], totalResults: 0, searchTime: Date.now() - start };
      }
      const data = (await res.json()) as {
        studies?: Array<{
          protocolSection?: {
            identificationModule?: { briefTitle?: string; nctId?: string };
            descriptionModule?: { briefSummary?: string; detailedDescription?: string };
            statusModule?: {
              startDateStruct?: { date?: string };
              primaryCompletionDateStruct?: { date?: string };
            };
            contactsLocationsModule?: { overallOfficial?: Array<{ name?: string }> };
            sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } };
          };
          derivedSection?: { conditionBrowseModule?: unknown };
        }>;
        totalStudies?: number;
      };

      const papers: AcademicPaper[] = (data.studies || []).map((s) => {
        const id = s.protocolSection?.identificationModule?.nctId;
        const title = s.protocolSection?.identificationModule?.briefTitle || '';
        const brief = s.protocolSection?.descriptionModule?.briefSummary;
        const detailed = s.protocolSection?.descriptionModule?.detailedDescription;
        const yearStr =
          s.protocolSection?.statusModule?.startDateStruct?.date ||
          s.protocolSection?.statusModule?.primaryCompletionDateStruct?.date;
        const year = yearStr ? new Date(yearStr).getFullYear() : undefined;
        const officials = s.protocolSection?.contactsLocationsModule?.overallOfficial || [];
        const sponsor = s.protocolSection?.sponsorCollaboratorsModule?.leadSponsor?.name;
        const authors = [sponsor, ...officials.map((o) => o.name || '').filter(Boolean)].filter(
          Boolean,
        ) as string[];
        return {
          title,
          authors,
          year,
          venue: 'ClinicalTrials.gov',
          doi: undefined,
          abstract: detailed || brief,
          url: id ? `https://clinicaltrials.gov/study/${id}` : undefined,
          citations: undefined,
          source: 'clinicaltrials',
        } satisfies AcademicPaper;
      });

      return {
        papers,
        totalResults:
          typeof (data as { totalStudies?: number }).totalStudies === 'number'
            ? (data as { totalStudies: number }).totalStudies
            : papers.length,
        searchTime: Date.now() - start,
      };
    } catch {
      return { papers: [], totalResults: 0, searchTime: Date.now() - start };
    }
  }
}

export const clinicalTrialsService = new ClinicalTrialsService();
