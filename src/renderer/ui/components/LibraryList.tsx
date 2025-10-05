import type React from 'react';

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

type LibraryListProps = {
  papers: Paper[];
  category: string;
  onPaperSelect: (id: string) => void;
};

export const LibraryList: React.FC<LibraryListProps> = ({ papers, category, onPaperSelect }) => {
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
    <div className="library-list">
      {papers.map((paper, index) => (
        <button
          key={paper.id}
          type="button"
          className="list-item"
          onClick={() => onPaperSelect(paper.id)}
          style={{
            animationDelay: `${index * 0.02}s`,
            animationFillMode: 'both',
          }}
        >
          <div className="list-item-header">
            <div className="list-item-tag">
              {index < 5 && <span className="new-badge">NEW • </span>}
              {getCategoryDisplayName(category)}
            </div>
            <div className="list-item-status">{getPaperStatus(paper)}</div>
          </div>
          <div className="list-item-content">
            <h3 className="list-item-title">{paper.title}</h3>
            <p className="list-item-identifier">{getPaperIdentifier(paper)}</p>
            {paper.authors.length > 0 && (
              <p className="list-item-authors">
                {paper.authors.slice(0, 3).join(', ')}
                {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
              </p>
            )}
          </div>
          <div className="list-item-footer">
            <span className="list-item-icon">📄</span>
            <span className="list-item-count">0</span>
          </div>
        </button>
      ))}
    </div>
  );
};
