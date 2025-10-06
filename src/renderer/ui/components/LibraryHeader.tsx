import React from 'react';
import { Search, Plus, Settings, X } from 'lucide-react';

type LibraryHeaderProps = {
  currentCategory: string;
  onAddItem: () => void;
  onSettingsClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  currentCategory,
  onAddItem,
  onSettingsClick,
  searchQuery,
  onSearchChange,
}) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return 'All Papers';
      case 'recent':
        return 'Recent';
      default:
        // Try to find the category name from localStorage
        try {
          const saved = localStorage.getItem('categories');
          if (saved) {
            const categories = JSON.parse(saved) as Array<{ id: string; name: string }>;
            const category = categories.find((c) => c.id === categoryId);
            return category ? category.name : 'Library';
          }
        } catch {
          // Fall back to default
        }
        return 'Library';
    }
  };

  return (
    <header className="library-header">
      <h1 className="header-title">Perch / {getCategoryDisplayName(currentCategory)}</h1>
      <div className="header-center">
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search papers by title, author, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => onSearchChange('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="header-right">
        <button
          type="button"
          className="header-btn primary"
          onClick={onAddItem}
          title="Add new paper"
        >
          <Plus size={18} />
        </button>
        <button type="button" className="header-btn" onClick={onSettingsClick} title="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
