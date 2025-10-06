import React from 'react';
import { ChevronLeft, ChevronRight, Maximize, X, FileText } from 'lucide-react';

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
};

export const PaperReader: React.FC<PaperReaderProps> = ({ paper, isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages] = React.useState(1);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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

            <div className="pdf-content">
              {paper.filePath ? (
                <div className="pdf-page">
                  {/* This would be replaced with actual PDF rendering */}
                  <div className="pdf-placeholder">
                    <h3>
                      <FileText className="inline h-5 w-5 mr-2" />
                      PDF Content
                    </h3>
                    <p>
                      Page {currentPage} of {totalPages}
                    </p>
                    <p>File: {paper.filePath}</p>
                    <p>
                      <em>PDF viewer integration would go here</em>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="pdf-placeholder">
                  <h3>
                    <FileText className="inline h-5 w-5 mr-2" />
                    No PDF Available
                  </h3>
                  <p>This paper doesn't have a PDF file attached.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
