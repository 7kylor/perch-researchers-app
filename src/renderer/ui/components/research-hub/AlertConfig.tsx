import React from 'react';
import { Bell, Plus, Settings, Play, Trash2 } from 'lucide-react';

type Frequency = 'daily' | 'weekly' | 'monthly';

export const AlertConfig: React.FC = () => {
  const [queries, setQueries] = React.useState<Array<{ id: string; name: string }>>([]);
  const [alerts, setAlerts] = React.useState<
    Array<{
      id: string;
      queryId: string;
      queryName: string;
      frequency: Frequency;
      enabled: number;
      lastChecked?: string | null;
    }>
  >([]);
  const [selectedQueryId, setSelectedQueryId] = React.useState<string>('');
  const [frequency, setFrequency] = React.useState<Frequency>('weekly');
  const [enabled, setEnabled] = React.useState<boolean>(true);

  const loadData = React.useCallback(async () => {
    const qs = await window.api.search.listQueries();
    setQueries(qs);
    const as = await window.api.alertsList.list();
    setAlerts(as);
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const createAlert = async () => {
    if (!selectedQueryId) return;
    await window.api.alerts.create({ queryId: selectedQueryId, frequency, enabled });
    setSelectedQueryId('');
    await loadData();
  };

  const toggleEnabled = async (id: string, current: boolean) => {
    await window.api.alerts.update(id, { enabled: !current });
    await loadData();
  };

  const remove = async (id: string) => {
    await window.api.alerts.delete(id);
    await loadData();
  };

  const runNow = async (id: string) => {
    await window.api.alerts.runNow(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bell size={20} className="animate-pulse" />
        <h4 style={{ margin: 0 }}>Create Alert</h4>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 140px 100px auto',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <select
          value={selectedQueryId}
          onChange={(e) => setSelectedQueryId(e.target.value)}
          style={{ padding: '6px 8px', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
        >
          <option value="">Select saved search…</option>
          {queries.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </select>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          style={{ padding: '6px 8px', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span style={{ fontSize: 12 }}>Enabled</span>
        </label>
        <button type="button" onClick={createAlert} disabled={!selectedQueryId}>
          <Plus size={14} className="animate-pulse" />
          Create
        </button>
      </div>

      <h4 style={{ margin: 0 }}>Alerts</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.map((a) => (
          <div
            key={a.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 120px auto',
              gap: 8,
              alignItems: 'center',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 14 }}>{a.queryName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Last checked: {a.lastChecked || '—'}
              </div>
            </div>
            <div style={{ fontSize: 12 }}>{a.frequency}</div>
            <div style={{ fontSize: 12 }}>{a.enabled ? 'Enabled' : 'Disabled'}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => toggleEnabled(a.id, !!a.enabled)}>
                <Settings size={12} className="animate-spin" />
                {a.enabled ? 'Disable' : 'Enable'}
              </button>
              <button type="button" onClick={() => runNow(a.id)}>
                <Play size={12} className="animate-pulse" />
                Run now
              </button>
              <button type="button" onClick={() => remove(a.id)}>
                <Trash2 size={12} className="animate-bounce" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No alerts yet.</div>
        )}
      </div>
    </div>
  );
};
