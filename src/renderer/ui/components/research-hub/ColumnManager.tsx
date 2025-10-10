import React from 'react';
import type { ExtractionColumn, ExtractionColumnType } from '../../../../shared/types';

export type ColumnManagerProps = {
  columns: ReadonlyArray<ExtractionColumn>;
  onChange: (cols: ReadonlyArray<ExtractionColumn>) => void;
};

const TYPES: ExtractionColumnType[] = ['text', 'number', 'boolean', 'date', 'categorical'];

export const ColumnManager: React.FC<ColumnManagerProps> = ({ columns, onChange }) => {
  const [local, setLocal] = React.useState<ExtractionColumn[]>([...columns]);

  React.useEffect(() => setLocal([...columns]), [columns]);

  const addColumn = () => {
    const now = Date.now().toString(36);
    const col: ExtractionColumn = {
      id: `col-${now}`,
      name: 'New Column',
      type: 'text',
      prompt: '',
    };
    const next = [...local, col];
    setLocal(next);
    onChange(next as ReadonlyArray<ExtractionColumn>);
  };

  const removeColumn = (id: string) => {
    const next = local.filter((c) => c.id !== id);
    setLocal(next);
    onChange(next as ReadonlyArray<ExtractionColumn>);
  };

  const update = (id: string, patch: Partial<ExtractionColumn>) => {
    const next = local.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setLocal(next);
    onChange(next as ReadonlyArray<ExtractionColumn>);
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = local.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= local.length) return;
    const next = [...local];
    const [item] = next.splice(idx, 1);
    if (item) {
      next.splice(j, 0, item);
      setLocal(next);
      onChange(next as ReadonlyArray<ExtractionColumn>);
    }
  };

  return (
    <div className="column-manager" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Columns</h4>
        <button type="button" onClick={addColumn} className="btn btn-default">
          Add Column
        </button>
      </div>
      {local.map((c, i) => (
        <div
          key={c.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 1fr auto',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={c.name}
            onChange={(e) => update(c.id, { name: e.target.value })}
            placeholder="Column name"
            style={{
              padding: '6px 8px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
            }}
          />
          <select
            value={c.type}
            onChange={(e) => update(c.id, { type: e.target.value as ExtractionColumnType })}
            style={{
              padding: '6px 8px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
            }}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={c.prompt}
            onChange={(e) => update(c.id, { prompt: e.target.value })}
            placeholder="Extraction instruction"
            style={{
              padding: '6px 8px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => move(c.id, -1)} disabled={i === 0}>
              ↑
            </button>
            <button type="button" onClick={() => move(c.id, 1)} disabled={i === local.length - 1}>
              ↓
            </button>
            <button type="button" onClick={() => removeColumn(c.id)}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
