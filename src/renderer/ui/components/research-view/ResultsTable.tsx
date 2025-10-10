import React from 'react';
import { ArrowUpDown, Filter, Download, Columns, Plus, Eye } from 'lucide-react';
import { useSearch } from './SearchProvider';
import type { AcademicPaper } from '../../../../shared/types';

export const ResultsTable: React.FC = () => {
  const { results, isSearching, selectedPapers, togglePaperSelection } = useSearch();

  if (isSearching) {
    return (
      <div className="results-loading">
        <div className="loading-spinner" />
        <p>Searching...</p>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const papers = results.papers;

  return (
    <div className="results-table-container">
      {/* Table toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="sort-control">
            <ArrowUpDown size={16} />
            <span>Sort: Most relevant</span>
          </div>
          <button type="button" className="toolbar-button">
            <Filter size={16} />
            Filters
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
            <tr>
              <th className="checkbox-column">
                <input type="checkbox" />
              </th>
              <th className="paper-column">Paper</th>
              <th className="abstract-column">Abstract summary</th>
              <th className="manage-column">
                <div className="manage-columns-header">
                  <Columns size={16} />
                  Manage Columns
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {papers.map((paper) => (
              <PaperRow
                key={`${paper.source}-${paper.doi ?? paper.url ?? paper.title}`}
                paper={paper}
                isSelected={selectedPapers.includes(paper.title)}
                onToggle={() => togglePaperSelection(paper.title)}
              />
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
    </div>
  );
};

type PaperRowProps = {
  paper: AcademicPaper;
  isSelected: boolean;
  onToggle: () => void;
};

const PaperRow: React.FC<PaperRowProps> = ({ paper, isSelected, onToggle }) => {
  return (
    <tr className={`paper-row ${isSelected ? 'selected' : ''}`}>
      <td className="checkbox-cell">
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
      </td>
      <td className="paper-cell">
        <div className="paper-content">
          <h4 className="paper-title">{paper.title}</h4>
          <div className="paper-meta">
            <div className="authors">
              <span className="author-count">{paper.authors.length} authors</span>
              {paper.authors.slice(0, 2).map((author, index) => (
                <span key={`${author}-${index}`} className="author-name">
                  {author}
                  {index < Math.min(2, paper.authors.length) - 1 && ', '}
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
      </td>
      <td className="abstract-cell">
        <div className="abstract-content">
          <p className="abstract-text">
            {paper.abstract || 'No abstract available for this paper.'}
          </p>
        </div>
      </td>
      <td className="manage-cell">
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
      </td>
    </tr>
  );
};
