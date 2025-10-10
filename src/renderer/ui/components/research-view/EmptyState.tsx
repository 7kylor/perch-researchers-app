import React from 'react';
import { Sparkles, Database, Zap, TrendingUp } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'Multi-Database Search',
      description: 'Search across arXiv, PubMed, CrossRef, Semantic Scholar, and more',
    },
    {
      icon: Zap,
      title: 'AI-Powered Results',
      description: 'Semantic understanding enhances your queries for better relevance',
    },
    {
      icon: TrendingUp,
      title: 'Smart Filtering',
      description: 'Filter by year, source, and content type to refine your search',
    },
  ];

  return (
    <div className="research-empty-state">
      <div className="empty-state-hero">
        <div className="empty-state-icon">
          <Sparkles />
        </div>
        <h2>Discover Research Papers</h2>
        <p>
          Use AI-powered semantic search to find relevant academic papers across multiple databases.
          Our intelligent system understands your research intent and surfaces the most relevant
          results.
        </p>
      </div>

      <div className="empty-state-features">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="empty-state-feature">
              <div className="feature-icon">
                <Icon />
              </div>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="empty-state-examples">
        <h3>Try searching for:</h3>
        <div className="search-examples">
          {[
            'machine learning transformers attention',
            'protein folding AlphaFold',
            'climate change mitigation strategies',
            'neural networks optimization',
          ].map((example, index) => (
            <button key={index} type="button" className="search-example">
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
