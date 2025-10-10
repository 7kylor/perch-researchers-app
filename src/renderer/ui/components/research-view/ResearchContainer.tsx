import type React from 'react';
import { ResearchQuestionInterface } from './ResearchQuestionInterface';
import { ResultsTable } from './ResultsTable';
import { useSearch } from './SearchProvider';

export const ResearchContainer: React.FC = () => {
  const { isSearching, results } = useSearch();

  return (
    <div className="research-view">
      <div className="research-container">
        {/* Show search interface when no results */}
        {!results && !isSearching && <ResearchQuestionInterface />}

        {/* Show results table when searching or have results */}
        {(isSearching || results) && <ResultsTable />}
      </div>
    </div>
  );
};
