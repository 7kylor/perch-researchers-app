import React from 'react';
import { Upload, X } from 'lucide-react';

type SimpleAddPaperProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: string, type: 'url' | 'pdf') => void;
};

export const SimpleAddPaper: React.FC<SimpleAddPaperProps> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
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
          // Import PDF from URL
          try {
            await window.api.pdf['import-from-url'](input.trim());
            setInput('');
            onClose();
          } catch (error) {
            console.error('Failed to import PDF:', error);
            throw error;
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
      throw error;
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
        if (filePath) {
          await onAdd(filePath, 'pdf');
          onClose();
        }
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
              disabled={isLoading}
            />
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
