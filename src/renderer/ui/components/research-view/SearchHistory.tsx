import React from 'react';
import { History, Trash2, X } from 'lucide-react';

type SearchHistoryProps = {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onClear,
  onClose,
}) => {
  if (history.length === 0) {
    return (
      <div className="search-history">
        <div className="search-history-header">
          <div className="search-history-title">
            <History />
            Search History
          </div>
          <button type="button" onClick={onClose} className="search-history-close">
            <X />
          </button>
        </div>
        <div className="search-history-empty">
          <p>No recent searches</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-history">
      <div className="search-history-header">
        <div className="search-history-title">
          <History />
          Recent Searches
        </div>
        <div className="search-history-actions">
          <button
            type="button"
            onClick={onClear}
            className="search-history-clear"
            title="Clear history"
          >
            <Trash2 />
          </button>
          <button type="button" onClick={onClose} className="search-history-close">
            <X />
          </button>
        </div>
      </div>

      <div className="search-history-list">
        {history.map((query, index) => (
          <button
            key={`${query}-${index}`}
            type="button"
            onClick={() => onSelect(query)}
            className="search-history-item"
          >
            <span className="search-history-query">{query}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
