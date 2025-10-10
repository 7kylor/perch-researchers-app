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
      <div className="reports-layout">
        {/* Left Sidebar - Recent Reports */}
        <aside className="reports-sidebar">
          <div className="sidebar-header">
            <h2>Recent Reports</h2>
          </div>
          <RecentList onOpen={handleOpenReport} limit={10} />
        </aside>

        {/* Main Content */}
        <main className="reports-main">
          {selectedReport ? <ReportViewer content={reportContent} /> : <ReportBuilder />}
        </main>
      </div>
    </div>
  );
};
