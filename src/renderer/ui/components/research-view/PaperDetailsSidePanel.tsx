import React from 'react';
import {
  X,
  ExternalLink,
  BookOpen,
  Share2,
  ChevronLeft,
  ChevronRight,
  Users,
  FileText,
  Quote,
  Bookmark,
} from 'lucide-react';
import { useSearch } from './SearchProvider';

export const PaperDetailsSidePanel: React.FC = () => {
  const {
    sidePanelPaperId,
    results,
    closeSidePanel,
    navigateSidePanel,
    selectedPapers,
    togglePaperSelection,
  } = useSearch();

  const paper = React.useMemo(() => {
    if (!sidePanelPaperId || !results) return null;
    return results.papers.find((p) => p.title === sidePanelPaperId);
  }, [sidePanelPaperId, results]);

  const currentIndex = React.useMemo(() => {
    if (!sidePanelPaperId || !results) return -1;
    return results.papers.findIndex((p) => p.title === sidePanelPaperId);
  }, [sidePanelPaperId, results]);

  const isSelected = paper ? selectedPapers.includes(paper.title) : false;

  if (!paper || !sidePanelPaperId) return null;

  const handleAddToLibrary = async () => {
    try {
      await window.api.papers.add({
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
    } catch (error) {
      console.error('Failed to add paper to library:', error);
    }
  };

  const handleOpenPaper = () => {
    if (paper.url) {
      window.open(paper.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export paper:', paper);
  };

  const handleShare = () => {
    // Copy DOI or URL to clipboard
    const textToCopy = paper.doi ? `https://doi.org/${paper.doi}` : paper.url || paper.title;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="side-panel-backdrop"
        onClick={closeSidePanel}
        aria-label="Close side panel"
      />

      {/* Side Panel */}
      <div className="side-panel">
        {/* Header */}
        <div className="side-panel-header">
          <div className="side-panel-nav">
            <button
              type="button"
              className="nav-button"
              onClick={() => navigateSidePanel('prev')}
              disabled={currentIndex === 0}
              aria-label="Previous paper"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="nav-position">
              {currentIndex + 1} / {results?.papers.length || 0}
            </span>
            <button
              type="button"
              className="nav-button"
              onClick={() => navigateSidePanel('next')}
              disabled={currentIndex === (results?.papers.length || 0) - 1}
              aria-label="Next paper"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={closeSidePanel}
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="side-panel-content">
          {/* Title */}
          <h2 className="paper-detail-title">{paper.title}</h2>

          {/* Source Badge */}
          <div className="paper-detail-source">
            <span className={`source-badge source-${paper.source}`}>{paper.source}</span>
            {paper.year && <span className="detail-year">{paper.year}</span>}
          </div>

          {/* Authors */}
          <div className="detail-section">
            <div className="detail-section-header">
              <Users size={16} />
              <h3>Authors</h3>
            </div>
            <div className="authors-list">
              {paper.authors.length > 0 ? (
                paper.authors.map((author) => (
                  <span key={author} className="author-name">
                    {author}
                    {paper.authors.indexOf(author) < paper.authors.length - 1 ? ', ' : ''}
                  </span>
                ))
              ) : (
                <span className="no-data">No author information</span>
              )}
            </div>
          </div>

          {/* Publication Info */}
          {paper.venue && (
            <div className="detail-section">
              <div className="detail-section-header">
                <FileText size={16} />
                <h3>Published in</h3>
              </div>
              <p className="detail-text">{paper.venue}</p>
            </div>
          )}

          {/* Citations */}
          {paper.citations !== undefined && (
            <div className="detail-section">
              <div className="detail-section-header">
                <Quote size={16} />
                <h3>Citations</h3>
              </div>
              <p className="detail-text">{paper.citations} citations</p>
            </div>
          )}

          {/* DOI */}
          {paper.doi && (
            <div className="detail-section">
              <div className="detail-section-header">
                <FileText size={16} />
                <h3>DOI</h3>
              </div>
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="doi-link"
              >
                {paper.doi}
              </a>
            </div>
          )}

          {/* Abstract */}
          <div className="detail-section">
            <div className="detail-section-header">
              <BookOpen size={16} />
              <h3>Abstract</h3>
            </div>
            {paper.abstract ? (
              <p className="abstract-full">{paper.abstract}</p>
            ) : (
              <p className="no-data">No abstract available</p>
            )}
          </div>

          {/* Actions */}
          <div className="detail-actions">
            <button
              type="button"
              className="action-primary"
              onClick={handleAddToLibrary}
              aria-label="Add to library"
            >
              <Bookmark size={16} />
              <span>Add to Library</span>
            </button>

            <button
              type="button"
              className="action-secondary"
              onClick={handleOpenPaper}
              disabled={!paper.url}
              aria-label="Open paper"
            >
              <ExternalLink size={16} />
              <span>Open Paper</span>
            </button>

            <button
              type="button"
              className="action-secondary"
              onClick={() => togglePaperSelection(paper.title)}
              aria-label={isSelected ? 'Deselect paper' : 'Select paper'}
            >
              <input type="checkbox" checked={isSelected} readOnly />
              <span>{isSelected ? 'Selected' : 'Select'}</span>
            </button>
          </div>

          <div className="detail-actions-secondary">
            <button
              type="button"
              className="action-icon"
              onClick={handleExport}
              aria-label="Export paper"
              title="Export"
            >
              <Download size={16} />
            </button>

            <button
              type="button"
              className="action-icon"
              onClick={handleShare}
              aria-label="Share paper"
              title="Copy link"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
