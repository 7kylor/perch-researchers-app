import React from 'react';
import { Inbox, Check, X } from 'lucide-react';

export const AlertInbox: React.FC = () => {
  const [alerts, setAlerts] = React.useState<Array<{ id: string; queryName: string }>>([]);
  const [selectedAlertId, setSelectedAlertId] = React.useState<string>('');
  const [results, setResults] = React.useState<
    Array<{
      id: string;
      paperId: string;
      title: string;
      authors: string[];
      year?: number | null;
      venue?: string | null;
      doi?: string | null;
      read: number;
      discoveredAt: string;
    }>
  >([]);

  React.useEffect(() => {
    void (async () => {
      const items = await window.api.alertsList.list();
      setAlerts(items);
    })();
  }, []);

  const loadResults = async (alertId: string) => {
    const rows = await window.api.alerts.getResults(alertId);
    setResults(rows);
  };

  const markRead = async (id: string, read: boolean) => {
    await window.api.alerts.markRead(id, read);
    if (selectedAlertId) await loadResults(selectedAlertId);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12 }}>
      <div
        style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}
      >
        <div
          style={{
            padding: 8,
            borderBottom: '1px solid var(--border-subtle)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Inbox size={16} className="animate-pulse" />
          Alerts
        </div>
        <div>
          {alerts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setSelectedAlertId(a.id);
                void loadResults(a.id);
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 8,
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              {a.queryName}
            </button>
          ))}
          {alerts.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 8 }}>
              No alerts.
            </div>
          )}
        </div>
      </div>
      <div
        style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}
      >
        <div
          style={{
            padding: 8,
            borderBottom: '1px solid var(--border-subtle)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} className="animate-bounce" />
          Inbox
        </div>
        <div>
          {results.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 8,
                borderBottom: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {r.authors.slice(0, 3).join(', ')}
                  {r.year ? ` • ${r.year}` : ''}
                  {r.venue ? ` • ${r.venue}` : ''}
                  {r.doi ? ` • ${r.doi}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => markRead(r.id, true)} disabled={!!r.read}>
                  <Check size={12} className="animate-pulse" />
                  Mark read
                </button>
                <button type="button" onClick={() => markRead(r.id, false)} disabled={!r.read}>
                  <X size={12} className="animate-bounce" />
                  Mark unread
                </button>
              </div>
            </div>
          ))}
          {selectedAlertId && results.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 8 }}>
              No results yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
