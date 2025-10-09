import type React from 'react';
import { PaperResultCard } from './PaperResultCard';
import type { AcademicSearchResult, AcademicPaper } from '../../../../shared/types';

type SearchResultsProps = {
  results: AcademicSearchResult;
  selected: ReadonlyArray<string>;
  onToggleSelect: (selected: ReadonlyArray<string>) => void;
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  selected,
  onToggleSelect,
}) => {
  const handleToggle = (paper: AcademicPaper) => {
    const exists = selected.includes(paper.title);
    if (exists) {
      onToggleSelect(selected.filter((id) => id !== paper.title));
    } else {
      onToggleSelect([...selected, paper.title]);
    }
  };

  if (results.papers.length === 0) {
    return (
      <div className="search-empty-state">
        <p className="search-loading-text">No papers found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-header">
        <p className="search-results-count">
          Found <span className="search-results-count-number">{results.papers.length}</span> papers
        </p>
        {selected.length > 0 && (
          <p className="search-results-selected">{selected.length} selected</p>
        )}
      </div>

      <div className="search-results-list">
        {results.papers.map((paper) => (
          <PaperResultCard
            key={`${paper.source}-${paper.doi ?? paper.url ?? paper.title}`}
            paper={paper}
            isSelected={selected.includes(paper.title)}
            onToggle={() => handleToggle(paper)}
          />
        ))}
      </div>
    </div>
  );
};
