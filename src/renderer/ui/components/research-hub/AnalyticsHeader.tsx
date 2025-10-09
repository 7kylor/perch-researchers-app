import type React from 'react';
import { Download } from 'lucide-react';

type Timeframe = 'week' | 'month' | 'year';

type AnalyticsHeaderProps = {
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onExport: (format: 'json' | 'csv') => void;
};

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  timeframe,
  onTimeframeChange,
  onExport,
}) => {
  return (
    <div className="analytics-header">
      <select
        value={timeframe}
        onChange={(e) => onTimeframeChange(e.target.value as Timeframe)}
        className="analytics-timeframe-select"
        aria-label="Select timeframe"
      >
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
      </select>

      <div className="analytics-export-buttons">
        <button
          type="button"
          onClick={() => void onExport('json')}
          className="analytics-export-button"
        >
          <Download />
          JSON
        </button>
        <button
          type="button"
          onClick={() => void onExport('csv')}
          className="analytics-export-button"
        >
          <Download />
          CSV
        </button>
      </div>
    </div>
  );
};
