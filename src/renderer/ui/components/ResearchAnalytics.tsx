import React from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  BookOpen,
  Calendar,
  Award,
  Download,
  BarChart3,
  Lightbulb,
  Timer,
  Zap,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ResearchMetrics {
  totalPapers: number;
  papersRead: number;
  papersInProgress: number;
  totalReadingTime: number;
  averageSessionTime: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  readingStreak: number;
  favoriteTopics: string[];
  readingVelocity: number;
  annotationRate: number;
  completionRate: number;
}

interface TopicAnalysis {
  topic: string;
  paperCount: number;
  totalReadingTime: number;
  averageEngagement: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface ProductivityInsights {
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  progressToGoal: number;
  recommendedFocusAreas: string[];
  suggestedBreakTime: number;
  optimalReadingTimes: number[];
}

export const ResearchAnalytics: React.FC = () => {
  const [metrics, setMetrics] = React.useState<ResearchMetrics | null>(null);
  const [topicAnalysis, setTopicAnalysis] = React.useState<TopicAnalysis[]>([]);
  const [insights, setInsights] = React.useState<ProductivityInsights | null>(null);
  const [readingHistory, setReadingHistory] = React.useState<
    ReadonlyArray<{
      readonly date: string;
      readonly papersRead: number;
      readonly timeSpent: number;
      readonly annotations: number;
    }>
  >([]);
  const [timeframe, setTimeframe] = React.useState<'week' | 'month' | 'year'>('month');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [metricsData, topicData, insightsData, historyData] = await Promise.all([
        window.api.analytics.getMetrics(),
        window.api.analytics.getTopicAnalysis(),
        window.api.analytics.getProductivityInsights(),
        window.api.analytics.getReadingHistory(timeframe),
      ]);

      setMetrics(metricsData);
      setTopicAnalysis(topicData);
      setInsights(insightsData);
      setReadingHistory(historyData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = async (format: 'json' | 'csv') => {
    try {
      const data = await window.api.analytics.export(format);
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
      console.error('Failed to export analytics:', error);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp size={16} className="trend-increasing" />;
      case 'decreasing':
        return <TrendingUp size={16} className="trend-decreasing" />;
      default:
        return <div className="trend-stable">→</div>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'trend-increasing';
      case 'decreasing':
        return 'trend-decreasing';
      default:
        return 'trend-stable';
    }
  };

  if (isLoading) {
    return (
      <div className="research-analytics loading">
        <div className="analytics-loading">Loading research insights...</div>
      </div>
    );
  }

  if (!metrics || !insights) {
    return (
      <div className="research-analytics empty">
        <div className="empty-state">
          <BarChart3 size={48} />
          <p>Start reading papers to see your research analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="research-analytics">
      <div className="analytics-header">
        <h2>Research Analytics</h2>
        <div className="analytics-controls">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="timeframe-selector"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button type="button" onClick={() => exportAnalytics('json')} className="export-btn">
            <Download size={16} />
            Export JSON
          </button>
          <button type="button" onClick={() => exportAnalytics('csv')} className="export-btn">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="analytics-section">
        <h3>Overview</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">
              <BookOpen size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.totalPapers}</div>
              <div className="metric-label">Total Papers</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <CheckCircle size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.papersRead}</div>
              <div className="metric-label">Papers Read</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{formatTime(metrics.totalReadingTime)}</div>
              <div className="metric-label">Total Reading Time</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Award size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.readingStreak}</div>
              <div className="metric-label">Current Streak</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Target size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.readingVelocity.toFixed(1)}</div>
              <div className="metric-label">Papers/Week</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <TrendingUp size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{metrics.completionRate.toFixed(0)}%</div>
              <div className="metric-label">Completion Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="analytics-section">
        <h3>Productivity Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <Zap size={20} />
            </div>
            <div className="insight-content">
              <div className="insight-title">Weekly Progress</div>
              <div className="insight-value">{insights.progressToGoal.toFixed(0)}%</div>
              <div className="insight-description">
                {insights.progressToGoal >= 100
                  ? 'Goal achieved!'
                  : `${insights.weeklyGoal - Math.floor(metrics.readingVelocity)} papers to go`}
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Timer size={20} />
            </div>
            <div className="insight-content">
              <div className="insight-title">Optimal Reading Time</div>
              <div className="insight-value">
                {insights.optimalReadingTimes.map((hour) => `${hour}:00`).join(', ')}
              </div>
              <div className="insight-description">When you&apos;re most productive</div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Lightbulb size={20} />
            </div>
            <div className="insight-content">
              <div className="insight-title">Suggested Break</div>
              <div className="insight-value">{insights.suggestedBreakTime} min</div>
              <div className="insight-description">After long sessions</div>
            </div>
          </div>

