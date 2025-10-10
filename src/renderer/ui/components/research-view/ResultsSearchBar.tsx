import React from 'react';
import { Search, Edit, Plus, ChevronDown, History } from 'lucide-react';
import { useSearch } from './SearchProvider';

export const ResultsSearchBar: React.FC = () => {
  const { query, setQuery, performSearch, clearResults, searchHistory } = useSearch();
  const [isEditing, setIsEditing] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [editedQuery, setEditedQuery] = React.useState(query);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setQuery(editedQuery);
    setIsEditing(false);
    if (editedQuery.trim() !== query.trim() && editedQuery.trim()) {
      await performSearch();
    }
  };

  const handleCancel = () => {
    setEditedQuery(query);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSelectHistory = (historyQuery: string) => {
    setQuery(historyQuery);
    setEditedQuery(historyQuery);
    setShowHistory(false);
    void performSearch();
  };

  return (
    <div className="results-search-bar">
      <div className="search-bar-content">
        <Search size={18} className="search-icon" />

        {isEditing ? (
          <div className="search-edit-mode">
            <input
              ref={inputRef}
              type="text"
              className="search-input-edit"
              value={editedQuery}
              onChange={(e) => setEditedQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSave}
              placeholder="Enter your search query..."
            />
          </div>
        ) : (
          <div className="search-display-mode">
            <span className="search-query-text">{query}</span>
            <button
              type="button"
              className="search-edit-button"
              onClick={() => setIsEditing(true)}
              aria-label="Edit search query"
            >
              <Edit size={14} />
            </button>
          </div>
        )}

        <div className="search-actions">
          {searchHistory.length > 0 && (
            <div className="search-history-dropdown">
              <button
                type="button"
                className="history-button"
                onClick={() => setShowHistory(!showHistory)}
                aria-label="Search history"
              >
                <History size={16} />
                <ChevronDown size={14} />
              </button>
              {showHistory && (
                <div className="history-menu">
                  <div className="history-header">Recent searches</div>
                  {searchHistory.map((historyQuery) => (
                    <button
                      key={historyQuery}
                      type="button"
                      className="history-item"
                      onClick={() => handleSelectHistory(historyQuery)}
                    >
                      <History size={14} />
                      <span>{historyQuery}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            className="new-search-button"
            onClick={clearResults}
            aria-label="New search"
          >
            <Plus size={16} />
            <span>New Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};
