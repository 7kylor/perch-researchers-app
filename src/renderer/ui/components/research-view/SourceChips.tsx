import React from 'react';
import type { AcademicPaper } from '../../../../shared/types';
import { useSearch } from './SearchProvider';

type SourceChipsProps = {
  papers: AcademicPaper[];
  selectedSources: string[];
};

export const SourceChips: React.FC<SourceChipsProps> = ({ papers, selectedSources }) => {
  const { updateFilters } = useSearch();

  const sources = React.useMemo(() => {
    const set = new Set<string>();
    for (const p of papers) set.add(p.source);
    return Array.from(set).sort();
  }, [papers]);

  const toggle = React.useCallback(
    (source: string) => {
      const next = selectedSources.includes(source)
        ? selectedSources.filter((s) => s !== source)
        : [...selectedSources, source];
      updateFilters({ sources: next });
    },
    [selectedSources, updateFilters],
  );

  if (sources.length === 0) return null;

  return (
    <div className="source-chips" role="toolbar" aria-label="Filter by source">
      {sources.map((src) => (
        <button
          key={src}
          type="button"
          onClick={() => toggle(src)}
          className={`source-chip ${selectedSources.includes(src) ? 'active' : ''}`}
          title={`Filter by ${src}`}
        >
          {src}
        </button>
      ))}
    </div>
  );
};
