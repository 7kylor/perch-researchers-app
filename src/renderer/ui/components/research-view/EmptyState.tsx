import React from 'react';
import { MoreHorizontal, Filter, History, Search } from 'lucide-react';
import { useSearch } from './SearchProvider';

export const EmptyState: React.FC = () => {
  const { query, isSearching, setQuery, performSearch } = useSearch();
  const [showMenu, setShowMenu] = React.useState(false);

  const onKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void performSearch();
      }
    },
    [performSearch],
  );

  return (
    <div className="empty-hero">
      <div className="hero-search">
        <div className="hero-search-input">
          <Search />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder="Search arXiv, PubMed, CrossRef, Semantic Scholar..."
            disabled={isSearching}
          />
          {query && (
            <button type="button" className="hero-clear" onClick={() => setQuery('')} title="Clear">
              ×
            </button>
          )}
        </div>
        <div className="hero-actions">
          <button type="button" className="hero-action" title="Filters">
            <Filter />
            Filters
          </button>
          <button type="button" className="hero-action" title="History">
            <History />
            History
          </button>
          <div className="hero-menu">
            <button
              type="button"
              className="hero-action"
              onClick={() => setShowMenu(!showMenu)}
              aria-haspopup="menu"
              aria-expanded={showMenu}
              title="More"
            >
              <MoreHorizontal />
              More
            </button>
            {showMenu && (
              <div className="hero-menu-popover" role="menu">
                <button type="button" role="menuitem" className="hero-menu-item">
                  Reset filters
                </button>
                <button type="button" role="menuitem" className="hero-menu-item">
                  Clear history
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="hero-search-button"
            onClick={() => void performSearch()}
            disabled={isSearching || !query.trim()}
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
