import type React from 'react';
import { MetricCard } from './MetricCard';
import { FileText, Activity, Clock, TrendingUp, Zap } from 'lucide-react';

type MetricsGridProps = {
  metrics: {
    totalPapers: number;
    totalSessions: number;
    avgSessionTime: number;
    weeklySessions: number;
    monthlySessions: number;
    papersRead: number;
  };
};

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="metrics-grid">
      <MetricCard
        icon={FileText}
        label="Total Papers"
        value={metrics.totalPapers}
        iconColor="metric-icon-gray"
        iconBg="metric-bg-gray"
      />

      <MetricCard
        icon={Activity}
        label="Papers Read"
        value={metrics.papersRead}
        iconColor="metric-icon-success"
        iconBg="metric-bg-success"
      />

      <MetricCard
        icon={Clock}
        label="Avg Session"
        value={`${metrics.avgSessionTime}m`}
        iconColor="metric-icon-primary"
        iconBg="metric-bg-primary"
      />

      <MetricCard
        icon={Zap}
        label="Total Sessions"
        value={metrics.totalSessions}
        iconColor="metric-icon-warning"
        iconBg="metric-bg-warning"
      />

      <MetricCard
        icon={TrendingUp}
        label="This Month"
        value={metrics.monthlySessions}
        iconColor="metric-icon-purple"
        iconBg="metric-bg-purple"
      />

      <MetricCard
        icon={TrendingUp}
        label="This Week"
        value={metrics.weeklySessions}
        iconColor="metric-icon-purple"
        iconBg="metric-bg-purple"
      />
    </div>
  );
};
