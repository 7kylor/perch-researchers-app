import React from 'react';
import { BookOpen, Clock, Edit, Trash2, Layers, Plus } from 'lucide-react';
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

// Categories will be loaded from localStorage and managed by user

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  selectedCategory,
  onCategorySelect,
  isCollapsed,
}) => {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [contextMenu, setContextMenu] = React.useState<{
    isOpen: boolean;
    x: number;
    y: number;
    categoryId: string | null;
  }>({ isOpen: false, x: 0, y: 0, categoryId: null });

  const sidebarRef = React.useRef<HTMLElement | null>(null);

  // Load categories from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('categories');
    if (saved) {
      try {
        const savedCategories = JSON.parse(saved);
        setCategories(savedCategories);
      } catch (error) {
        console.error('Error loading categories from localStorage:', error);
      }
    }
  }, []);

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

  const saveCategoriesToStorage = (updatedCategories: Category[]) => {
    localStorage.setItem('categories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const handleAddCategory = () => {
    const categoryName = prompt('Enter category name:');
    if (categoryName?.trim()) {
      const newCategory: Category = {
        id: `category-${Date.now()}`,
        name: categoryName.trim(),
        count: 0,
        icon: <Layers className="h-3 w-3" />,
        color: '#6b7280',
      };
      const updatedCategories = [...categories, newCategory];
      saveCategoriesToStorage(updatedCategories);
    }
  };

  const handleCategoryRename = (categoryId: string) => {
    const newName = prompt('Enter new category name:');
    if (newName?.trim()) {
      const updatedCategories = categories.map((category) =>
        category.id === categoryId ? { ...category, name: newName.trim() } : category,
      );
      saveCategoriesToStorage(updatedCategories);
    }
    setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null });
  };

  const handleCategoryDelete = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const updatedCategories = categories.filter((category) => category.id !== categoryId);
      saveCategoriesToStorage(updatedCategories);
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
    <nav
      className={`library-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Library sidebar"
      ref={sidebarRef as React.RefObject<HTMLElement>}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const root = sidebarRef.current;
        if (!root) return;
        const focusable = Array.from(
          root.querySelectorAll<HTMLButtonElement>('li > button.sidebar-item:not(.hidden)'),
        );
        if (focusable.length === 0) return;
        const currentIndex = focusable.findIndex((el) => el === document.activeElement);
        let nextIndex = currentIndex;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % focusable.length;
        } else if (e.key === 'ArrowUp') {
          nextIndex =
            currentIndex === -1
              ? focusable.length - 1
              : (currentIndex - 1 + focusable.length) % focusable.length;
        }
        const next = focusable[nextIndex];
        if (next) {
          e.preventDefault();
          next.focus();
        }
      }}
    >
      <div className="sidebar-grid">
        {/* Library Section */}
        <div className="sidebar-section">
          <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Library</h3>
          <ul className="section-items">
            <li>
              <button
                type="button"
                className={`sidebar-item ${selectedCategory === 'all' ? 'selected' : ''}`}
                aria-current={selectedCategory === 'all' ? 'page' : undefined}
                onClick={() => onCategorySelect('all')}
              >
                <span className="item-icon" aria-hidden="true">
                  <BookOpen className="h-3 w-3" />
                </span>
                <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>All Papers</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`sidebar-item ${selectedCategory === 'recent' ? 'selected' : ''}`}
                aria-current={selectedCategory === 'recent' ? 'page' : undefined}
                onClick={() => onCategorySelect('recent')}
              >
                <span className="item-icon" aria-hidden="true">
                  <Clock className="h-3 w-3" />
                </span>
                <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>Recent</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Categories Section */}
        <div className="sidebar-section">
          <div className={`section-title ${isCollapsed ? 'hidden' : ''}`}>
            <span>Categories</span>
            {!isCollapsed && (
              <button
                type="button"
                className="add-category-title-btn"
                onClick={handleAddCategory}
                title="Add new category"
                aria-label="Add category"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
          <ul className="section-items">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className={`sidebar-item ${selectedCategory === category.id ? 'selected' : ''}`}
                  aria-current={selectedCategory === category.id ? 'page' : undefined}
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
                  <span className="item-icon" style={{ color: category.color }} aria-hidden="true">
                    {typeof category.icon === 'string' ? category.icon : category.icon}
                  </span>
                  <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>
                    {category.name}
                  </span>
                  <span className={`item-count ${isCollapsed ? 'hidden' : ''}`}>
                    {category.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Account Section */}
      <div className={`sidebar-footer ${isCollapsed ? 'collapsed' : ''}`}>
        <button
          type="button"
          className={`sidebar-item sidebar-account-btn ${isCollapsed ? 'collapsed' : ''}`}
          onClick={() => {
            console.log('Account clicked - open modal');
          }}
        >
          <div className="sidebar-avatar" aria-hidden="true">
            JD
          </div>
          <span className={`item-text ${isCollapsed ? 'hidden' : ''}`}>John Doe</span>
        </button>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, categoryId: null })}
        items={contextMenuItems}
      />
    </nav>
  );
};
