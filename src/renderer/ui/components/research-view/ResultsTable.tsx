import React, { useId, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Filter,
  Download,
  Columns,
  Plus,
  Eye,
  ChevronUp,
  ChevronDown,
  Check,
  BookOpen,
  ExternalLink,
  Bookmark,
  X,
} from 'lucide-react';
import { useSearch } from './SearchProvider';
import type { AcademicPaper } from '../../../../shared/types';

const columnHelper = createColumnHelper<AcademicPaper>();

export const ResultsTable: React.FC = () => {
  const { results, isSearching, selectedPapers, togglePaperSelection, query } = useSearch();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [showManageColumns, setShowManageColumns] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showSortOptions, setShowSortOptions] = React.useState(false);
  const [selectedPaper, setSelectedPaper] = React.useState<AcademicPaper | null>(null);
  const [showPaperDetails, setShowPaperDetails] = React.useState(false);
  const modalTitleId = useId();
  const hasPdfId = useId();
  const publicationDateMinId = useId();
  const publicationDateMaxId = useId();
  const journalQualityId = useId();

  // Filter state
  const [hasPdfFilter, setHasPdfFilter] = React.useState(false);
  const [publicationDateRange, setPublicationDateRange] = React.useState<[number, number]>([
    1900, 2025,
  ]);
  const [journalQualityFilter, setJournalQualityFilter] = React.useState(5);
  const [studyTypeFilters, setStudyTypeFilters] = React.useState<string[]>([]);

  const papers = results?.papers || [];
  const hasResults = results && papers.length > 0;

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortOptions && !(event.target as Element).closest('.sort-dropdown')) {
        setShowSortOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortOptions]);

  // Handle sort option selection
  const handleSortSelection = (sortType: string) => {
    switch (sortType) {
      case 'most-relevant':
        setSorting([]);
        break;
      case 'most-recent':
        setSorting([{ id: 'year', desc: true }]);
        break;
      case 'least-recent':
        setSorting([{ id: 'year', desc: false }]);
        break;
      case 'most-cited':
        setSorting([{ id: 'citations', desc: true }]);
        break;
      case 'least-cited':
        setSorting([{ id: 'citations', desc: false }]);
        break;
      case 'alphabetical':
        setSorting([{ id: 'title', desc: false }]);
        break;
      default:
        setSorting([]);
    }
    setShowSortOptions(false);
  };

  // Apply filters to the table
  const applyFilters = () => {
    const filters: ColumnFiltersState = [];

    if (hasPdfFilter) {
      filters.push({ id: 'hasPdf', value: true });
    }

    if (publicationDateRange[0] > 1900 || publicationDateRange[1] < 2025) {
      filters.push({ id: 'publicationDate', value: publicationDateRange });
    }

    if (journalQualityFilter < 5) {
      filters.push({ id: 'journalQuality', value: journalQualityFilter });
    }

    if (studyTypeFilters.length > 0) {
      filters.push({ id: 'studyType', value: studyTypeFilters });
    }

    setColumnFilters(filters);
    setShowFilters(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setHasPdfFilter(false);
    setPublicationDateRange([1900, 2025]);
    setJournalQualityFilter(5);
    setStudyTypeFilters([]);
    setColumnFilters([]);
  };

  const columns = React.useMemo<ColumnDef<AcademicPaper>[]>(
    () => [
      {
        id: 'selection',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Select row"
          />
        ),
        size: 40,
        accessorFn: undefined,
      },
      columnHelper.accessor('title', {
        id: 'paper',
        header: 'Paper',
        cell: ({ row }) => <PaperCell paper={row.original} />,
        size: 500,
      }),
      columnHelper.accessor('abstract', {
        id: 'abstract',
        header: 'Abstract summary',
        cell: ({ getValue }) => (
          <div className="abstract-content">
            <p className="abstract-text">{getValue() || 'No abstract available for this paper.'}</p>
          </div>
        ),
        size: 600,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: papers,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection: selectedPapers.reduce(
        (acc, title) => {
          const index = papers.findIndex((p) => p.title === title);
          if (index !== -1) acc[index] = true;
          return acc;
        },
        {} as Record<number, boolean>,
      ),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    enableMultiRowSelection: true,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater({}) : updater;
      Object.entries(newSelection).forEach(([index, selected]) => {
        if (selected) {
          togglePaperSelection(papers[parseInt(index)].title);
        } else {
          togglePaperSelection(papers[parseInt(index)].title);
        }
      });
    },
  });

  if (isSearching) {
    return (
      <div className="results-loading">
        <div className="loading-spinner" />
        <p>Searching...</p>
      </div>
    );
  }

  if (!hasResults) {
    return null;
  }

  return (
    <div className="results-table-container">
      {/* Results Header */}
      {results && (
        <div className="results-header">
          <div className="results-info">
            <h2 className="results-title">Research Results for "{query}"</h2>
            <p className="results-summary">
              Found {papers.length} papers matching your search criteria. These results are curated
              from academic databases including arXiv, PubMed, CrossRef, and Semantic Scholar.
            </p>
            <div className="results-stats">
              <span className="stat-item">
                <strong>{papers.length}</strong> total results
              </span>
              <span className="stat-item">
                <strong>{selectedPapers.length}</strong> selected
              </span>
            </div>
          </div>
          <button
            type="button"
            className="back-to-search"
            onClick={() => {
              // Clear results to go back to search interface
              window.location.hash = '#research';
            }}
          >
            ← Back to Search
          </button>
        </div>
      )}

      {/* Table toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="sort-dropdown">
            <button
              type="button"
              className="sort-button"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <ArrowUpDown size={16} />
              <span>Sort: Most relevant</span>
              <ChevronDown size={14} />
            </button>
            {showSortOptions && (
              <div
                className="sort-options-dropdown"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSortOptions(false);
                  }
                }}
                role="menu"
              >
                <button
                  type="button"
                  className={`sort-option ${sorting.length === 0 ? 'active' : ''}`}
                  onClick={() => handleSortSelection('most-relevant')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortSelection('most-relevant');
                    }
                  }}
                  role="menuitem"
                >
                  {sorting.length === 0 && <Check size={14} />}
                  Most relevant
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'year' && s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('most-recent')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortSelection('most-recent');
                    }
                  }}
                  role="menuitem"
                >
                  {sorting.some((s) => s.id === 'year' && s.desc) && <Check size={14} />}
                  Most recent
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'year' && !s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('least-recent')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortSelection('least-recent');
                    }
                  }}
                  role="menuitem"
                >
                  {sorting.some((s) => s.id === 'year' && !s.desc) && <Check size={14} />}
                  Least recent
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'citations' && s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('most-cited')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortSelection('most-cited');
                    }
                  }}
                  role="menuitem"
                >
                  {sorting.some((s) => s.id === 'citations' && s.desc) && <Check size={14} />}
                  Most cited
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'citations' && !s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('least-cited')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortSelection('least-cited');
                    }
                  }}
                  role="menuitem"
                >
                  {sorting.some((s) => s.id === 'citations' && !s.desc) && <Check size={14} />}
                  Least cited
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'title' && !s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('alphabetical')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSortSelection('alphabetical');
                    }
                  }}
                  role="menuitem"
                >
                  {sorting.some((s) => s.id === 'title' && !s.desc) && <Check size={14} />}
                  Title (alphabetical)
                </button>
              </div>
            )}
          </div>
          <button type="button" className="toolbar-button" onClick={() => setShowFilters(true)}>
            <Filter size={16} />
            Filters
          </button>
          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowManageColumns(true)}
          >
            <Columns size={16} />
            Manage Columns
          </button>
          <button type="button" className="toolbar-button">
            Export as
            <Download size={16} />
          </button>
        </div>
        <div className="toolbar-right">
          <button type="button" className="upgrade-button">
            UPGRADE
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={
                      header.id === 'selection'
                        ? 'checkbox-column'
                        : header.id === 'paper'
                          ? 'paper-column'
                          : 'abstract-column'
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={header.column.getCanSort() ? 'sortable-header' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="sort-indicator">
                            {header.column.getIsSorted() === 'asc' && <ChevronUp size={14} />}
                            {header.column.getIsSorted() === 'desc' && <ChevronDown size={14} />}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={`paper-row ${row.getIsSelected() ? 'selected' : ''}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      <div className="load-more-section">
        <button type="button" className="load-more-button">
          Load more
        </button>
      </div>

      {/* Manage Columns Modal */}
      {showManageColumns && (
        <div className="modal-overlay">
          <div
            className="manage-columns-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowManageColumns(false);
              }
            }}
          >
            <div className="modal-header">
              <h3 id={modalTitleId}>Manage Columns</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowManageColumns(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="manage-columns-panel">
                <div className="manage-header">
                  <h5>Search or create a column</h5>
                  <p>Describe what kind of data you want to extract</p>
                  <div className="example-text">e.g. Limitations, Survival time</div>
                </div>
                <div className="add-columns-section">
                  <h6>ADD COLUMNS</h6>
                  <div className="column-suggestions">
                    <button type="button" className="column-suggestion">
                      <Plus size={14} />
                      Summary
                    </button>
                    <button type="button" className="column-suggestion">
                      <Plus size={14} />
                      Main findings
                    </button>
                    <button type="button" className="column-suggestion">
                      <Plus size={14} />
                      Methodology
                    </button>
                    <button type="button" className="column-suggestion">
                      <Plus size={14} />
                      Intervention
                    </button>
                    <button type="button" className="column-suggestion">
                      <Plus size={14} />
                      Outcome measured
                    </button>
                    <button type="button" className="column-suggestion">
                      <Plus size={14} />
                      Limitations
                    </button>
                  </div>
                  <button type="button" className="show-more-columns">
                    Show more
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {showFilters && (
        <div className="modal-overlay">
          <div
            className="filters-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowFilters(false);
              }
            }}
          >
            <div className="modal-header">
              <h3 id={modalTitleId}>Filters</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="filters-actions">
                <button type="button" className="clear-filters-button" onClick={clearFilters}>
                  Clear All
                </button>
                <button type="button" className="apply-filters-button" onClick={applyFilters}>
                  Apply Filters
                </button>
              </div>
              <div className="filters-panel">
                {/* Has PDF Filter */}
                <div className="filter-group">
                  <div className="filter-header">
                    <label htmlFor={hasPdfId} className="filter-label">
                      Has PDF
                    </label>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        id={hasPdfId}
                        checked={hasPdfFilter}
                        onChange={(e) => setHasPdfFilter(e.target.checked)}
                      />
                      <label
                        htmlFor={hasPdfId}
                        className="toggle-slider"
                        aria-label="Has PDF filter"
                      ></label>
                    </div>
                  </div>
                </div>

                {/* Publication Date Filter */}
                <div className="filter-group">
                  <fieldset>
                    <legend className="filter-label">Publication date</legend>
                    <div className="range-filter">
                      <div className="range-labels">
                        <span>Any time</span>
                        <span>2025</span>
                      </div>
                      <div className="range-slider">
                        <input
                          type="range"
                          id={publicationDateMinId}
                          min="1900"
                          max="2025"
                          value={publicationDateRange[0]}
                          onChange={(e) =>
                            setPublicationDateRange([
                              parseInt(e.target.value),
                              publicationDateRange[1],
                            ])
                          }
                          aria-label="Minimum publication year"
                        />
                        <input
                          type="range"
                          id={publicationDateMaxId}
                          min="1900"
                          max="2025"
                          value={publicationDateRange[1]}
                          onChange={(e) =>
                            setPublicationDateRange([
                              publicationDateRange[0],
                              parseInt(e.target.value),
                            ])
                          }
                          aria-label="Maximum publication year"
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Journal Quality Filter */}
                <div className="filter-group">
                  <fieldset>
                    <legend className="filter-label">
                      Journal quality
                      <span className="info-icon" title="Journal quartile ranking">
                        ⓘ
                      </span>
                    </legend>
                    <div className="journal-quality-filter">
                      <div className="quality-labels">
                        <span>Q1</span>
                        <span>Q2</span>
                        <span>Q3</span>
                        <span>Q4</span>
                        <span>All</span>
                      </div>
                      <div className="quality-slider">
                        <input
                          type="range"
                          id={journalQualityId}
                          min="1"
                          max="5"
                          value={journalQualityFilter}
                          onChange={(e) => setJournalQualityFilter(parseInt(e.target.value))}
                          aria-label="Journal quality filter"
                        />
                      </div>
                    </div>
                  </fieldset>
                </div>

                {/* Study Type Filter */}
                <div className="filter-group">
                  <fieldset>
                    <legend className="filter-label">Study Type</legend>
                    <div className="checkbox-group">
                      {[
                        { id: 'review', label: 'Review' },
                        { id: 'meta-analysis', label: 'Meta-Analysis' },
                        { id: 'systematic-review', label: 'Systematic Review' },
                        { id: 'rct', label: 'RCT' },
                        { id: 'longitudinal', label: 'Longitudinal' },
                      ].map((type) => (
                        <label key={type.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={studyTypeFilters.includes(type.label)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStudyTypeFilters([...studyTypeFilters, type.label]);
                              } else {
                                setStudyTypeFilters(
                                  studyTypeFilters.filter((t) => t !== type.label),
                                );
                              }
                            }}
                          />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paper Details Modal */}
      {showPaperDetails && selectedPaper && (
        <div className="modal-overlay">
          <div
            className="paper-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paper-details-title"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowPaperDetails(false);
              }
            }}
          >
            <div className="modal-header">
              <h3 id="paper-details-title">{selectedPaper.title}</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPaperDetails(false)}
                aria-label="Close paper details"
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="paper-details-panel">
                <div className="paper-meta-section">
                  <h4>Authors</h4>
                  <p>{selectedPaper.authors.join(', ')}</p>
                </div>
                <div className="paper-meta-section">
                  <h4>Publication</h4>
                  <p>
                    {selectedPaper.venue} ({selectedPaper.year})
                  </p>
                </div>
                <div className="paper-meta-section">
                  <h4>Source</h4>
                  <p>{selectedPaper.source}</p>
                </div>
                {selectedPaper.doi && (
                  <div className="paper-meta-section">
                    <h4>DOI</h4>
                    <p>{selectedPaper.doi}</p>
                  </div>
                )}
                <div className="paper-abstract-section">
                  <h4>Abstract</h4>
                  <p>{selectedPaper.abstract}</p>
                </div>
                <div className="paper-actions-section">
                  <button
                    type="button"
                    className="primary-action-button"
                    onClick={() => {
                      if (selectedPaper.url) {
                        window.open(selectedPaper.url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={!selectedPaper.url}
                  >
                    <ExternalLink size={16} />
                    Open Paper
                  </button>
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={async () => {
                      try {
                        await window.api.papers.add({
                          title: selectedPaper.title,
                          authors: selectedPaper.authors,
                          venue: selectedPaper.venue,
                          year: selectedPaper.year,
                          doi: selectedPaper.doi,
                          source: selectedPaper.source,
                          abstract: selectedPaper.abstract,
                          status: 'to_read',
                          filePath: undefined,
                          textHash: `${selectedPaper.title}-${selectedPaper.authors.slice(0, 2).join(',')}`,
                        });
                        setShowPaperDetails(false);
                      } catch (error) {
                        console.error('Failed to add paper to library:', error);
                      }
                    }}
                  >
                    <Bookmark size={16} />
                    Add to Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type PaperCellProps = {
  paper: AcademicPaper;
};

const PaperCell: React.FC<PaperCellProps> = ({ paper }) => {
  return (
    <div className="paper-content">
      <h4 className="paper-title">{paper.title}</h4>
      <div className="paper-meta">
        <div className="authors">
          <span className="author-count">{paper.authors.length} authors</span>
          {paper.authors.slice(0, 2).map((author) => (
            <span key={author} className="author-name">
              {author}
            </span>
          ))}
          {paper.authors.length > 2 && (
            <span className="more-authors">+{paper.authors.length - 2}</span>
          )}
        </div>
        <div className="paper-details">
          <span className="venue">{paper.venue}</span>
          <span className="year">{paper.year}</span>
          <span className="citations">{paper.year} citations</span>
          <span className="source">Source</span>
          <div className="paper-actions">
            <button
              type="button"
              className="action-button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPaper(paper);
                setShowPaperDetails(true);
              }}
              title="View paper details"
            >
              <BookOpen size={12} />
            </button>
            <button
              type="button"
              className="action-button"
              onClick={(e) => {
                e.stopPropagation();
                if (paper.url) {
                  window.open(paper.url, '_blank', 'noopener,noreferrer');
                }
              }}
              title="Open paper"
              disabled={!paper.url}
            >
              <ExternalLink size={12} />
            </button>
            <button
              type="button"
              className="action-button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
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
                  // Could add toast notification here
                } catch (error) {
                  console.error('Failed to add paper to library:', error);
                }
              }}
              title="Add to library"
            >
              <Bookmark size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
