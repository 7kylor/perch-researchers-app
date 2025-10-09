import type React from 'react';

export const AnalyticsLoadingState: React.FC = () => {
  return (
    <div className="analytics-loading">
      <div className="analytics-loading-header">
        <div className="analytics-loading-skeleton analytics-loading-skeleton-small" />
        <div className="analytics-loading-skeleton-buttons">
          <div className="analytics-loading-skeleton-button" />
          <div className="analytics-loading-skeleton-button" />
        </div>
      </div>

      <div className="analytics-loading-grid">
        <div className="analytics-loading-card" />
        <div className="analytics-loading-card" />
        <div className="analytics-loading-card" />
        <div className="analytics-loading-card" />
        <div className="analytics-loading-card" />
        <div className="analytics-loading-card" />
      </div>

      <div className="analytics-loading-topics" />
    </div>
  );
};
