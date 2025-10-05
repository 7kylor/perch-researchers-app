import React from 'react';

export const QuickAdd: React.FC = () => {
  const [value, setValue] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    try {
      if (value.startsWith('10.')) {
        await window.api.ingest.doi(value);
      } else {
        await window.api.papers.add({
          title: value,
          authors: [],
          venue: undefined,
          year: undefined,
          doi: undefined,
          source: 'url',
          abstract: undefined,
          status: 'to_read',
          filePath: undefined,
          textHash: value,
        });
      }
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      await window.api.ingest.pdf(f.path);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <input
        className="input"
        placeholder="Paste URL or DOI, or drop PDF"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn primary" disabled={busy}>
        {busy ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
};
