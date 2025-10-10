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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <RecentList onOpen={handleOpenRecent} limit={20} />
      </div>
    </div>
  );
};
