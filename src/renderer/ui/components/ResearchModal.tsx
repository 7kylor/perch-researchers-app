import React from 'react';
import {
  X,
  Brain,
  Search,
  BookOpen,
  FileText,
  Target,
  GitBranch,
  Lightbulb,
  TrendingUp,
  Award,
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
  BarChart3,
  Calendar,
  Activity,
  BookMarked,
  Zap,
  CheckCircle,
} from 'lucide-react';
import type { AcademicPaper, AcademicSearchResult } from '../../../shared/types';

type ResearchModalProps = {
  onClose: () => void;
};

type TabId = 'research-hub' | 'analytics';

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

export const ResearchModal: React.FC<ResearchModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = React.useState<TabId>('research-hub');

  // Research Hub state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<AcademicSearchResult | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedDatabases, setSelectedDatabases] = React.useState<Set<string>>(
    new Set(['googlescholar', 'semanticscholar', 'pubmed', 'ieee']),
  );
  const [showDatabaseFilters, setShowDatabaseFilters] = React.useState(false);
  const [selectedPapers, setSelectedPapers] = React.useState<string[]>([]);
  const [activeAIFeature, setActiveAIFeature] = React.useState<AIFeature | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['analysis', 'synthesis', 'generation']),
  );
  const [focusArea, setFocusArea] = React.useState('');
  const [analysisHistory, setAnalysisHistory] = React.useState<
    Array<{
      id: string;
      type: string;
      timestamp: string;
      papers: string[];
      result: string;
    }>
  >([]);

  // Analytics state
  const [analyticsData, setAnalyticsData] = React.useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(false);

  React.useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab]);

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await window.api.analytics.getMetrics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const databases = [
    { id: 'googlescholar', name: 'Google Scholar', icon: Search, color: 'blue' as const },
    { id: 'semanticscholar', name: 'Semantic Scholar', icon: Database, color: 'green' as const },
    { id: 'pubmed', name: 'PubMed', icon: BookOpen, color: 'red' as const },
    { id: 'ieee', name: 'IEEE Xplore', icon: Database, color: 'purple' as const },
  ];

  const tabs = [
    { id: 'research-hub', label: 'Research Hub', icon: <Brain size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  ];

  // Research Hub functions
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

  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers((prev) =>
      prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId],
    );
  };

  const addSearchResultToPapers = (paper: AcademicPaper) => {
    const paperData = {
      title: paper.title,
      authors: paper.authors,
      venue: paper.venue,
      year: paper.year,
      doi: paper.doi,
      source: paper.source as any,
      abstract: paper.abstract,
      status: 'to_read' as const,
      filePath: undefined,
      textHash: `${paper.title}-${paper.authors.join(',')}-${paper.year || 'unknown'}`,
    };

    window.api.papers
      .add(paperData)
      .then((paperId) => {
        setSelectedPapers((prev) => [...prev, paperId]);
      })
      .catch((error) => {
        console.error('Failed to add paper:', error);
      });
  };

  const runAIFeature = async (featureId: AIFeature) => {
    if (!canRunFeature(aiFeatures.find((f) => f.id === featureId)!)) return;

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
        case 'gap-analysis': {
          response = await window.api.ai['identify-gaps'](selectedPapers);
          break;
        }
        case 'topic-modeling': {
          response = await window.api.ai['topic-modeling'](selectedPapers);
          break;
        }
        case 'concept-extraction': {
          response = await window.api.ai['extract-concepts'](selectedPapers);
          break;
        }
        case 'research-questions': {
          response = await window.api.ai['generate-questions'](
            selectedPapers,
            focusArea || undefined,
          );
          break;
        }
        case 'trend-analysis': {
          response = await window.api.ai['analyze-trends'](selectedPapers);
          break;
        }
        case 'research-proposal': {
          const gapPrompt = `Based on the identified research gaps in these papers, generate a research proposal for: ${focusArea || 'an important research gap'}`;
          response = await window.api.ai['generate-proposal'](selectedPapers, gapPrompt);
          break;
        }
      }

      const historyItem = {
        id: Date.now().toString(),
        type: featureId,
        timestamp: new Date().toISOString(),
        papers: selectedPapers,
        result: response,
      };
      setAnalysisHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('AI feature execution failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canRunFeature = (feature: AIFeatureConfig) => {
    if (!feature.requiresPapers) return true;
    return selectedPapers.length > 0;
  };

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
    <div className="research-modal-overlay">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="research-modal">
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ background: 'var(--surface)', borderBottom: `1px solid var(--border-subtle)` }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
              <Brain className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                Research & Analytics
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                AI-powered research tools and productivity insights
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex"
          style={{ background: 'var(--surface)', borderBottom: `1px solid var(--border-subtle)` }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'border-b-2 bg-surface-secondary' : 'hover:bg-card-hover'
              }`}
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Research Hub Tab */}
          {activeTab === 'research-hub' && (
            <div className="h-full flex flex-col">
              {/* Research Hub Header */}
              <div
                className="p-6"
                style={{
                  background: 'var(--surface)',
                  borderBottom: `1px solid var(--border-subtle)`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
                      <Brain className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        Research Hub
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Discover, analyze, and synthesize research with AI-powered tools
                      </p>
                    </div>
                  </div>
                  {selectedPapers.length > 0 && (
                    <div className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                      {selectedPapers.length} papers selected
                    </div>
                  )}
                </div>
              </div>

              {/* Research Hub Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  {/* Search Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg" style={{ background: 'var(--card-hover)' }}>
                        <Search className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                      </div>
                      <h3 className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                        Academic Search
                      </h3>
                    </div>

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
                            isSearching || !searchQuery.trim()
                              ? 'var(--text-secondary)'
                              : 'var(--bg)',
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
                    </div>

                    {/* Database Filters */}
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={() => setShowDatabaseFilters(!showDatabaseFilters)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition-colors"
                        style={{
                          background: showDatabaseFilters
                            ? 'var(--surface-secondary)'
                            : 'var(--bg)',
                          color: showDatabaseFilters ? 'var(--primary)' : 'var(--text-secondary)',
                          borderColor: showDatabaseFilters
                            ? 'var(--primary)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <Filter className="w-4 h-4" />
                        Database Filters
                      </button>

                      {showDatabaseFilters && (
                        <div
                          className="mt-3 p-4 rounded-lg"
                          style={{ background: 'var(--surface)' }}
                        >
                          <div className="flex flex-wrap gap-3">
                            {databases.map((db) => {
                              const Icon = db.icon;
                              const isSelected = selectedDatabases.has(db.id);
                              return (
                                <button
                                  key={db.id}
                                  type="button"
                                  onClick={() => toggleDatabase(db.id)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : 'border-gray-300'
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
                    </div>

                    {/* Search Results */}
                    {searchResults && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-medium" style={{ color: 'var(--text)' }}>
                            Search Results ({searchResults.totalResults} papers)
                          </h4>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Search took {searchResults.searchTime}ms
                          </span>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto">
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
                      </div>
                    )}
                  </div>

                  {/* AI Analysis Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">AI Analysis Tools</h3>
                    </div>

                    {selectedPapers.length === 0 && (
                      <div
                        className="p-4 rounded-lg mb-4"
                        style={{ background: 'var(--warning)', color: 'var(--text)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          <span>Please select papers first to enable AI analysis features.</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
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
                          >
                            {expandedCategories.has(category) ? (
                              <ChevronDown
                                className="w-4 h-4"
                                style={{ color: 'var(--primary)' }}
                              />
                            ) : (
                              <ChevronRight
                                className="w-4 h-4"
                                style={{ color: 'var(--primary)' }}
                              />
                            )}
                            <span className="font-medium" style={{ color: 'var(--text)' }}>
                              {categoryLabels[category as keyof typeof categoryLabels]}
                            </span>
                          </button>

                          {expandedCategories.has(category) && (
                            <div className="ml-6 space-y-3 mt-3">
                              {features.map((feature) => (
                                <div
                                  key={feature.id}
                                  className={`p-4 border rounded-lg transition-all ${
                                    canRunFeature(feature)
                                      ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                      : 'border-gray-100 bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${
                                        canRunFeature(feature)
                                          ? 'bg-blue-100 text-blue-600'
                                          : 'bg-gray-100 text-gray-400'
                                      }`}
                                    >
                                      {feature.icon}
                                    </div>
                                    <div className="flex-1">
                                      <h4
                                        className={`font-medium ${
                                          canRunFeature(feature) ? 'text-gray-900' : 'text-gray-500'
                                        }`}
                                      >
                                        {feature.name}
                                      </h4>
                                      <p
                                        className={`text-sm mt-1 ${
                                          canRunFeature(feature) ? 'text-gray-600' : 'text-gray-400'
                                        }`}
                                      >
                                        {feature.description}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => runAIFeature(feature.id)}
                                      disabled={!canRunFeature(feature) || isAnalyzing}
                                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                        canRunFeature(feature)
                                          ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
                                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      }`}
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
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="h-full flex flex-col">
              {/* Analytics Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Research Analytics</h2>
                    <p className="text-sm text-gray-600">
                      Track your research productivity and reading patterns
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingAnalytics ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Loading analytics...</span>
                  </div>
                ) : analyticsData ? (
                  <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div
                        className="p-6 rounded-lg border"
                        style={{ background: 'var(--surface)' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <BookOpen className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Papers in Library</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {analyticsData.totalPapers || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-6 rounded-lg border"
                        style={{ background: 'var(--surface)' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Calendar className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Reading Sessions</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {analyticsData.totalSessions || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div
                        className="p-6 rounded-lg border"
                        style={{ background: 'var(--surface)' }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Activity className="w-6 h-6 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Avg. Session Time</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {analyticsData.avgSessionTime
                                ? `${Math.round(analyticsData.avgSessionTime)}m`
                                : '0m'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reading Trends */}
                    <div className="p-6 rounded-lg border" style={{ background: 'var(--surface)' }}>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Reading Activity</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">This Week</span>
                          <span className="text-sm font-medium text-gray-900">
                            {analyticsData.weeklySessions || 0} sessions
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">This Month</span>
                          <span className="text-sm font-medium text-gray-900">
                            {analyticsData.monthlySessions || 0} sessions
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Papers Read</span>
                          <span className="text-sm font-medium text-gray-900">
                            {analyticsData.papersRead || 0} papers
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Topic Analysis */}
                    {analyticsData.topics && analyticsData.topics.length > 0 && (
                      <div
                        className="p-6 rounded-lg border"
                        style={{ background: 'var(--surface)' }}
                      >
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Research Topics</h3>
                        <div className="space-y-2">
                          {analyticsData.topics.slice(0, 5).map((topic: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{topic.name}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {topic.count} papers
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
                    <p className="text-gray-600">
                      Start reading papers to see your research analytics and productivity insights.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4"
          style={{ background: 'var(--surface)', borderTop: `1px solid var(--border-subtle)` }}
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span style={{ color: 'var(--text-secondary)' }}>Research Hub v1.0</span>
              {selectedPapers.length > 0 && (
                <span className="font-medium" style={{ color: 'var(--primary)' }}>
                  {selectedPapers.length} papers selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>AI features available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
