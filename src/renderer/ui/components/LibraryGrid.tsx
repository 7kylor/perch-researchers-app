import type React from 'react';
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

type LibraryGridProps = {
  papers: Paper[];
  category: string;
  onPaperSelect: (id: string) => void;
};

export const LibraryGrid: React.FC<LibraryGridProps> = ({ papers, category, onPaperSelect }) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
      case 'ai-models':
        return '2025 AI Models';
      case 'ml':
        return '2025 ML';
      case 'segmentation':
        return '2025 Segmentation';
      default:
        return 'Library Items';
    }
  };

  const getPaperIdentifier = (paper: Paper) => {
    if (paper.doi) {
      return paper.doi;
    }
    if (paper.filePath) {
      return paper.filePath.split('/').pop() || paper.id;
    }
    return paper.id.slice(0, 12);
  };

  const getPaperStatus = (paper: Paper) => {
    if (paper.status === 'to_read') return 'unknown';
    if (paper.status === 'reading') return 'reading';
    if (paper.status === 'read') return 'read';
    return 'unknown';
  };

  return (
    <div className="library-grid">
      {papers.map((paper, index) => (
        <LibraryCard
          key={paper.id}
          id={paper.id}
          title={paper.title}
          identifier={getPaperIdentifier(paper)}
          status={getPaperStatus(paper)}
          category={getCategoryDisplayName(category)}
          isNew={index < 5} // Mark first 5 as new
          count={0} // TODO: Add comment/note count
          onClick={onPaperSelect}
        />
      ))}
    </div>
  );
};
