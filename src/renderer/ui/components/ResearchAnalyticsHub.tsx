import React from 'react';
import { AnalyticsSection } from './research-hub/AnalyticsSection';
import { ResearchSection } from './research-hub/ResearchSection';
import { HubHeader } from './research-hub/HubHeader';
import './research-hub/research-hub.css';

type TabId = 'research' | 'analytics';

type ResearchAnalyticsHubProps = {
  defaultTab?: TabId;
};

export const ResearchAnalyticsHub: React.FC<ResearchAnalyticsHubProps> = ({
  defaultTab = 'research',
}) => {
  const [activeTab, setActiveTab] = React.useState<TabId>(defaultTab);

  React.useEffect(() => {
    const saved = window.localStorage.getItem('research-hub:activeTab');
    if (saved === 'research' || saved === 'analytics') {
      setActiveTab(saved);
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem('research-hub:activeTab', activeTab);
  }, [activeTab]);

  return (
    <div className="research-analytics-hub">
      <HubHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="hub-content">
        {activeTab === 'research' ? <ResearchSection /> : <AnalyticsSection />}
      </div>
    </div>
  );
};
