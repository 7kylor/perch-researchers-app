import React from 'react';
import {
  Settings,
  User,
  HelpCircle,
  LogOut,
  Library,
  Brain,
  FileText,
  History,
  Plus,
} from 'lucide-react';

type ActivityBarProps = {
  onSettingsClick: () => void;
  onAddPaperClick?: () => void;
  currentRoute?: string;
  onViewChange: (view: 'library' | 'research' | 'reports' | 'recent') => void;
};

export const ActivityBar: React.FC<ActivityBarProps> = ({
  onSettingsClick,
  onAddPaperClick,
  currentRoute = 'research',
  onViewChange,
}) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        e.target &&
        !userMenuRef.current.contains(e.target as HTMLElement)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const getNavButtonClass = (route: string) => {
    return `nav-button ${currentRoute === route ? 'nav-button-active' : ''}`;
  };

  return (
    <header className="activity-bar">
      {/* Left section - Brand and Navigation */}
      <div className="activity-left" style={{ marginLeft: '200px' }}>
        <div className="activity-brand">
          <h1 className="activity-title">Perch</h1>
        </div>
        <nav className="main-nav">
          <button
            type="button"
            className={getNavButtonClass('library')}
            onClick={() => onViewChange('library')}
          >
            <Library size={16} />
            <span>Library</span>
          </button>
          <button
            type="button"
            className={getNavButtonClass('research')}
            onClick={() => onViewChange('research')}
          >
            <Brain size={16} />
            <span>Semantic research</span>
          </button>
          <button
            type="button"
            className={getNavButtonClass('reports')}
            onClick={() => onViewChange('reports')}
          >
            <FileText size={16} />
            <span>Reports</span>
          </button>
          <button
            type="button"
            className={getNavButtonClass('recent')}
            onClick={() => onViewChange('recent')}
          >
            <History size={16} />
            <span>Recent</span>
          </button>
        </nav>
      </div>

      {/* Right section - User and Settings */}
      <div className="activity-right" style={{ marginRight: '100px' }}>
        <button
          type="button"
          className="nav-button add-paper-button"
          onClick={onAddPaperClick}
          title="Add Research Paper"
        >
          <Plus size={16} />
          <span>Add Paper</span>
        </button>
        <div className="activity-user" ref={userMenuRef}>
          <button
            type="button"
            className="user-menu-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Account menu"
          >
            <User size={18} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <User size={14} />
                <span>talikim@gmail.com</span>
              </div>
              <div className="dropdown-divider" />
              <button type="button" className="dropdown-item" onClick={onSettingsClick}>
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button type="button" className="dropdown-item">
                <HelpCircle size={14} />
                <span>Help</span>
              </button>
              <div className="dropdown-divider" />
              <button type="button" className="dropdown-item dropdown-item-danger">
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
