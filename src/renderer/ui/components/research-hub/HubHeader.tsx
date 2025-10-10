import type React from 'react';
import { Brain, TrendingUp, FileText, Bell } from 'lucide-react';

type TabId = 'research' | 'analytics' | 'reports' | 'alerts';

type HubHeaderProps = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export const HubHeader: React.FC<HubHeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="hub-header">
      <div className="hub-header-left">
        <div className="hub-icon-badge">
          <Brain />
        </div>
        <h1 className="hub-title">Research Hub</h1>
      </div>

      <nav className="hub-tabs">
        <button
          type="button"
          onClick={() => onTabChange('research')}
          className={`hub-tab ${activeTab === 'research' ? 'hub-tab-active' : ''}`}
          aria-pressed={activeTab === 'research'}
        >
          <Brain />
          Research
        </button>
        <button
          type="button"
          onClick={() => onTabChange('analytics')}
          className={`hub-tab ${activeTab === 'analytics' ? 'hub-tab-active' : ''}`}
          aria-pressed={activeTab === 'analytics'}
        >
          <TrendingUp />
          Analytics
        </button>
        <button
          type="button"
          onClick={() => onTabChange('reports')}
          className={`hub-tab ${activeTab === 'reports' ? 'hub-tab-active' : ''}`}
          aria-pressed={activeTab === 'reports'}
        >
          <FileText />
          Reports
        </button>
        <button
          type="button"
          onClick={() => onTabChange('alerts')}
          className={`hub-tab ${activeTab === 'alerts' ? 'hub-tab-active' : ''}`}
          aria-pressed={activeTab === 'alerts'}
        >
          <Bell />
          Alerts
        </button>
      </nav>
    </header>
  );
};
