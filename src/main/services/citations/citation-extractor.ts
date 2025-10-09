import { openDatabase } from '../../db.js';
import { randomUUID } from 'node:crypto';

const db = openDatabase();

export interface CitationData {
  readonly id: string;
  readonly paperId: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly year?: number;
  readonly venue?: string;
  readonly doi?: string;
  readonly url?: string;
  readonly citationStyle: string;
  readonly formattedCitation: string;
  readonly rawCitation?: string;
  readonly context?: string;
  readonly pageNumber?: number;
}

export interface CitationStyle {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  readonly example: string;
}

export class CitationExtractor {
  private citationPatterns = [
    // APA style patterns
    /(\w+,\s*\w+\.?\s*\(\d{4}\)\.\s*[^.]+\.)\s*([^,]+),\s*(\d+)/g,
    // MLA style patterns
    /(\w+,\s*\w+\.?\s*"[^"]+"\s*[^,]*,\s*\d{4})/g,
    // IEEE style patterns
    /\[(\d+)\]\s*([^[\]]+)/g,
    // General academic citation patterns
    /(\w+\s+et\s+al\.?\s*\(\d{4}\))/g,
    /(\w+,\s*\w+\.?\s*\d{4})/g,
  ];

  private authorPatterns = [
    /(\w+,\s*\w+\.?)/g, // Smith, J.
    /(\w+\s+\w+\.?\s+et\s+al\.?)/g, // Smith J. et al.
    /(\w+\s+&\s+\w+\.?\s*\(\d{4}\))/g, // Smith J. & Jones K. (2020)
  ];

  async extractCitationsFromPaper(paperId: string): Promise<CitationData[]> {
    const paper = db
      .prepare('select title, abstract, filePath from papers where id = ?')
      .get(paperId) as
      | { title: string; abstract: string | null; filePath: string | null }
      | undefined;

    if (!paper) throw new Error('Paper not found');

    const text = `${paper.title}\n${paper.abstract || ''}`;

    // If we have a PDF file, we could extract text from it
    // For now, we'll work with the available metadata
    if (paper.filePath) {
      // TODO: Extract text from PDF if needed
      // text += await extractTextFromPDF(paper.filePath);
    }

    const citations: CitationData[] = [];
    const citationStyle = this.detectCitationStyle(text);

    // Extract citations using patterns
    for (const pattern of this.citationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const rawCitation = match[0];
        const citation = await this.parseCitation(rawCitation, citationStyle);
        if (citation) {
          citations.push({
            id: randomUUID(),
            paperId,
            citationStyle,
            formattedCitation: citation.formattedCitation,
            rawCitation,
            title: citation.title,
            authors: citation.authors,
            year: citation.year,
            venue: citation.venue,
            doi: citation.doi,
            url: citation.url,
          } as CitationData);
        }
      }
    }

