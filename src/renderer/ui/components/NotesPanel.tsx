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
  selectedAnnotationId?: string;
  onAnnotationSelect: (annotation: Annotation) => void;
  onAnnotationUpdate: (
    id: string,
    updates: Partial<{ color: string; note?: string; tags: string[] }>,
  ) => void;
  onAnnotationDelete: (id: string) => void;
};

export function NotesPanel({
  paperId,
  annotations,
  selectedAnnotationId,
  onAnnotationSelect,
  onAnnotationUpdate,
  onAnnotationDelete,
}: Props) {
  const [newNote, setNewNote] = React.useState('');

  const addNote = async () => {
    if (!newNote.trim()) return;

    await window.api.annotations.add({
      paperId,
      page: 1,
      color: '#ffda79',
      note: newNote,
      tags: [],
      anchors: {},
    });

    setNewNote('');
    // Refresh annotations would be handled by parent
  };

  return (
    <aside className="notes-panel">
      <div className="notes-header">
        <h3>Notes</h3>
        <div className="notes-add">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="note-input"
          />
          <button type="button" className="btn" onClick={addNote} disabled={!newNote.trim()}>
            Add Note
          </button>
        </div>
      </div>

      <div className="notes-list">
        {annotations
          .filter((a) => a.note)
          .map((annotation) => (
            <div
              key={annotation.id}
              className={`note-item ${selectedAnnotationId === annotation.id ? 'selected' : ''}`}
              onClick={() => onAnnotationSelect(annotation)}
            >
              <div className="note-header">
                <span className="note-page">Page {annotation.page}</span>
                <span className="note-date">
                  {new Date(annotation.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="note-content">{annotation.note}</div>
              {annotation.tags.length > 0 && (
                <div className="note-tags">
                  {annotation.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </aside>
  );
}
