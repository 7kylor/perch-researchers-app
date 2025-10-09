import type React from 'react';
import { FileText, Users, Calendar, ExternalLink } from 'lucide-react';
import type { AcademicPaper } from '../../../../shared/types';

type PaperResultCardProps = {
  paper: AcademicPaper;
  isSelected: boolean;
  onToggle: () => void;
};

export const PaperResultCard: React.FC<PaperResultCardProps> = ({
  paper,
  isSelected,
  onToggle,
}) => {
  const sourceClass =
    {
      arxiv: 'paper-source-arxiv',
      pubmed: 'paper-source-pubmed',
      crossref: 'paper-source-crossref',
      semanticscholar: 'paper-source-semanticscholar',
    }[paper.source as string] || 'paper-source-default';

  return (
    <div className={`paper-result-card ${isSelected ? 'paper-result-card-selected' : ''}`}>
      <label className="paper-result-card-label">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="paper-result-checkbox"
        />

        <div className="paper-result-content">
          <div className="paper-result-header">
            <h4 className="paper-result-title">{paper.title}</h4>
            <span className={`paper-result-source ${sourceClass}`}>{paper.source}</span>
          </div>

          <div className="paper-result-meta">
            {paper.authors.length > 0 && (
              <span className="paper-result-meta-item">
                <Users />
                {paper.authors.slice(0, 2).join(', ')}
                {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
              </span>
            )}

            {paper.year && (
              <span className="paper-result-meta-item">
                <Calendar />
                {paper.year}
              </span>
            )}

            {paper.venue && (
              <span className="paper-result-meta-item">
                <FileText />
                {paper.venue}
              </span>
            )}
          </div>

          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="paper-result-link"
              onClick={(e) => e.stopPropagation()}
            >
              View paper
              <ExternalLink />
            </a>
          )}
        </div>
      </label>
    </div>
  );
};
