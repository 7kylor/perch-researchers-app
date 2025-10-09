import React from 'react';
import {
  Search,
  Brain,
  BookOpen,
  FileText,
  Target,
  GitBranch,
  Lightbulb,
  TrendingUp,
  Award,
  X,
  Clock,
  Loader2,
  Database,
  Users,
  Filter,
  ChevronDown,
  ChevronRight,
  Eye,
  FolderOpen,
  AlertCircle,
  Info,
  Sparkles,
} from 'lucide-react';
import type { AcademicPaper, AcademicSearchResult } from '../../../shared/types';

interface ResearchHubProps {
  onClose?: () => void;
}

type TabType = 'search' | 'analysis' | 'papers' | 'results';

type AIFeature =
  | 'literature-review'
  | 'methodology-extraction'
  | 'gap-analysis'
  | 'topic-modeling'
  | 'concept-extraction'
  | 'research-questions'
  | 'trend-analysis'
  | 'research-proposal';

interface AIFeatureConfig {
  id: AIFeature;
  name: string;
  description: string;
  icon: React.ReactNode;
  estimatedTime: string;
  requiresPapers: boolean;
  category: 'analysis' | 'synthesis' | 'generation';
}

const aiFeatures: AIFeatureConfig[] = [
  {
    id: 'literature-review',
    name: 'Literature Review Synthesis',
    description:
      'Generate comprehensive literature reviews with thematic analysis and research gap identification',
    icon: <BookOpen className="w-5 h-5" />,
    estimatedTime: '30-60 seconds',
    requiresPapers: true,
    category: 'synthesis',
  },
  {
    id: 'methodology-extraction',
    name: 'Methodology Extraction',
    description: 'Extract and analyze research methodologies, designs, and analytical approaches',
    icon: <FileText className="w-5 h-5" />,
    estimatedTime: '15-30 seconds',
    requiresPapers: false,
    category: 'analysis',
  },
  {
    id: 'gap-analysis',
    name: 'Research Gap Analysis',
    description: 'Identify research gaps, unanswered questions, and future research opportunities',
    icon: <Target className="w-5 h-5" />,
    estimatedTime: '45-90 seconds',
    requiresPapers: true,
    category: 'analysis',
  },
  {
    id: 'topic-modeling',
    name: 'Topic Modeling',
    description: 'Discover latent research topics and themes across your paper collection',
    icon: <GitBranch className="w-5 h-5" />,
    estimatedTime: '30-60 seconds',
    requiresPapers: true,
    category: 'analysis',
  },
  {
    id: 'concept-extraction',
    name: 'Key Concept Extraction',
    description: 'Extract and map key concepts, theories, and technical terms from research',
    icon: <Brain className="w-5 h-5" />,
    estimatedTime: '20-40 seconds',
    requiresPapers: true,
    category: 'analysis',
  },
  {
    id: 'research-questions',
    name: 'Research Question Generation',
    description: 'Generate innovative research questions based on existing literature',
    icon: <Lightbulb className="w-5 h-5" />,
    estimatedTime: '30-60 seconds',
    requiresPapers: true,
    category: 'generation',
  },
  {
    id: 'trend-analysis',
    name: 'Research Trend Analysis',
    description: 'Analyze publication trends, methodological evolution, and future directions',
    icon: <TrendingUp className="w-5 h-5" />,
    estimatedTime: '45-90 seconds',
    requiresPapers: true,
    category: 'analysis',
  },
  {
    id: 'research-proposal',
    name: 'Research Proposal Generation',
    description: 'Generate structured research proposals addressing identified gaps',
    icon: <Award className="w-5 h-5" />,
    estimatedTime: '60-120 seconds',
    requiresPapers: true,
    category: 'generation',
  },
];

