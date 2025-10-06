import React from 'react';
import { Sidebar as NewSidebar } from './components/sidebar/Sidebar';
import { ActivityBar } from './components/ActivityBar';
import { LibraryControls } from './components/LibraryControls';
import { LibraryGrid } from './components/LibraryGrid';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { SimpleAddPaper } from './components/SimpleAddPaper';
import { Toast } from './components/Toast';
import { SettingsPanel } from './components/SettingsPanel';
import { ThemeProvider } from './components/ThemeProvider';
import { useSidebarStore } from './sidebar/store';

export const App: React.FC = () => {
  const [results, setResults] = React.useState<import('../../shared/types').Paper[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState('builtin:all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSimpleAddModal, setShowSimpleAddModal] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  const { prefs, actions } = useSidebarStore();
  const [toast, setToast] = React.useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const openPaper = React.useCallback(async (id: string) => {
    const paper = await window.api.papers.get(id);
    if (paper) {
      // Always open in separate PDF reader window
      try {
        await window.api['pdf-reader']['create-window'](paper);
      } catch (error) {
        console.error('Failed to open PDF reader window:', error);
        setToast({ message: 'Failed to open PDF reader', type: 'error' });
      }
    }
  }, []);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSidebarToggle = () => {
    actions.setSidebarCollapsed(!prefs.sidebarCollapsed);
  };

  const handlePaperClick = (paperId: string) => {
    openPaper(paperId);
  };

  const handleSimpleAddPaper = async (input: string, type: 'url' | 'pdf') => {
    try {
      let paperId: string;

      if (type === 'pdf') {
        // Handle local PDF file upload
        const result = await window.api.pdf['import-from-file'](input.trim());
        paperId = await window.api.papers.add(result.paper);
        setToast({ message: 'PDF uploaded successfully!', type: 'success' });
      } else {
        // Handle URL input - could be DOI, ArXiv ID, or PDF URL
        if (input.startsWith('10.') || input.includes('doi.org')) {
          // It's a DOI
          paperId = await window.api.ingest.doi(input);
          setToast({ message: 'Paper imported from DOI successfully!', type: 'success' });
        } else if (input.includes('arxiv.org') || /^\d+\.\d+$/.test(input.trim())) {
          // It's an ArXiv ID or similar
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
        } else if (input.includes('.pdf') || input.startsWith('http')) {
          // It's a PDF URL - try to import it directly
          try {
            const result = await window.api.pdf['import-from-url'](input.trim());
            paperId = await window.api.papers.add(result.paper);
            setToast({ message: 'PDF downloaded and imported successfully!', type: 'success' });
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
          }
        } else {
          // Regular URL
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
      const papers = await window.api.papers.search(searchQuery);
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
      const papers = await window.api.papers.search(query);
      setResults(papers);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load papers on selected category change
  React.useEffect(() => {
    const loadByCategory = async () => {
      try {
        setIsLoading(true);
        const papers = await window.api.papers.listByCategory(selectedCategory, 50);
        setResults(papers);
      } catch (error) {
        console.error('Failed to load papers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadByCategory();
  }, [selectedCategory]);

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
          isSidebarCollapsed={prefs.sidebarCollapsed}
          onSidebarToggle={handleSidebarToggle}
        />
        <div className={`library-layout ${prefs.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <NewSidebar selectedId={selectedCategory} onSelect={setSelectedCategory} />
          <div className={`library-main ${prefs.sidebarCollapsed ? 'expanded' : ''}`}>
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
                        const papers = await window.api.papers.search('');
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
