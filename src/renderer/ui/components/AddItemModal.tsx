import React from 'react';

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: { title: string; authors: string; doi?: string; url?: string }) => void;
};

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = React.useState('');
  const [authors, setAuthors] = React.useState('');
  const [doi, setDoi] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const titleId = React.useId();
  const authorsId = React.useId();
  const doiId = React.useId();
  const urlId = React.useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await onAdd({
        title: title.trim(),
        authors: authors.trim(),
        doi: doi.trim() || undefined,
        url: url.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setAuthors('');
      setDoi('');
      setUrl('');
      onClose();
    } catch (error) {
      console.error('Failed to add item:', error);
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
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add New Item</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor={titleId} className="form-label">
              Title *
            </label>
            <input
              id={titleId}
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter paper title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor={authorsId} className="form-label">
              Authors
            </label>
            <input
              id={authorsId}
              type="text"
              className="form-input"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Author names (comma separated)"
            />
          </div>

          <div className="form-group">
            <label htmlFor={doiId} className="form-label">
              DOI
            </label>
            <input
              id={doiId}
              type="text"
              className="form-input"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1000/example"
            />
          </div>

          <div className="form-group">
            <label htmlFor={urlId} className="form-label">
              URL
            </label>
            <input
              id={urlId}
              type="url"
              className="form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/paper"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
