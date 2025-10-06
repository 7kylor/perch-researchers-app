import React from 'react';
import { LibrarySidebar } from './components/LibrarySidebar';
import { ActivityBar } from './components/ActivityBar';
import { LibraryControls } from './components/LibraryControls';
import { LibraryGrid } from './components/LibraryGrid';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { SimpleAddPaper } from './components/SimpleAddPaper';
import { Toast } from './components/Toast';
import { PaperReader } from './components/PaperReader';
import { SettingsPanel } from './components/SettingsPanel';
import { ThemeProvider } from './components/ThemeProvider';

export const App: React.FC = () => {
  const [results, setResults] = React.useState<import('../../shared/types').Paper[]>([]);
  const [currentPaper, setCurrentPaper] = React.useState<import('../../shared/types').Paper | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'library' | 'reader'>('library');
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSimpleAddModal, setShowSimpleAddModal] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [toast, setToast] = React.useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const openPaper = React.useCallback(async (id: string) => {
    const paper = await window.api.papers.get(id);
    if (paper) {
      setCurrentPaper(paper);
      setViewMode('reader');
    }
  }, []);

  const closeReader = React.useCallback(() => {
    setCurrentPaper(null);
    setViewMode('library');
  }, []);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handlePaperClick = (paperId: string) => {
    openPaper(paperId);
  };

  const handleSimpleAddPaper = async (input: string, type: 'url' | 'pdf') => {
    try {
      let paperId: string;

      if (type === 'pdf') {
        paperId = await window.api.ingest.pdf(input);
        setToast({ message: 'PDF uploaded successfully!', type: 'success' });
      } else {
        if (input.startsWith('10.')) {
          paperId = await window.api.ingest.doi(input);
          setToast({ message: 'Paper imported from DOI successfully!', type: 'success' });
        } else {
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
      }

      // Refresh the papers list
      const papers = await window.api.papers.search(searchQuery || '*');
      setResults(papers);

      return paperId;
    } catch (error) {
      console.error('Failed to add paper:', error);
      setToast({ message: 'Failed to add paper. Please try again.', type: 'error' });
      throw error;
    }
  };

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);

    try {
      const papers = await window.api.papers.search(query || '*');
      setResults(papers);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load papers on mount
  React.useEffect(() => {
    const loadPapers = async () => {
      try {
        setIsLoading(true);
        const papers = await window.api.papers.search('*');
        setResults(papers);
      } catch (error) {
        console.error('Failed to load papers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPapers();
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals and panels
      if (e.key === 'Escape') {
        if (showSimpleAddModal) setShowSimpleAddModal(false);
        if (showSettings) setShowSettings(false);
        if (viewMode === 'reader') closeReader();
      }
      // Cmd/Ctrl + , to open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSimpleAddModal, showSettings, viewMode]);

  if (viewMode === 'reader') {
    return (
      <div className="app-root">
        <header className="topbar">
          <div className="title">Perch</div>
          <div className="spacer" />
          <button type="button" className="btn" onClick={closeReader}>
            ← Back to Library
          </button>
        </header>
        <main className="reader-layout">
          {currentPaper && <PaperReader paper={currentPaper} isOpen={true} onClose={closeReader} />}
        </main>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="app-root">
        <ActivityBar
          currentCategory={selectedCategory}
          onSettingsClick={handleSettingsClick}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={handleSidebarToggle}
        />
        <div className="library-layout">
          <LibrarySidebar
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
            isCollapsed={isSidebarCollapsed}
          />
          <div className="library-main">
            <LibraryControls
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onAddItem={() => setShowSimpleAddModal(true)}
            />
            <div className="library-content">
              {isLoading ? (
                <LoadingSkeleton count={9} />
              ) : results.length === 0 ? (
                <EmptyState
                  category={selectedCategory}
                  onAddItem={() => setShowSimpleAddModal(true)}
                />
              ) : (
                <LibraryGrid
                  papers={results}
                  category={selectedCategory}
                  onPaperSelect={handlePaperClick}
                  onRefresh={() => {
                    // Refresh the papers list
                    const loadPapers = async () => {
                      try {
                        setIsLoading(true);
                        const papers = await window.api.papers.search('*');
                        setResults(papers);
                      } catch (error) {
                        console.error('Failed to load papers:', error);
                      } finally {
                        setIsLoading(false);
                      }
                    };
                    loadPapers();
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <SimpleAddPaper
          isOpen={showSimpleAddModal}
          onClose={() => setShowSimpleAddModal(false)}
          onAdd={handleSimpleAddPaper}
        />

        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

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
