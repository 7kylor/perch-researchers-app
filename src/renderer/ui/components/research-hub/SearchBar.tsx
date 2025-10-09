import type React from 'react';
import { Search, Sparkles } from 'lucide-react';

type SearchBarProps = {
  query: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  isSearching,
  onQueryChange,
  onSearch,
  onKeyPress,
}) => {
  return (
    <div className="search-bar-container">
      <div className="search-bar-content">
        <div className="search-icon-badge">
          <Search />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Search arXiv, PubMed, CrossRef, and more..."
          className="search-input"
          disabled={isSearching}
        />

        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching || !query.trim()}
          className="search-button"
        >
          <Sparkles />
          Search
        </button>
      </div>
    </div>
  );
};
