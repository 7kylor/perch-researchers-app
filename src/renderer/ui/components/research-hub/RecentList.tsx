import React from 'react';
import { BookOpen } from 'lucide-react';

export type Notebook = {
  id: string;
  type: 'report' | 'extraction' | 'search';
  title: string;
  refId?: string | null;
  createdAt: string;
};

export const RecentList: React.FC<{
  onOpen: (n: Notebook) => void;
  onViewAll?: () => void;
  limit?: number;
  showViewAll?: boolean;
}> = ({ onOpen, onViewAll, limit = 10, showViewAll = true }) => {
  const [items, setItems] = React.useState<Notebook[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = (await window.api.notebooks.list(limit)) as Notebook[];
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="recent-list">
      <div className="recent-list-header">
        <h2>Recent</h2>
      </div>

      <div className="recent-list-items">
        {loading && (
          <div className="recent-loading">
            <div className="loading-text">Loading...</div>
          </div>
        )}

        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="recent-item"
            onClick={() => onOpen(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(item);
              }
            }}
          >
            <div className="recent-item-icon">
              <BookOpen size={16} />
            </div>
            <div className="recent-item-content">
              <div className="recent-item-title">{item.title}</div>
              <div className="recent-item-meta">
                <span className="recent-item-type">{item.type}</span>
                <span className="recent-item-separator">•</span>
                <span className="recent-item-time">{formatDate(item.createdAt)}</span>
              </div>
            </div>
            <div className="recent-item-arrow">
              <span>⋯</span>
            </div>
          </button>
        ))}

        {!loading && items.length === 0 && (
          <div className="recent-empty">
            <div className="empty-text">No recent items.</div>
          </div>
        )}
      </div>

      {showViewAll && !loading && items.length > 0 && (
        <div className="recent-view-all">
          <button type="button" className="view-all-button" onClick={onViewAll}>
            View all
          </button>
        </div>
      )}
    </div>
  );
};
