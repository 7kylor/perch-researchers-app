import React from 'react';

type Notebook = {
  id: string;
  type: 'report' | 'extraction' | 'search';
  title: string;
  refId?: string | null;
  createdAt: string;
};

export const RecentList: React.FC<{
  onOpen: (n: Notebook) => void;
  limit?: number;
}> = ({ onOpen, limit = 10 }) => {
  const [items, setItems] = React.useState<Notebook[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = (await window.api.notebooks.list(limit)) as Notebook[];
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h4 style={{ margin: 0 }}>Recent</h4>
      {loading && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading…</div>}
      {items.map((n) => (
        <div
          key={n.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            padding: 8,
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {n.type} •{' '}
              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div>
            <button type="button" onClick={() => onOpen(n)}>
              Open
            </button>
          </div>
        </div>
      ))}
      {!loading && items.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No recent items.</div>
      )}
    </div>
  );
};
