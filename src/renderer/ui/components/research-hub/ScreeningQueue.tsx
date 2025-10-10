import React from 'react';

type Stage = 'title_abstract' | 'full_text';

export const ScreeningQueue: React.FC = () => {
  const [stage, setStage] = React.useState<Stage>('title_abstract');
  const [items, setItems] = React.useState<Array<{ id: string; title: string }>>([]);
  const [stats, setStats] = React.useState<Record<string, number>>({});

  const loadStats = React.useCallback(async () => {
    const s = (await window.api.screening.stats(stage)) as Record<string, number>;
    setStats(s);
  }, [stage]);

  React.useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const decide = async (paperId: string, decision: 'include' | 'exclude' | 'maybe') => {
    await window.api.screening.decide({ paperId, stage, decision });
    void loadStats();
    setItems((prev) => prev.filter((x) => x.id !== paperId));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setStage('title_abstract')}
            disabled={stage === 'title_abstract'}
          >
            Title/Abstract
          </button>
          <button
            type="button"
            onClick={() => setStage('full_text')}
            disabled={stage === 'full_text'}
          >
            Full Text
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          include: {stats['include'] || 0} • exclude: {stats['exclude'] || 0} • maybe:{' '}
          {stats['maybe'] || 0}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No items in queue.</div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: 8,
            }}
          >
            <div style={{ fontSize: 14 }}>{it.title}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => decide(it.id, 'include')}>
                Include
              </button>
              <button type="button" onClick={() => decide(it.id, 'maybe')}>
                Maybe
              </button>
              <button type="button" onClick={() => decide(it.id, 'exclude')}>
                Exclude
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
