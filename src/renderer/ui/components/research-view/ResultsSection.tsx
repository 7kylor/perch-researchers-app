import React from 'react';
import { ResultsHeader } from './ResultsHeader';
import { ResultsList } from './ResultsList';
import { useSearch } from './SearchProvider';
import { SourceChips } from './SourceChips';
import type { AcademicSearchResult } from '../../../../shared/types';

type ResultsSectionProps = {
  results: AcademicSearchResult;
};

export const ResultsSection: React.FC<ResultsSectionProps> = ({ results }) => {
  const {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    selectedPapers,
    togglePaperSelection,
    clearSelection,
    filters,
    density,
    setDensity,
  } = useSearch();

  const filteredPapers = React.useMemo(() => {
    let filtered = results.papers;

    // Apply year range filter
    if (filters.yearRange[0] !== null || filters.yearRange[1] !== null) {
      filtered = filtered.filter((paper) => {
        if (!paper.year) return false;
        const year = parseInt(paper.year.toString(), 10);
        if (filters.yearRange[0] !== null && year < filters.yearRange[0]) return false;
        if (filters.yearRange[1] !== null && year > filters.yearRange[1]) return false;
        return true;
      });
    }

    // Apply source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter((paper) => filters.sources.includes(paper.source));
    }

    // Apply abstract filter
    if (filters.hasAbstract !== null) {
      filtered = filtered.filter((paper) =>
        filters.hasAbstract ? !!paper.abstract : !paper.abstract,
      );
    }

    return filtered;
  }, [results.papers, filters]);

  const sortedPapers = React.useMemo(() => {
    const sorted = [...filteredPapers];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'relevance':
          // For relevance, we use the original order from the API
          return 0;
        case 'year': {
          const yearA = parseInt(a.year?.toString() || '0', 10);
          const yearB = parseInt(b.year?.toString() || '0', 10);
          comparison = yearA - yearB;
          break;
        }
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredPapers, sortBy, sortOrder]);

  return (
    <div className="research-results-section">
      <ResultsHeader
        totalResults={results.papers.length}
        filteredResults={sortedPapers.length}
        selectedCount={selectedPapers.length}
        viewMode={'list'}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onViewModeChange={() => {}}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onClearSelection={clearSelection}
        density={density}
        onDensityChange={setDensity}
      />

      <SourceChips papers={results.papers} selectedSources={filters.sources} />

      <div className={`results-layout`}>
        <div className={`results-container list ${density}`}>
          <ResultsList
            papers={sortedPapers}
            selectedPapers={selectedPapers}
            viewMode={'list'}
            onToggleSelection={togglePaperSelection}
          />
        </div>
      </div>
    </div>
  );
};
