import React from 'react';
import { BookOpen, Edit, Trash2, FileText, Calendar } from 'lucide-react';
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
  dateAdded?: string;
};

export const LibraryCard: React.FC<LibraryCardProps> = ({
  id,
  title,
  authors,
  year,
  status,
  isNew = false,
  count,
  onClick,
  onRefresh,
  dateAdded,
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
    if (newTitle && newTitle.trim()) {
      try {
        console.log('Rename paper:', id, newTitle);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div
        className={`book-card ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClick(id)}
        onContextMenu={handleRightClick}
      >
        {/* Book Cover */}
        <div className="book-cover">
          {/* Book Spine */}
          <div className="book-spine"></div>

          {/* Front Cover Content */}
          <div className="book-front">
            {/* Title Badge */}
            <div className="book-title-badge">{year || 'Unknown'}</div>

            {/* Main Title/Number */}
            <div className="book-main-title">
              {title.length > 60 ? `${title.substring(0, 60)}...` : title}
            </div>

            {/* Status */}
            <div className="book-status">{isNew ? 'New' : formatDate(dateAdded) || 'Unknown'}</div>

            {/* Notes Count */}
            {count > 0 && (
              <div className="book-notes">
                <FileText size={12} />
                <span>{count}</span>
              </div>
            )}
          </div>

          {/* Book Pages Effect on Hover */}
          <div className="book-pages">
            <div className="page page-1"></div>
            <div className="page page-2"></div>
            <div className="page page-3"></div>
          </div>
        </div>

        {/* Authors Info (visible on hover) */}
        {isHovered && authors.length > 0 && (
          <div className="book-authors-info">
            <div className="authors-list">
              {authors.slice(0, 2).join(', ')}
              {authors.length > 2 && ` +${authors.length - 2} more`}
            </div>
          </div>
        )}
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
