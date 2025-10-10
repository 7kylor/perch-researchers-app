import React from 'react';
import { ReportBuilder } from './research-hub/ReportBuilder';
import { ReportViewer } from './research-hub/ReportViewer';

type ReportsViewProps = {
  onOpenReport?: (reportId: string) => void;
};

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenReport }) => {
  const [selectedReport, setSelectedReport] = React.useState<string | null>(null);
  const [reportContent, setReportContent] = React.useState<string>('');

  return (
    <div className="reports-view">
      <div className="reports-layout">
        {/* Left Sidebar - Recent Reports */}
        <aside className="reports-sidebar">
          <div className="sidebar-header">
            <h2>Recent Reports</h2>
          </div>
        </aside>

        {/* Main Content */}
        <main className="reports-main">
          {selectedReport ? <ReportViewer content={reportContent} /> : <ReportBuilder />}
        </main>
      </div>
    </div>
  );
};
