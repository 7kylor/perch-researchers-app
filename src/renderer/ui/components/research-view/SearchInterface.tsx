import React from 'react';
import { History, Filter, MoreHorizontal } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { SearchHistory } from './SearchHistory';
import { SearchFilters } from './SearchFilters';
import { useSearch } from './SearchProvider';

type SearchInterfaceProps = {
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ onKeyPress }) => {
  const { query, isSearching, setQuery, performSearch, searchHistory } = useSearch();
  const [showHistory, setShowHistory] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleSearchClick = React.useCallback(() => {
    void performSearch();
  }, [performSearch]);

  const handleHistorySelect = React.useCallback(
    (historyQuery: string) => {
      setQuery(historyQuery);
      setShowHistory(false);
      void performSearch();
    },
    [setQuery, performSearch],
  );

  const handleClearHistory = React.useCallback(() => {
    // This would be implemented in SearchProvider
    setShowHistory(false);
  }, []);

  return (
    <div className="search-interface">
      <div className="search-controls">
        <div className="search-input-container">
          <SearchInput
            query={query}
            isSearching={isSearching}
            onQueryChange={setQuery}
            onKeyPress={onKeyPress}
            placeholder="Search arXiv, PubMed, CrossRef, Semantic Scholar..."
          />
          <div className="search-actions">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`search-action-button ${showFilters ? 'active' : ''}`}
              title="Search filters"
            >
              <Filter />
            </button>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`search-action-button ${showHistory ? 'active' : ''}`}
              title="Search history"
            >
              <History />
            </button>
            <div className="search-menu">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className={`search-action-button ${showMenu ? 'active' : ''}`}
                title="More options"
                aria-haspopup="menu"
                aria-expanded={showMenu}
              >
                <MoreHorizontal />
              </button>
              {showMenu && (
                <div className="search-menu-popover" role="menu">
                  <button type="button" role="menuitem" className="search-menu-item">
                    Reset filters
                  </button>
                  <button type="button" role="menuitem" className="search-menu-item">
                    Clear history
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={isSearching || !query.trim()}
              className="search-button-primary"
            >
              Search
            </button>
          </div>
        </div>
        {showFilters && <SearchFilters />}
        {showHistory && (
          <SearchHistory
            history={searchHistory}
            onSelect={handleHistorySelect}
            onClear={handleClearHistory}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
};
