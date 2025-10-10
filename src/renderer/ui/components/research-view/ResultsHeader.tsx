import React from 'react';
import { ArrowUpDown, X } from 'lucide-react';

type ViewMode = 'list';
type SortBy = 'relevance' | 'year' | 'title';
type SortOrder = 'asc' | 'desc';

type ResultsHeaderProps = {
  totalResults: number;
  filteredResults: number;
  selectedCount: number;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onViewModeChange: (mode: ViewMode) => void;
  onSortByChange: (sort: SortBy) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onClearSelection: () => void;
};

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  totalResults,
  filteredResults,
  selectedCount,
  viewMode: _viewMode,
  sortBy,
  sortOrder,
  onViewModeChange: _onViewModeChange,
  onSortByChange,
  onSortOrderChange,
  onClearSelection,
}) => {
  const [showSortMenu, setShowSortMenu] = React.useState(false);

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'year', label: 'Year' },
    { value: 'title', label: 'Title' },
    { value: 'citations', label: 'Citations' },
  ];

  const handleSortChange = React.useCallback(
    (newSortBy: SortBy) => {
      if (newSortBy === sortBy) {
        // If same sort field, toggle order
        onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // If different sort field, set to desc by default
        onSortByChange(newSortBy);
        onSortOrderChange('desc');
      }
      setShowSortMenu(false);
    },
    [sortBy, sortOrder, onSortByChange, onSortOrderChange],
  );

  return (
    <div className="results-header">
      <div className="results-info">
        <div className="results-stats">
          <span className="results-count">
            {filteredResults === totalResults
              ? `Found ${totalResults} papers`
              : `Showing ${filteredResults} of ${totalResults} papers`}
          </span>
          {selectedCount > 0 && <span className="selected-count">• {selectedCount} selected</span>}
        </div>
      </div>

      <div className="results-controls">
        {selectedCount > 0 && (
          <button type="button" onClick={onClearSelection} className="clear-selection-button">
            <X />
            Clear Selection
          </button>
        )}

        <div className="sort-controls">
          <button
            type="button"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="sort-button"
          >
            <ArrowUpDown />
            Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}
            {sortOrder === 'desc' ? ' ↓' : ' ↑'}
          </button>

          {showSortMenu && (
            <div className="sort-menu">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSortChange(option.value as SortBy)}
                  className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                >
                  {option.label}
                  {sortBy === option.value && (
                    <span className="sort-indicator">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
