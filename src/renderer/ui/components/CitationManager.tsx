/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
import * as React from 'react';
import { Download, BookOpen, Plus, FileText, Copy, ExternalLink } from 'lucide-react';

interface CitationData {
  readonly id: string;
  readonly paperId: string;
  readonly title: string;
  readonly authors: readonly string[];
  readonly year?: number;
  readonly venue?: string;
  readonly doi?: string;
  readonly url?: string;
  readonly citationStyle: string;
  readonly formattedCitation: string;
  readonly rawCitation?: string;
  readonly context?: string;
  readonly pageNumber?: number;
}

interface BibliographyCollection {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly citationStyle: string;
  readonly paperIds: readonly string[];
  readonly generatedContent: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface CitationManagerProps {
  readonly paperId?: string;
  readonly onClose?: () => void;
}

export const CitationManager: React.FC<CitationManagerProps> = ({ paperId, onClose }) => {
  const [citations, setCitations] = React.useState<readonly CitationData[]>([]);
  const [bibliographies, setBibliographies] = React.useState<readonly BibliographyCollection[]>([]);
  const [selectedCitations, setSelectedCitations] = React.useState<readonly string[]>([]);
  const [citationStyle, setCitationStyle] = React.useState<string>('apa');
  const [showCreateBibliography, setShowCreateBibliography] = React.useState<boolean>(false);
  const [bibliographyName, setBibliographyName] = React.useState<string>('');
  const [bibliographyDescription, setBibliographyDescription] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (paperId) {
      loadCitations();
    }
    loadBibliographies();
  }, [paperId]);

  const loadCitations = async (): Promise<void> => {
    if (!paperId) return;

    try {
      setIsLoading(true);
      const extractedCitations = await window.api.citations.getForPaper(paperId);
      setCitations(extractedCitations);

      // If no citations found, try to extract them
      if (extractedCitations.length === 0) {
        await window.api.citations.extract(paperId);
        const newCitations = await window.api.citations.getForPaper(paperId);
        setCitations(newCitations);
      }
    } catch (error) {
      console.error('Failed to load citations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBibliographies = async (): Promise<void> => {
    try {
      const collections = await window.api.citations.getCollections();
      setBibliographies(collections);
    } catch (error) {
      console.error('Failed to load bibliographies:', error);
    }
  };

  const createBibliographyCollection = async (): Promise<void> => {
    if (!bibliographyName.trim() || selectedCitations.length === 0) return;

    try {
      setIsLoading(true);
      await window.api.citations.createCollection(
        bibliographyName,
        bibliographyDescription,
        selectedCitations,
        citationStyle,
      );
      setBibliographyName('');
      setBibliographyDescription('');
      setShowCreateBibliography(false);
      setSelectedCitations([]);
      await loadBibliographies();
    } catch (error) {
      console.error('Failed to create bibliography:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportBibliography = async (bibliographyId: string): Promise<void> => {
    try {
      const content = await window.api.citations.getCollectionContent(bibliographyId);
      if (content) {
        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bibliography-${bibliographyId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export bibliography:', error);
    }
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!paperId) {
    return (
      <div className="citation-manager">
        <div className="citation-header">
          <h2>Citation Manager</h2>
          {onClose && (
            <button type="button" onClick={onClose} className="close-btn">
              ×
            </button>
          )}
        </div>

        <div className="bibliography-collections">
          <div className="section-header">
            <h3>Bibliography Collections</h3>
            <button
              type="button"
              onClick={() => setShowCreateBibliography(true)}
              className="create-btn"
            >
              <Plus size={16} />
              Create Collection
            </button>
          </div>

          {bibliographies.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>No bibliography collections yet</p>
              <p>Create your first collection to organize citations</p>
            </div>
          ) : (
            <div className="collections-grid">
              {bibliographies.map((bib) => (
                <div key={bib.id} className="collection-card">
                  <div className="collection-header">
                    <h4>{bib.name}</h4>
                    <div className="collection-actions">
                      <button
                        type="button"
                        onClick={() => exportBibliography(bib.id)}
                        title="Export bibliography"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bib.generatedContent || '')}
                        title="Copy bibliography"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  {bib.description && <p className="collection-description">{bib.description}</p>}
                  <div className="collection-meta">
                    <span className="citation-style">{bib.citationStyle.toUpperCase()}</span>
                    <span className="paper-count">{bib.paperIds.length} papers</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateBibliography && (
          <div className="create-bibliography-modal">
            <div className="modal-content">
              <h3>Create Bibliography Collection</h3>
              <div className="form-group">
                <label htmlFor="bibliographyName">Name</label>
                <input
                  type="text"
                  value={bibliographyName}
                  onChange={(e) => setBibliographyName(e.target.value)}
                  placeholder="My Research Bibliography"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bibliographyDescription">Description (optional)</label>
                <textarea
                  value={bibliographyDescription}
                  onChange={(e) => setBibliographyDescription(e.target.value)}
                  placeholder="Collection of papers for my thesis..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="citationStyle">Citation Style</label>
                <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value)}>
                  <option value="apa">APA</option>
                  <option value="mla">MLA</option>
                  <option value="ieee">IEEE</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateBibliography(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createBibliographyCollection}
                  disabled={!bibliographyName.trim() || isLoading}
                  className="create-btn"
                >
                  Create Collection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="citation-manager">
      <div className="citation-header">
        <h2>Citations for Paper</h2>
        <div className="citation-actions">
          <select
            value={citationStyle}
            onChange={(e) => setCitationStyle(e.target.value)}
            className="style-selector"
          >
            <option value="apa">APA</option>
            <option value="mla">MLA</option>
            <option value="ieee">IEEE</option>
          </select>
          <button
            type="button"
            onClick={() => setShowCreateBibliography(true)}
            disabled={selectedCitations.length === 0}
            className="create-collection-btn"
          >
            <BookOpen size={16} />
            Create Bibliography
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="close-btn">
              ×
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <p>Extracting citations...</p>
        </div>
      ) : citations.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>No citations found</p>
          <p>Citations will be automatically extracted from the paper content</p>
        </div>
      ) : (
        <div className="citations-list">
          {citations.map((citation) => (
            <div key={citation.id} className="citation-item">
              <input
                type="checkbox"
                checked={selectedCitations.includes(citation.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCitations([...selectedCitations, citation.id]);
                  } else {
                    setSelectedCitations(selectedCitations.filter((id) => id !== citation.id));
                  }
                }}
                className="citation-checkbox"
              />

              <div className="citation-content">
                <div className="citation-text">{citation.formattedCitation}</div>
                {citation.context && (
                  <div className="citation-context">Context: &ldquo;{citation.context}&rdquo;</div>
                )}
                <div className="citation-meta">
                  {citation.year && <span className="year">{citation.year}</span>}
                  {citation.venue && <span className="venue">{citation.venue}</span>}
                  {citation.doi && (
                    <a
                      href={`https://doi.org/${citation.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doi-link"
                    >
                      <ExternalLink size={14} />
                      DOI
                    </a>
                  )}
                </div>
              </div>

              <div className="citation-actions">
                <button
                  type="button"
                  onClick={() => copyToClipboard(citation.formattedCitation)}
                  title="Copy citation"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateBibliography && (
        <div className="create-bibliography-modal">
          <div className="modal-content">
            <h3>Create Bibliography Collection</h3>
            <p>
              Create a bibliography collection from {selectedCitations.length} selected citations
            </p>
            <div className="form-group">
              <label htmlFor="bibliographyName">Name</label>
              <input
                type="text"
                value={bibliographyName}
                onChange={(e) => setBibliographyName(e.target.value)}
                placeholder="My Research Bibliography"
              />
            </div>
            <div className="form-group">
              <label htmlFor="bibliographyDescription">Description (optional)</label>
              <textarea
                value={bibliographyDescription}
                onChange={(e) => setBibliographyDescription(e.target.value)}
                placeholder="Collection of papers for my thesis..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowCreateBibliography(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createBibliographyCollection}
                disabled={!bibliographyName.trim() || isLoading}
                className="create-btn"
              >
                Create Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
