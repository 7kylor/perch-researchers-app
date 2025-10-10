import type React from 'react';
import { ResearchQuestionInterface } from './ResearchQuestionInterface';
import { ResultsTable } from './ResultsTable';
import { PaperDetailsPage } from './PaperDetailsPage';
import { useSearch } from './SearchProvider';

export const ResearchContainer: React.FC = () => {
  const { isSearching, results, detailsPagePaperId } = useSearch();

  return (
    <div className="research-view">
      <div className="research-container">
        {/* Show search interface when no results and not viewing details */}
        {!results && !isSearching && !detailsPagePaperId && <ResearchQuestionInterface />}

        {/* Show results table when searching or have results */}
        {(isSearching || results) && !detailsPagePaperId && <ResultsTable />}

        {/* Show details page when a paper is selected for detailed view */}
        {detailsPagePaperId && <PaperDetailsPage />}
      </div>
    </div>
  );
};
