import React from 'react';
import { LibraryCard } from './LibraryCard';

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

type ViewMode = 'grid' | 'list' | 'compact';

type LibraryGridProps = {
  papers: Paper[];
  category: string;
  onPaperSelect: (id: string) => void;
  onRefresh?: () => void;
  viewMode?: ViewMode;
  onShowCitations?: (paperId: string) => void;
};

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  papers,
  category,
  onPaperSelect,
  onRefresh,
  viewMode = 'grid',
  onShowCitations,
}) => {
  const [animatedPapers, setAnimatedPapers] = React.useState<Set<string>>(new Set());

  // Animate new papers as they appear
  React.useEffect(() => {
    const newIds = new Set(papers.map((p) => p.id));
    const timer = setTimeout(() => {
      setAnimatedPapers(newIds);
    }, 50);
    return () => clearTimeout(timer);
  }, [papers]);

  const getPaperStatus = (paper: Paper) => {
    if (paper.status === 'to_read') return 'unknown';
    if (paper.status === 'reading') return 'reading';
    if (paper.status === 'read') return 'read';
    return 'unknown';
  };

  // Calculate stagger delay for animations
  const getStaggerDelay = (index: number) => {
    const maxDelay = 0.5; // Maximum delay in seconds
    const delayIncrement = 0.03;
    return Math.min(index * delayIncrement, maxDelay);
  };

  return (
    <div className={`library-grid library-grid-${viewMode}`}>
      {papers.map((paper, index) => (
        <div
          key={paper.id}
          className={`library-grid-item ${animatedPapers.has(paper.id) ? 'animated' : ''}`}
          style={{
            animationDelay: `${getStaggerDelay(index)}s`,
          }}
        >
          <LibraryCard
            id={paper.id}
            title={paper.title}
            authors={paper.authors}
            venue={paper.venue}
            year={paper.year}
            doi={paper.doi}
            abstract={paper.abstract}
            source={paper.source}
            status={getPaperStatus(paper)}
            category={category}
            isNew={index < 3}
            count={0}
            onClick={onPaperSelect}
            onRefresh={onRefresh}
            dateAdded={paper.filePath ? new Date().toISOString() : undefined}
            onShowCitations={onShowCitations}
          />
        </div>
      ))}
    </div>
  );
};
