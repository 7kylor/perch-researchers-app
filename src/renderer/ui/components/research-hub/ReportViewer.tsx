import React from 'react';
import { FileText, Download, Eye } from 'lucide-react';

export const ReportViewer: React.FC<{ content: string }> = ({ content }) => {
  const printPdf = () => {
    window.print();
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={20} className="animate-pulse" />
          <h4 style={{ margin: 0 }}>Report Viewer</h4>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={printPdf} className="btn btn-default">
            <Download size={14} className="animate-bounce" />
            Print to PDF
          </button>
          <button type="button" className="btn btn-default">
            <Eye size={14} className="animate-pulse" />
            Preview
          </button>
        </div>
      </div>
      <div
        style={{
          whiteSpace: 'pre-wrap',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6,
          padding: 12,
          background: 'white',
          minHeight: 400,
          overflow: 'auto',
        }}
      >
        {content || 'No report content to display.'}
      </div>
    </div>
  );
};
