import React from 'react';
import { BookOpen, Clock, Settings, Edit, Trash2, Brain, TrendingUp, Layers } from 'lucide-react';
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
  isCollapsed: boolean;
};

const categories: Category[] = [
  {
    id: 'ai-models',
    name: 'AI Models',
    count: 40,
    icon: <Brain className="h-4 w-4" />,
    color: '#3b82f6',
  },
  { id: 'ml', name: 'ML', count: 23, icon: <TrendingUp className="h-4 w-4" />, color: '#6b7280' },
  {
    id: 'segmentation',
    name: 'Segmentation',
    count: 15,
    icon: <Layers className="h-4 w-4" />,
    color: '#9ca3af',
  },
];

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  selectedCategory,
  onCategorySelect,
  isCollapsed,
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
    if (newName?.trim()) {
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
          icon: <Edit className="h-4 w-4" />,
          onClick: () => handleCategoryRename(contextMenu.categoryId as string),
        },
        {
          label: 'Delete',
          icon: <Trash2 className="h-4 w-4" />,
          onClick: () => handleCategoryDelete(contextMenu.categoryId as string),
          danger: true,
        },
      ]
    : [];

  return (
    <aside className={`library-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-section">
        <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Library</h3>
        <button
          type="button"
          className={`sidebar-item ${selectedCategory === 'all' ? 'selected' : ''}`}
          onClick={() => onCategorySelect('all')}
        >
          <span className="item-icon">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>All Papers</span>
        </button>
        <button
          type="button"
          className={`sidebar-item ${selectedCategory === 'recent' ? 'selected' : ''}`}
          onClick={() => onCategorySelect('recent')}
        >
          <span className="item-icon">
            <Clock className="h-4 w-4" />
          </span>
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>Recent</span>
        </button>
      </div>

      <div className="sidebar-section">
        <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Categories</h3>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`sidebar-item ${selectedCategory === category.id ? 'selected' : ''}`}
            onClick={() => onCategorySelect(category.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCategoryLongPress(e, category.id);
            }}
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
              {typeof category.icon === 'string' ? category.icon : category.icon}
            </span>
            <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>{category.name}</span>
            <span className={`item-count ${isCollapsed ? 'hidden' : ''}`}>{category.count}</span>
          </button>
        ))}
        <button
          type="button"
          className={`sidebar-item add-category ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => {}}
        >
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>New category +</span>
        </button>
      </div>

      <div className={`sidebar-footer ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          type="button"
          className={`sidebar-item ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => {}}
        >
          <span className="item-icon">
            <Settings className="h-4 w-4" />
          </span>
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>Settings</span>
        </button>
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
