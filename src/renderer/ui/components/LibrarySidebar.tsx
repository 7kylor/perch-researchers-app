import React from 'react';
import { BookOpen, Clock, Edit, Trash2, Cpu, TrendingUp, Shapes } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

type Category = {
  id: string;
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
};

type LibrarySidebarProps = {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
};

const categories: Category[] = [
  { id: 'ai-models', name: 'AI Models', count: 40, icon: <Cpu size={16} />, color: '#3b82f6' },
  { id: 'ml', name: 'ML', count: 23, icon: <TrendingUp size={16} />, color: '#6b7280' },
  {
    id: 'segmentation',
    name: 'Segmentation',
    count: 15,
    icon: <Shapes size={16} />,
    color: '#9ca3af',
  },
];

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  const [contextMenu, setContextMenu] = React.useState<{
    isOpen: boolean;
    x: number;
    y: number;
    categoryId: string | null;
  }>({ isOpen: false, x: 0, y: 0, categoryId: null });

  const handleCategoryLongPress = (e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      categoryId,
    });
  };

  const handleCategoryRename = (categoryId: string) => {
    const newName = prompt('Enter new category name:');
    if (newName && newName.trim()) {
      console.log('Rename category:', categoryId, newName);
      // TODO: Implement category rename in database
    }
    setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null });
  };

  const handleCategoryDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      console.log('Delete category:', categoryId);
      // TODO: Implement category deletion in database
    }
    setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null });
  };

  const contextMenuItems = contextMenu.categoryId
    ? [
        {
          label: 'Rename',
          icon: <Edit size={16} />,
          onClick: () => handleCategoryRename(contextMenu.categoryId!),
        },
        {
          label: 'Delete',
          icon: <Trash2 size={16} />,
          onClick: () => handleCategoryDelete(contextMenu.categoryId!),
          danger: true,
        },
      ]
    : [];
  return (
    <aside className="library-sidebar">
      <div className="sidebar-section">
        <h3 className="section-title">Library</h3>
        <button
          type="button"
          className={`sidebar-item ${selectedCategory === 'all' ? 'selected' : ''}`}
          onClick={() => onCategorySelect('all')}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Open context menu for "All Papers" (though it doesn't have actions, we can show it)
            handleCategoryLongPress(e, 'all');
          }}
        >
          <span className="item-icon">
            <BookOpen size={18} />
          </span>
          <span className="item-text">All Papers</span>
        </button>
        <button
          type="button"
          className={`sidebar-item ${selectedCategory === 'recent' ? 'selected' : ''}`}
          onClick={() => onCategorySelect('recent')}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Open context menu for "Recent" (though it doesn't have actions, we can show it)
            handleCategoryLongPress(e, 'recent');
          }}
        >
          <span className="item-icon">
            <Clock size={18} />
          </span>
          <span className="item-text">Recent</span>
        </button>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">Categories</h3>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`sidebar-item ${selectedCategory === category.id ? 'selected' : ''}`}
            onClick={() => onCategorySelect(category.id)}
            onMouseDown={(e) => {
              const timer = setTimeout(() => {
                handleCategoryLongPress(e, category.id);
              }, 500);

              const handleMouseUp = () => {
                clearTimeout(timer);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            <span className="item-icon" style={{ backgroundColor: category.color }}>
              {category.icon}
            </span>
            <span className="item-text">{category.name}</span>
            <span className="item-count">{category.count}</span>
          </button>
        ))}
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null })}
        items={contextMenuItems}
      />
    </aside>
  );
};
