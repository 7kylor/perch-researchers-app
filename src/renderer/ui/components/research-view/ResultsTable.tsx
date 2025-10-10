import React, { useId } from 'react';
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
} from 'lucide-react';
import { useSearch } from './SearchProvider';
import type { AcademicPaper } from '../../../../shared/types';

const columnHelper = createColumnHelper<AcademicPaper>();

export const ResultsTable: React.FC = () => {
  const { results, isSearching, selectedPapers, togglePaperSelection } = useSearch();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [showManageColumns, setShowManageColumns] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showSortOptions, setShowSortOptions] = React.useState(false);
  const modalTitleId = useId();
  const hasPdfId = useId();
  const publicationDateMinId = useId();
  const publicationDateMaxId = useId();
  const journalQualityId = useId();

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

  const columns = React.useMemo<ColumnDef<AcademicPaper>[]>(
    () => [
      columnHelper.accessor('title', {
        id: 'selection',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
      }),
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
                  className="sort-option active"
                  onClick={() => setShowSortOptions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSortOptions(false);
                    }
                  }}
                  role="menuitem"
                >
                  <Check size={14} />
                  Most relevant
                </button>
                <button
                  type="button"
                  className="sort-option"
                  onClick={() => setShowSortOptions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSortOptions(false);
                    }
                  }}
                  role="menuitem"
                >
                  Most recent
                </button>
                <button
                  type="button"
                  className="sort-option"
                  onClick={() => setShowSortOptions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSortOptions(false);
                    }
                  }}
                  role="menuitem"
                >
                  Least recent
                </button>
                <button
                  type="button"
                  className="sort-option"
                  onClick={() => setShowSortOptions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSortOptions(false);
                    }
                  }}
                  role="menuitem"
                >
                  Most cited
                </button>
                <button
                  type="button"
                  className="sort-option"
                  onClick={() => setShowSortOptions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSortOptions(false);
                    }
                  }}
                  role="menuitem"
                >
                  Least cited
                </button>
                <button
                  type="button"
                  className="sort-option"
                  onClick={() => setShowSortOptions(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowSortOptions(false);
                    }
                  }}
                  role="menuitem"
                >
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
              <div className="filters-panel">
                {/* Has PDF Filter */}
                <div className="filter-group">
                  <div className="filter-header">
                    <label htmlFor={hasPdfId} className="filter-label">
                      Has PDF
                    </label>
                    <div className="toggle-switch">
                      <input type="checkbox" id={hasPdfId} />
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
                          defaultValue="1900"
                          aria-label="Minimum publication year"
                        />
                        <input
                          type="range"
                          id={publicationDateMaxId}
                          min="1900"
                          max="2025"
                          defaultValue="2025"
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
                          defaultValue="5"
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
                      <label className="checkbox-item">
                        <input type="checkbox" />
                        <span>Review</span>
                      </label>
                      <label className="checkbox-item">
                        <input type="checkbox" />
                        <span>Meta-Analysis</span>
                      </label>
                      <label className="checkbox-item">
                        <input type="checkbox" />
                        <span>Systematic Review</span>
                      </label>
                      <label className="checkbox-item">
                        <input type="checkbox" />
                        <span>RCT</span>
                      </label>
                      <label className="checkbox-item">
                        <input type="checkbox" />
                        <span>Longitudinal</span>
                      </label>
                    </div>
                  </fieldset>
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
          <button type="button" className="doi-link">
            DOI
            <Eye size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
