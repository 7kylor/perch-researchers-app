import React from 'react';
import { PaperListItem } from './PaperListItem';
import type { AcademicPaper } from '../../../../shared/types';

type ViewMode = 'list';

type ResultsListProps = {
  papers: AcademicPaper[];
  selectedPapers: ReadonlyArray<string>;
  viewMode: ViewMode;
  onToggleSelection: (paperId: string) => void;
};

export const ResultsList: React.FC<ResultsListProps> = ({
  papers,
  selectedPapers,
  viewMode: _viewMode,
  onToggleSelection,
}) => {
  if (papers.length === 0) {
    return (
      <div className="no-results">
        <p>No papers match your current filters. Try adjusting your search criteria.</p>
      </div>
    );
  }

  const renderPaper = (paper: AcademicPaper, index: number) => {
    const isSelected = selectedPapers.includes(paper.title);

    return (
      <PaperListItem
        key={`${paper.source}-${paper.doi ?? paper.url ?? paper.title}-${index}`}
        paper={paper}
        isSelected={isSelected}
        onToggle={() => onToggleSelection(paper.title)}
      />
    );
  };

  return (
    <div className={`results-list list`}>
      {papers.map((paper, index) => renderPaper(paper, index))}
    </div>
  );
};
