import React from 'react';
import { Search, Trash2, History } from 'lucide-react';

type RecentSearch = {
  id: string;
  name: string;
  query: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

type RecentSearchesProps = {
  onSearchSelect: (query: string) => void;
  onDelete?: (id: string) => void;
  limit?: number;
};

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  onSearchSelect,
  onDelete,
  limit = 5,
}) => {
  const [searches, setSearches] = React.useState<RecentSearch[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const loadSearches = React.useCallback(async () => {
    setLoading(true);
    try {
      const recent = (await window.api.search.listQueries()) as RecentSearch[];
      setSearches(recent.slice(0, limit));
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    void loadSearches();
  }, [loadSearches]);

  const handleDelete = async (id: string) => {
    if (onDelete) {
      await onDelete(id);
      await loadSearches();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <History size={16} className="animate-pulse" />
        <h4 style={{ margin: 0 }}>Recent Searches</h4>
      </div>

      {loading && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Loading...</div>}

      {searches.length === 0 && !loading && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No recent searches.</div>
      )}

      {searches.map((search) => (
        <div
          key={search.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 8,
            border: '1px solid var(--border-subtle)',
            borderRadius: 6,
            cursor: 'pointer',
          }}
          onClick={() => onSearchSelect(search.query)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{search.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {new Date(search.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(search.id);
              }}
              style={{
                padding: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
