import React from 'react';
import type { ExtractionTemplate, PaperExtractionRow } from '../../../../shared/types';

type ExtractionPanelProps = {
  selectedPaperIds: ReadonlyArray<string>;
};

export const ExtractionPanel: React.FC<ExtractionPanelProps> = ({ selectedPaperIds }) => {
  const [templates, setTemplates] = React.useState<ExtractionTemplate[]>([]);
  const [templateId, setTemplateId] = React.useState<string>('');
  const [jobId, setJobId] = React.useState<string>('');
  const [progress, setProgress] = React.useState<number>(0);
  const [results, setResults] = React.useState<PaperExtractionRow[]>([]);
  const [isRunning, setIsRunning] = React.useState<boolean>(false);

  React.useEffect(() => {
    void (async () => {
      const tpls = (await window.api.extraction.templates.list()) as ExtractionTemplate[];
      setTemplates(tpls);
      if (tpls.length > 0) setTemplateId(tpls[0]?.id || '');
    })();
  }, []);

  React.useEffect(() => {
    if (!jobId) return;
    const handle = setInterval(async () => {
      const status = (await window.api.extraction.jobStatus(jobId)) as {
        status: string;
        progress: number;
      } | null;
      if (status) setProgress(status.progress);
    }, 500);
    return () => clearInterval(handle);
  }, [jobId]);

  const runExtraction = async () => {
    if (!templateId || selectedPaperIds.length === 0) return;
    setIsRunning(true);
    const jid = `job-${Date.now().toString(36)}`;
    setJobId(jid);
    try {
      await window.api.extraction.batch(jid, [...selectedPaperIds], templateId);
      const data = (await window.api.extraction.getResults({
        templateId,
        paperIds: [...selectedPaperIds],
      })) as PaperExtractionRow[];
      setResults(data);
    } catch (e) {
      console.error('Extraction failed:', e);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={{ padding: '6px 8px', border: '1px solid var(--border-subtle)', borderRadius: 6 }}
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isRunning || selectedPaperIds.length === 0}
          onClick={runExtraction}
        >
          {isRunning ? `Running… ${progress}%` : 'Run Extraction'}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {results.length} rows extracted
        </div>
      )}
    </div>
  );
};
