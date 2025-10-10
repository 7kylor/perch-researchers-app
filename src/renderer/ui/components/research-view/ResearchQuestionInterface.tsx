import React from 'react';
import { Search, Upload, MessageCircle, HelpCircle, ArrowRight, History, Clock, TrendingUp } from 'lucide-react';
import { useSearch } from './SearchProvider';

export const ResearchQuestionInterface: React.FC = () => {
  const { query, isSearching, setQuery, performSearch } = useSearch();

  const handleSearchKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void performSearch();
      }
    },
    [performSearch],
  );

  const suggestions = [
    'Specify research domain',
    'Clarify research focus',
    'Operationalize research scope',
  ];

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
