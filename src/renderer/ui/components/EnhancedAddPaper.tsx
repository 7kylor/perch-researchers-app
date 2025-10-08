import React from 'react';
import { Upload, X, Check, Loader2, FileText, Globe, Link as LinkIcon } from 'lucide-react';

type EnhancedAddPaperProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: string, type: 'url' | 'pdf') => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
};

interface DetectedMetadata {
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  source: string;
}

export const EnhancedAddPaper: React.FC<EnhancedAddPaperProps> = ({
  isOpen,
  onClose,
  onAdd,
  onToast,
}) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [detectedMetadata, setDetectedMetadata] = React.useState<DetectedMetadata | null>(null);
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'url' | 'file'>('url');
  const [bulkProgress, setBulkProgress] = React.useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const inputId = React.useId();

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen && activeTab === 'url' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  // Detect metadata when input changes
  React.useEffect(() => {
    const detectMetadata = async () => {
      if (!input.trim() || activeTab !== 'url') {
        setDetectedMetadata(null);
        return;
      }

      const isUrlLike =
        input.startsWith('http') ||
        input.startsWith('www') ||
        input.includes('.com') ||
        input.includes('.org') ||
        input.includes('.edu');
      const isArxivId = /^\d+\.\d+$/.test(input.trim());

      if (isUrlLike || isArxivId) {
        setIsDetecting(true);
        try {
          let metadata = null;
          if (isArxivId) {
            metadata = await window.api.url['detect-arxiv-id'](input.trim());
          } else {
            metadata = await window.api.url['detect-paper'](input.trim());
          }

          if (metadata) {
            setDetectedMetadata(metadata);
          } else {
            setDetectedMetadata(null);
          }
        } catch {
          setDetectedMetadata(null);
        } finally {
          setIsDetecting(false);
        }
      } else {
        setDetectedMetadata(null);
        setIsDetecting(false);
      }
    };

    const timeoutId = setTimeout(detectMetadata, 600);
    return () => clearTimeout(timeoutId);
  }, [input, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onAdd(input.trim(), 'url');
      setInput('');
      setDetectedMetadata(null);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePaths = result.filePaths;

        if (filePaths.length === 1) {
          // Single file upload - use existing logic
          await onAdd(filePaths[0], 'pdf');
          onClose();
        } else {
          // Bulk upload - process multiple files
          await handleBulkUpload(filePaths);
        }
      }
    } catch {
      // Error handled by parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async (filePaths: string[]) => {
    setIsLoading(true);
    setBulkProgress({ current: 0, total: filePaths.length, currentFile: '' });

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const fileName = filePath.split('/').pop() || filePath;

      setBulkProgress({
        current: i + 1,
        total: filePaths.length,
        currentFile: fileName,
      });

      try {
        await onAdd(filePath, 'pdf');
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${fileName}: ${error}`);
      }
    }

    // Close modal after bulk upload
    onClose();

    // Show results toast
    if (results.successful > 0) {
      const message = `Successfully uploaded ${results.successful} PDF${results.successful > 1 ? 's' : ''}`;
      if (results.failed > 0) {
        onToast?.(`${message}, ${results.failed} failed`, 'info');
      } else {
        onToast?.(message, 'success');
      }
    } else {
      onToast?.(`Failed to upload ${results.failed} PDF${results.failed > 1 ? 's' : ''}`, 'error');
    }

    // Clear progress after a delay
    setTimeout(() => setBulkProgress(null), 1000);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="enhanced-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
        }
      }}
      tabIndex={-1}
      role="button"
      aria-label="Close modal"
    >
      <div
        className="enhanced-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-paper-title"
        ref={modalRef}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoading) {
            onClose();
          }
        }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="enhanced-modal-header">
          <h2 id={titleId} className="enhanced-modal-title">
            <FileText size={24} />
            Add Research Paper
          </h2>
          <button
            type="button"
            className="enhanced-modal-close"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="enhanced-modal-tabs" role="tablist">
          <button
            type="button"
            className={`enhanced-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('url');
              }
            }}
            disabled={isLoading}
            role="tab"
            aria-selected={activeTab === 'url'}
          >
            <Globe size={18} />
            <span>From URL</span>
          </button>
          <button
            type="button"
            className={`enhanced-tab ${activeTab === 'file' ? 'active' : ''}`}
            onClick={() => setActiveTab('file')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('file');
              }
            }}
            disabled={isLoading}
            role="tab"
            aria-selected={activeTab === 'file'}
          >
            <Upload size={18} />
            <span>Upload File</span>
          </button>
        </div>

        <style>{`
          .bulk-progress-container {
            background: var(--card-background);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid var(--border-color);
          }

          .bulk-progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .bulk-progress-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .bulk-progress-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .progress-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .progress-text {
            font-size: 14px;
            color: var(--text-secondary);
          }

          .progress-percentage {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
          }

          .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--background-secondary);
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            border-radius: 4px;
            transition: width 0.3s ease;
          }

          .current-file {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--background-secondary);
            border-radius: 6px;
            font-size: 13px;
            color: var(--text-secondary);
          }

          .current-file svg {
            flex-shrink: 0;
          }
        `}</style>

        {/* Content */}
        <div className="enhanced-modal-content">
          {activeTab === 'url' ? (
            <form onSubmit={handleSubmit} className="enhanced-form">
              <div className="enhanced-form-group">
                <label htmlFor={inputId} className="enhanced-label">
                  Enter URL, DOI, or ArXiv ID
                </label>
                <div className="enhanced-input-wrapper">
                  <LinkIcon size={18} className="input-icon" />
                  <input
                    id={inputId}
                    ref={inputRef}
                    type="text"
                    className="enhanced-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="https://arxiv.org/abs/1234.5678"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>

                {/* Detection Status */}
                {isDetecting && (
                  <div className="detection-status detecting">
                    <Loader2 size={16} className="spin-animation" />
                    <span>Detecting paper...</span>
                  </div>
                )}

                {/* Metadata Preview */}
                {detectedMetadata && !isDetecting && (
                  <div className="metadata-card">
                    <div className="metadata-card-header">
                      <div className="success-badge">
                        <Check size={14} />
                        <span>Paper Found</span>
                      </div>
                      <span className="metadata-source-badge">{detectedMetadata.source}</span>
                    </div>

                    <h3 className="metadata-title">{detectedMetadata.title}</h3>

                    <div className="metadata-details">
                      {detectedMetadata.authors.length > 0 && (
                        <div className="metadata-row">
                          <span className="metadata-label">Authors</span>
                          <span className="metadata-value">
                            {detectedMetadata.authors.slice(0, 3).join(', ')}
                            {detectedMetadata.authors.length > 3 &&
                              ` +${detectedMetadata.authors.length - 3} more`}
                          </span>
                        </div>
                      )}

                      {detectedMetadata.venue && (
                        <div className="metadata-row">
                          <span className="metadata-label">Venue</span>
                          <span className="metadata-value">{detectedMetadata.venue}</span>
                        </div>
                      )}

                      {detectedMetadata.year && (
                        <div className="metadata-row">
                          <span className="metadata-label">Year</span>
                          <span className="metadata-value">{detectedMetadata.year}</span>
                        </div>
                      )}

                      {detectedMetadata.doi && (
                        <div className="metadata-row">
                          <span className="metadata-label">DOI</span>
                          <span className="metadata-value metadata-doi">
                            {detectedMetadata.doi}
                          </span>
                        </div>
                      )}
                    </div>

                    {detectedMetadata.abstract && (
                      <details className="metadata-abstract">
                        <summary>View Abstract</summary>
                        <p>{detectedMetadata.abstract}</p>
                      </details>
                    )}
                  </div>
                )}
              </div>

              <div className="enhanced-modal-footer">
                <button
                  type="button"
                  className="enhanced-btn enhanced-btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="enhanced-btn enhanced-btn-primary"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Add Paper</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="upload-section">
              {bulkProgress ? (
                <div className="bulk-progress-container">
                  <div className="bulk-progress-header">
                    <h3>Uploading PDF Files</h3>
                    <button
                      type="button"
                      className="enhanced-modal-close"
                      onClick={onClose}
                      disabled={isLoading}
                      aria-label="Close dialog"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="bulk-progress-content">
                    <div className="progress-info">
                      <span className="progress-text">
                        Processing file {bulkProgress.current} of {bulkProgress.total}
                      </span>
                      <span className="progress-percentage">
                        {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="current-file">
                      <FileText size={16} />
                      <span>{bulkProgress.currentFile}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="upload-drop-zone"
                  onClick={handleFileUpload}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFileUpload();
                    }
                  }}
                  aria-label="Upload PDF files"
                >
                  <div className="upload-icon-wrapper">
                    <Upload size={48} strokeWidth={1.5} />
                  </div>
                  <h3 className="upload-title">Upload PDF Files</h3>
                  <p className="upload-description">
                    Click to browse for PDF files on your computer. You can select multiple files.
                  </p>
                  <div className="upload-button">
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="spin-animation" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        <span>Choose Files</span>
                      </>
                    )}
                  </div>
                </button>
              )}

              <div className="upload-info">
                <p className="upload-info-text">Supported format: PDF</p>
                <p className="upload-info-text">
                  We&apos;ll automatically extract paper information
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

EnhancedAddPaper.displayName = 'EnhancedAddPaper';

export type { EnhancedAddPaperProps };
