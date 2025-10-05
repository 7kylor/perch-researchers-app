import type React from 'react';

type LibraryHeaderProps = {
  currentCategory: string;
  onAddItem: () => void;
  onSearch: () => void;
  onToggleView: () => void;
  viewType: 'grid' | 'list';
};

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  currentCategory,
  onAddItem,
  onSearch,
  onToggleView,
  viewType,
}) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
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
      <div className="header-left">
        <h1 className="header-title">My Library / {getCategoryDisplayName(currentCategory)}</h1>
      </div>
      <div className="header-right">
        <button type="button" className="header-btn primary" onClick={onAddItem} title="Add item">
          <span className="btn-icon">+</span>
        </button>
        <button type="button" className="header-btn" onClick={onSearch} title="Search">
          <span className="btn-icon">🔍</span>
        </button>
        <button
          type="button"
          className="header-btn"
          onClick={onToggleView}
          title={`Switch to ${viewType === 'grid' ? 'list' : 'grid'} view`}
        >
          <span className="btn-icon">{viewType === 'grid' ? '☰' : '⊞'}</span>
        </button>
      </div>
    </header>
  );
};
