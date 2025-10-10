import React from 'react';
import { Plus, X, Trash2, Eye, EyeOff, GripVertical, Loader } from 'lucide-react';
import { useSearch } from './SearchProvider';
import type { CustomColumn, ExtractionColumnType, ExtractionModel } from '../../../../shared/types';

type CustomColumnManagerProps = {
  onClose: () => void;
};

export const CustomColumnManager: React.FC<CustomColumnManagerProps> = ({ onClose }) => {
  const { customColumns, addCustomColumn, updateCustomColumn, removeCustomColumn, results } =
    useSearch();

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newColumn, setNewColumn] = React.useState<Partial<CustomColumn>>({
    name: '',
    type: 'text',
    prompt: '',
    model: 'qwen3-1.7b',
    isVisible: true,
  });
  const [searchFilter, setSearchFilter] = React.useState('');
  const columnNameId = React.useId();
  const columnPromptId = React.useId();
  const columnTypeId = React.useId();
  const columnModelId = React.useId();
  const modalTitleId = React.useId();

  const filteredColumns = React.useMemo(() => {
    if (!searchFilter) return customColumns;
    return customColumns.filter(
      (col) =>
        col.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        col.prompt.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }, [customColumns, searchFilter]);

  const handleAddColumn = async () => {
    if (!newColumn.name || !newColumn.prompt) return;

    const column: CustomColumn = {
      id: `col-${Date.now()}`,
      name: newColumn.name,
      type: newColumn.type as ExtractionColumnType,
      prompt: newColumn.prompt,
      model: newColumn.model as ExtractionModel,
      isVisible: true,
      order: customColumns.length,
      extractedValues: {},
      isExtracting: false,
    };

    addCustomColumn(column);
    setNewColumn({
      name: '',
      type: 'text',
      prompt: '',
      model: 'qwen3-1.7b',
      isVisible: true,
    });
    setShowAddForm(false);

    // Start extraction for visible papers
    if (results && results.papers.length > 0) {
      void extractColumnData(column);
    }
  };

  const extractColumnData = async (column: CustomColumn) => {
    if (!results) return;

    updateCustomColumn(column.id, { isExtracting: true, error: undefined });

    try {
      // Extract data for first 20 papers (or all if less)
      const papersToExtract = results.papers.slice(0, 20);
      const extractedValues: Record<string, string | number | boolean | null> = {};

      // TODO: Replace with actual extraction API call
      // For now, simulate extraction
      for (const paper of papersToExtract) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        extractedValues[paper.title] = `Extracted from ${column.name}`;
      }

      updateCustomColumn(column.id, {
        extractedValues,
        isExtracting: false,
      });
    } catch (error) {
      updateCustomColumn(column.id, {
        isExtracting: false,
        error: error instanceof Error ? error.message : 'Extraction failed',
      });
    }
  };

  const handleToggleVisibility = (columnId: string) => {
    const column = customColumns.find((c) => c.id === columnId);
    if (column) {
      updateCustomColumn(columnId, { isVisible: !column.isVisible });
    }
  };

  const handleRemoveColumn = (columnId: string) => {
    if (confirm('Are you sure you want to remove this column?')) {
      removeCustomColumn(columnId);
    }
  };

  const suggestionColumns = [
    { name: 'Summary', prompt: 'Provide a one-sentence summary of the main finding' },
    { name: 'Methodology', prompt: 'What research methodology was used?' },
    { name: 'Sample Size', prompt: 'What was the sample size?', type: 'number' as const },
    { name: 'Key Findings', prompt: 'What were the key findings?' },
    { name: 'Limitations', prompt: 'What are the limitations of this study?' },
    {
      name: 'Study Design',
      prompt: 'What type of study design was used?',
      type: 'categorical' as const,
    },
  ];

  return (
    <button
      type="button"
      className="modal-overlay"
      onClick={onClose}
      aria-label="Close column manager"
    >
      <div
        className="custom-column-manager"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="modal-header">
          <h3 id={modalTitleId}>Manage Columns</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close column manager"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* Search/Filter */}
          <div className="column-search">
            <input
              type="text"
              className="column-search-input"
              placeholder="Search columns..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          {/* Add Column Button */}
          {!showAddForm && (
            <button
              type="button"
              className="add-column-button"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              <span>Add Custom Column</span>
            </button>
          )}

          {/* Add Column Form */}
          {showAddForm && (
            <div className="add-column-form">
              <div className="form-group">
                <label htmlFor={columnNameId}>Column Name</label>
                <input
                  id={columnNameId}
                  type="text"
                  className="form-input"
                  placeholder="e.g., Methodology"
                  value={newColumn.name}
                  onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor={columnPromptId}>Extraction Prompt</label>
                <textarea
                  id={columnPromptId}
                  className="form-textarea"
                  placeholder="Describe what you want to extract from each paper..."
                  value={newColumn.prompt}
                  onChange={(e) => setNewColumn({ ...newColumn, prompt: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={columnTypeId}>Type</label>
                  <select
                    id={columnTypeId}
                    className="form-select"
                    value={newColumn.type}
                    onChange={(e) =>
                      setNewColumn({
                        ...newColumn,
                        type: e.target.value as ExtractionColumnType,
                      })
                    }
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Yes/No</option>
                    <option value="categorical">Categorical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor={columnModelId}>AI Model</label>
                  <select
                    id={columnModelId}
                    className="form-select"
                    value={newColumn.model}
                    onChange={(e) =>
                      setNewColumn({ ...newColumn, model: e.target.value as ExtractionModel })
                    }
                  >
                    <option value="qwen3-0.6b">Qwen3-0.6B (Fast)</option>
                    <option value="qwen3-1.7b">Qwen3-1.7B (Balanced)</option>
                    <option value="phi-4-mini">Phi-4-Mini (Accurate)</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="form-button-cancel"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewColumn({
                      name: '',
                      type: 'text',
                      prompt: '',
                      model: 'qwen3-1.7b',
                      isVisible: true,
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="form-button-submit"
                  onClick={handleAddColumn}
                  disabled={!newColumn.name || !newColumn.prompt}
                >
                  Add Column
                </button>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {!showAddForm && customColumns.length === 0 && (
            <div className="column-suggestions-section">
              <h4 className="suggestions-title">Suggested Columns</h4>
              <div className="column-suggestions-grid">
                {suggestionColumns.map((suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    className="suggestion-card"
                    onClick={() => {
                      setNewColumn({
                        name: suggestion.name,
                        type: suggestion.type || 'text',
                        prompt: suggestion.prompt,
                        model: 'qwen3-1.7b',
                        isVisible: true,
                      });
                      setShowAddForm(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>{suggestion.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Existing Columns */}
          {filteredColumns.length > 0 && (
            <div className="columns-list">
              <h4 className="columns-list-title">Custom Columns ({filteredColumns.length})</h4>
              {filteredColumns.map((column) => (
                <div key={column.id} className="column-item">
                  <div className="column-item-header">
                    <button type="button" className="column-drag-handle" aria-label="Reorder">
                      <GripVertical size={16} />
                    </button>
                    <div className="column-item-info">
                      <div className="column-item-name">
                        {column.name}
                        {column.isExtracting && (
                          <span className="column-extracting">
                            <Loader size={12} className="spinner" />
                            Extracting...
                          </span>
                        )}
                        {column.error && <span className="column-error">Error</span>}
                      </div>
                      <div className="column-item-prompt">{column.prompt}</div>
                      <div className="column-item-meta">
                        <span className="column-meta-badge">{column.type}</span>
                        <span className="column-meta-badge">{column.model}</span>
                        {column.extractedValues && (
                          <span className="column-meta-info">
                            {Object.keys(column.extractedValues).length} values
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="column-item-actions">
                      <button
                        type="button"
                        className="column-action-button"
                        onClick={() => handleToggleVisibility(column.id)}
                        aria-label={column.isVisible ? 'Hide column' : 'Show column'}
                        title={column.isVisible ? 'Hide' : 'Show'}
                      >
                        {column.isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        type="button"
                        className="column-action-button column-action-delete"
                        onClick={() => handleRemoveColumn(column.id)}
                        aria-label="Delete column"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
