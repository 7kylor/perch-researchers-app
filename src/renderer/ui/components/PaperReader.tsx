import React from 'react';
import { ChevronLeft, ChevronRight, Maximize, X, FileText, ExternalLink } from 'lucide-react';

type Paper = {
  id: string;
  title: string;
  authors: string[];
  venue?: string;
  year?: number;
  doi?: string;
  source?: string;
  abstract?: string;
  status: string;
  filePath?: string;
  textHash: string;
};

type PaperReaderProps = {
  paper: Paper;
  isOpen: boolean;
  onClose: () => void;
  onOpenPDF?: (paper: Paper) => void;
};

export const PaperReader: React.FC<PaperReaderProps> = ({ paper, isOpen, onClose, onOpenPDF }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState<'none' | 'summary' | 'qa' | 'related'>('none');
  const [summary, setSummary] = React.useState<string>('');
  const [question, setQuestion] = React.useState<string>('');
  const [answer, setAnswer] = React.useState<string>('');
  const [related, setRelated] = React.useState<
    Array<{ paperId: string; title: string; score: number }>
  >([]);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentPage > 1) setCurrentPage(currentPage - 1);
          break;
        case 'ArrowRight':
          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
          break;
        case 'f':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
      }
    },
    [isOpen, onClose, currentPage, totalPages, isFullscreen],
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className={`paper-reader-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="paper-reader">
        {/* Header - Using Activity Bar style */}
        <header className="activity-bar">
          {/* Left section - Empty for paper reader */}
          <div className="activity-left"></div>

          {/* Center section - Paper title */}
          <div className="activity-center">
            <h1 className="activity-title" title={paper.title}>
              {paper.title.length > 50 ? `${paper.title.substring(0, 50)}...` : paper.title}
            </h1>
          </div>

          {/* Right section - Controls */}
          <div className="activity-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
              <button
                type="button"
                className="activity-compact-btn"
                onClick={async () => {
                  try {
                    setAiLoading('summary');
                    const result = await window.api.ai.summarize(paper.id);
                    setSummary(result);
                  } catch {
                    setSummary('Failed to summarize.');
                  } finally {
                    setAiLoading('none');
                  }
                }}
                title="Summarize"
              >
                <span>Summarize</span>
              </button>
              <input
                type="text"
                placeholder="Ask a question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{ height: 24 }}
              />
              <button
                type="button"
                className="activity-compact-btn"
                onClick={async () => {
                  if (!question.trim()) return;
                  try {
                    setAiLoading('qa');
                    const result = await window.api.ai.question(question.trim(), paper.id);
                    setAnswer(result);
                  } catch {
                    setAnswer('Failed to answer question.');
                  } finally {
                    setAiLoading('none');
                  }
                }}
                title="Ask"
              >
                <span>Ask</span>
              </button>
              <button
                type="button"
                className="activity-compact-btn"
                onClick={async () => {
                  try {
                    setAiLoading('related');
                    const res = await window.api.ai.related(paper.title);
                    setRelated(res);
                  } catch {
                    setRelated([]);
                  } finally {
                    setAiLoading('none');
                  }
                }}
                title="Related"
              >
                <span>Related</span>
              </button>
            </div>
            <button
              type="button"
              className="activity-compact-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle Fullscreen"
            >
              <Maximize className="h-3 w-3" />
            </button>
            <button type="button" className="activity-compact-btn" onClick={onClose} title="Close">
              <X className="h-3 w-3" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="reader-content">
          {/* PDF Viewer */}
          <div className="pdf-viewer-container">
            <div className="pdf-content">
              {paper.filePath ? (
                <div className="pdf-viewer-options">
                  <div className="pdf-option-card">
                    <div className="pdf-option-header">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <h3>PDF Document Available</h3>
                    </div>
                    <p className="pdf-option-description">
                      This paper has an attached PDF document that can be viewed in the dedicated
                      PDF reader.
                    </p>
                    <div className="pdf-option-actions">
                      <button
                        type="button"
                        className="pdf-open-btn"
                        onClick={() => onOpenPDF?.(paper)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in PDF Reader
                      </button>
                    </div>
                  </div>

                  {/* Simple preview placeholder */}
                  <div className="pdf-preview">
                    <div className="pdf-page-preview">
                      <div className="pdf-page-content">
                        <h4>{paper.title}</h4>
                        <p className="pdf-authors">
                          {paper.authors?.join(', ') || 'Unknown Authors'}
                        </p>
                        {paper.venue && (
                          <p className="pdf-venue">
                            {paper.venue} {paper.year}
                          </p>
                        )}
                        {paper.abstract && (
                          <p className="pdf-abstract">
                            {paper.abstract.length > 150
                              ? `${paper.abstract.substring(0, 150)}...`
                              : paper.abstract}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pdf-placeholder">
                  <h3>
                    <FileText className="inline h-5 w-5 mr-2" />
                    No PDF Available
                  </h3>
                  <p>This paper doesn&apos;t have a PDF file attached.</p>
                  {paper.doi && (
                    <p className="pdf-doi-info">
                      DOI:{' '}
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {paper.doi}
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* AI Results */}
            <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
              {aiLoading !== 'none' && <div className="loading-skeleton" style={{ height: 64 }} />}
              {!!summary && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Summary</h4>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{summary}</pre>
                </div>
              )}
              {!!answer && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Answer</h4>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{answer}</pre>
                </div>
              )}
              {related.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Related Papers</h4>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {related.map((r) => (
                      <li key={r.paperId}>{r.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* PDF Toolbar - Moved to bottom */}
            <div className="pdf-toolbar">
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="page-info">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS styles for the PDF viewer options
const styles = `
  .pdf-viewer-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .pdf-content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .pdf-toolbar {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .toolbar-btn {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: var(--text);
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--surface);
    border-color: var(--primary);
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-info {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
    min-width: 80px;
    text-align: center;
  }

  .pdf-viewer-options {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px;
  }

  .pdf-option-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    text-align: center;
  }

  .pdf-option-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .pdf-option-header h3 {
    margin: 0;
    color: var(--text);
    font-size: 18px;
    font-weight: 600;
  }

  .pdf-option-description {
    color: var(--text-secondary);
    margin: 0 0 20px 0;
    line-height: 1.5;
  }

  .pdf-option-actions {
    display: flex;
    justify-content: center;
  }

  .pdf-open-btn {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.2s;
  }

  .pdf-open-btn:hover {
    background: var(--primary-hover);
  }

  .pdf-preview {
    background: var(--bg);
    border-radius: 8px;
    overflow: hidden;
  }

  .pdf-page-preview {
    background: white;
    padding: 32px;
    min-height: 400px;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .pdf-page-content h4 {
    margin: 0 0 12px 0;
    color: var(--text);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }

  .pdf-authors {
    margin: 0 0 8px 0;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .pdf-venue {
    margin: 0 0 16px 0;
    color: var(--text-secondary);
    font-size: 14px;
    font-style: italic;
  }

  .pdf-abstract {
    margin: 0;
    color: var(--text);
    font-size: 14px;
    line-height: 1.5;
  }

  .pdf-doi-info {
    margin-top: 16px;
    font-size: 14px;
  }

  .pdf-doi-info a {
    color: var(--primary);
    text-decoration: none;
  }

  .pdf-doi-info a:hover {
    text-decoration: underline;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
