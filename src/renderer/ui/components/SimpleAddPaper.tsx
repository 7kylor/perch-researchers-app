import React from 'react';
import { Upload, Link, X } from 'lucide-react';

type SimpleAddPaperProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: string, type: 'url' | 'pdf') => void;
};

export const SimpleAddPaper: React.FC<SimpleAddPaperProps> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const inputId = React.useId();
  const fileInputId = React.useId();

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
        await onAdd(input.trim(), 'url');
      } else {
        // Assume it's a local file path or we'll handle it as text
        await onAdd(input.trim(), 'url');
      }

      setInput('');
      onClose();
    } catch (error) {
      console.error('Failed to add paper:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      // Convert file to path-like string for the backend
      const filePath = (file as any).path || file.name;
      await onAdd(filePath, 'pdf');
      onClose();
    } catch (error) {
      console.error('Failed to upload PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        handleFileUpload(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content simple-add-modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Paper</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div
          className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById(fileInputId)?.click();
            }
          }}
        >
          <div className="drop-zone-content">
            <div className="drop-icon">
              <Upload size={48} />
            </div>
            <p className="drop-text">Drop PDF here or click to browse</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="file-input"
              id={fileInputId}
            />
            <label htmlFor={fileInputId} className="file-label">
              Choose PDF File
            </label>
          </div>
        </div>

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
