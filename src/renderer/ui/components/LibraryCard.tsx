import React from 'react';
import {
  BookOpen,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  Circle,
  Sparkles,
} from 'lucide-react';
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
  onRefresh?: () => void;
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
  onRefresh,
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

  const handleRename = async () => {
    const newTitle = prompt('Enter new title:');
    if (newTitle && newTitle.trim()) {
      try {
        // TODO: Implement paper rename in database
        // For now, we'll just show a toast
        console.log('Rename paper:', id, newTitle);
        // You would call: await window.api.papers.update(id, { title: newTitle.trim() });
      } catch (error) {
        console.error('Failed to rename paper:', error);
      }
    }
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this paper?')) {
      try {
        await window.api.papers.delete(id);
        console.log('Delete paper:', id);
        // Refresh the paper list in parent component
        onRefresh?.();
      } catch (error) {
        console.error('Failed to delete paper:', error);
      }
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

  const getStatusIcon = () => {
    switch (status) {
      case 'read':
        return <CheckCircle className="h-3 w-3" />;
      case 'reading':
        return <Clock className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'read':
        return 'Read';
      case 'reading':
        return 'Reading';
      default:
        return 'To Read';
    }
  };

  return (
    <>
      <div className="library-card">
        <button
          type="button"
          className="library-card-content"
          onClick={() => onClick(id)}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLongPress(e);
          }}
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
