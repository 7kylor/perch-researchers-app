import React from 'react';
import {
  ArrowUpDown,
  Columns,
  ChevronDown,
  Check,
  BookOpen,
  ExternalLink,
  Bookmark,
  Users,
  FileText,
} from 'lucide-react';
import { useSearch } from './SearchProvider';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { ResultsSearchBar } from './ResultsSearchBar';
import { PaperDetailsSidePanel } from './PaperDetailsSidePanel';
import { CustomColumnManager } from './CustomColumnManager';
import type { AcademicPaper } from '../../../../shared/types';

export const ResultsTable: React.FC = () => {
  const {
    results,
    isSearching,
    selectedPapers,
    customColumns,
    columnVisibility,
    sorting,
    togglePaperSelection,
    setSorting,
  } = useSearch();
  const [showManageColumns, setShowManageColumns] = React.useState(false);
  const [showSortOptions, setShowSortOptions] = React.useState(false);

  const papers = results?.papers || [];
  const hasResults = results && papers.length > 0;

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

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (showSortOptions && target && !target.closest('.sort-dropdown')) {
        setShowSortOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortOptions]);

  if (isSearching) {
    return (
      <div className="results-loading">
        <div className="loading-spinner" />
        <p>Searching academic databases...</p>
      </div>
    );
  }

  if (!hasResults) {
    return null;
  }

  // Visible columns (default + custom)
  const visibleCustomColumns = customColumns.filter(
    (col) => columnVisibility[col.id] !== false && col.isVisible !== false,
  );

  return (
    <div className="results-table-container">
      {/* Results Search Bar */}
      <ResultsSearchBar />

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar />

      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="sort-dropdown">
            <button
              type="button"
              className="sort-button"
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <ArrowUpDown size={16} />
              <span>
                Sort:{' '}
                {sorting.length === 0
                  ? 'Most relevant'
                  : sorting[0]?.id === 'year' && sorting[0]?.desc
                    ? 'Most recent'
                    : sorting[0]?.id === 'year' && !sorting[0]?.desc
                      ? 'Least recent'
                      : sorting[0]?.id === 'citations' && sorting[0]?.desc
                        ? 'Most cited'
                        : sorting[0]?.id === 'citations' && !sorting[0]?.desc
                          ? 'Least cited'
                          : sorting[0]?.id === 'title'
                            ? 'Alphabetical'
                            : 'Most relevant'}
              </span>
              <ChevronDown size={14} />
            </button>
            {showSortOptions && (
              <div className="sort-options-dropdown">
                <button
                  type="button"
                  className={`sort-option ${sorting.length === 0 ? 'active' : ''}`}
                  onClick={() => handleSortSelection('most-relevant')}
                >
                  {sorting.length === 0 && <Check size={14} />}
                  Most relevant
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'year' && s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('most-recent')}
                >
                  {sorting.some((s) => s.id === 'year' && s.desc) && <Check size={14} />}
                  Most recent
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'year' && !s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('least-recent')}
                >
                  {sorting.some((s) => s.id === 'year' && !s.desc) && <Check size={14} />}
                  Least recent
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'citations' && s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('most-cited')}
                >
                  {sorting.some((s) => s.id === 'citations' && s.desc) && <Check size={14} />}
                  Most cited
                </button>
                <button
                  type="button"
                  className={`sort-option ${sorting.some((s) => s.id === 'title' && !s.desc) ? 'active' : ''}`}
                  onClick={() => handleSortSelection('alphabetical')}
                >
                  {sorting.some((s) => s.id === 'title' && !s.desc) && <Check size={14} />}
                  Title (alphabetical)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="toolbar-button"
            onClick={() => setShowManageColumns(true)}
          >
            <Columns size={16} />
            Manage Columns
          </button>
        </div>

        <div className="toolbar-right">
          <span className="results-count">
            {papers.length} {papers.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="results-table elicit-style">
          <thead>
            <tr>
              <th className="checkbox-column">
                <div className="select-all-container">
                  <input
                    type="checkbox"
                    checked={selectedPapers.length === papers.length && papers.length > 0}
                    onChange={() => {
                      if (selectedPapers.length === papers.length) {
                        papers.forEach((p) => {
                          togglePaperSelection(p.title);
                        });
                      } else {
                        papers.forEach((p) => {
                          if (!selectedPapers.includes(p.title)) {
                            togglePaperSelection(p.title);
                          }
                        });
                      }
                    }}
                    aria-label="Select all"
                  />
                </div>
              </th>
              <th className="paper-column-wide">Paper</th>
              <th className="abstract-column-wide">Abstract summary</th>
              {visibleCustomColumns.map((col) => (
                <th key={col.id} className="custom-column-wide">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {papers.map((paper) => (
              <PaperRow key={paper.title} paper={paper} customColumns={visibleCustomColumns} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Side Panel */}
      <PaperDetailsSidePanel />

      {/* Column Manager Modal */}
      {showManageColumns && <CustomColumnManager onClose={() => setShowManageColumns(false)} />}
    </div>
  );
};

type PaperRowProps = {
  paper: AcademicPaper;
  customColumns: Array<{ id: string; name: string; extractedValues?: Record<string, unknown> }>;
};

const PaperRow: React.FC<PaperRowProps> = ({ paper, customColumns }) => {
  const { selectedPapers, togglePaperSelection, openSidePanel } = useSearch();
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewPosition, setPreviewPosition] = React.useState({ x: 0, y: 0 });

  const isSelected = selectedPapers.includes(paper.title);

  const handleAddToLibrary = async (e: React.MouseEvent) => {
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
    } catch (error) {
      console.error('Failed to add paper:', error);
    }
  };

  const handleOpenPaper = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (paper.url) {
      window.open(paper.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSidePanel(paper.title);
  };

  return (
    <>
      <tr
        className={`paper-row-elicit ${isSelected ? 'selected' : ''}`}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        onMouseMove={(e) => {
          setPreviewPosition({ x: e.clientX, y: e.clientY });
        }}
      >
        <td className="checkbox-cell">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => togglePaperSelection(paper.title)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select paper"
          />
        </td>

        <td className="paper-cell-elicit">
          <div className="paper-header-row">
            <h4 className="paper-title-elicit">{paper.title}</h4>
            <div className="paper-actions-top">
              <button
                type="button"
                className="action-btn-top"
                onClick={handleAddToLibrary}
                title="Add to library"
                aria-label="Add to library"
              >
                <Bookmark size={14} />
              </button>
              <button
                type="button"
                className="action-btn-top"
                onClick={handleOpenPaper}
                disabled={!paper.url}
                title="Open paper"
                aria-label="Open paper"
              >
                <ExternalLink size={14} />
              </button>
              <button
                type="button"
                className="action-btn-top"
                onClick={handleViewDetails}
                title="View details"
                aria-label="View details"
              >
                <BookOpen size={14} />
              </button>
            </div>
          </div>

          <div className="paper-metadata-row">
            {paper.authors.length > 0 && (
              <span className="metadata-item">
                <Users size={12} />
                {paper.authors.slice(0, 1).join(', ')}
                {paper.authors.length > 1 && ` +${paper.authors.length - 1}`}
              </span>
            )}
            {paper.venue && (
              <span className="metadata-item">
                <FileText size={12} />
                {paper.venue}
              </span>
            )}
          </div>

          <div className="paper-stats-row">
            {paper.year && <span className="stat-badge year-badge">{paper.year}</span>}
            {paper.citations !== undefined && (
              <span className="stat-badge citations-badge">{paper.citations} citations</span>
            )}
            <span className={`stat-badge source-badge-inline source-${paper.source}`}>
              {paper.source}
            </span>
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="doi-link-inline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={10} />
                DOI
              </a>
            )}
          </div>
        </td>

        <td className="abstract-cell-elicit">
          {paper.abstract ? (
            <p className="abstract-text-elicit">{paper.abstract}</p>
          ) : (
            <span className="no-data">No abstract available for this paper.</span>
          )}
        </td>

        {customColumns.map((col) => {
          const value = col.extractedValues?.[paper.title];
          return (
            <td key={col.id} className="custom-cell-elicit">
              {value ? (
                <div className="extracted-value">{String(value)}</div>
              ) : (
                <span className="no-data">—</span>
              )}
            </td>
          );
        })}
      </tr>

      {/* Instant Preview Tooltip */}
      {showPreview && (
        <div
          className="paper-preview-tooltip"
          style={{
            left: `${Math.min(previewPosition.x + 10, window.innerWidth - 420)}px`,
            top: `${Math.min(previewPosition.y - 10, window.innerHeight - 520)}px`,
          }}
        >
          <div className="preview-tooltip-content">
            <div className="preview-tooltip-header">
              <h5 className="preview-tooltip-title">{paper.title}</h5>
              <button
                type="button"
                className="preview-close-button"
                onClick={() => setShowPreview(false)}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            <div className="preview-tooltip-body">
              {paper.authors.length > 0 && (
                <div className="preview-section">
                  <strong>Authors:</strong> {paper.authors.join(', ')}
                </div>
              )}

              {paper.venue && (
                <div className="preview-section">
                  <strong>Published in:</strong> {paper.venue} ({paper.year || 'Unknown year'})
                </div>
              )}

              {paper.citations !== undefined && (
                <div className="preview-section">
                  <strong>Citations:</strong> {paper.citations}
                </div>
              )}

              {paper.doi && (
                <div className="preview-section">
                  <strong>DOI:</strong>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="preview-doi-link"
                  >
                    {paper.doi}
                  </a>
                </div>
              )}

              {paper.abstract && (
                <div className="preview-section">
                  <strong>Abstract:</strong>
                  <p className="preview-abstract">{paper.abstract}</p>
                </div>
              )}

              {customColumns.length > 0 && (
                <div className="preview-section">
                  <strong>Extractions:</strong>
                  <div className="preview-extractions">
                    {customColumns
                      .filter((col) => col.extractedValues?.[paper.title])
                      .map((col) => {
                        const value = col.extractedValues?.[paper.title];
                        return (
                          <div key={col.id} className="preview-extraction">
                            <span className="extraction-label">{col.name}:</span>
                            <span className="extraction-value">{value ? String(value) : ''}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            <div className="preview-tooltip-actions">
              <button
                type="button"
                className="preview-action-button preview-primary"
                onClick={handleAddToLibrary}
              >
                <Bookmark size={14} />
                Add to Library
              </button>
              <button type="button" className="preview-action-button" onClick={handleViewDetails}>
                <BookOpen size={14} />
                View Details
              </button>
              {paper.url && (
                <button type="button" className="preview-action-button" onClick={handleOpenPaper}>
                  <ExternalLink size={14} />
                  Open Paper
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
