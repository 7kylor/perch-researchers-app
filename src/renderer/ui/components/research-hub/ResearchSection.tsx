import React from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { SearchEmptyState } from './SearchEmptyState';
import { ExtractionPanel } from './ExtractionPanel';
import { DataTable } from './DataTable';
import { ColumnManager } from './ColumnManager';
import { RecentSearches } from './RecentSearches';
import type { ExtractionColumn, PaperExtractionRow } from '../../../../shared/types';
import type { AcademicSearchResult } from '../../../../shared/types';

export const ResearchSection: React.FC = () => {
  const [query, setQuery] = React.useState<string>('');
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  const [results, setResults] = React.useState<AcademicSearchResult | null>(null);
  const [selected, setSelected] = React.useState<ReadonlyArray<string>>([]);
  const [columns, setColumns] = React.useState<ExtractionColumn[]>([]);
  const [rows, setRows] = React.useState<PaperExtractionRow[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const response = await window.api.academic['search-all'](query.trim(), 20);
      setResults(response as AcademicSearchResult);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleSearch();
    }
  };

  const refreshExtraction = async () => {
    if (selected.length === 0 || columns.length === 0) return;
    const tpl = await window.api.extraction.templates.list();
    const active = (tpl as Array<{ id: string }>)[0];
    if (!active) return;
    const data = (await window.api.extraction.getResults({
      templateId: active.id,
      paperIds: [...selected],
    })) as PaperExtractionRow[];
    setRows(data);
  };

  const saveSearch = async () => {
    if (!query.trim()) return;
    const name = window.prompt('Save search as:') || '';
    if (!name.trim()) return;
    await window.api.search.saveQuery({ name: name.trim(), query: query.trim(), filters: {} });
  };

  const runSearchReporting = async () => {
    if (!query.trim()) return;
    // Run search and generate report
    setIsSearching(true);
    try {
      const searchResults = await window.api.academic['search-all'](query.trim(), 20);
      const paperIds: string[] = [];

      for (const paper of searchResults.papers) {
        const id = await window.api.papers.add({
          title: paper.title,
          authors: paper.authors,
          venue: paper.venue,
          year: paper.year,
          doi: paper.doi,
          source: paper.source,
          abstract: paper.abstract,
          status: 'to_read',
          filePath: undefined,
          textHash: `${paper.title}-${paper.authors.slice(0, 2).join(',')}`,
        });
        paperIds.push(id);
      }

      await window.api.reports.generate(paperIds, {
        sections: [
          'Background and Motivation',
          'Methods and Datasets',
          'Findings and Evidence (with tables where helpful)',
          'Gaps and Future Work',
          'Conclusion',
        ],
      });
    } catch (error) {
      console.error('Search reporting failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="research-section">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Left Sidebar - Recent Searches */}
        <div>
          <RecentSearches
            onSearchSelect={(searchQuery) => {
              setQuery(searchQuery);
              setTimeout(() => handleSearch(), 100);
            }}
            onDelete={async (id) => {
              // Note: Would need to implement delete in backend
              console.log('Delete search:', id);
            }}
          />
        </div>

        {/* Main Content */}
        <div>
          <SearchBar
            query={query}
            isSearching={isSearching}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              padding: '0 4px 8px 4px',
            }}
          >
            <button
              type="button"
              onClick={saveSearch}
              disabled={!query.trim()}
              className="btn btn-default"
            >
              Save search
            </button>
            <button
              type="button"
              onClick={runSearchReporting}
              disabled={isSearching || !query.trim()}
              className="btn btn-primary"
            >
              {isSearching ? 'Generating Report...' : 'Search & Report'}
            </button>
          </div>

          {!results && !isSearching && <SearchEmptyState />}

          {isSearching && (
            <div className="search-loading">
              <div className="search-loading-content">
                <div className="search-loading-spinner" />
                <p className="search-loading-text">Searching across databases...</p>
              </div>
            </div>
          )}

          {results && !isSearching && (
            <>
              <SearchResults results={results} selected={selected} onToggleSelect={setSelected} />

              {selected.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: 12,
                  }}
                >
                  <div>
                    <ColumnManager columns={columns} onChange={(cols) => setColumns([...cols])} />
                    <div style={{ height: 12 }} />
                    <ExtractionPanel selectedPaperIds={[...selected]} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button type="button" onClick={refreshExtraction}>
                        Refresh Results
                      </button>
                    </div>
                  </div>
                  <div>
                    <DataTable columns={columns} rows={rows} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
