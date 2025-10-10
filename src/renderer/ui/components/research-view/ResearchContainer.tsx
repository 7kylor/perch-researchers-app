import React from 'react';
import { SearchInterface } from './SearchInterface';
import { ResultsSection } from './ResultsSection';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { useSearch } from './SearchProvider';

export const ResearchContainer: React.FC = () => {
  const { query, isSearching, results, performSearch } = useSearch();

  const handleSearchKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void performSearch();
      }
    },
    [performSearch],
  );

  return (
    <div className="research-view">
      <div className="research-container">
        <SearchInterface onKeyPress={handleSearchKeyPress} />

        {!query && !isSearching && <EmptyState />}

        {isSearching && <LoadingState />}

        {results && !isSearching && <ResultsSection results={results} />}
      </div>
    </div>
  );
};