    return citations;
  }

  private detectCitationStyle(text: string): string {
    // Simple heuristic to detect citation style
    if (text.includes('(') && text.includes(')')) {
      if (text.includes('et al.')) return 'apa';
      if (text.includes('"') && text.includes(',')) return 'mla';
      if (text.includes('[') && text.includes(']')) return 'ieee';
    }
    return 'apa'; // Default
  }

  private async parseCitation(
    rawCitation: string,
    style: string,
  ): Promise<Partial<CitationData> | null> {
    // This is a simplified parser - in a real implementation,
    // you'd want more sophisticated parsing

    let title: string = '';
    let authors: readonly string[] = [];
    let year: number | undefined = undefined;
    const venue: string | undefined = undefined;
    const doi: string | undefined = undefined;
    const url: string | undefined = undefined;

    // Extract year
    const yearMatch: RegExpMatchArray | null =
      rawCitation.match(/\((\d{4})\)/) || rawCitation.match(/(\d{4})/);
    if (yearMatch && yearMatch[1]) {
      year = parseInt(yearMatch[1]);
    }

    // Extract authors (simplified)
    const authorMatches: RegExpMatchArray | null = rawCitation.match(/(\w+,\s*\w+\.?)/g);
    if (authorMatches) {
      authors = authorMatches.slice(0, 3); // Limit to first 3 authors
    }

    // Extract title (simplified - look for quoted text or text after authors)
    const titleMatch: RegExpMatchArray | null =
      rawCitation.match(/"([^"]+)"/) || rawCitation.match(/\.?\s*([^.,()]+)\s*[.,]/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    if (!title) return null;

    // Generate formatted citation based on style
    const formattedCitation: string = this.formatCitation(
      {
        id: '',
        paperId: '',
        title,
        authors,
        year,
        venue,
        doi,
        url,
        citationStyle: style,
        formattedCitation: '',
      },
      style,
    );

    return {
      title,
      authors,
      year,
      venue,
      doi,
      url,
      formattedCitation,
    };
  }

  private formatCitation(citation: CitationData, style: string): string {
    switch (style) {
      case 'apa':
        return `${citation.authors.slice(0, 2).join(', ')}${citation.authors.length > 2 ? ' et al.' : ''} (${citation.year}). ${citation.title}. ${citation.venue || ''}`;
      case 'mla':
        return `${citation.authors[0] || 'Unknown'}. "${citation.title}." ${citation.venue || 'Unknown'}, ${citation.year}.`;
      case 'ieee':
        return `[${citation.authors.slice(0, 2).join(' and ')} ${citation.year}] ${citation.title}`;
      default:
        return `${citation.authors.join(', ')} (${citation.year}). ${citation.title}`;
    }
  }

  async saveCitations(citations: CitationData[]): Promise<void> {
    const stmt = db.prepare(`
      insert into citations (id, paperId, citedPaperId, title, authors, year, venue, doi, url, citationStyle, formattedCitation, rawCitation, context, pageNumber, createdAt, updatedAt)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const citation of citations) {
      stmt.run(
        citation.id,
        citation.paperId,
        null, // citedPaperId - not implemented yet
        citation.title,
        JSON.stringify(citation.authors),
        citation.year || null,
        citation.venue || null,
        citation.doi || null,
        citation.url || null,
        citation.citationStyle,
        citation.formattedCitation,
        citation.rawCitation || null,
        citation.context || null,
        citation.pageNumber || null,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    }
  }

  async getCitationsForPaper(paperId: string): Promise<readonly CitationData[]> {
    interface CitationRow {
      readonly id: string;
      readonly paperId: string;
      readonly citedPaperId: string | null;
      readonly title: string;
      readonly authors: string;
      readonly year: number | null;
      readonly venue: string | null;
      readonly doi: string | null;
      readonly url: string | null;
      readonly citationStyle: string;
      readonly formattedCitation: string;
      readonly rawCitation: string | null;
      readonly context: string | null;
      readonly pageNumber: number | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    }

    const rows = db
      .prepare('select * from citations where paperId = ? order by createdAt')
      .all(paperId) as readonly CitationRow[];
    return rows.map(
      (row): CitationData => ({
        id: row.id,
        paperId: row.paperId,
        title: row.title,
        authors: JSON.parse(row.authors) as readonly string[],
        year: row.year ?? undefined,
        venue: row.venue ?? undefined,
        doi: row.doi ?? undefined,
        url: row.url ?? undefined,
        citationStyle: row.citationStyle,
        formattedCitation: row.formattedCitation,
        rawCitation: row.rawCitation ?? undefined,
        context: row.context ?? undefined,
        pageNumber: row.pageNumber ?? undefined,
      }),
    );
  }

  async generateBibliography(paperIds: readonly string[], style: string = 'apa'): Promise<string> {
    const placeholders = paperIds.map(() => '?').join(',');
    interface PaperWithCitationRow {
      readonly id: string;
      readonly title: string;
      readonly authors: string;
      readonly venue: string | null;
      readonly year: number | null;
      readonly doi: string | null;
      readonly formattedCitation: string | null;
    }

    const papers = db
      .prepare(
        `
      select p.*, c.formattedCitation
      from papers p
      left join citations c on p.id = c.citedPaperId
      where p.id in (${placeholders})
      order by p.authors, p.year, p.title
    `,
      )
      .all(...paperIds) as readonly PaperWithCitationRow[];

    if (papers.length === 0) return '';

    let bibliography = '';

    for (const paper of papers) {
      const citation: string =
        paper.formattedCitation ||
        this.formatCitation(
          {
            id: '',
            paperId: paper.id,
            title: paper.title,
            authors: JSON.parse(paper.authors) as readonly string[],
            year: paper.year ?? undefined,
            venue: paper.venue ?? undefined,
            doi: paper.doi ?? undefined,
            url: undefined,
            citationStyle: style,
            formattedCitation: '',
          },
          style,
        );

      bibliography += `${citation}\n\n`;
    }

    return bibliography.trim();
  }

  async createBibliographyCollection(
    name: string,
    description: string,
    paperIds: readonly string[],
    style: string = 'apa',
  ): Promise<string> {
    const bibliographyId: string = randomUUID();
    const content: string = await this.generateBibliography(paperIds, style);

    db.prepare(
      `
      insert into bibliographies (id, name, description, citationStyle, paperIds, generatedContent, createdAt, updatedAt)
      values (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      bibliographyId,
      name,
      description,
      style,
      JSON.stringify(paperIds),
      content,
      new Date().toISOString(),
      new Date().toISOString(),
    );

    return bibliographyId;
  }

  async getBibliographyCollections(): Promise<readonly BibliographyCollection[]> {
    interface BibliographyRow {
      readonly id: string;
      readonly name: string;
      readonly description: string | null;
      readonly citationStyle: string;
      readonly paperIds: string;
      readonly generatedContent: string | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    }

    interface BibliographyCollection {
      readonly id: string;
      readonly name: string;
      readonly description: string | null;
      readonly citationStyle: string;
      readonly paperIds: readonly string[];
      readonly generatedContent: string | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    }

    const rows = db
      .prepare('select * from bibliographies order by updatedAt desc')
      .all() as readonly BibliographyRow[];
    return rows.map(
      (row): BibliographyCollection => ({
        id: row.id,
        name: row.name,
        description: row.description,
        citationStyle: row.citationStyle,
        paperIds: JSON.parse(row.paperIds) as readonly string[],
        generatedContent: row.generatedContent,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async getBibliographyContent(bibliographyId: string): Promise<string | null> {
    interface BibliographyContentRow {
      readonly generatedContent: string;
    }

    const row = db
      .prepare('select generatedContent from bibliographies where id = ?')
      .get(bibliographyId) as BibliographyContentRow | undefined;
    return row?.generatedContent || null;
  }
}

export interface BibliographyCollection {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly citationStyle: string;
  readonly paperIds: readonly string[];
  readonly generatedContent: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const citationExtractor = new CitationExtractor();
