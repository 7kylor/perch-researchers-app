import React from 'react';
import { Search } from 'lucide-react';

type SearchInputProps = {
  query: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  query,
  isSearching,
  onQueryChange,
  onKeyPress,
  placeholder,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="search-input-wrapper">
      <div className="search-input-icon">
        <Search />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        className="search-input-field"
        disabled={isSearching}
        autoComplete="off"
        spellCheck={false}
      />

      {query && !isSearching && (
        <button
          type="button"
          onClick={() => onQueryChange('')}
          className="search-input-clear"
          title="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};
