import React from 'react';
import type { AcademicSearchResult, CustomColumn, ExportFormat } from '../../../../shared/types';

type SearchFilters = {
  yearRange: [number | null, number | null];
  sources: string[];
  hasAbstract: boolean | null;
  hasPdf: boolean | null;
  journalQuality: number | null;
  studyTypes: string[];
};

type SearchState = {
  query: string;
  isSearching: boolean;
  results: AcademicSearchResult | null;
  selectedPapers: string[];
  expandedPaperIds: string[];
  sidePanelPaperId: string | null;
  detailsPagePaperId: string | null; // For dedicated details page
  customColumns: CustomColumn[];
  columnVisibility: Record<string, boolean>;
  sorting: Array<{ id: string; desc: boolean }>;
  filters: SearchFilters;
  searchHistory: string[];
  density: 'normal' | 'dense';
};

type SearchActions = {
  setQuery: (query: string) => void;
  performSearch: () => Promise<void>;
  clearResults: () => void;
  togglePaperSelection: (paperId: string) => void;
  selectAllPapers: () => void;
  clearSelection: () => void;
  toggleRowExpansion: (paperId: string) => void;
  collapseAllRows: () => void;
  openSidePanel: (paperId: string) => void;
  closeSidePanel: () => void;
  navigateSidePanel: (direction: 'next' | 'prev') => void;
  openDetailsPage: (paperId: string) => void;
  closeDetailsPage: () => void;
  addCustomColumn: (column: CustomColumn) => void;
  updateCustomColumn: (columnId: string, updates: Partial<CustomColumn>) => void;
  removeCustomColumn: (columnId: string) => void;
  toggleColumnVisibility: (columnId: string) => void;
  setSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setDensity: (density: SearchState['density']) => void;
  exportSelectedPapers: (format: ExportFormat) => Promise<void>;
  addSelectedToLibrary: () => Promise<void>;
  tagSelectedPapers: (tags: string[]) => Promise<void>;
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

const STORAGE_KEYS = {
  HISTORY: 'research:search:history',
  DENSITY: 'research:search:density',
  CUSTOM_COLUMNS: 'research:search:customColumns',
  COLUMN_VISIBILITY: 'research:search:columnVisibility',
  FILTERS: 'research:search:filters',
  SORTING: 'research:search:sorting',
} as const;

const DEFAULT_FILTERS: SearchFilters = {
  yearRange: [null, null],
  sources: [],
  hasAbstract: null,
  hasPdf: null,
  journalQuality: null,
  studyTypes: [],
};

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, setState] = React.useState<SearchState>(() => {
    // Initialize from localStorage
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const savedDensity = localStorage.getItem(STORAGE_KEYS.DENSITY);
    const savedColumns = localStorage.getItem(STORAGE_KEYS.CUSTOM_COLUMNS);
    const savedVisibility = localStorage.getItem(STORAGE_KEYS.COLUMN_VISIBILITY);
    const savedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
    const savedSorting = localStorage.getItem(STORAGE_KEYS.SORTING);

    return {
      query: '',
      isSearching: false,
      results: null,
      selectedPapers: [],
      expandedPaperIds: [],
      sidePanelPaperId: null,
      detailsPagePaperId: null,
      customColumns: savedColumns ? JSON.parse(savedColumns) : [],
      columnVisibility: savedVisibility ? JSON.parse(savedVisibility) : {},
      sorting: savedSorting ? JSON.parse(savedSorting) : [],
      filters: savedFilters ? JSON.parse(savedFilters) : DEFAULT_FILTERS,
      searchHistory: savedHistory ? JSON.parse(savedHistory) : [],
      density: (savedDensity as SearchState['density']) || 'normal',
    };
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
        selectedPapers: [],
        expandedPaperIds: [],
      }));

      // Add to search history
      setState((prev) => {
        if (!prev.searchHistory.includes(trimmed)) {
          const newHistory = [trimmed, ...prev.searchHistory.slice(0, 9)];
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
          return { ...prev, searchHistory: newHistory };
        }
        return prev;
      });
    } catch (error) {
      console.error('Search failed:', error);
      setState((prev) => ({ ...prev, isSearching: false }));
    }
  }, [state.query]);

  const clearResults = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      results: null,
      selectedPapers: [],
      expandedPaperIds: [],
      sidePanelPaperId: null,
    }));
  }, []);

  const togglePaperSelection = React.useCallback((paperId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPapers: prev.selectedPapers.includes(paperId)
        ? prev.selectedPapers.filter((id) => id !== paperId)
        : [...prev.selectedPapers, paperId],
    }));
  }, []);

  const selectAllPapers = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedPapers: prev.results?.papers.map((p) => p.title) || [],
    }));
  }, []);

  const clearSelection = React.useCallback(() => {
    setState((prev) => ({ ...prev, selectedPapers: [] }));
  }, []);

  const toggleRowExpansion = React.useCallback((paperId: string) => {
    setState((prev) => ({
      ...prev,
      expandedPaperIds: prev.expandedPaperIds.includes(paperId)
        ? prev.expandedPaperIds.filter((id) => id !== paperId)
        : [paperId], // Accordion: only one row expanded at a time
    }));
  }, []);

  const collapseAllRows = React.useCallback(() => {
    setState((prev) => ({ ...prev, expandedPaperIds: [] }));
  }, []);

  const openSidePanel = React.useCallback((paperId: string) => {
    setState((prev) => ({ ...prev, sidePanelPaperId: paperId }));
  }, []);

  const closeSidePanel = React.useCallback(() => {
    setState((prev) => ({ ...prev, sidePanelPaperId: null }));
  }, []);

  const openDetailsPage = React.useCallback((paperId: string) => {
    setState((prev) => ({ ...prev, detailsPagePaperId: paperId }));
  }, []);

  const closeDetailsPage = React.useCallback(() => {
    setState((prev) => ({ ...prev, detailsPagePaperId: null }));
  }, []);

  const navigateSidePanel = React.useCallback((direction: 'next' | 'prev') => {
    setState((prev) => {
      if (!prev.sidePanelPaperId || !prev.results) return prev;

      const papers = prev.results.papers;
      const currentIndex = papers.findIndex((p) => p.title === prev.sidePanelPaperId);

      if (currentIndex === -1) return prev;

      const nextIndex =
        direction === 'next'
          ? (currentIndex + 1) % papers.length
          : (currentIndex - 1 + papers.length) % papers.length;

      const nextPaper = papers[nextIndex];
      if (!nextPaper) return prev;

      return { ...prev, sidePanelPaperId: nextPaper.title };
    });
  }, []);

  const addCustomColumn = React.useCallback((column: CustomColumn) => {
    setState((prev) => {
      const newColumns = [...prev.customColumns, column];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(newColumns));
      return { ...prev, customColumns: newColumns };
    });
  }, []);

  const updateCustomColumn = React.useCallback(
    (columnId: string, updates: Partial<CustomColumn>) => {
      setState((prev) => {
        const newColumns = prev.customColumns.map((col) =>
          col.id === columnId ? { ...col, ...updates } : col,
        );
        localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(newColumns));
        return { ...prev, customColumns: newColumns };
      });
    },
    [],
  );

  const removeCustomColumn = React.useCallback((columnId: string) => {
    setState((prev) => {
      const newColumns = prev.customColumns.filter((col) => col.id !== columnId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COLUMNS, JSON.stringify(newColumns));
      return { ...prev, customColumns: newColumns };
    });
  }, []);

  const toggleColumnVisibility = React.useCallback((columnId: string) => {
    setState((prev) => {
      const newVisibility = {
        ...prev.columnVisibility,
        [columnId]: !prev.columnVisibility[columnId],
      };
      localStorage.setItem(STORAGE_KEYS.COLUMN_VISIBILITY, JSON.stringify(newVisibility));
      return { ...prev, columnVisibility: newVisibility };
    });
  }, []);

  const setSorting = React.useCallback((sorting: Array<{ id: string; desc: boolean }>) => {
    setState((prev) => {
      localStorage.setItem(STORAGE_KEYS.SORTING, JSON.stringify(sorting));
      return { ...prev, sorting };
    });
  }, []);

  const updateFilters = React.useCallback((filters: Partial<SearchFilters>) => {
    setState((prev) => {
      const newFilters = { ...prev.filters, ...filters };
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(newFilters));
      return { ...prev, filters: newFilters };
    });
  }, []);

  const clearFilters = React.useCallback(() => {
    setState((prev) => {
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(DEFAULT_FILTERS));
      return { ...prev, filters: DEFAULT_FILTERS };
    });
  }, []);

  const setDensity = React.useCallback((density: SearchState['density']) => {
    setState((prev) => {
      localStorage.setItem(STORAGE_KEYS.DENSITY, density);
      return { ...prev, density };
    });
  }, []);

  const exportSelectedPapers = React.useCallback(
    async (format: ExportFormat) => {
      if (!state.results || state.selectedPapers.length === 0) return;

      const selectedPaperData = state.results.papers.filter((p) =>
        state.selectedPapers.includes(p.title),
      );

      // This would need to be implemented in the main process
      // For now, we'll just log it
      console.log('Exporting papers:', { format, papers: selectedPaperData });

      // TODO: Call window.api.export[format](selectedPaperData)
    },
    [state.results, state.selectedPapers],
  );

  const addSelectedToLibrary = React.useCallback(async () => {
    if (!state.results || state.selectedPapers.length === 0) return;

    const selectedPaperData = state.results.papers.filter((p) =>
      state.selectedPapers.includes(p.title),
    );

    try {
      for (const paper of selectedPaperData) {
        await window.api.papers.add({
          title: paper.title,
          authors: paper.authors,
          venue: paper.venue,
          year: paper.year,
          doi: paper.doi,
          source: paper.source,
          abstract: paper.abstract,
          status: 'to_read',
          filePath: undefined,
          textHash: `${paper.title}-${paper.authors.slice(0, 2).join(',')}`,
        });
      }

      // Clear selection after successful import
      setState((prev) => ({ ...prev, selectedPapers: [] }));
    } catch (error) {
      console.error('Failed to add papers to library:', error);
    }
  }, [state.results, state.selectedPapers]);

  const tagSelectedPapers = React.useCallback(
    async (tags: string[]) => {
      if (!state.results || state.selectedPapers.length === 0) return;

      // TODO: Implement tagging in the main process
      console.log('Tagging papers:', { tags, papers: state.selectedPapers });
    },
    [state.results, state.selectedPapers],
  );

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close side panel
      if (e.key === 'Escape' && state.sidePanelPaperId) {
        closeSidePanel();
      }

      // Arrow keys for side panel navigation
      if (state.sidePanelPaperId && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          navigateSidePanel('next');
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          navigateSidePanel('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.sidePanelPaperId, closeSidePanel, navigateSidePanel]);

  const contextValue = React.useMemo<SearchContextType>(
    () => ({
      ...state,
      setQuery,
      performSearch,
      clearResults,
      togglePaperSelection,
      selectAllPapers,
      clearSelection,
      toggleRowExpansion,
      collapseAllRows,
      openSidePanel,
      closeSidePanel,
      navigateSidePanel,
      openDetailsPage,
      closeDetailsPage,
      addCustomColumn,
      updateCustomColumn,
      removeCustomColumn,
      toggleColumnVisibility,
      setSorting,
      updateFilters,
      clearFilters,
      setDensity,
      exportSelectedPapers,
      addSelectedToLibrary,
      tagSelectedPapers,
    }),
    [
      state,
      setQuery,
      performSearch,
      clearResults,
      togglePaperSelection,
      selectAllPapers,
      clearSelection,
      toggleRowExpansion,
      collapseAllRows,
      openSidePanel,
      closeSidePanel,
      navigateSidePanel,
      openDetailsPage,
      closeDetailsPage,
      addCustomColumn,
      updateCustomColumn,
      removeCustomColumn,
      toggleColumnVisibility,
      setSorting,
      updateFilters,
      clearFilters,
      setDensity,
      exportSelectedPapers,
      addSelectedToLibrary,
      tagSelectedPapers,
    ],
  );

  return <SearchContext.Provider value={contextValue}>{children}</SearchContext.Provider>;
};
