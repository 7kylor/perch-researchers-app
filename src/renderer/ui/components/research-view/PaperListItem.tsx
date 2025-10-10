import React from 'react';
import { ExternalLink, Bookmark, Users, Calendar } from 'lucide-react';
import type { AcademicPaper } from '../../../../shared/types';

type PaperListItemProps = {
  paper: AcademicPaper;
  isSelected: boolean;
  onToggle: () => void;
};

function getSourceClass(source: string): string {
  const classes: Record<string, string> = {
    arxiv: 'source-arxiv',
    pubmed: 'source-pubmed',
    crossref: 'source-crossref',
    semanticscholar: 'source-semanticscholar',
  };
  return classes[source] ?? 'source-default';
}

export const PaperListItem: React.FC<PaperListItemProps> = ({ paper, isSelected, onToggle }) => {
  const handleAddToLibrary = React.useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
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
    },
    [paper],
  );

  const handleOpenPaper = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (paper.url) {
        window.open(paper.url, '_blank', 'noopener,noreferrer');
      }
    },
    [paper.url],
  );

  return (
    <div className={`paper-list-item ${isSelected ? 'selected' : ''}`}>
      <label className="paper-checkbox">
        <input type="checkbox" checked={isSelected} onChange={onToggle} />
        <span className="checkmark" />
      </label>

      <button type="button" className="paper-list-main" onClick={onToggle}>
        <div className="paper-list-title-row">
          <h4 className="paper-list-title">{paper.title}</h4>
          <span className={`paper-source ${getSourceClass(paper.source)}`}>{paper.source}</span>
        </div>
        <div className="paper-list-meta">
          {paper.authors.length > 0 && (
            <span className="paper-list-authors">
              <Users />
              {paper.authors.slice(0, 2).join(', ')}
              {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
            </span>
          )}
          {paper.year && (
            <span className="paper-list-year">
              <Calendar />
              {paper.year}
            </span>
          )}
          {paper.venue && <span className="paper-list-venue">{paper.venue}</span>}
        </div>
      </button>

      <div className="paper-list-actions">
        <button
          type="button"
          onClick={handleAddToLibrary}
          className="compact-action-button"
          title="Add to library"
        >
          <Bookmark />
        </button>
        <button
          type="button"
          onClick={handleOpenPaper}
          className="compact-action-button"
          title="Open paper"
          disabled={!paper.url}
        >
          <ExternalLink />
        </button>
      </div>
    </div>
  );
};
