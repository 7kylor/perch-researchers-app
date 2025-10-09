import React from 'react';
import {
  Settings,
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Plus,
  ArrowUpDown,
  Calendar,
  User,
  X,
  Bot,
  BarChart3,
  Brain,
} from 'lucide-react';

type SortOption = 'recent' | 'title' | 'author' | 'year';

type ActivityBarProps = {
  onSettingsClick: () => void;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;

  // Debug props
  debug?: {
    renderCount?: number;
  };
  // Search props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  // Sort and add props
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onAddItem: () => void;
  // AI chat props
  onAIChatToggle: () => void;
  showAIChat: boolean;
  // Analytics props
  onAnalyticsToggle: () => void;
  showAnalytics: boolean;
  // Research Modal props
  onResearchModalToggle: () => void;
  showResearchModal: boolean;
};

export const ActivityBar: React.FC<ActivityBarProps> = ({
  onSettingsClick,
  isSidebarCollapsed,
  onSidebarToggle,
  debug,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onAddItem,
  onAIChatToggle,
  showAIChat,
  onAnalyticsToggle,
  showAnalytics,
  onResearchModalToggle,
  showResearchModal,
}) => {
  const renderCount = React.useRef(0);
  renderCount.current += 1;

  // Debug logging to track props
  console.log('🔄 ACTIVITYBAR RENDER:', {
    isSidebarCollapsed,
    renderCount: renderCount.current,
    debug: debug?.renderCount,
  });

  const [showSortDropdown, setShowSortDropdown] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && e.target && !sortRef.current.contains(e.target as HTMLElement)) {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortDropdown]);

  const sortOptions = [
    {
      value: 'recent' as SortOption,
      label: 'Recently Added',
      icon: <Calendar className="h-3 w-3" />,
    },
    { value: 'title' as SortOption, label: 'Title', icon: <ArrowUpDown className="h-3 w-3" /> },
    { value: 'author' as SortOption, label: 'Author', icon: <User className="h-3 w-3" /> },
    { value: 'year' as SortOption, label: 'Year', icon: <Calendar className="h-3 w-3" /> },
  ];

  return (
    <header className="activity-bar">
      {/* Left section - Logo and Sidebar toggle */}
      <div className="activity-left">
        <button
          type="button"
          className="activity-sidebar-toggle"
          onClick={onSidebarToggle}
          title={isSidebarCollapsed ? 'Show sidebar (⌘B)' : 'Hide sidebar (⌘B)'}
          aria-label={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div className="activity-divider" />
        <h1 className="activity-title">Perch</h1>
      </div>

      {/* Center section - Search */}
      <div className="activity-center">
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search papers by title, author, or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" onClick={() => onSearchChange('')}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="activity-right">
        {/* Sort Dropdown */}
        <div className="activity-actions" ref={sortRef}>
          <button
            type="button"
            className="activity-compact-btn"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            title="Sort papers"
          >
            <ArrowUpDown size={18} />
          </button>

          {showSortDropdown && (
            <div className="quick-actions-menu">
              <div className="quick-actions-section">
                <div className="quick-action-label">Sort by</div>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`quick-action-item ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => {
                      onSortChange(option.value);
                      setShowSortDropdown(false);
                    }}
                  >
                    {option.icon}
                    <div className="quick-action-content">
                      <div className="quick-action-title">{option.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analytics Button */}
        <button
          type="button"
          className={`activity-compact-btn ${showAnalytics ? 'active' : ''}`}
          onClick={onAnalyticsToggle}
          title={showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        >
          <BarChart3 size={18} />
        </button>

        {/* AI Chat Button */}
        <button
          type="button"
          className={`activity-compact-btn ${showAIChat ? 'active' : ''}`}
          onClick={onAIChatToggle}
          title={showAIChat ? 'Hide AI Assistant' : 'Show AI Assistant'}
        >
          <Bot size={18} />
        </button>

        {/* Research Modal Button */}
        <button
          type="button"
          className={`activity-compact-btn ${showResearchModal ? 'active' : ''}`}
          onClick={onResearchModalToggle}
          title={showResearchModal ? 'Hide Research & Analytics' : 'Show Research & Analytics'}
        >
          <Brain size={18} />
        </button>

        {/* Add Paper Button */}
        <button
          type="button"
          className="activity-compact-btn add-btn"
          onClick={onAddItem}
          title="Add new paper"
        >
          <Plus size={18} />
          <span>Add Paper</span>
        </button>

        <button
          type="button"
          className="activity-compact-btn"
          onClick={onSettingsClick}
          title="Settings (⌘,)"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
