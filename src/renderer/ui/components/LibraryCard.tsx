import React from 'react';
import { BookOpen, Edit, Trash2, FileText, Quote } from 'lucide-react';
import { ContextMenu } from './ContextMenu';
import { ResearchBadge } from './ResearchBadge';

type LibraryCardProps = {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  source?: string;
  status: string;
  category: string;
  isNew?: boolean;
  count: number;
  onClick: (id: string) => void;
  onRefresh?: () => void;
  dateAdded?: string;
  onShowCitations?: (paperId: string) => void;
};

export const LibraryCard: React.FC<LibraryCardProps> = ({
  id,
  title,
  authors,
  venue,
  year,
  doi,
  abstract,
  source,
  status,
  category,
  isNew = false,
  count,
  onClick,
  onRefresh,
  dateAdded,
  onShowCitations,
}) => {
  const [contextMenu, setContextMenu] = React.useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleRename = async () => {
    const newTitle = prompt('Enter new title:');
    if (newTitle?.trim()) {
      // TODO: Implement rename functionality
    }
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      try {
        await window.api.papers.delete(id);
        onRefresh?.();
      } catch {
        // Error handled silently
      }
    }
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(id);
    }
  };

  const contextMenuItems = [
    {
      label: 'Open',
      icon: <BookOpen size={16} />,
      onClick: () => onClick(id),
    },
    ...(onShowCitations
      ? [
          {
            label: 'Citations',
            icon: <Quote size={16} />,
            onClick: () => onShowCitations(id),
          },
        ]
      : []),
    {
      label: 'Rename',
      icon: <Edit size={16} />,
      onClick: handleRename,
    },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      danger: true,
    },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to_read':
        return 'var(--text-secondary)';
      case 'in_review':
        return 'var(--primary)';
      case 'annotated':
        return 'var(--success)';
      case 'research':
        return 'var(--research)';
      case 'archived':
        return 'var(--muted)';
      default:
        return 'var(--text-secondary)';
    }
  };

  // Check if this is a research-related paper (could be based on category, source, or other criteria)
  const isResearchPaper = React.useMemo(() => {
    return (
      category === 'research' ||
      source?.toLowerCase().includes('arxiv') ||
      source?.toLowerCase().includes('scholar') ||
      status === 'research'
    );
  }, [category, source, status]);

  return (
    <>
      <div style={{ paddingLeft: '40px', paddingRight: '10px' }}>
        <div className={`book-card ${isHovered ? 'hovered' : ''}`}>
          <button
            className="book-card-button"
            onClick={() => onClick(id)}
            onContextMenu={handleRightClick}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
              }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            type="button"
            aria-label={`Open paper: ${title}`}
          >
            <div className="book-cover">
              <div
                className="book-spine"
                style={isResearchPaper ? { backgroundColor: 'var(--research)' } : {}}
              ></div>

              <div className="book-front">
                <div className="book-header">
                  <div
                    className="book-status-indicator"
                    style={{ backgroundColor: getStatusColor(status) }}
                  ></div>
                  {isNew && <div className="book-new-badge">New</div>}
                  {isResearchPaper && (
                    <ResearchBadge variant="subtle" size="sm">
                      Research
                    </ResearchBadge>
                  )}
                </div>

                <div className="book-content">
                  {/* Title Section */}
                  <div className="book-title-section">
                    <div
                      className="book-title"
                      style={isResearchPaper ? { color: 'var(--research)' } : {}}
                    >
                      {truncateText(title, 55)}
                    </div>
                    {authors.length > 0 && (
                      <div className="book-authors">
                        {authors.slice(0, 3).join(', ')}
                        {authors.length > 3 ? ` +${authors.length - 3} more` : ''}
                      </div>
                    )}
                    {isResearchPaper && (
                      <div style={{ marginTop: '4px' }}>
                        <ResearchBadge variant="outline" size="sm">
                          Academic
                        </ResearchBadge>
                      </div>
                    )}
                  </div>

                  {/* Publication Info */}
                  <div className="book-publication">
                    <div className="publication-row">
                      {year && <span className="publication-year">{year}</span>}
                      {venue && (
                        <span className="publication-venue">{truncateText(venue, 30)}</span>
                      )}
                    </div>
                    {(doi || source) && (
                      <div className="publication-details">
                        {doi && (
                          <span className="publication-doi">DOI: {truncateText(doi, 20)}</span>
                        )}
                        {source && <span className="publication-source">{source}</span>}
                      </div>
                    )}
                  </div>

                  {/* Abstract Preview */}
                  {abstract && (
                    <div className="book-abstract">
                      <div className="abstract-content">{truncateText(abstract, 100)}</div>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="book-footer">
                    <div className="book-date">Added {formatDate(dateAdded)}</div>
                    {count > 0 && (
                      <div
                        className="book-notes"
                        style={isResearchPaper ? { color: 'var(--research)' } : {}}
                      >
                        <FileText size={12} />
                        <span>{count} notes</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        items={contextMenuItems}
      />
    </>
  );
};
