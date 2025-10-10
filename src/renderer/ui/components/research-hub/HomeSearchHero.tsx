import React from 'react';
import { FileText, Search, Brain, Activity } from 'lucide-react';

export type Mode = 'report' | 'systematic';
export type Corpus = 'papers' | 'trials';

export const HomeSearchHero: React.FC<{
  onSearch: (params: { query: string; mode: Mode; corpus: Corpus }) => Promise<void> | void;
}> = ({ onSearch }) => {
  const [mode, setMode] = React.useState<Mode>(
    () => (localStorage.getItem('hero:mode') as Mode) || 'report',
  );
  const [corpus, setCorpus] = React.useState<Corpus>(
    () => (localStorage.getItem('hero:corpus') as Corpus) || 'papers',
  );
  const [query, setQuery] = React.useState<string>('');
  const [busy, setBusy] = React.useState<boolean>(false);

  React.useEffect(() => {
    localStorage.setItem('hero:mode', mode);
  }, [mode]);
  React.useEffect(() => {
    localStorage.setItem('hero:corpus', corpus);
  }, [corpus]);

  const run = async () => {
    if (!query.trim()) return;
    setBusy(true);
    try {
      await onSearch({ query: query.trim(), mode, corpus });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setMode('report')}
          className={mode === 'report' ? 'hub-tab hub-tab-active' : 'hub-tab'}
        >
          <FileText size={14} className="animate-pulse" />
          Research report
        </button>
        <button
          type="button"
          onClick={() => setMode('systematic')}
          className={mode === 'systematic' ? 'hub-tab hub-tab-active' : 'hub-tab'}
        >
          <Brain size={14} className="animate-spin" />
          Systematic review
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            className="search-icon animate-bounce"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
          <input
            type="text"
            placeholder="Ask a research question to search and explore academic literature"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            className="search-input"
            style={{ paddingLeft: 40 }}
          />
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy || !query.trim()}
          className="search-button"
        >
          <Activity size={14} className="animate-pulse" />
          {busy ? 'Searching…' : 'Find papers'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
        <span>Searching:</span>
        <button
          type="button"
          onClick={() => setCorpus('papers')}
          className={corpus === 'papers' ? 'hub-tab hub-tab-active' : 'hub-tab'}
        >
          <FileText size={12} className="animate-pulse" />
          Research papers
        </button>
        <button
          type="button"
          onClick={() => setCorpus('trials')}
          className={corpus === 'trials' ? 'hub-tab hub-tab-active' : 'hub-tab'}
        >
          <Brain size={12} className="animate-spin" />
          Clinical trials
        </button>
      </div>
    </div>
  );
};
