import React from 'react';
import type {
  ExtractionColumn,
  PaperExtractionRow,
  ExtractedCellValue,
} from '../../../../shared/types';

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

export type DataTableProps = {
  columns: ReadonlyArray<ExtractionColumn>;
  rows: ReadonlyArray<PaperExtractionRow>;
  onExportCsv?: () => void;
};

function compareValues(a: ExtractedCellValue, b: ExtractedCellValue): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? -1 : 1;
  return String(a).localeCompare(String(b));
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows, onExportCsv }) => {
  const [sort, setSort] = React.useState<SortState>(null);
  const [filter, setFilter] = React.useState<string>('');

  const sortedRows = React.useMemo(() => {
    let out = [...rows];
    if (filter.trim().length > 0) {
      const f = filter.toLowerCase();
      out = out.filter((r) =>
        Object.values(r.values).some((v) =>
          v !== null ? String(v).toLowerCase().includes(f) : false,
        ),
      );
    }
    if (sort) {
      out.sort((a, b) => {
        const av = a.values[sort.columnId];
        const bv = b.values[sort.columnId];
        const cmp = compareValues(av ?? null, bv ?? null);
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, sort, filter]);

  const toggleSort = (columnId: string) => {
    setSort((prev) => {
      if (!prev || prev.columnId !== columnId) return { columnId, direction: 'asc' };
      if (prev.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  const handleExport = () => {
    if (onExportCsv) onExportCsv();
    else {
      const header = ['paperId', ...columns.map((c) => c.name)].join(',');
      const lines = sortedRows.map((r) => {
        const cells = columns.map((c) => {
          const v = r.values[c.id];
          const s = v === null || v === undefined ? '' : String(v);
          return '"' + s.replace(/"/g, '""') + '"';
        });
        return [r.paperId, ...cells].join(',');
      });
      const csv = [header, ...lines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extractions.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="data-table">
      <div className="data-table-toolbar" style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
          }}
        />
        <button type="button" onClick={handleExport} className="btn btn-default">
          Export CSV
        </button>
      </div>
      <div
        className="data-table-container"
        style={{ overflow: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 8 }}
      >
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: 8,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Paper
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  onClick={() => toggleSort(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: 8,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                  }}
                  title={`${c.name} (${c.type})`}
                >
                  {c.name}
                  {sort?.columnId === c.id ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 8, borderBottom: '1px solid var(--border-subtle)' }}>
                  {r.paperId}
                </td>
                {columns.map((c) => (
                  <td
                    key={`${r.id}-${c.id}`}
                    style={{ padding: 8, borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    {r.values[c.id] === null || r.values[c.id] === undefined
                      ? ''
                      : String(r.values[c.id])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
