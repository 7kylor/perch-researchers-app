import fetch from 'node-fetch';

export type UnpaywallInfo = {
  isOpenAccess: boolean;
  bestPdfUrl?: string;
  bestOaLocationUrl?: string;
  oaStatus?: string;
};

export class UnpaywallService {
  private readonly base = 'https://api.unpaywall.org/v2';
  private readonly email = 'opensource@local.test';

  async lookup(doi: string): Promise<UnpaywallInfo | null> {
    const url = `${this.base}/${encodeURIComponent(doi)}?email=${encodeURIComponent(this.email)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        is_oa?: boolean;
        best_oa_location?: { url_for_pdf?: string; url?: string } | null;
        oa_status?: string;
      };
      return {
        isOpenAccess: !!data.is_oa,
        bestPdfUrl: data.best_oa_location?.url_for_pdf || undefined,
        bestOaLocationUrl: data.best_oa_location?.url || undefined,
        oaStatus: data.oa_status,
      };
    } catch {
      return null;
    }
  }
}

export const unpaywallService = new UnpaywallService();
