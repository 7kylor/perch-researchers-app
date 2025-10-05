import React from 'react';
import { PdfReader } from './components/PdfReader';
import { Sidebar } from './components/Sidebar';
import { NotesPanel } from './components/NotesPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { LibrarySidebar } from './components/LibrarySidebar';
import { LibraryHeader } from './components/LibraryHeader';
import { LibraryGrid } from './components/LibraryGrid';

function useSystemTheme(): 'light' | 'dark' {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return theme;
}

type Annotation = {
  id: string;
  paperId: string;
  page: number;
  color: string;
  note?: string;
  tags: string[];
  anchors: { region?: { page: number; x: number; y: number; width: number; height: number } };
  createdAt: string;
};

export const App: React.FC = () => {
  const theme = useSystemTheme();
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const [results, setResults] = React.useState<import('../../shared/types').Paper[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = React.useState<string | undefined>();
  const [currentPaper, setCurrentPaper] = React.useState<import('../../shared/types').Paper | null>(
    null,
  );
  const [showSettings, setShowSettings] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('ai-models');
  const [viewMode, setViewMode] = React.useState<'library' | 'reader'>('library');

  const openPaper = async (id: string) => {
    const paper = await window.api.papers.get(id);
    if (paper) {
      setCurrentPaper(paper);
      setOpenId(id);
      setViewMode('reader');
      const anns = await window.api.annotations.getByPaper(id);
      setAnnotations(anns);
    }
  };

  const handleAddItem = () => {
    // TODO: Implement add item functionality
    console.log('Add item clicked');
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log('Search clicked');
  };

  const handleToggleView = () => {
    // TODO: Implement view toggle functionality
    console.log('Toggle view clicked');
  };

  // Load papers on mount
  React.useEffect(() => {
    const loadPapers = async () => {
      try {
        const papers = await window.api.papers.search('*');
        setResults(papers);
      } catch (error) {
        console.error('Failed to load papers:', error);
      }
    };
    loadPapers();
  }, []);

  const handleAnnotationSelect = (annotation: Annotation) => {
    setSelectedAnnotationId(annotation.id);
  };

  const handleAnnotationUpdate = async (
    id: string,
    updates: Partial<{ color: string; note?: string; tags: string[] }>,
  ) => {
    await window.api.annotations.update(id, updates);
    const updatedAnns = await window.api.annotations.getByPaper(openId!);
    setAnnotations(updatedAnns);
  };

  const handleAnnotationDelete = async (id: string) => {
    await window.api.annotations.delete(id);
    const updatedAnns = await window.api.annotations.getByPaper(openId!);
    setAnnotations(updatedAnns);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(undefined);
    }
  };

  if (viewMode === 'reader') {
    return (
      <div className="app-root">
        <header className="topbar">
          <div className="title">Researchers</div>
          <div className="spacer" />
          <button type="button" className="btn" onClick={() => setViewMode('library')}>
            ← Back to Library
          </button>
          <button type="button" className="btn" onClick={() => setShowSettings(true)}>
            ⚙️ Settings
          </button>
          <small className="version" title="App Version">
            v{/* Version fetched at runtime */}
          </small>
        </header>
        <main className="app-layout">
          <section className="pdf-viewer">
            <div className="pdf-header">
              <h2 className="h1">{currentPaper?.title || 'No paper selected'}</h2>
              <button type="button" className="btn" onClick={() => setOpenId(null)}>
                Close
              </button>
            </div>
            <div className="pdf-content">
              {currentPaper?.filePath ? (
                <PdfReader filePath={currentPaper.filePath} paperId={currentPaper.id} />
              ) : (
                <div className="muted">Select a paper to view</div>
              )}
            </div>
          </section>

          <Sidebar
            paperId={openId || ''}
            annotations={annotations}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationDelete={handleAnnotationDelete}
            onAnnotationUpdate={handleAnnotationUpdate}
            selectedAnnotationId={selectedAnnotationId}
          />

          <NotesPanel
            paperId={openId || ''}
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
          />
        </main>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="library-layout">
        <LibrarySidebar
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        <div className="library-main">
          <LibraryHeader
            currentCategory={selectedCategory}
            onAddItem={handleAddItem}
            onSearch={handleSearch}
            onToggleView={handleToggleView}
          />
          <div className="library-content">
            <LibraryGrid papers={results} category={selectedCategory} onPaperSelect={openPaper} />
          </div>
        </div>
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
};
