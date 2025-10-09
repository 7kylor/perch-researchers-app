/**
 * Secure arXiv API client that replaces the vulnerable arxiv-api package
 * Uses native fetch API instead of axios to avoid security vulnerabilities
 */

export interface ArxivSearchResult {
  id: string;
  title: string;
  summary: string;
  // Authors come as nested arrays: [["Author Name"]]
  authors: string[][];
  links: Array<{ href: string; title?: string; rel?: string; type?: string }>;
  published: string;
  updated: string;
  categories: Array<{ term: string; scheme?: string }>;
}

export interface SearchOptions {
  searchQueryParams: Array<{
    include: Array<{ name: string; prefix?: string }>;
    exclude?: Array<{ name: string; prefix?: string }>;
  }>;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'ascending' | 'descending';
  start?: number;
  maxResults?: number;
}

/**
 * Simple XML parser for arXiv API responses
 */
function parseXML(xmlString: string): any {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'text/xml');
}

/**
 * Extract text content from XML element
 */
function getTextContent(element: Element | null): string {
  return element?.textContent?.trim() || '';
}

/**
 * Parse arXiv API response XML into structured data
 */
function parseArxivResponse(xmlText: string): ArxivSearchResult[] {
  const xmlDoc = parseXML(xmlText);
  const entries = xmlDoc.querySelectorAll('entry');

  return Array.from(entries).map((entry: unknown): ArxivSearchResult => {
    const element = entry as Element;
    const id = getTextContent(element.querySelector('id'));
    const title = getTextContent(element.querySelector('title'));
    const summary = getTextContent(element.querySelector('summary'));
    const published = getTextContent(element.querySelector('published'));
    const updated = getTextContent(element.querySelector('updated'));

    // Parse authors (arXiv returns them as nested arrays in the original library)
    const authors: string[][] = [];
    const authorElements = element.querySelectorAll('author');
    authorElements.forEach((authorElement: Element) => {
      const nameElement = authorElement.querySelector('name');
      if (nameElement) {
        authors.push([getTextContent(nameElement)]);
      }
    });

    // Parse links
    const links: Array<{ href: string; title?: string; rel?: string; type?: string }> = [];
    const linkElements = element.querySelectorAll('link');
    linkElements.forEach((link: Element) => {
      const href = link.getAttribute('href') || '';
      const title = link.getAttribute('title') || undefined;
      const rel = link.getAttribute('rel') || undefined;
      const type = link.getAttribute('type') || undefined;
      links.push({ href, title, rel, type });
    });

    // Parse categories
    const categories: Array<{ term: string; scheme?: string }> = [];
    const categoryElements = element.querySelectorAll('category');
    categoryElements.forEach((cat: Element) => {
      const term = cat.getAttribute('term') || '';
      const scheme = cat.getAttribute('scheme') || undefined;
      categories.push({ term, scheme });
    });

    return {
      id,
      title,
      summary,
      authors,
      links,
      published,
      updated,
      categories,
    };
  });
}

/**
 * Build arXiv API query URL from search options
 */
function buildQueryUrl(options: SearchOptions): string {
  const baseUrl = 'http://export.arxiv.org/api/query';

  if (!options.searchQueryParams || options.searchQueryParams.length === 0) {
    throw new Error('Search query parameters are required');
  }

  // Build search query
  let searchQuery = '';
  options.searchQueryParams.forEach((param, index) => {
    if (index > 0) searchQuery += '+';

    param.include.forEach((include, i) => {
      if (i > 0) searchQuery += '+';
      searchQuery += include.prefix ? `${include.prefix}:"${include.name}"` : `"${include.name}"`;
    });

    if (param.exclude) {
      param.exclude.forEach((exclude) => {
        searchQuery += `+-${exclude.prefix ? `${exclude.prefix}:"${exclude.name}"` : `"${exclude.name}"`}`;
      });
    }
  });

  const url = new URL(baseUrl);
  url.searchParams.set('search_query', searchQuery);

  if (options.sortBy) {
    url.searchParams.set('sortBy', options.sortBy);
  }

  if (options.sortOrder) {
    url.searchParams.set('sortOrder', options.sortOrder);
  }

  if (options.start !== undefined) {
    url.searchParams.set('start', options.start.toString());
  }

  if (options.maxResults !== undefined) {
    url.searchParams.set('max_results', options.maxResults.toString());
  }

  return url.toString();
}

/**
 * Search arXiv using the public API
 */
export async function search(options: SearchOptions): Promise<ArxivSearchResult[]> {
  try {
    const queryUrl = buildQueryUrl(options);

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`arXiv API request failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    return parseArxivResponse(xmlText);
  } catch (error) {
    console.error('Error searching arXiv:', error);
    throw error;
  }
}
