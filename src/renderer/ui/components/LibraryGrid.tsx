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

type LibraryGridProps = {
  papers: Paper[];
  category: string;
  onPaperSelect: (id: string) => void;
  onRefresh?: () => void;
};

export const LibraryGrid: React.FC<LibraryGridProps> = ({
  papers,
  category,
  onPaperSelect,
  onRefresh,
}) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
      case 'builtin:all':
        return 'All Papers';
      case 'builtin:recent':
        return 'Recent';
      case 'builtin:unfiled':
        return 'Unfiled';
      case 'all':
        return 'All Papers';
      case 'recent':
        return 'Recent';
      default:
        // Try to find the category name from localStorage
        try {
          const saved = localStorage.getItem('categories');
          if (saved) {
            const categories = JSON.parse(saved) as Array<{ id: string; name: string }>;
            const category = categories.find((c) => c.id === categoryId);
            return category ? category.name : 'Library Items';
          }
        } catch {
          // Fall back to default
        }
        return 'Library Items';
    }
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
        <div
          key={paper.id}
          style={{
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'both',
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
            status={getPaperStatus(paper)}
            category={getCategoryDisplayName(category)}
            isNew={index < 5} // Mark first 5 as new
            count={0} // TODO: Add comment/note count
            onClick={onPaperSelect}
            onRefresh={onRefresh}
          />
        </div>
      ))}
    </div>
  );
};
