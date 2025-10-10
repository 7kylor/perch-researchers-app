import React from 'react';
import { ResearchQuestionInterface } from './ResearchQuestionInterface';
import { ResultsTable } from './ResultsTable';
import { useSearch } from './SearchProvider';

export const ResearchContainer: React.FC = () => {
  const { query, isSearching, results } = useSearch();

  return (
    <div className="research-view">
      <div className="research-container">
        {!results && !isSearching && <ResearchQuestionInterface />}

        {(isSearching || results) && <ResultsTable />}
      </div>
    </div>
  );
};
