import React from 'react';
import type { Paper } from '../../../shared/types';

interface PaperSelectorProps {
  papers: Paper[];
  selectedPapers: string[];
  onSelectionChange: (paperIds: string[]) => void;
  maxSelections?: number;
}

export const PaperSelector: React.FC<PaperSelectorProps> = ({
  papers,
  selectedPapers,
  onSelectionChange,
  maxSelections = 10,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showSelector, setShowSelector] = React.useState(false);

  const filteredPapers = React.useMemo(() => {
    if (!searchTerm) return papers;
    const term = searchTerm.toLowerCase();
    return papers.filter(
      (paper) =>
        paper.title.toLowerCase().includes(term) ||
        paper.authors.some((author) => author.toLowerCase().includes(term)) ||
        (paper.venue && paper.venue.toLowerCase().includes(term)),
    );
  }, [papers, searchTerm]);

  const handlePaperToggle = (paperId: string) => {
    if (selectedPapers.includes(paperId)) {
      onSelectionChange(selectedPapers.filter((id) => id !== paperId));
    } else if (selectedPapers.length < maxSelections) {
      onSelectionChange([...selectedPapers, paperId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPapers.length === filteredPapers.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredPapers.slice(0, maxSelections).map((p) => p.id));
    }
  };

  const selectedPaperObjects = React.useMemo(
    () => papers.filter((p) => selectedPapers.includes(p.id)),
    [papers, selectedPapers],
  );

  if (!showSelector && selectedPapers.length === 0) {
    return (
      <button type="button" className="paper-selector-toggle" onClick={() => setShowSelector(true)}>
        Select Papers for AI Analysis
      </button>
    );
  }

  return (
    <div className="paper-selector">
      <div className="paper-selector-header">
        <div className="selector-info">
          <span className="selection-count">
            {selectedPapers.length}/{maxSelections} papers selected
          </span>
          {selectedPapers.length > 0 && (
            <button type="button" className="clear-selection" onClick={() => onSelectionChange([])}>
              Clear All
            </button>
          )}
        </div>
        <button
          type="button"
          className="toggle-selector"
          onClick={() => setShowSelector(!showSelector)}
        >
          {showSelector ? 'Hide' : 'Show'} Paper Selection
        </button>
      </div>

      {selectedPapers.length > 0 && (
        <div className="selected-papers-preview">
          <h4>Selected Papers:</h4>
          <div className="selected-papers-list">
            {selectedPaperObjects.map((paper) => (
              <div key={paper.id} className="selected-paper-item">
                <span className="paper-title">{paper.title}</span>
                <span className="paper-authors">
                  {paper.authors.slice(0, 2).join(', ')}
                  {paper.authors.length > 2 && ` +${paper.authors.length - 2} more`}
                </span>
                <button
                  type="button"
                  className="remove-paper"
                  onClick={() => handlePaperToggle(paper.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSelector && (
        <div className="paper-selection-panel">
          <div className="search-controls">
            <input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="paper-search"
            />
            <button type="button" className="select-all-toggle" onClick={handleSelectAll}>
              {selectedPapers.length === filteredPapers.length
                ? 'Deselect All'
                : 'Select All Visible'}
            </button>
          </div>

          <div className="papers-list">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className={`paper-item ${selectedPapers.includes(paper.id) ? 'selected' : ''}`}
                onClick={() => handlePaperToggle(paper.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedPapers.includes(paper.id)}
                  onChange={() => {}} // Handled by onClick
                  className="paper-checkbox"
                />
                <div className="paper-info">
                  <div className="paper-title">{paper.title}</div>
                  <div className="paper-meta">
                    <span className="paper-authors">
                      {paper.authors.slice(0, 3).join(', ')}
                      {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                    </span>
                    {paper.year && <span className="paper-year">{paper.year}</span>}
                    {paper.venue && <span className="paper-venue">{paper.venue}</span>}
                  </div>
                  {paper.abstract && (
                    <div className="paper-abstract-preview">
                      {paper.abstract.slice(0, 150)}
                      {paper.abstract.length > 150 && '...'}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredPapers.length === 0 && (
              <div className="no-papers">No papers found matching your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
