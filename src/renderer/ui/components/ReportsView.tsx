import React from 'react';
import { ReportBuilder } from './research-hub/ReportBuilder';
import { ReportViewer } from './research-hub/ReportViewer';
import { RecentList } from './research-hub/RecentList';
import type { Notebook } from './research-hub/RecentList';

type ReportsViewProps = {
  onOpenReport?: (reportId: string) => void;
};

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenReport }) => {
  const [selectedReport, setSelectedReport] = React.useState<string | null>(null);
  const [reportContent, setReportContent] = React.useState<string>('');

  const handleOpenReport = async (notebook: Notebook) => {
    if (notebook.type === 'report' && notebook.refId) {
      try {
        const report = await window.api.reports.getReport(notebook.refId);
        if (report?.content) {
          setSelectedReport(notebook.refId);
          setReportContent(report.content);
          onOpenReport?.(notebook.refId);
        }
      } catch (error) {
        console.error('Failed to load report:', error);
      }
    }
  };

  return (
    <div className="reports-view">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Left Sidebar - Recent Reports */}
        <div>
          <RecentList
            onOpen={handleOpenReport}
            limit={10}
          />
        </div>

        {/* Main Content */}
        <div>
          {selectedReport ? (
            <ReportViewer content={reportContent} />
          ) : (
            <ReportBuilder />
          )}
        </div>
      </div>
    </div>
  );
};
