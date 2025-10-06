import React from 'react';
import { Plus, Search, X, LayoutGrid, List, ArrowUpDown, Calendar, User } from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'recent' | 'title' | 'author' | 'year';

type LibraryControlsProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddItem: () => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
};

export const LibraryControls: React.FC<LibraryControlsProps> = ({
  searchQuery,
  onSearchChange,
  onAddItem,
  viewMode = 'grid',
  onViewModeChange,
  sortBy = 'recent',
  onSortChange,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);
  const filtersRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as HTMLElement | null)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilters]);

  const sortOptions: { value: SortOption; label: string; icon: React.ReactElement }[] = [
    { value: 'recent', label: 'Recently Added', icon: <Calendar className="h-3 w-3" /> },
    { value: 'title', label: 'Title', icon: <ArrowUpDown className="h-3 w-3" /> },
    { value: 'author', label: 'Author', icon: <User className="h-3 w-3" /> },
    { value: 'year', label: 'Year', icon: <Calendar className="h-3 w-3" /> },
  ];

  const getSortLabel = () => {
    return sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort';
  };

  return (
    <div className="library-controls">
      <div className="controls-left">
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
      </div>

      <div className="controls-right">
        {/* Sort Dropdown */}
        <div className="control-group" ref={filtersRef}>
          <button
            type="button"
            className={`control-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Sort and filter"
          >
            <ArrowUpDown size={16} />
            <span className="control-btn-text">{getSortLabel()}</span>
          </button>

          {showFilters && onSortChange && (
            <div className="sort-dropdown">
              <div className="dropdown-section">
                <div className="dropdown-label">Sort by</div>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`dropdown-item ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => {
                      onSortChange(option.value);
                      setShowFilters(false);
                    }}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => onViewModeChange('grid')}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => onViewModeChange('list')}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        )}

        {/* Add Paper Button */}
        <button type="button" className="add-btn" onClick={onAddItem} title="Add new paper">
          <Plus size={18} />
          <span>Add Paper</span>
        </button>
      </div>
    </div>
  );
};
