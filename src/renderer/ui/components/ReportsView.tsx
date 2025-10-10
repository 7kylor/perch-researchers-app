import React, { useState } from 'react';
import { ReportBuilder } from './research-hub/ReportBuilder';
import { ReportViewer } from './research-hub/ReportViewer';

export const ReportsView: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string>('');
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
