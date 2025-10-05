import React from 'react';
import { Grid } from './components/Grid';

function useSystemTheme(): 'light' | 'dark' {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return theme;
}

export const App: React.FC = () => {
  const theme = useSystemTheme();
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="title">Researchers</div>
        <div className="spacer" />
        <small className="version" title="App Version">
          v{/* Version fetched at runtime */}
        </small>
      </header>
      <main className="content">
        <section className="panel">
          <h1 className="h1">Welcome</h1>
          <p className="muted">
            Local-first research workspace. Start by adding a URL or dropping a PDF.
          </p>
          <LibraryDemo />
        </section>
        <section className="panel">
          <h2 className="h1">Quick add</h2>
          <QuickAdd />
        </section>
      </main>
    </div>
  );
};

const LibraryDemo: React.FC = () => {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<import('../../shared/types').Paper[]>([]);

  const onSearch = async () => {
    const rows = await window.api.papers.search(q || '*');
    setResults(rows);
  };

  const onAddDemo = async () => {
    const id = await window.api.papers.add({
      title: 'Example Paper',
      authors: ['Doe, J.', 'Smith, A.'],
      venue: 'DemoConf',
      year: 2025,
      doi: '10.0000/demo.1',
      source: 'pdf',
      abstract: 'A minimal example paper to seed the library.',
      status: 'to_read',
      filePath: undefined,
      textHash: 'demo',
    });
    void id;
    await onSearch();
  };

  return (
    <div>
      <div className="grid">
        <input
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input"
        />
        <button className="btn" onClick={onSearch}>
          Search
        </button>
        <button className="btn" onClick={onAddDemo}>
          Add demo
        </button>
      </div>
      <Grid
        items={results.map((p) => ({
          id: p.id,
          title: p.title,
          meta: [p.venue, String(p.year ?? '')].filter(Boolean).join(' • '),
        }))}
      />
    </div>
  );
};

const QuickAdd = React.lazy(() =>
  import('./components/QuickAdd').then((m) => ({ default: m.QuickAdd })),
);
