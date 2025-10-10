import React from 'react';
import { Calendar, Database, FileText, X } from 'lucide-react';
import { useSearch } from './SearchProvider';

export const SearchFilters: React.FC = () => {
  const { filters, updateFilters, results } = useSearch();

  const availableSources = React.useMemo(() => {
    if (!results?.papers) return [];
    const sources = [...new Set(results.papers.map((p) => p.source))];
    return sources.sort();
  }, [results]);

  const handleYearRangeChange = React.useCallback(
    (type: 'min' | 'max', value: string) => {
      const numValue = value ? parseInt(value, 10) : null;
      updateFilters({
        yearRange:
          type === 'min' ? [numValue, filters.yearRange[1]] : [filters.yearRange[0], numValue],
      });
    },
    [filters.yearRange, updateFilters],
  );

  const handleSourceToggle = React.useCallback(
    (source: string) => {
      const newSources = filters.sources.includes(source)
        ? filters.sources.filter((s) => s !== source)
        : [...filters.sources, source];
      updateFilters({ sources: newSources });
    },
    [filters.sources, updateFilters],
  );

  const handleAbstractToggle = React.useCallback(() => {
    updateFilters({
      hasAbstract: filters.hasAbstract === null ? true : !filters.hasAbstract,
    });
  }, [filters.hasAbstract, updateFilters]);

  const clearAllFilters = React.useCallback(() => {
    updateFilters({
      yearRange: [null, null],
      sources: [],
      hasAbstract: null,
    });
  }, [updateFilters]);

  const hasActiveFilters =
    filters.yearRange[0] !== null ||
    filters.yearRange[1] !== null ||
    filters.sources.length > 0 ||
    filters.hasAbstract !== null;

  return (
    <div className="search-filters">
      <div className="search-filters-header">
        <h3>Search Filters</h3>
        {hasActiveFilters && (
          <button type="button" onClick={clearAllFilters} className="search-filters-clear">
            <X />
            Clear All
          </button>
        )}
      </div>

      <div className="search-filters-content">
        {/* Year Range Filter */}
        <div className="filter-group">
          <div className="filter-label">
            <Calendar />
            Publication Year
          </div>
          <div className="year-range-inputs">
            <input
              type="number"
              placeholder="From"
              value={filters.yearRange[0] ?? ''}
              onChange={(e) => handleYearRangeChange('min', e.target.value)}
              className="year-input"
              min="1900"
              max="2030"
            />
            <span className="year-separator">–</span>
            <input
              type="number"
              placeholder="To"
              value={filters.yearRange[1] ?? ''}
              onChange={(e) => handleYearRangeChange('max', e.target.value)}
              className="year-input"
              min="1900"
              max="2030"
            />
          </div>
        </div>

        {/* Source Filter */}
        <div className="filter-group">
          <div className="filter-label">
            <Database />
            Sources
          </div>
          <div className="source-checkboxes">
            {availableSources.map((source) => (
              <label key={source} className="source-checkbox">
                <input
                  type="checkbox"
                  checked={filters.sources.includes(source)}
                  onChange={() => handleSourceToggle(source)}
                />
                <span className="source-name">{source}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Abstract Filter */}
        <div className="filter-group">
          <div className="filter-label">
            <FileText />
            Content
          </div>
          <label className="abstract-checkbox">
            <input
              type="checkbox"
              checked={filters.hasAbstract === true}
              onChange={handleAbstractToggle}
            />
            <span>Has Abstract</span>
          </label>
        </div>
      </div>
    </div>
  );
};