export const ResearchHub: React.FC<ResearchHubProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('search');

  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<AcademicSearchResult | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedDatabases, setSelectedDatabases] = React.useState<Set<string>>(
    new Set(['googlescholar', 'semanticscholar', 'pubmed', 'ieee']),
  );
  const [showDatabaseFilters, setShowDatabaseFilters] = React.useState(false);

  // Analysis state
  const [selectedPapers, setSelectedPapers] = React.useState<string[]>([]);
  const [activeAIFeature, setActiveAIFeature] = React.useState<AIFeature | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['analysis', 'synthesis', 'generation']),
  );
  const [focusArea, setFocusArea] = React.useState('');

  // Results state
  const [analysisHistory, setAnalysisHistory] = React.useState<
    Array<{
      id: string;
      type: string;
      timestamp: string;
      papers: string[];
      result: string;
    }>
  >([]);

  const databases = [
    { id: 'googlescholar', name: 'Google Scholar', icon: Search, color: 'blue' as const },
    { id: 'semanticscholar', name: 'Semantic Scholar', icon: Database, color: 'green' as const },
    { id: 'pubmed', name: 'PubMed', icon: BookOpen, color: 'red' as const },
    { id: 'ieee', name: 'IEEE Xplore', icon: Database, color: 'purple' as const },
  ];

  const tabs = [
    { id: 'search', name: 'Search', icon: <Search className="w-4 h-4" />, badge: null },
    {
      id: 'papers',
      name: 'Papers',
      icon: <FolderOpen className="w-4 h-4" />,
      badge: selectedPapers.length > 0 ? selectedPapers.length : null,
    },
    { id: 'analysis', name: 'AI Analysis', icon: <Brain className="w-4 h-4" />, badge: null },
    {
      id: 'results',
      name: 'Results',
      icon: <Eye className="w-4 h-4" />,
      badge: analysisHistory.length > 0 ? analysisHistory.length : null,
    },
  ];

  // Search functions
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await window.api.academic['search-all'](searchQuery.trim(), 20);
      setSearchResults(response);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleDatabase = (dbId: string) => {
    const newSelected = new Set(selectedDatabases);
    if (newSelected.has(dbId)) {
      newSelected.delete(dbId);
    } else {
      newSelected.add(dbId);
    }
    setSelectedDatabases(newSelected);
  };

  // Paper selection functions
  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId],
    );
  };

  const addSearchResultToPapers = (paper: AcademicPaper) => {
    // Create a new paper entry in the database
    const paperData = {
      title: paper.title,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
      doi: paper.doi,
      source: paper.source,
      abstract: paper.abstract,
      status: 'to_read' as const,
      filePath: undefined,
      textHash: `${paper.title}-${paper.authors.join(',')}-${paper.year || 'unknown'}`,
    };

    window.api.papers
      .add(paperData)
      .then((paperId) => {
        setSelectedPapers((prev) => [...prev, paperId]);
        setActiveTab('papers');
      })
      .catch((error) => {
        console.error('Failed to add paper:', error);
      });
  };

  // AI Analysis functions
  const runAIFeature = async (featureId: AIFeature) => {
    const feature = aiFeatures.find((f) => f.id === featureId);
    if (!feature || !canRunFeature(feature)) return;

    setIsAnalyzing(true);
    setActiveAIFeature(featureId);

    try {
      let response: string = '';

      switch (featureId) {
        case 'literature-review': {
          response = await window.api.ai['synthesize-review'](selectedPapers);
          break;
        }
        case 'methodology-extraction': {
          const paperId = selectedPapers[0];
          response = await window.api.ai['extract-methodology'](paperId);
          break;
        }
        case 'gap-analysis':
          response = await window.api.ai['identify-gaps'](selectedPapers);
          break;
        case 'topic-modeling':
          response = await window.api.ai['topic-modeling'](selectedPapers);
          break;
        case 'concept-extraction':
          response = await window.api.ai['extract-concepts'](selectedPapers);
          break;
        case 'research-questions':
          response = await window.api.ai['generate-questions'](
            selectedPapers,
            focusArea || undefined,
          );
          break;
        case 'trend-analysis':
          response = await window.api.ai['analyze-trends'](selectedPapers);
          break;
        case 'research-proposal': {
          const gapPrompt = `Based on the identified research gaps in these papers, generate a research proposal for: ${focusArea || 'an important research gap'}`;
          response = await window.api.ai['generate-proposal'](selectedPapers, gapPrompt);
          break;
        }
      }

      // Analysis result is stored in history, no need to set local state

      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        type: featureId,
        timestamp: new Date().toISOString(),
        papers: selectedPapers,
        result: response,
      };
      setAnalysisHistory((prev) => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
    } catch (error) {
      console.error('AI feature execution failed:', error);
      // Analysis result is stored in history, no need to set local state for errors
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canRunFeature = (feature: AIFeatureConfig) => {
    if (!feature.requiresPapers) return true;
    return selectedPapers.length > 0;
  };

  // Helper functions
  const formatSourceName = (source: string) => {
    return source.charAt(0).toUpperCase() + source.slice(1).replace(/([A-Z])/g, ' $1');
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      googlescholar: 'bg-blue-100 text-blue-800',
      semanticscholar: 'bg-green-100 text-green-800',
      pubmed: 'bg-red-100 text-red-800',
      ieee: 'bg-purple-100 text-purple-800',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const featuresByCategory = aiFeatures.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) acc[feature.category] = [];
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, AIFeatureConfig[]>,
  );

  const categoryLabels = {
    analysis: 'Research Analysis',
    synthesis: 'Knowledge Synthesis',
    generation: 'Content Generation',
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="research-hub h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header - App Design Style */}
      <div className="activity-bar" style={{ background: 'var(--surface)' }}>
        <div className="activity-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
              <Brain className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h1 className="activity-title">Research Hub</h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                AI-powered research discovery & analysis
              </p>
            </div>
          </div>
        </div>

        <div className="activity-right">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="activity-compact-btn"
              style={{
                background: 'var(--surface)',
                border: `1px solid var(--border-subtle)`,
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--card-hover)';
                e.currentTarget.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation - App Design Style */}
      <div
        className="flex"
        style={{ background: 'var(--surface)', borderBottom: `1px solid var(--border-subtle)` }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            type="button"
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative`}
            style={{
              background: activeTab === tab.id ? 'var(--surface-secondary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? `2px solid var(--primary)` : 'none',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'var(--card-hover)';
                e.currentTarget.style.color = 'var(--text)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {tab.icon}
            {tab.name}
            {tab.badge && (
              <span
                className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--bg)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Search Tab - Redesigned with App Styling */}
        {activeTab === 'search' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Search Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
                    <Search className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      Academic Database Search
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Discover research papers across multiple academic databases
                    </p>
                  </div>
                </div>

                {/* Search Input - App Design Style */}
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <div className="search-bar">
                      <Search className="search-icon" size={18} />
                      <input
                        type="text"
                        placeholder="Search for research papers, topics, or authors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="search-input"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      background:
                        isSearching || !searchQuery.trim()
                          ? 'var(--surface-secondary)'
                          : 'var(--primary)',
                      color:
                        isSearching || !searchQuery.trim() ? 'var(--text-secondary)' : 'var(--bg)',
                      cursor: isSearching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 inline mr-2" />
                        Search
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDatabaseFilters(!showDatabaseFilters)}
                    className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                      showDatabaseFilters ? 'border-primary' : 'border-gray-300'
                    }`}
                    style={{
                      background: showDatabaseFilters ? 'var(--surface-secondary)' : 'var(--bg)',
                      color: showDatabaseFilters ? 'var(--primary)' : 'var(--text-secondary)',
                      borderColor: showDatabaseFilters ? 'var(--primary)' : 'var(--border-subtle)',
                    }}
                  >
                    <Filter className="w-4 h-4 inline mr-1" />
                    Filters
                  </button>
                </div>

                {/* Database Filters - App Design Style */}
                {showDatabaseFilters && (
                  <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
                    <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                      Search Databases
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {databases.map((db) => {
                        const Icon = db.icon;
                        const isSelected = selectedDatabases.has(db.id);
                        const colorClasses = {
                          blue: 'bg-blue-100 text-blue-800 border-blue-300',
                          green: 'bg-green-100 text-green-800 border-green-300',
                          red: 'bg-red-100 text-red-800 border-red-300',
                          purple: 'bg-purple-100 text-purple-800 border-purple-300',
                        };

                        return (
                          <button
                            type="button"
                            key={db.id}
                            onClick={() => toggleDatabase(db.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition-colors ${
                              isSelected ? colorClasses[db.color] : 'border-gray-300'
                            }`}
                            style={{
                              background: isSelected ? undefined : 'var(--bg)',
                              color: isSelected ? undefined : 'var(--text-secondary)',
                              borderColor: isSelected ? undefined : 'var(--border-subtle)',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{db.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Search Results - Redesigned with App Cards */}
                {searchResults && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        Search Results ({searchResults.totalResults} papers)
                      </h3>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Search took {searchResults.searchTime}ms
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.papers.map((paper, index) => (
                        <div
                          key={`${paper.source}-${index}`}
                          className="book-card"
                          style={{
                            background: 'var(--bg)',
                            border: `1px solid var(--border-subtle)`,
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div
                            className="book-card-button"
                            onClick={() => addSearchResultToPapers(paper)}
                          >
                            <div className="book-cover">
                              <div className="book-spine"></div>
                              <div className="book-front">
                                <div className="book-header">
                                  <div
                                    className="book-status-indicator"
                                    style={{ backgroundColor: 'var(--success)' }}
                                  ></div>
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(paper.source)}`}
                                  >
                                    {formatSourceName(paper.source)}
                                  </span>
                                </div>

                                <div className="book-content">
                                  <div className="book-title-section">
                                    <div className="book-title">{paper.title}</div>
                                    <div className="book-authors">
                                      {paper.authors.slice(0, 3).join(', ')}
                                      {paper.authors.length > 3
                                        ? ` +${paper.authors.length - 3} more`
                                        : ''}
                                    </div>
                                  </div>

                                  <div className="book-publication">
                                    <div className="publication-row">
                                      {paper.year && (
                                        <span className="publication-year">{paper.year}</span>
                                      )}
                                      {paper.venue && (
                                        <span className="publication-venue">{paper.venue}</span>
                                      )}
                                    </div>
                                    {paper.citations && (
                                      <div className="publication-details">
                                        <span style={{ color: 'var(--success)' }}>
                                          {paper.citations} citations
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {paper.abstract && (
                                    <div className="book-abstract">
                                      <div className="abstract-content">{paper.abstract}</div>
                                    </div>
                                  )}

                                  <div className="book-footer">
                                    <div className="book-date">Academic Paper</div>
                                    <div className="flex items-center gap-2">
                                      {paper.url && (
                                        <a
                                          href={paper.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs"
                                          style={{ color: 'var(--primary)' }}
                                        >
                                          View Paper
                                        </a>
                                      )}
                                      {paper.doi && (
                                        <span
                                          className="text-xs"
                                          style={{ color: 'var(--text-secondary)' }}
                                        >
                                          DOI: {paper.doi}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {searchResults.papers.length === 0 && (
                      <div className="text-center py-8">
                        <AlertCircle
                          className="w-12 h-12 mx-auto mb-4"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>
                          No papers found
                        </h3>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          Try adjusting your search terms or database filters.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Papers Tab - Redesigned */}
        {activeTab === 'papers' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
                    <FolderOpen className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      Selected Papers for Analysis
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Papers selected for AI-powered research analysis
                    </p>
                  </div>
                </div>
                {selectedPapers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('analysis')}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--bg)',
                    }}
                  >
                    <Brain className="w-4 h-4 inline mr-2" />
                    Run AI Analysis
                  </button>
                )}
              </div>

              {selectedPapers.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>
                    No papers selected
                  </h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Search for papers and add them to your analysis collection.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--bg)',
                    }}
                  >
                    Go to Search
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPapers.map((paperId) => (
                    <div
                      key={paperId}
                      className="book-card"
                      style={{
                        background: 'var(--bg)',
                        border: `1px solid var(--border-subtle)`,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div className="book-card-button">
                        <div className="book-cover">
                          <div className="book-spine"></div>
                          <div className="book-front">
                            <div className="book-header">
                              <div
                                className="book-status-indicator"
                                style={{ backgroundColor: 'var(--success)' }}
                              ></div>
                              <span
                                className="px-2 py-1 text-xs font-medium rounded-full"
                                style={{
                                  background: 'var(--primary)',
                                  color: 'var(--bg)',
                                }}
                              >
                                Selected
                              </span>
                            </div>

                            <div className="book-content">
                              <div className="book-title-section">
                                <div className="book-title">Paper ID: {paperId}</div>
                                <div className="book-authors">Selected for analysis</div>
                              </div>

                              <div className="book-footer">
                                <div className="book-date">Ready for analysis</div>
                                <button
                                  type="button"
                                  onClick={() => togglePaperSelection(paperId)}
                                  className="text-xs"
                                  style={{ color: 'var(--error)' }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Tab - Redesigned with App Styling */}
        {activeTab === 'analysis' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
                    <Brain className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      AI-Powered Research Analysis
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Use advanced AI to analyze your selected papers and generate research insights
                    </p>
                  </div>
                </div>

                {selectedPapers.length === 0 && (
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--warning)', color: 'var(--text)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      <span>Please select papers first to enable AI analysis features.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Features by Category - Redesigned Cards */}
              <div className="space-y-6">
                {Object.entries(featuresByCategory).map(([category, features]) => (
                  <div key={category}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full text-left p-3 rounded-lg transition-colors"
                      style={{
                        background: 'var(--surface)',
                        border: `1px solid var(--border-subtle)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--card-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--surface)';
                      }}
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                      )}
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {categoryLabels[category as keyof typeof categoryLabels]}
                      </span>
                      <span className="text-sm ml-auto" style={{ color: 'var(--text-secondary)' }}>
                        {features.length} features
                      </span>
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="ml-6 space-y-3 mt-3">
                        {features.map((feature) => (
                          <div
                            key={feature.id}
                            className="book-card"
                            style={{
                              background: 'var(--bg)',
                              border: `1px solid ${canRunFeature(feature) ? 'var(--border-subtle)' : 'var(--border)'}`,
                              boxShadow: 'var(--shadow-sm)',
                              opacity: canRunFeature(feature) ? 1 : 0.6,
                            }}
                          >
                            <div
                              className="book-card-button"
                              onClick={() => canRunFeature(feature) && runAIFeature(feature.id)}
                            >
                              <div className="book-cover">
                                <div className="book-spine"></div>
                                <div className="book-front">
                                  <div className="book-header">
                                    <div
                                      className="book-status-indicator"
                                      style={{
                                        backgroundColor: canRunFeature(feature)
                                          ? 'var(--success)'
                                          : 'var(--muted)',
                                      }}
                                    ></div>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        canRunFeature(feature)
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}
                                    >
                                      {feature.category}
                                    </span>
                                  </div>

                                  <div className="book-content">
                                    <div className="book-title-section">
                                      <div className="book-title">{feature.name}</div>
                                      <div className="book-authors">{feature.description}</div>
                                    </div>

                                    <div className="book-publication">
                                      <div className="publication-row">
                                        <span className="publication-year">
                                          <Clock className="w-3 h-3 inline mr-1" />
                                          {feature.estimatedTime}
                                        </span>
                                        {!feature.requiresPapers && (
                                          <span className="publication-venue">
                                            <Users className="w-3 h-3 inline mr-1" />
                                            Single paper
                                          </span>
                                        )}
                                        {feature.requiresPapers && selectedPapers.length > 0 && (
                                          <span className="publication-venue">
                                            <BookOpen className="w-3 h-3 inline mr-1" />
                                            {selectedPapers.length} papers
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="book-footer">
                                      <div className="book-date">AI Analysis Feature</div>
                                      <button
                                        type="button"
                                        onClick={() => runAIFeature(feature.id)}
                                        disabled={!canRunFeature(feature) || isAnalyzing}
                                        className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                                          canRunFeature(feature) && !isAnalyzing
                                            ? 'bg-primary text-bg hover:bg-primary-hover'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        style={{
                                          background:
                                            canRunFeature(feature) && !isAnalyzing
                                              ? 'var(--primary)'
                                              : 'var(--surface-secondary)',
                                          color:
                                            canRunFeature(feature) && !isAnalyzing
                                              ? 'var(--bg)'
                                              : 'var(--text-secondary)',
                                        }}
                                      >
                                        {isAnalyzing && activeAIFeature === feature.id ? (
                                          <>
                                            <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                                            Running...
                                          </>
                                        ) : (
                                          'Run Analysis'
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Focus Area Input - Redesigned */}
              {(activeAIFeature === 'research-questions' ||
                activeAIFeature === 'research-proposal') && (
                <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text)' }}
                  >
                    Research Focus Area (Optional)
                  </label>
                  <input
                    type="text"
                    value={focusArea}
                    onChange={(e) => setFocusArea(e.target.value)}
                    placeholder="e.g., machine learning in healthcare, sustainable energy, social media impact..."
                    className="w-full px-3 py-2 rounded-md border font-normal"
                    style={{
                      background: 'var(--bg)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text)',
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Provide a specific focus area to generate more targeted research questions or
                    proposals.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab - Redesigned */}
        {activeTab === 'results' && (
          <div className="p-6 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
                    <Eye className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      Analysis Results & History
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      View and manage your AI analysis results and research insights
                    </p>
                  </div>
                </div>
              </div>

              {analysisHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Eye
                    className="w-12 h-12 mx-auto mb-4"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text)' }}>
                    No analysis results yet
                  </h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Run AI analyses on your selected papers to see results here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('analysis')}
                    className="px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--bg)',
                    }}
                  >
                    Go to Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {analysisHistory.map((item) => (
                    <div
                      key={item.id}
                      className="book-card"
                      style={{
                        background: 'var(--bg)',
                        border: `1px solid var(--border-subtle)`,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div className="book-card-button">
                        <div className="book-cover">
                          <div className="book-spine"></div>
                          <div className="book-front">
                            <div className="book-header">
                              <div
                                className="book-status-indicator"
                                style={{ backgroundColor: 'var(--success)' }}
                              ></div>
                              <span
                                className="px-2 py-1 text-xs font-medium rounded-full"
                                style={{
                                  background: 'var(--primary)',
                                  color: 'var(--bg)',
                                }}
                              >
                                {aiFeatures.find((f) => f.id === item.type)?.category || 'Analysis'}
                              </span>
                            </div>

                            <div className="book-content">
                              <div className="book-title-section">
                                <div className="book-title">
                                  {aiFeatures.find((f) => f.id === item.type)?.name || item.type}
                                </div>
                                <div className="book-authors">
                                  {new Date(item.timestamp).toLocaleString()}
                                </div>
                              </div>

                              <div className="book-abstract">
                                <div className="abstract-content">
                                  {item.result.split('\n').slice(0, 3).join(' ')}...
                                </div>
                              </div>

                              <div className="book-footer">
                                <div className="book-date">
                                  {item.papers.length} papers analyzed
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnalysisHistory((prev) =>
                                      prev.filter((h) => h.id !== item.id),
                                    )
                                  }
                                  className="text-xs"
                                  style={{ color: 'var(--error)' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status - App Design Style */}
      <div
        className="activity-bar"
        style={{ background: 'var(--surface)', borderTop: `1px solid var(--border-subtle)` }}
      >
        <div className="activity-left">
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Research Hub v1.0
            </span>
            {selectedPapers.length > 0 && (
              <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                {selectedPapers.length} papers selected for analysis
              </span>
            )}
          </div>
        </div>
        <div className="activity-right">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--success)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI features available
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
