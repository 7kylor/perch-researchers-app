import React from 'react';
import { BookOpen, Clock, Edit, Trash2, Brain, TrendingUp, Layers, User } from 'lucide-react';
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
    icon: <Brain className="h-3 w-3" />,
    color: '#3b82f6',
  },
  { id: 'ml', name: 'ML', count: 23, icon: <TrendingUp className="h-3 w-3" />, color: '#6b7280' },
  {
    id: 'segmentation',
    name: 'Segmentation',
    count: 15,
    icon: <Layers className="h-3 w-3" />,
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
          icon: <Edit className="h-3 w-3" />,
          onClick: () => handleCategoryRename(contextMenu.categoryId as string),
        },
        {
          label: 'Delete',
          icon: <Trash2 className="h-3 w-3" />,
          onClick: () => handleCategoryDelete(contextMenu.categoryId as string),
          danger: true,
        },
      ]
    : [];

  return (
    <aside className={`library-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-grid">
        {/* Library Section */}
        <div className="sidebar-section">
          <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Library</h3>
          <div className="section-items">
            <button
              type="button"
              className={`sidebar-item ${selectedCategory === 'all' ? 'selected' : ''}`}
              onClick={() => onCategorySelect('all')}
            >
              <BookOpen className="h-3 w-3" />
              <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>All Papers</span>
            </button>
            <button
              type="button"
              className={`sidebar-item ${selectedCategory === 'recent' ? 'selected' : ''}`}
              onClick={() => onCategorySelect('recent')}
            >
              <Clock className="h-3 w-3" />
              <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>Recent</span>
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="sidebar-section">
          <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Categories</h3>
          <div className="section-items">
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
                <span style={{ color: category.color }}>
                  {typeof category.icon === 'string' ? category.icon : category.icon}
                </span>
                <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>{category.name}</span>
                <span className={`item-count ${isCollapsed ? 'hidden' : ''}`}>
                  {category.count}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`sidebar-item add-category ${isCollapsed ? 'collapsed' : ''}`}
              onClick={() => {}}
            >
              <Layers className="h-3 w-3" />
              <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>New category +</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className={`sidebar-footer ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          type="button"
          className={`sidebar-item ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => {
            console.log('Account clicked - open modal');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'white',
              fontWeight: '600',
            }}
          >
            JD
          </div>
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`} style={{ fontSize: '13px' }}>
            John Doe
          </span>
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
