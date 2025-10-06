import React from 'react';
import { Plus, Search } from 'lucide-react';

type LibraryControlsProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddItem: () => void;
};

export const LibraryControls: React.FC<LibraryControlsProps> = ({
  searchQuery,
  onSearchChange,
  onAddItem,
}) => {
  return (
    <div className="library-controls">
      <div className="search-container">
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
      <button type="button" className="add-btn" onClick={onAddItem} title="Add new paper">
        <Plus size={18} />
        <span>Add Paper</span>
      </button>
    </div>
  );
};
