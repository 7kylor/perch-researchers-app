import React from 'react';
import { AnalyticsSection } from './research-hub/AnalyticsSection';
import { ResearchSection } from './research-hub/ResearchSection';
import { ReportBuilder } from './research-hub/ReportBuilder';
import { AlertConfig } from './research-hub/AlertConfig';
import { AlertInbox } from './research-hub/AlertInbox';
import { HomeSearchHero } from './research-hub/HomeSearchHero';
import type { Corpus, Mode } from './research-hub/HomeSearchHero';
import { RecentList } from './research-hub/RecentList';
import { HubHeader } from './research-hub/HubHeader';
import './research-hub/research-hub.css';

type TabId = 'research' | 'analytics' | 'reports' | 'alerts';

type ResearchAnalyticsHubProps = {
  defaultTab?: TabId;
};

export const ResearchAnalyticsHub: React.FC<ResearchAnalyticsHubProps> = ({
  defaultTab = 'research',
}) => {
  const [activeTab, setActiveTab] = React.useState<TabId>(defaultTab);

  React.useEffect(() => {
    const saved = window.localStorage.getItem('research-hub:activeTab');
    if (
      saved === 'research' ||
      saved === 'analytics' ||
      saved === 'reports' ||
      saved === 'alerts'
    ) {
      setActiveTab(saved as TabId);
    }
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem('research-hub:activeTab', activeTab);
  }, [activeTab]);

  return (
    <div className="research-analytics-hub">
      <HubHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="hub-content">
        {activeTab === 'research' && (
          <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16 }}>
            <HomeSearchHero
              onSearch={async ({
                query,
                mode,
                corpus,
              }: {
                query: string;
                mode: Mode;
                corpus: Corpus;
              }) => {
                if (mode === 'report') {
                  const res = await window.api.openalex.search(query, 12, 1, undefined);
                  const ids: string[] = [];
                  for (const p of res.papers as Array<{
                    title: string;
                    authors: string[];
                    venue?: string;
                    year?: number;
                    doi?: string;
                    source?: string;
                    abstract?: string;
                  }>) {
                    const id = await window.api.papers.add({
                      title: p.title,
                      authors: p.authors,
                      venue: p.venue,
                      year: p.year,
                      doi: p.doi,
                      source: p.source as string,
                      abstract: p.abstract,
                      status: 'to_read',
                      filePath: undefined,
                      textHash: `${p.title}-${(p.authors || []).slice(0, 2).join(',')}`,
                    });
                    ids.push(id);
                  }
                  await window.api.reports.generate(ids, {
                    sections: [
                      'Background and Motivation',
                      'Methods and Datasets',
                      'Findings and Evidence (with tables where helpful)',
                      'Gaps and Future Work',
                      'Conclusion',
                    ],
                  });
                } else {
                  if (corpus === 'trials') {
                    await window.api.academic['search-clinicaltrials'](query, 20);
                  } else {
                    await window.api.openalex.search(query, 20, 1, undefined);
                  }
                }
              }}
            />
            <ResearchSection />
            <RecentList
              onOpen={async (n) => {
                if (n.type === 'report' && n.refId) {
                  const rep = await window.api.reports.getReport(n.refId);
                  if (rep?.content) {
                    // For now, open print viewer or log; integrate a viewer panel later
                     
                    console.log('Open report:', rep.title);
                  }
                }
              }}
            />
          </div>
        )}
        {activeTab === 'analytics' && <AnalyticsSection />}
        {activeTab === 'reports' && <ReportBuilder />}
        {activeTab === 'alerts' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <AlertConfig />
            <AlertInbox />
          </div>
        )}
      </div>
    </div>
  );
};
