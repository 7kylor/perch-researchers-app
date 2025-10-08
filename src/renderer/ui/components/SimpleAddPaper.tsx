import React from 'react';
import { Upload, X, Check } from 'lucide-react';

type SimpleAddPaperProps = {
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

export const SimpleAddPaper: React.FC<SimpleAddPaperProps> = ({
  isOpen,
  onClose,
  onAdd,
  onToast,
}) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [detectedMetadata, setDetectedMetadata] = React.useState<DetectedMetadata | null>(null);
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);
  const inputId = React.useId();
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Focus modal when it opens
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Detect metadata when input changes
  React.useEffect(() => {
    const detectMetadata = async () => {
      if (!input.trim()) {
        setDetectedMetadata(null);
        return;
      }

      // Check if input looks like a URL or arXiv ID
      const isUrlLike =
        input.startsWith('http') ||
        input.startsWith('www') ||
        input.includes('.com') ||
        input.includes('.org');
      const isArxivId = /^\d+\.\d+$/.test(input.trim()); // Simple arXiv ID pattern

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
          // Failed to detect metadata
          setDetectedMetadata(null);
        } finally {
          setIsDetecting(false);
        }
      } else {
        setDetectedMetadata(null);
        setIsDetecting(false);
      }
    };

    // Debounce the detection
    const timeoutId = setTimeout(detectMetadata, 500);

    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      // Determine if it's a URL or DOI
      const isUrl =
        input.startsWith('http') ||
        input.startsWith('www') ||
        input.includes('.com') ||
        input.includes('.org');
      const isDoi = input.startsWith('10.') || input.includes('doi.org');

      if (isUrl || isDoi) {
        // Check if it looks like a PDF URL
        const _isPdfUrl = input.includes('.pdf') || input.includes('pdf');

        // For all URL types (including PDF URLs), call the parent's onAdd function
        // The parent component (App.tsx) has the proper logic to handle different URL types
        await onAdd(input.trim(), 'url');
        setInput('');
        setDetectedMetadata(null);
        onClose();
      } else {
        // Assume it's a local file path or we'll handle it as text
        await onAdd(input.trim(), 'url');
        setInput('');
        setDetectedMetadata(null);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    setIsLoading(true);
    try {
      // Use Electron's native file dialog with multi-selection support
      const result = await window.api.dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf'],
          },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePaths = result.filePaths;

        if (filePaths.length === 1) {
          // Single file upload - use existing logic
          const filePath = filePaths[0];
          if (filePath) {
            await onAdd(filePath, 'pdf');
            onClose();
          }
        } else {
          // Bulk upload - process multiple files
          await handleBulkUpload(filePaths);
        }
      }
    } catch {
      // Failed to upload PDF
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
      if (!filePath) continue;

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
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} aria-hidden="true">
      <div
        className="modal-content simple-add-modal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
            cursor: default;
          }

          .metadata-status {
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .metadata-status.detecting {
            background-color: #e3f2fd;
            color: #1976d2;
            border: 1px solid #bbdefb;
          }

          .metadata-preview {
            margin-top: 12px;
            padding: 12px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #fafafa;
          }

          .metadata-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-weight: 500;
            color: #2e7d32;
          }

          .status-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
          }

          .status-icon.success {
            background-color: #c8e6c9;
            color: #2e7d32;
          }

          .metadata-content {
            font-size: 14px;
          }

          .metadata-title {
            margin: 0 0 8px 0;
            font-size: 16px;
            font-weight: 600;
            color: #333;
            line-height: 1.3;
          }

          .metadata-authors,
          .metadata-venue,
          .metadata-year,
          .metadata-doi {
            margin: 4px 0;
            color: #666;
            line-height: 1.4;
          }

          .metadata-abstract {
            margin-top: 8px;
          }

          .metadata-abstract summary {
            cursor: pointer;
            font-weight: 500;
            color: #666;
            margin-bottom: 4px;
          }

          .metadata-abstract p {
            margin: 8px 0 0 0;
            color: #666;
            line-height: 1.4;
            font-size: 13px;
          }

          .metadata-source {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #999;
          }

          .bulk-progress-container {
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
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
            color: #333;
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
            color: #666;
          }

          .progress-percentage {
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }

          .progress-bar {
            width: 100%;
            height: 8px;
            background: #f0f0f0;
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
            background: #f8f9fa;
            border-radius: 6px;
            font-size: 13px;
            color: #666;
          }

          .current-file svg {
            flex-shrink: 0;
          }

        `}</style>
        <div className="modal-header">
          <h2 className="modal-title">Add Paper</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {bulkProgress ? (
          <div className="bulk-progress-container">
            <div className="bulk-progress-header">
              <h3>Uploading PDF Files</h3>
              <button type="button" className="modal-close" onClick={onClose}>
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
                <Upload size={16} />
                <span>{bulkProgress.currentFile}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="drop-zone"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFileUpload();
              }
            }}
            onClick={handleFileUpload}
          >
            <div className="drop-zone-content">
              <div className="drop-icon">
                <Upload size={48} />
              </div>
              <p className="drop-text">Click to browse for PDF files</p>
              <button
                type="button"
                className="file-label"
                onClick={handleFileUpload}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFileUpload();
                  }
                }}
              >
                Choose PDF Files
              </button>
            </div>
          </button>
        )}

        <div className="divider">
          <span className="divider-text">or</span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor={inputId} className="form-label">
              Enter URL, DOI, or ArXiv ID
            </label>
            <input
              id={inputId}
              type="text"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://arxiv.org/abs/1234.5678 or 10.1000/example or 1234.5678"
              disabled={isLoading}
            />
            {isDetecting && (
              <div className="metadata-status detecting">
                <div className="status-icon">⟳</div>
                <span>Detecting paper information...</span>
              </div>
            )}
            {detectedMetadata && !isDetecting && (
              <div className="metadata-preview">
                <div className="metadata-header">
                  <div className="status-icon success">
                    <Check size={16} />
                  </div>
                  <span>Paper detected!</span>
                </div>
                <div className="metadata-content">
                  <h4 className="metadata-title">{detectedMetadata.title}</h4>
                  {detectedMetadata.authors.length > 0 && (
                    <p className="metadata-authors">
                      <strong>Authors:</strong> {detectedMetadata.authors.join(', ')}
                    </p>
                  )}
                  {detectedMetadata.venue && (
                    <p className="metadata-venue">
                      <strong>Venue:</strong> {detectedMetadata.venue}
                    </p>
                  )}
                  {detectedMetadata.year && (
                    <p className="metadata-year">
                      <strong>Year:</strong> {detectedMetadata.year}
                    </p>
                  )}
                  {detectedMetadata.doi && (
                    <p className="metadata-doi">
                      <strong>DOI:</strong> {detectedMetadata.doi}
                    </p>
                  )}
                  {detectedMetadata.abstract && (
                    <details className="metadata-abstract">
                      <summary>Abstract</summary>
                      <p>{detectedMetadata.abstract}</p>
                    </details>
                  )}
                  <div className="metadata-source">
                    <strong>Source:</strong> {detectedMetadata.source}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !input.trim()}>
              {isLoading ? 'Processing...' : 'Add Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SimpleAddPaper.displayName = 'SimpleAddPaper';

export type { SimpleAddPaperProps };
