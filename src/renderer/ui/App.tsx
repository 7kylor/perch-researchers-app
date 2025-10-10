import React from 'react';
import { ActivityBar } from './components/ActivityBar';
import { EnhancedAddPaper } from './components/EnhancedAddPaper';
import { Toast } from './components/Toast';
import { SettingsPanel } from './components/SettingsPanel';
import { AIChat } from './components/AIChat';
import { CitationManager } from './components/CitationManager';
import { ResearchAnalyticsHub } from './components/ResearchAnalyticsHub';
import { LibraryView } from './components/LibraryView';
import { ReportsView } from './components/ReportsView';
import { RecentView } from './components/RecentView';

import { ThemeProvider } from './components/ThemeProvider';

export const App: React.FC = () => {
  const [results, setResults] = React.useState<import('../../shared/types').Paper[]>([]);
  const [selectedCategory, _setSelectedCategory] = React.useState('builtin:all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [_searchQuery, _setSearchQuery] = React.useState('');
  const [showSimpleAddModal, setShowSimpleAddModal] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showAIChat, _setShowAIChat] = React.useState(false);
  const [selectedPapersForAI, setSelectedPapersForAI] = React.useState<string[]>([]);
  const [currentView, setCurrentView] = React.useState<
    'library' | 'research' | 'reports' | 'recent'
  >(() => {
    // Initialize from URL hash
    const hash = window.location.hash.slice(1) || 'library';
    return (['library', 'research', 'reports', 'recent'].includes(hash) ? hash : 'library') as
      | 'library'
      | 'research'
      | 'reports'
      | 'recent';
  });
  const [showCitationManager, setShowCitationManager] = React.useState(false);
  const [selectedPaperForCitations, setSelectedPaperForCitations] = React.useState<string | null>(
    null,
  );

  const [toast, setToast] = React.useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const refreshPapers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const papers = await window.api.papers.search('');
      setResults(papers);
    } catch {
      // Failed to load papers
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openPaper = React.useCallback(async (id: string) => {
    const paper = await window.api.papers.get(id);
    if (paper) {
      // Always open in separate PDF reader window
      try {
        await window.api['pdf-reader']['create-window'](paper);
      } catch {
        // Failed to open PDF reader window
        setToast({ message: 'Failed to open PDF reader', type: 'error' });
      }
    }
  }, []);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleAddPaperClick = () => {
    setShowSimpleAddModal(true);
  };

  const handleViewChange = (view: 'library' | 'research' | 'reports' | 'recent') => {
    setCurrentView(view);
    // Update URL hash
    window.location.hash = view;
  };

  const handlePaperClick = (paperId: string) => {
    openPaper(paperId);
  };

  const handleShowCitations = (paperId: string) => {
    setSelectedPaperForCitations(paperId);
    setShowCitationManager(true);
  };

  const handleSimpleAddPaper = async (input: string, type: 'url' | 'pdf') => {
    try {
      let paperId: string;

      if (type === 'pdf') {
        // Handle local PDF file upload
        const result = await window.api.pdf['import-from-file'](input.trim());
        paperId = await window.api.papers.add(result.paper);
        setToast({ message: 'PDF uploaded successfully!', type: 'success' });
        await refreshPapers(); // Refresh the library to show the new paper
      } else {
        // Handle URL input - ORDER MATTERS: check specific patterns before generic ones
        // Check arXiv FIRST before checking for .pdf (since arXiv URLs often contain .pdf)
        if (input.includes('arxiv.org') || /^\d+\.\d+$/.test(input.trim())) {
          // It's an ArXiv ID or URL - try to get rich metadata
          try {
            let metadata = null;
            if (/^\d+\.\d+$/.test(input.trim())) {
              // It's an arXiv ID
              metadata = await window.api.url['detect-arxiv-id'](input.trim());
            } else {
              // It's an arXiv URL
              metadata = await window.api.url['detect-paper'](input.trim());
            }

            if (metadata) {
              const paperData: Omit<
                import('../../shared/types').Paper,
                'id' | 'addedAt' | 'updatedAt'
              > = {
                title: metadata.title,
                authors: metadata.authors,
                venue: metadata.venue,
                year: metadata.year,
                doi: metadata.doi,
                source: metadata.source as
                  | 'url'
                  | 'arxiv'
                  | 'pubmed'
                  | 'crossref'
                  | 'semanticscholar'
                  | 'ieee'
                  | 'sciencedirect'
                  | 'jstor'
                  | 'googlescholar'
                  | 'pdf',
                abstract: metadata.abstract,
                status: 'to_read' as const,
                filePath: metadata.filePath,
                textHash: input,
              };
              paperId = await window.api.papers.add(paperData);
              setToast({
                message: 'Paper with rich metadata added successfully!',
                type: 'success',
              });
            } else {
              // Fallback to basic metadata
              const paperData = {
                title: `Paper from ${input}`,
                authors: [],
                venue: undefined,
                year: undefined,
                doi: undefined,
                source: 'url' as const,
                abstract: undefined,
                status: 'to_read' as const,
                filePath: undefined,
                textHash: input,
              };
              paperId = await window.api.papers.add(paperData);
              setToast({ message: 'Paper added successfully!', type: 'success' });
            }
          } catch {
            // If metadata extraction fails, add with basic info
            const paperData = {
              title: `Paper from ${input}`,
              authors: [],
              venue: undefined,
              year: undefined,
              doi: undefined,
              source: 'url' as const,
              abstract: undefined,
              status: 'to_read' as const,
              filePath: undefined,
              textHash: input,
            };
            paperId = await window.api.papers.add(paperData);
            setToast({ message: 'Paper added successfully!', type: 'success' });
          }
          await refreshPapers(); // Refresh the library to show the new paper
        } else if (input.startsWith('10.') || input.includes('doi.org')) {
          // It's a DOI
          paperId = await window.api.ingest.doi(input);
          setToast({ message: 'Paper imported from DOI successfully!', type: 'success' });
          await refreshPapers(); // Refresh the library to show the new paper
        } else if (input.includes('.pdf') || input.startsWith('http')) {
          // It's a PDF URL - try to import it directly
          try {
            const result = await window.api.pdf['import-from-url'](input.trim());
            paperId = await window.api.papers.add(result.paper);
            setToast({ message: 'PDF downloaded and imported successfully!', type: 'success' });
            await refreshPapers(); // Refresh the library to show the new paper
          } catch {
            // If PDF import fails, add as regular URL
            const paperData = {
              title: `Paper from ${input}`,
              authors: [],
              venue: undefined,
              year: undefined,
              doi: undefined,
              source: 'url' as const,
              abstract: undefined,
              status: 'to_read' as const,
              filePath: undefined,
              textHash: input,
            };
            paperId = await window.api.papers.add(paperData);
            setToast({ message: 'URL added successfully!', type: 'success' });
            await refreshPapers(); // Refresh the library to show the new paper
          }
        } else {
          // Regular URL - try to extract metadata if possible
          try {
            const metadata = await window.api.url['detect-paper'](input.trim());

            if (metadata) {
              const paperData: Omit<
                import('../../shared/types').Paper,
                'id' | 'addedAt' | 'updatedAt'
              > = {
                title: metadata.title,
                authors: metadata.authors,
                venue: metadata.venue,
                year: metadata.year,
                doi: metadata.doi,
                source: metadata.source as
                  | 'url'
                  | 'arxiv'
                  | 'pubmed'
                  | 'crossref'
                  | 'semanticscholar'
                  | 'ieee'
                  | 'sciencedirect'
                  | 'jstor'
                  | 'googlescholar'
                  | 'pdf',
                abstract: metadata.abstract,
                status: 'to_read' as const,
                filePath: metadata.filePath,
                textHash: input,
              };
              paperId = await window.api.papers.add(paperData);
              setToast({
                message: 'Paper with rich metadata added successfully!',
                type: 'success',
              });
            } else {
              // Fallback to basic metadata
              const paperData = {
                title: `Paper from ${input}`,
                authors: [],
                venue: undefined,
                year: undefined,
                doi: undefined,
                source: 'url' as const,
                abstract: undefined,
                status: 'to_read' as const,
                filePath: undefined,
                textHash: input,
              };
              paperId = await window.api.papers.add(paperData);
              setToast({ message: 'Paper added successfully!', type: 'success' });
            }
          } catch {
            // If metadata extraction fails, add with basic info
            const paperData = {
              title: `Paper from ${input}`,
              authors: [],
              venue: undefined,
              year: undefined,
              doi: undefined,
              source: 'url' as const,
              abstract: undefined,
              status: 'to_read' as const,
              filePath: undefined,
              textHash: input,
            };
            paperId = await window.api.papers.add(paperData);
            setToast({ message: 'Paper added successfully!', type: 'success' });
          }
          await refreshPapers(); // Refresh the library to show the new paper
        }
      }

      return paperId;
    } catch (error) {
      // Failed to add paper
      setToast({ message: 'Failed to add paper. Please try again.', type: 'error' });
      throw error;
    }
  };

  // Load papers on mount
  React.useEffect(() => {
    const loadPapers = async () => {
      try {
        setIsLoading(true);
        const papers = await window.api.papers.search('');
        setResults(papers);
      } catch {
        // Failed to load papers
      } finally {
        setIsLoading(false);
      }
    };
    void loadPapers();
  }, []);

  // Hash change listener for navigation
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'library';
      if (['library', 'research', 'reports', 'recent'].includes(hash)) {
        setCurrentView(hash as 'library' | 'research' | 'reports' | 'recent');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals and panels
      if (e.key === 'Escape') {
        if (showSimpleAddModal) setShowSimpleAddModal(false);
        if (showSettings) setShowSettings(false);
      }
      // Cmd/Ctrl + , to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSimpleAddModal, showSettings]);

  return (
    <ThemeProvider>
      <div className="app-root">
        <ActivityBar
          onSettingsClick={handleSettingsClick}
          onAddPaperClick={handleAddPaperClick}
          currentRoute={currentView}
          onViewChange={handleViewChange}
        />
        <div className="main-layout">
          <main className="main-content">
            {currentView === 'library' && (
              <LibraryView
                papers={results}
                isLoading={isLoading}
                selectedCategory={selectedCategory}
                onPaperSelect={handlePaperClick}
                onRefresh={refreshPapers}
                onShowCitations={handleShowCitations}
              />
            )}
            {currentView === 'research' && <ResearchAnalyticsHub />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'recent' && <RecentView />}
          </main>

          {showAIChat && (
            <aside className="ai-chat-panel">
              <AIChat
                availablePapers={results}
                selectedPapers={selectedPapersForAI}
                onPapersChange={setSelectedPapersForAI}
              />
            </aside>
          )}
        </div>

        <EnhancedAddPaper
          isOpen={showSimpleAddModal}
          onClose={() => setShowSimpleAddModal(false)}
          onAdd={handleSimpleAddPaper}
          onToast={(message, type) => setToast({ message, type })}
        />

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

        {showCitationManager && (
          <div className="citation-manager-overlay">
            <CitationManager
              paperId={selectedPaperForCitations || undefined}
              onClose={() => {
                setShowCitationManager(false);
                setSelectedPaperForCitations(null);
              }}
            />
          </div>
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
};
