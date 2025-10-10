import React from 'react';
import { LibraryGrid } from './LibraryGrid';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

type Paper = {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  source?: string;
  abstract?: string;
  status: string;
  filePath?: string;
  textHash: string;
};

type LibraryViewProps = {
  papers: Paper[];
  isLoading: boolean;
  selectedCategory: string;
  onPaperSelect: (id: string) => void;
  onRefresh: () => void;
  onShowCitations: (paperId: string) => void;
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  papers,
  isLoading,
  selectedCategory,
  onPaperSelect,
  onRefresh,
  onShowCitations,
}) => {
  return (
    <div className="library-view">
      <div className="library-container">
        {isLoading ? (
          <LoadingSkeleton count={9} />
        ) : papers.length === 0 ? (
          <EmptyState
            category={selectedCategory}
            onAddItem={() => {
              // This would trigger the add paper modal
              console.log('Add paper');
            }}
          />
        ) : (
          <LibraryGrid
            papers={papers}
            category={selectedCategory}
            onPaperSelect={onPaperSelect}
            onRefresh={onRefresh}
            onShowCitations={onShowCitations}
          />
        )}
      </div>
    </div>
  );
};
