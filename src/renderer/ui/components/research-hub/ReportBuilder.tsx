import React from 'react';
import { FileText, Plus, CheckCircle, Loader2 } from 'lucide-react';

type SectionKey =
  | 'Background and Motivation'
  | 'Methods and Datasets'
  | 'Findings and Evidence (with tables where helpful)'
  | 'Gaps and Future Work'
  | 'Conclusion';

const DEFAULT_SECTIONS: SectionKey[] = [
  'Background and Motivation',
  'Methods and Datasets',
  'Findings and Evidence (with tables where helpful)',
  'Gaps and Future Work',
  'Conclusion',
];

export const ReportBuilder: React.FC = () => {
  const inputId = React.useId();
  const [paperIdsInput, setPaperIdsInput] = React.useState<string>('');
  const [sections, setSections] = React.useState<Record<SectionKey, boolean>>(() => {
    const init: Record<SectionKey, boolean> = {
      'Background and Motivation': true,
      'Methods and Datasets': true,
      'Findings and Evidence (with tables where helpful)': true,
      'Gaps and Future Work': true,
      Conclusion: true,
    };
    return init;
  });
  const [generating, setGenerating] = React.useState<boolean>(false);
  const [content, setContent] = React.useState<string>('');

  const toggleSection = (k: SectionKey) => setSections((s) => ({ ...s, [k]: !s[k] }));

  const generate = async () => {
    const ids = paperIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (ids.length === 0) return;
    const selectedSections = DEFAULT_SECTIONS.filter((k) => sections[k]);
    setGenerating(true);
    try {
      const res = (await window.api.reports.generate(ids, { sections: selectedSections })) as {
        content: string;
      };
      setContent(res.content || '');
    } catch (e) {
      console.error('Report generation failed:', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} className="animate-pulse" />
          <h4 style={{ margin: 0 }}>Report Builder</h4>
        </div>
        <label htmlFor={inputId} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Paper IDs (comma-separated)
        </label>
        <input
          id={inputId}
          type="text"
          value={paperIdsInput}
          onChange={(e) => setPaperIdsInput(e.target.value)}
          placeholder="id1,id2,id3"
          style={{ padding: '6px 8px', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Sections</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {DEFAULT_SECTIONS.map((k) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={!!sections[k]} onChange={() => toggleSection(k)} />
              <span style={{ fontSize: 12 }}>{k}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={generate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Plus size={14} className="animate-pulse" />
              Generate Report
            </>
          )}
        </button>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <CheckCircle size={16} className="animate-bounce" />
          <h4 style={{ margin: 0 }}>Preview</h4>
        </div>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            padding: 12,
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            minHeight: 240,
          }}
        >
          {content || 'No content yet.'}
        </div>
      </div>
    </div>
  );
};
