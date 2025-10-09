import React from 'react';
import { MetricsGrid } from './MetricsGrid';
import { AnalyticsHeader } from './AnalyticsHeader';
import { TopicsCloud } from './TopicsCloud';
import { AnalyticsLoadingState } from './AnalyticsLoadingState';

type Timeframe = 'week' | 'month' | 'year';

type AnalyticsMetrics = {
  totalPapers: number;
  totalSessions: number;
  avgSessionTime: number;
  weeklySessions: number;
  monthlySessions: number;
  papersRead: number;
  topics: ReadonlyArray<{ name: string; count: number; relevance?: number }>;
};

export const AnalyticsSection: React.FC = () => {
  const [timeframe, setTimeframe] = React.useState<Timeframe>('month');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [metrics, setMetrics] = React.useState<AnalyticsMetrics | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await window.api.analytics.getMetrics();
        if (!mounted) return;
        setMetrics(data as AnalyticsMetrics);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load analytics', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const exportAnalytics = async (format: 'json' | 'csv') => {
    try {
      const data: string = await window.api.analytics.export(format);
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-analytics-${timeframe}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export analytics:', error);
    }
  };

  if (isLoading) {
    return <AnalyticsLoadingState />;
  }

  if (!metrics) {
    return (
      <div className="analytics-no-data">
        <p className="analytics-no-data-text">No analytics data available</p>
      </div>
    );
  }

  return (
    <section className="analytics-section">
      <AnalyticsHeader
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onExport={exportAnalytics}
      />

      <MetricsGrid metrics={metrics} />

      {metrics.topics.length > 0 && <TopicsCloud topics={metrics.topics} />}
    </section>
  );
};