          {insights.recommendedFocusAreas.length > 0 && (
            <div className="insight-card">
              <div className="insight-icon">
                <Target size={20} />
              </div>
              <div className="insight-content">
                <div className="insight-title">Recommended Topics</div>
                <div className="insight-value">{insights.recommendedFocusAreas.join(', ')}</div>
                <div className="insight-description">Trending research areas</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topic Analysis */}
      <div className="analytics-section">
        <h3>Topic Analysis</h3>
        {topicAnalysis.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <p>Read more papers to see topic analysis</p>
          </div>
        ) : (
          <div className="topics-grid">
            {topicAnalysis.map((topic) => (
              <div key={topic.topic} className="topic-card">
                <div className="topic-header">
                  <h4>{topic.topic}</h4>
                  {getTrendIcon(topic.trend)}
                </div>
                <div className="topic-stats">
                  <div className="topic-stat">
                    <span className="stat-label">Papers</span>
                    <span className="stat-value">{topic.paperCount}</span>
                  </div>
                  <div className="topic-stat">
                    <span className="stat-label">Avg. Engagement</span>
                    <span className="stat-value">{formatTime(topic.averageEngagement)}</span>
                  </div>
                </div>
                <div className={`topic-trend ${getTrendColor(topic.trend)}`}>
                  {topic.trend === 'increasing' && '📈 Increasing'}
                  {topic.trend === 'decreasing' && '📉 Decreasing'}
                  {topic.trend === 'stable' && '➡️ Stable'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reading History Chart (simplified visualization) */}
      <div className="analytics-section">
        <h3>Reading Activity ({timeframe})</h3>
        {readingHistory.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>No reading activity in this timeframe</p>
          </div>
        ) : (
          <div className="reading-history">
            {readingHistory.slice(-14).map((day) => (
              <div key={day.date} className="history-day">
                <div className="day-label">{formatDate(day.date)}</div>
                <div className="day-bars">
                  <div
                    className="papers-bar"
                    style={{ height: `${Math.min((day.papersRead / 5) * 100, 100)}%` }}
                    title={`${day.papersRead} papers`}
                  ></div>
                  <div
                    className="time-bar"
                    style={{ height: `${Math.min((day.timeSpent / 120) * 100, 100)}%` }}
                    title={`${formatTime(day.timeSpent)} reading time`}
                  ></div>
                  <div
                    className="annotations-bar"
                    style={{ height: `${Math.min((day.annotations / 10) * 100, 100)}%` }}
                    title={`${day.annotations} annotations`}
                  ></div>
                </div>
                <div className="day-legend">
                  <span>Papers</span>
                  <span>Time</span>
                  <span>Notes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="analytics-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button
            type="button"
            className="action-btn"
            onClick={() => window.api.analytics.trackSession('demo', 'start')}
          >
            <Timer size={16} />
            Start Reading Session
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => window.api.analytics.trackSession('demo', 'end')}
          >
            <CheckCircle size={16} />
            End Reading Session
          </button>
        </div>
      </div>
    </div>
  );
};
