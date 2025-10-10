import React from 'react';
import { RecentList } from './research-hub/RecentList';
import type { Notebook } from './research-hub/RecentList';

export const RecentView: React.FC = () => {
  const handleOpenRecent = async (notebook: Notebook) => {
    if (notebook.type === 'report' && notebook.refId) {
      try {
        const report = await window.api.reports.getReport(notebook.refId);
        if (report?.content) {
          // For now, just log. Could open in a viewer component
          console.log('Open report:', report.title);
        }
      } catch (error) {
        console.error('Failed to load report:', error);
      }
    }
  };

  return (
    <div className="recent-view">
      <div className="recent-container">
        <div className="recent-header">
          <h1>Recent Activity</h1>
          <p className="recent-subtitle">
            Your latest research activities, reports, and discoveries
          </p>
        </div>
        <RecentList onOpen={handleOpenRecent} limit={20} />
      </div>
    </div>
  );
};
