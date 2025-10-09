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
        iconColor="#64748b"
        iconBg="#f1f5f9"
      />

      <MetricCard
        icon={Activity}
        label="Papers Read"
        value={metrics.papersRead}
        iconColor="#059669"
        iconBg="#d1fae5"
      />

      <MetricCard
        icon={Clock}
        label="Avg Session"
        value={`${metrics.avgSessionTime}m`}
        iconColor="#2563eb"
        iconBg="#dbeafe"
      />

      <MetricCard
        icon={Zap}
        label="Total Sessions"
        value={metrics.totalSessions}
        iconColor="#d97706"
        iconBg="#fef3c7"
      />

      <MetricCard
        icon={TrendingUp}
        label="This Month"
        value={metrics.monthlySessions}
        iconColor="#4f46e5"
        iconBg="#e0e7ff"
      />

      <MetricCard
        icon={TrendingUp}
        label="This Week"
        value={metrics.weeklySessions}
        iconColor="#9333ea"
        iconBg="#f3e8ff"
      />
    </div>
  );
};
