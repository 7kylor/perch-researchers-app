import type React from 'react';
import { Sparkles, Database, Zap } from 'lucide-react';

export const SearchEmptyState: React.FC = () => {
  return (
    <div className="search-empty-state">
      <div className="empty-state-icon">
        <Sparkles />
      </div>

      <h3 className="empty-state-title">Discover Research Papers</h3>

      <p className="empty-state-description">
        Search across multiple academic databases to find relevant papers for your research
      </p>

      <div className="empty-state-features">
        <div className="empty-state-feature">
          <Database style={{ color: '#3b82f6' }} />
          <span>Multi-database</span>
        </div>
        <div className="empty-state-feature">
          <Zap style={{ color: '#8b5cf6' }} />
          <span>Real-time</span>
        </div>
      </div>
    </div>
  );
};
