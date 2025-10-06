import React from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type SimpleAddPaperProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: string, type: 'url' | 'pdf') => void;
};

interface ImportProgress {
  stage: 'downloading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  filePath?: string;
}

export const SimpleAddPaper: React.FC<SimpleAddPaperProps> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState<ImportProgress | null>(null);
  const inputId = React.useId();
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Focus modal when it opens
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setImportProgress(null);

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
        const isPdfUrl = input.includes('.pdf') || input.includes('pdf');

        if (isPdfUrl) {
          // Import PDF from URL with progress tracking
          try {
            await window.api.pdf['import-from-url'](input.trim(), (progress: ImportProgress) => {
              setImportProgress(progress);
            });
            setImportProgress({
              stage: 'complete',
              progress: 100,
              message: 'PDF imported successfully!',
            });
            setTimeout(() => {
              setInput('');
              onClose();
            }, 1500);
          } catch (error) {
            setImportProgress({
              stage: 'error',
              progress: 0,
              message: error instanceof Error ? error.message : 'Failed to import PDF',
            });
          }
        } else {
          // Regular URL/DOI import
          await onAdd(input.trim(), 'url');
          setInput('');
          onClose();
        }
      } else {
        // Assume it's a local file path or we'll handle it as text
        await onAdd(input.trim(), 'url');
        setInput('');
        onClose();
      }
    } catch (error) {
      console.error('Failed to add paper:', error);
      setImportProgress({
        stage: 'error',
        progress: 0,
        message: 'Failed to add paper',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    setIsLoading(true);
    try {
      // Use Electron's native file dialog
      const result = await window.api.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {
            name: 'PDF Files',
            extensions: ['pdf'],
          },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        await onAdd(filePath, 'pdf');
        onClose();
      }
    } catch (error) {
      console.error('Failed to upload PDF:', error);
    } finally {
      setIsLoading(false);
    }
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

          .import-progress {
            margin: 16px 0;
            padding: 12px;
            border-radius: 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
          }

          .import-progress.downloading {
            background: #e3f2fd;
            border-color: #2196f3;
          }

          .import-progress.processing {
            background: #fff3e0;
            border-color: #ff9800;
          }

          .import-progress.complete {
            background: #e8f5e8;
            border-color: #4caf50;
          }

          .import-progress.error {
            background: #ffebee;
            border-color: #f44336;
          }

          .progress-header {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .progress-icon {
            color: #666;
            display: flex;
            align-items: center;
          }

          .import-progress.downloading .progress-icon {
            color: #2196f3;
          }

          .import-progress.processing .progress-icon {
            color: #ff9800;
          }

          .import-progress.complete .progress-icon {
            color: #4caf50;
          }

          .import-progress.error .progress-icon {
            color: #f44336;
          }

          .progress-info {
            flex: 1;
          }

          .progress-message {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
            color: #333;
          }

          .progress-bar {
            width: 100%;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: #2196f3;
            transition: width 0.3s ease;
            border-radius: 2px;
          }

          .import-progress.processing .progress-fill {
            background: #ff9800;
          }

          .import-progress.complete .progress-fill {
            background: #4caf50;
          }

          .import-progress.error .progress-fill {
            background: #f44336;
          }
        `}</style>
        <div className="modal-header">
          <h2 className="modal-title">Add Paper</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
            <button type="button" className="file-label" onClick={handleFileUpload}>
              Choose PDF File
            </button>
          </div>
        </button>

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
              disabled={isLoading || importProgress !== null}
            />
          </div>

          {/* Progress indicator for PDF imports */}
          {importProgress && (
            <div className={`import-progress ${importProgress.stage}`}>
              <div className="progress-header">
                <div className="progress-icon">
                  {importProgress.stage === 'downloading' && (
                    <Loader2 className="animate-spin" size={20} />
                  )}
                  {importProgress.stage === 'processing' && (
                    <Loader2 className="animate-spin" size={20} />
                  )}
                  {importProgress.stage === 'complete' && <CheckCircle size={20} />}
                  {importProgress.stage === 'error' && <AlertCircle size={20} />}
                </div>
                <div className="progress-info">
                  <div className="progress-message">{importProgress.message}</div>
                  {importProgress.stage !== 'complete' && importProgress.stage !== 'error' && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${importProgress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading || importProgress !== null}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !input.trim() || importProgress !== null}
            >
              {isLoading || importProgress ? 'Processing...' : 'Add Paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
