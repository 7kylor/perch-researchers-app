import React from 'react';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { SearchEmptyState } from './SearchEmptyState';
import type { AcademicSearchResult } from '../../../../shared/types';

export const ResearchSection: React.FC = () => {
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
      // eslint-disable-next-line no-console
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

  return (
    <section className="research-section">
      <SearchBar
        query={query}
        isSearching={isSearching}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />

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
        <SearchResults results={results} selected={selected} onToggleSelect={setSelected} />
      )}
    </section>
  );
};
