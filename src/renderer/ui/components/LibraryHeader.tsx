import React from 'react';
import { Search, Plus, Settings, X, CheckSquare, Square, Trash2 } from 'lucide-react';

type LibraryHeaderProps = {
  currentCategory: string;
  onAddItem: () => void;
  onSettingsClick: () => void;
  onToggleSelection: () => void;
  isSelectionMode: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  currentCategory,
  onAddItem,
  onSettingsClick,
  onToggleSelection,
  isSelectionMode,
  selectedCount,
  onSelectAll,
  onBulkDelete,
  searchQuery,
  onSearchChange,
}) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return 'All Papers';
      case 'recent':
        return 'Recent';
      case 'ai-models':
        return 'AI Models';
      case 'ml':
        return 'ML';
      case 'segmentation':
        return 'Segmentation';
      default:
        return 'Library';
    }
  };

  return (
    <header className="library-header">
      {isSelectionMode ? (
        <div className="selection-header">
          <button
            type="button"
            className="header-btn"
            onClick={onToggleSelection}
            title="Exit selection mode"
          >
            <X size={18} />
          </button>
          <span className="selection-info">{selectedCount} selected</span>
          <div className="selection-actions">
            <button
              type="button"
              className="header-btn"
              onClick={onSelectAll}
              title={selectedCount === 0 ? 'Select all' : 'Deselect all'}
            >
              {selectedCount === 0 ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                className="header-btn danger"
                onClick={onBulkDelete}
                title={`Delete ${selectedCount} selected papers`}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <h1 className="header-title">My Library / {getCategoryDisplayName(currentCategory)}</h1>
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
            <button
              type="button"
              className="header-btn"
              onClick={onToggleSelection}
              title="Select papers"
            >
              <CheckSquare size={18} />
            </button>
            <button type="button" className="header-btn" onClick={onSettingsClick} title="Settings">
              <Settings size={18} />
            </button>
          </div>
        </>
      )}
    </header>
  );
};
