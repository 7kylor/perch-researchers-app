import React from 'react';
import { Bookmark, Download, Tag, X, CheckSquare } from 'lucide-react';
import { useSearch } from './SearchProvider';
import type { ExportFormat } from '../../../../shared/types';

export const BulkActionsToolbar: React.FC = () => {
  const {
    selectedPapers,
    results,
    selectAllPapers,
    clearSelection,
    exportSelectedPapers,
    addSelectedToLibrary,
  } = useSearch();

  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [showTagInput, setShowTagInput] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');
  const [isAdding, setIsAdding] = React.useState(false);

  const totalPapers = results?.papers.length || 0;
  const selectedCount = selectedPapers.length;

  if (selectedCount === 0) return null;

  const handleExport = async (format: ExportFormat) => {
    await exportSelectedPapers(format);
    setShowExportMenu(false);
  };

  const handleAddToLibrary = async () => {
    setIsAdding(true);
    try {
      await addSelectedToLibrary();
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddTags = () => {
    if (!tagInput.trim()) return;
    const tags = tagInput.split(',').map((t) => t.trim());
    // TODO: Implement tagging
    console.log('Add tags:', tags);
    setTagInput('');
    setShowTagInput(false);
  };

  return (
    <div className="bulk-actions-toolbar">
      <div className="bulk-actions-info">
        <CheckSquare size={16} />
        <span className="selection-count">
          {selectedCount} of {totalPapers} selected
        </span>
      </div>

      <div className="bulk-actions-buttons">
        {selectedCount < totalPapers && (
          <button
            type="button"
            className="bulk-action-button"
            onClick={selectAllPapers}
            aria-label="Select all papers"
          >
            Select All
          </button>
        )}

        <button
          type="button"
          className="bulk-action-button action-primary"
          onClick={handleAddToLibrary}
          disabled={isAdding}
          aria-label="Add selected papers to library"
        >
          <Bookmark size={16} />
          <span>{isAdding ? 'Adding...' : 'Add to Library'}</span>
        </button>

        <div className="bulk-action-dropdown">
          <button
            type="button"
            className="bulk-action-button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Export options"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
          {showExportMenu && (
            <div className="bulk-dropdown-menu">
              <button type="button" className="dropdown-item" onClick={() => handleExport('csv')}>
                Export as CSV
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => handleExport('bibtex')}
              >
                Export as BibTeX
              </button>
              <button type="button" className="dropdown-item" onClick={() => handleExport('ris')}>
                Export as RIS
              </button>
              <button type="button" className="dropdown-item" onClick={() => handleExport('json')}>
                Export as JSON
              </button>
            </div>
          )}
        </div>

        <div className="bulk-action-dropdown">
          <button
            type="button"
            className="bulk-action-button"
            onClick={() => setShowTagInput(!showTagInput)}
            aria-label="Add tags"
          >
            <Tag size={16} />
            <span>Tag</span>
          </button>
          {showTagInput && (
            <div className="bulk-dropdown-menu tag-input-menu">
              <input
                type="text"
                className="tag-input"
                placeholder="Enter tags (comma-separated)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTags();
                  }
                }}
              />
              <div className="tag-input-actions">
                <button
                  type="button"
                  className="tag-cancel-button"
                  onClick={() => {
                    setTagInput('');
                    setShowTagInput(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="tag-add-button"
                  onClick={handleAddTags}
                  disabled={!tagInput.trim()}
                >
                  Add Tags
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="bulk-action-button action-clear"
          onClick={clearSelection}
          aria-label="Clear selection"
        >
          <X size={16} />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
