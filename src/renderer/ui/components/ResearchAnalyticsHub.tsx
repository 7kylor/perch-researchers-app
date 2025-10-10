import React from 'react';
import { SearchBar } from './research-hub/SearchBar';
import { SearchResults } from './research-hub/SearchResults';
import type { AcademicSearchResult } from '../../../shared/types';

export const ResearchAnalyticsHub: React.FC = () => {
  const [query, setQuery] = React.useState<string>('');
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  const [results, setResults] = React.useState<AcademicSearchResult | null>(null);
  const [selected, setSelected] = React.useState<ReadonlyArray<string>>([]);

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

  const handleAddToLibrary = async (paperIds: string[]) => {
    for (const paperId of paperIds) {
      const paper = results?.papers.find((p) => p.title === paperId);
      if (paper) {
        await window.api.papers.add({
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
      }
    }
  };

  const handleExtractPapers = async (paperIds: string[]) => {
    // Trigger extraction for selected papers
    console.log('Extract papers:', paperIds);
  };

  return (
    <div className="research-hub">
      <div className="research-container">
        <div className="search-section">
          <SearchBar
            query={query}
            isSearching={isSearching}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
          />
        </div>

        {!results && !isSearching && (
          <div className="empty-search-state">
            <div className="empty-icon">🔬</div>
            <h2>Discover Research Papers</h2>
            <p>
              Search across academic databases including arXiv, PubMed, CrossRef, and more to find
              relevant research papers for your work.
            </p>
          </div>
        )}

        {isSearching && (
          <div className="search-loading-state">
            <div className="loading-spinner" />
            <p>Searching across academic databases...</p>
          </div>
        )}

        {results && !isSearching && (
          <>
            <div className="results-header">
              <div className="results-info">
                <h3>Search Results</h3>
                <p className="results-count">Found {results.papers.length} papers</p>
              </div>
              {selected.length > 0 && (
                <div className="results-actions">
                  <button
                    type="button"
                    className="action-button primary"
                    onClick={() => handleAddToLibrary([...selected])}
                  >
                    Add to Library ({selected.length})
                  </button>
                  <button
                    type="button"
                    className="action-button secondary"
                    onClick={() => handleExtractPapers([...selected])}
                  >
                    Extract ({selected.length})
                  </button>
                </div>
              )}
            </div>

            <SearchResults results={results} selected={selected} onToggleSelect={setSelected} />
          </>
        )}
      </div>
    </div>
  );
};
