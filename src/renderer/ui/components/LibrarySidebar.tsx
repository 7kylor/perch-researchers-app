import type React from 'react';

type Category = {
  id: string;
  name: string;
  count: number;
  icon: string;
  color: string;
};

type LibrarySidebarProps = {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
};

const categories: Category[] = [
  { id: 'ai-models', name: 'AI Models', count: 40, icon: '🤖', color: '#7aa2f7' },
  { id: 'ml', name: 'ML', count: 23, icon: '🧠', color: '#bb9af7' },
  { id: 'segmentation', name: 'Segmentation', count: 15, icon: '✂️', color: '#9ece6a' },
];

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  return (
    <aside className="library-sidebar">
      <div className="sidebar-section">
        <h3 className="section-title">Recent</h3>
        <div className="sidebar-item">
          <span className="item-icon">📚</span>
          <span className="item-text">Reading list</span>
        </div>
        <div className="sidebar-item">
          <span className="item-icon">🔍</span>
          <span className="item-text">Discover</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="section-title">My library</h3>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`sidebar-item ${selectedCategory === category.id ? 'selected' : ''}`}
            onClick={() => onCategorySelect(category.id)}
          >
            <span className="item-icon" style={{ backgroundColor: category.color }}>
              {category.icon}
            </span>
            <span className="item-text">{category.name}</span>
            <span className="item-count">{category.count}</span>
          </button>
        ))}
        <div className="sidebar-item add-category">
          <span className="item-text">New category +</span>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-item">
          <span className="item-icon">⚙️</span>
          <span className="item-text">Settings</span>
        </div>
      </div>
    </aside>
  );
};
