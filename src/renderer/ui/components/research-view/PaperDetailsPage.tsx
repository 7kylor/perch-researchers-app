import React from 'react';
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Share2,
  Users,
  FileText,
  Quote,
  Bookmark,
  TrendingUp,
} from 'lucide-react';
import { useSearch } from './SearchProvider';

export const PaperDetailsPage: React.FC = () => {
  const { detailsPagePaperId, results, closeDetailsPage } = useSearch();

  const paper = React.useMemo(() => {
    if (!detailsPagePaperId || !results) return null;
    return results.papers.find((p) => p.title === detailsPagePaperId);
  }, [detailsPagePaperId, results]);

  if (!paper || !detailsPagePaperId) return null;

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

  const handleShare = () => {
    const textToCopy = paper.doi ? `https://doi.org/${paper.doi}` : paper.url || paper.title;
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div className="paper-details-page">
      {/* Header with Back Button */}
      <div className="details-page-header">
        <button
          type="button"
          className="back-to-results-button"
          onClick={closeDetailsPage}
          aria-label="Back to results"
        >
          <ArrowLeft size={18} />
          <span>Back to Results</span>
        </button>
        <div className="details-page-actions">
          <button
            type="button"
            className="details-action-button"
            onClick={handleShare}
            title="Share paper"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="details-page-content">
        <div className="details-container">
          {/* Title Section */}
          <div className="details-title-section">
            <h1 className="details-title">{paper.title}</h1>
            <div className="details-source-badges">
              <span className={`source-badge-details source-${paper.source}`}>{paper.source}</span>
              {paper.year && <span className="year-badge-details">{paper.year}</span>}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="details-metadata-grid">
            {paper.authors.length > 0 && (
              <div className="metadata-item-details">
                <Users size={18} />
                <div className="metadata-content">
                  <span className="metadata-label">Authors</span>
                  <span className="metadata-value">{paper.authors.join(', ')}</span>
                </div>
              </div>
            )}

            {paper.venue && (
              <div className="metadata-item-details">
                <FileText size={18} />
                <div className="metadata-content">
                  <span className="metadata-label">Published in</span>
                  <span className="metadata-value">{paper.venue}</span>
                </div>
              </div>
            )}

            {paper.citations !== undefined && (
              <div className="metadata-item-details">
                <Quote size={18} />
                <div className="metadata-content">
                  <span className="metadata-label">Citations</span>
                  <span className="metadata-value">{paper.citations}</span>
                </div>
              </div>
            )}

            {paper.doi && (
              <div className="metadata-item-details">
                <ExternalLink size={18} />
                <div className="metadata-content">
                  <span className="metadata-label">DOI</span>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doi-link-details"
                  >
                    {paper.doi}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Abstract Section */}
          <div className="details-abstract-section">
            <h3 className="section-title">
              <BookOpen size={20} />
              Abstract
            </h3>
            {paper.abstract ? (
              <div className="abstract-content-details">
                <p className="abstract-text-details">{paper.abstract}</p>
              </div>
            ) : (
              <p className="no-abstract">No abstract available for this paper.</p>
            )}
          </div>

          {/* Actions Section */}
          <div className="details-actions-section">
            <div className="action-buttons-group">
              <button
                type="button"
                className="primary-action-button-details"
                onClick={handleAddToLibrary}
              >
                <Bookmark size={18} />
                <span>Add to Library</span>
              </button>

              <button
                type="button"
                className="secondary-action-button-details"
                onClick={handleOpenPaper}
                disabled={!paper.url}
              >
                <ExternalLink size={18} />
                <span>Open Paper</span>
              </button>

              <button
                type="button"
                className="secondary-action-button-details"
                onClick={handleShare}
              >
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Related Papers Section (Optional) */}
          <div className="details-related-section">
            <h3 className="section-title">
              <TrendingUp size={20} />
              Related Papers
            </h3>
            <div className="related-papers-list">
              {/* Mock related papers - in real implementation, this would come from API */}
              <div className="related-paper-item">
                <h4 className="related-paper-title">
                  Similar research paper title that would be relevant
                </h4>
                <div className="related-paper-meta">
                  <span className="related-paper-authors">Authors et al.</span>
                  <span className="related-paper-year">2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
