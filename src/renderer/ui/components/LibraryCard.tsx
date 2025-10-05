import React from 'react';
import { BookOpen, Edit, Trash2, FileText, CheckCircle, Clock, Circle, Sparkles } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

type LibraryCardProps = {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  status: string;
  category: string;
  isNew?: boolean;
  count: number;
  onClick: (id: string) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelection?: (id: string) => void;
};

// Removed unused cardColors array since we're using CSS variables now

export const LibraryCard: React.FC<LibraryCardProps> = ({
  id,
  title,
  authors,
  venue,
  year,
  doi,
  abstract,
  status,
  category,
  isNew = false,
  count,
  onClick,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelection,
}) => {
  const [contextMenu, setContextMenu] = React.useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({ isOpen: false, x: 0, y: 0 });

  const handleLongPress = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleRename = () => {
    const newTitle = prompt('Enter new title:');
    if (newTitle && newTitle.trim()) {
      console.log('Rename paper:', id, newTitle);
      // TODO: Implement paper rename in database
    }
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      console.log('Delete paper:', id);
      // TODO: Implement paper deletion in database
    }
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const contextMenuItems = [
    {
      label: 'Open',
      icon: <BookOpen size={16} />,
      onClick: () => onClick(id),
    },
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

  return (
    <>
      <div className={`library-card ${isSelected ? 'selected' : ''}`}>
        {isSelectionMode && (
          <div className="selection-overlay">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection?.(id)}
              className="selection-checkbox"
            />
          </div>
        )}
        <button
          type="button"
          className="library-card-content"
          onClick={() => onClick(id)}
          onContextMenu={handleRightClick}
          onMouseDown={(e) => {
            // Long press detection
            const timer = setTimeout(() => {
              handleLongPress(e);
            }, 500);

            const handleMouseUp = () => {
              clearTimeout(timer);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div className="card-tag">
            {isNew && (
              <span className="new-badge">
                <Sparkles size={12} />
                NEW
              </span>
            )}
            {category}
          </div>
          <div className="card-content">
            <div className="card-title">{title}</div>
            {authors.length > 0 && (
              <div className="card-authors">
                {authors.slice(0, 2).join(', ')}
                {authors.length > 2 && ` +${authors.length - 2}`}
              </div>
            )}
            {(venue || year) && (
              <div className="card-venue">
                {venue && <span>{venue}</span>}
                {venue && year && <span> • </span>}
                {year && <span>{year}</span>}
              </div>
            )}
            {abstract && (
              <div className="card-abstract">
                {abstract.length > 120 ? `${abstract.substring(0, 120)}...` : abstract}
              </div>
            )}
          </div>
          <div className="card-footer">
            <div className="card-status-badge">
              {status === 'read' ? (
                <>
                  <CheckCircle size={12} />
                  <span>Read</span>
                </>
              ) : status === 'reading' ? (
                <>
                  <Clock size={12} />
                  <span>Reading</span>
                </>
              ) : (
                <>
                  <Circle size={12} />
                  <span>To Read</span>
                </>
              )}
            </div>
            <div className="card-meta">
              <span className="card-icon">
                <FileText size={16} />
              </span>
              <span className="card-count">{count}</span>
            </div>
          </div>
        </button>
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
