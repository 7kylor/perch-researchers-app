import React from 'react';

type Annotation = {
  id: string;
  paperId: string;
  page: number;
  color: string;
  note?: string;
  tags: string[];
  anchors: { region?: { page: number; x: number; y: number; width: number; height: number } };
  createdAt: string;
};

type Props = {
  paperId: string;
  annotations: Annotation[];
  onAnnotationSelect: (annotation: Annotation) => void;
  onAnnotationDelete: (id: string) => void;
  onAnnotationUpdate: (
    id: string,
    updates: Partial<{ color: string; note?: string; tags: string[] }>,
  ) => void;
  selectedAnnotationId?: string;
};

export function Sidebar({
  paperId,
  annotations,
  onAnnotationSelect,
  onAnnotationDelete,
  onAnnotationUpdate,
  selectedAnnotationId,
}: Props) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editNote, setEditNote] = React.useState('');

  const startEdit = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditNote(annotation.note || '');
  };

  const saveEdit = () => {
    if (editingId) {
      onAnnotationUpdate(editingId, { note: editNote });
      setEditingId(null);
      setEditNote('');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Highlights ({annotations.length})</h3>
      </div>
      <div className="sidebar-content">
        {annotations.length === 0 ? (
          <p className="muted">No highlights yet</p>
        ) : (
          annotations.map((annotation) => (
            <div
              key={annotation.id}
              className={`highlight-item ${selectedAnnotationId === annotation.id ? 'selected' : ''}`}
              onClick={() => onAnnotationSelect(annotation)}
            >
              <div className="highlight-header">
                <span className="highlight-color" style={{ backgroundColor: annotation.color }} />
                <span className="highlight-page">Page {annotation.page}</span>
                <div className="highlight-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(annotation);
                    }}
                    title="Edit note"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnnotationDelete(annotation.id);
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingId === annotation.id ? (
                <div className="highlight-edit">
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Add a note..."
                    className="note-input"
                    autoFocus
                    onBlur={saveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                  />
                  <button type="button" className="btn" onClick={saveEdit}>
                    Save
                  </button>
                </div>
              ) : (
                <div className="highlight-note">{annotation.note || 'No note'}</div>
              )}

              {annotation.tags.length > 0 && (
                <div className="highlight-tags">
                  {annotation.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
