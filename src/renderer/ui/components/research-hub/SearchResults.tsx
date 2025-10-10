import type React from 'react';
import { PaperResultCard } from './PaperResultCard';
import type { AcademicSearchResult, AcademicPaper } from '../../../../shared/types';

type ViewMode = 'card' | 'table';

type SearchResultsProps = {
  results: AcademicSearchResult;
  selected: ReadonlyArray<string>;
  onToggleSelect: (selected: ReadonlyArray<string>) => void;
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  selected,
  onToggleSelect,
}) => {
  const [view, setView] = React.useState<ViewMode>(
    () => (localStorage.getItem('search:view') as ViewMode) || 'card',
  );
  React.useEffect(() => localStorage.setItem('search:view', view), [view]);
  const [previewKey, setPreviewKey] = React.useState<string | null>(null);

  const handleToggle = (paper: AcademicPaper) => {
    const exists = selected.includes(paper.title);
    if (exists) {
      onToggleSelect(selected.filter((id) => id !== paper.title));
    } else {
      onToggleSelect([...selected, paper.title]);
    }
    setPreviewKey(paper.title);
  };

  const addToLibrary = async (paper: AcademicPaper) => {
    const id = await window.api.papers.add({
      title: paper.title,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
      doi: paper.doi,
      source: paper.source,
      abstract: paper.abstract,
      status: 'to_read',
      filePath: undefined,
      textHash: `${paper.title}-${paper.authors.slice(0, 2).join(',')}`,
    });
    return id;
  };

  const preview = React.useMemo(() => {
    if (!previewKey) return null;
    return results.papers.find((p) => p.title === previewKey) || null;
  }, [previewKey, results.papers]);

  if (results.papers.length === 0) {
    return (
      <div className="search-empty-state">
        <p className="search-loading-text">No papers found. Try a different search query.</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-header">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <p className="search-results-count">
            Found <span className="search-results-count-number">{results.papers.length}</span>{' '}
            papers
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setView('card')}
              className={view === 'card' ? 'hub-tab hub-tab-active' : 'hub-tab'}
            >
              Card
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={view === 'table' ? 'hub-tab hub-tab-active' : 'hub-tab'}
            >
              Table
            </button>
          </div>
        </div>
        {selected.length > 0 && (
          <p className="search-results-selected">{selected.length} selected</p>
        )}
      </div>

      {view === 'card' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div className="search-results-list">
            {results.papers.map((paper) => (
              <PaperResultCard
                key={`${paper.source}-${paper.doi ?? paper.url ?? paper.title}`}
                paper={paper}
                isSelected={selected.includes(paper.title)}
                onToggle={() => handleToggle(paper)}
              />
            ))}
          </div>
          <aside style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Preview</div>
            {!preview ? (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Select a paper to preview abstract and quick actions.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {preview.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {preview.authors.slice(0, 3).join(', ')}
                  {preview.year ? ` • ${preview.year}` : ''}
                  {preview.venue ? ` • ${preview.venue}` : ''}
                </div>
                {preview.abstract && (
                  <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
                    {preview.abstract}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => addToLibrary(preview)}>
                    Add to Library
                  </button>
                  {preview.url && (
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-default"
                    >
                      Open
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div
          style={{ overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8 }}
        >
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Title</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Authors</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Year</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Source</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.papers.map((p) => (
                <tr key={`${p.source}-${p.doi ?? p.url ?? p.title}`}>
                  <td style={{ padding: 8 }}>{p.title}</td>
                  <td style={{ padding: 8 }}>
                    {p.authors.slice(0, 3).join(', ')}
                    {p.authors.length > 3 ? ` +${p.authors.length - 3}` : ''}
                  </td>
                  <td style={{ padding: 8 }}>{p.year ?? ''}</td>
                  <td style={{ padding: 8 }}>{p.source}</td>
                  <td style={{ padding: 8 }}>
                    <button type="button" onClick={() => addToLibrary(p)}>
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
