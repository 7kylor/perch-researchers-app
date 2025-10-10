import React from 'react';
import {
  Search,
  Upload,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  History,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useSearch } from './SearchProvider';

export const ResearchQuestionInterface: React.FC = () => {
  const { query, isSearching, setQuery, performSearch, searchHistory } = useSearch();
  const [showRecent, setShowRecent] = React.useState(false);

  const handleSearchKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void performSearch();
      }
    },
    [performSearch],
  );

  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    void performSearch();
    setShowRecent(false);
  };

  const suggestions = [
    'Specify research domain',
    'Clarify research focus',
    'Operationalize research scope',
  ];

  // Mock recent searches with paper counts for demo
  const recentSearches = [
    { query: 'machine learning in healthcare', count: 47, timeAgo: '2 hours ago' },
    { query: 'neural networks for image classification', count: 23, timeAgo: '1 day ago' },
    { query: 'transformer models in NLP', count: 89, timeAgo: '3 days ago' },
    { query: 'reinforcement learning applications', count: 34, timeAgo: '1 week ago' },
    { query: 'computer vision object detection', count: 156, timeAgo: '2 weeks ago' },
  ].slice(0, Math.min(5, searchHistory.length || 5));

  return (
    <div className="research-question-interface">
      {/* Main search bar */}
      <div className="hero-search-section">
        <div className="hero-search-bar">
          <div className="search-icon-large">
            <Search />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="Enter your research question..."
            className="hero-search-input"
            disabled={isSearching}
          />
          <button
            type="button"
            className="hero-search-button"
            onClick={() => void performSearch()}
            disabled={isSearching || !query.trim()}
          >
            <ArrowRight />
          </button>
        </div>

        {/* Research question guidance */}
        <div className="research-guidance">
          <div className="guidance-icon">
            <HelpCircle />
          </div>
          <div className="guidance-content">
            <p className="guidance-text">
              <strong>Good research question.</strong> Consider adding these elements for better
              results:
            </p>
            <div className="guidance-suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" className="suggestion-chip">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dataset toggle */}
        <div className="dataset-toggle">
          <span className="dataset-label">Searching:</span>
          <div className="dataset-buttons">
            <button
              type="button"
              className="dataset-button active"
              onClick={() => {
                /* Handle papers selection */
              }}
            >
              Research papers
            </button>
            <button
              type="button"
              className="dataset-button"
              onClick={() => {
                /* Handle clinical trials selection */
              }}
            >
              Clinical trials
            </button>
          </div>
        </div>
      </div>

      {/* Recent Researches Section */}
      <div className="recent-researches-section">
        <div className="recent-researches-header">
          <div className="recent-researches-title">
            <TrendingUp size={20} />
            <h3>Recent Researches</h3>
          </div>
          <button
            type="button"
            className="recent-toggle-button"
            onClick={() => setShowRecent(!showRecent)}
          >
            <History size={16} />
            <span>{showRecent ? 'Hide' : 'Show'} All</span>
          </button>
        </div>

        {showRecent ? (
          <div className="recent-researches-expanded">
            <div className="recent-researches-grid">
              {recentSearches.map((search, index) => (
                <div key={`${search.query}-${index}`} className="recent-research-card">
                  <div className="recent-research-header">
                    <h4 className="recent-research-query">{search.query}</h4>
                    <div className="recent-research-meta">
                      <span className="recent-research-count">{search.count} papers</span>
                      <span className="recent-research-time">{search.timeAgo}</span>
                    </div>
                  </div>
                  <div className="recent-research-preview">
                    <div className="preview-papers">
                      {/* Mock paper previews */}
                      <div className="preview-paper">
                        <div className="preview-title">Recent paper in this search</div>
                        <div className="preview-authors">Authors et al.</div>
                      </div>
                      <div className="preview-paper">
                        <div className="preview-title">Another relevant paper</div>
                        <div className="preview-authors">Researchers et al.</div>
                      </div>
                    </div>
                  </div>
                  <div className="recent-research-actions">
                    <button
                      type="button"
                      className="recent-search-button"
                      onClick={() => handleRecentSearch(search.query)}
                    >
                      <Search size={14} />
                      Search Again
                    </button>
                    <button
                      type="button"
                      className="recent-view-button"
                      onClick={() => handleRecentSearch(search.query)}
                    >
                      <Clock size={14} />
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="recent-researches-collapsed">
            <div className="recent-researches-list">
              {recentSearches.slice(0, 3).map((search, index) => (
                <button
                  key={`${search.query}-${index}`}
                  type="button"
                  className="recent-research-item"
                  onClick={() => handleRecentSearch(search.query)}
                >
                  <div className="recent-item-content">
                    <span className="recent-item-query">{search.query}</span>
                    <span className="recent-item-count">{search.count} papers</span>
                  </div>
                  <ArrowRight size={14} className="recent-item-arrow" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* More tools section */}
      <div className="more-tools-section">
        <h3 className="more-tools-title">More tools</h3>
        <div className="more-tools-grid">
          <button type="button" className="tool-button">
            <Upload />
            <span>Upload and extract</span>
          </button>
          <button type="button" className="tool-button">
            <MessageCircle />
            <span>Chat with papers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
