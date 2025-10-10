import React from 'react';
import type { AcademicSearchResult } from '../../../../shared/types';

type SearchState = {
  query: string;
  isSearching: boolean;
  results: AcademicSearchResult | null;
  selectedPapers: ReadonlyArray<string>;
  searchHistory: string[];
  density: 'normal' | 'dense';
  filters: {
    yearRange: [number | null, number | null];
    sources: string[];
    hasAbstract: boolean | null;
  };
};

type SearchActions = {
  setQuery: (query: string) => void;
  performSearch: () => Promise<void>;
  togglePaperSelection: (paperId: string) => void;
  clearSelection: () => void;
  setDensity: (density: SearchState['density']) => void;
  updateFilters: (filters: Partial<SearchState['filters']>) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
};

type SearchContextType = SearchState & SearchActions;

const SearchContext = React.createContext<SearchContextType | null>(null);

export const useSearch = (): SearchContextType => {
  const context = React.useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

type SearchProviderProps = {
  children: React.ReactNode;
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, setState] = React.useState<SearchState>({
    query: '',
    isSearching: false,
    results: null,
    selectedPapers: [],
    searchHistory: JSON.parse(localStorage.getItem('search:history') || '[]'),
    density: (localStorage.getItem('search:density') as SearchState['density']) || 'normal',
    filters: {
      yearRange: [null, null],
      sources: [],
      hasAbstract: null,
    },
  });

  const setQuery = React.useCallback((query: string) => {
    setState((prev) => ({ ...prev, query }));
  }, []);

  const performSearch = React.useCallback(async () => {
    const trimmed = state.query.trim();
    if (!trimmed) return;

    setState((prev) => ({ ...prev, isSearching: true }));

    try {
      const response = await window.api.academic['search-all'](trimmed, 50);
      setState((prev) => ({
        ...prev,
        results: response as AcademicSearchResult,
        isSearching: false,
      }));

      // Add to history if not already present
      setState((prev) => {
        if (!prev.searchHistory.includes(trimmed)) {
          const newHistory = [trimmed, ...prev.searchHistory.slice(0, 9)];
          localStorage.setItem('search:history', JSON.stringify(newHistory));
          return { ...prev, searchHistory: newHistory };
        }
        return prev;
      });
    } catch (error) {
      console.error('Search failed:', error);
      setState((prev) => ({ ...prev, isSearching: false }));
    }
  }, [state.query]);

  const togglePaperSelection = React.useCallback((paperId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPapers: prev.selectedPapers.includes(paperId)
        ? prev.selectedPapers.filter((id) => id !== paperId)
        : [...prev.selectedPapers, paperId],
    }));
  }, []);

  const clearSelection = React.useCallback(() => {
    setState((prev) => ({ ...prev, selectedPapers: [] }));
  }, []);

  const setDensity = React.useCallback((density: SearchState['density']) => {
    setState((prev) => ({ ...prev, density }));
    localStorage.setItem('search:density', density);
  }, []);

  const updateFilters = React.useCallback((filters: Partial<SearchState['filters']>) => {
    setState((prev) => ({ ...prev, filters: { ...prev.filters, ...filters } }));
  }, []);

  const addToHistory = React.useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setState((prev) => {
      if (prev.searchHistory.includes(trimmed)) return prev;
      const newHistory = [trimmed, ...prev.searchHistory.slice(0, 9)];
      localStorage.setItem('search:history', JSON.stringify(newHistory));
      return { ...prev, searchHistory: newHistory };
    });
  }, []);

  const clearHistory = React.useCallback(() => {
    setState((prev) => ({ ...prev, searchHistory: [] }));
    localStorage.removeItem('search:history');
  }, []);

  const contextValue = React.useMemo<SearchContextType>(
    () => ({
      ...state,
      setQuery,
      performSearch,
      togglePaperSelection,
      clearSelection,
      setDensity,
      updateFilters,
      addToHistory,
      clearHistory,
    }),
    [
      state,
      setQuery,
      performSearch,
      togglePaperSelection,
      clearSelection,
      setDensity,
      updateFilters,
      addToHistory,
      clearHistory,
    ],
  );

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>;
};
