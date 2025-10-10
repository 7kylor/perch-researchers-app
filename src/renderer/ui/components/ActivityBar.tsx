import React from 'react';
import { Settings, User, HelpCircle, LogOut, Library, Brain, FileText, Bell } from 'lucide-react';

type ActivityBarProps = {
  onSettingsClick: () => void;
  currentRoute?: string;
  onViewChange: (view: 'library' | 'research' | 'reports' | 'alerts') => void;
};

export const ActivityBar: React.FC<ActivityBarProps> = ({
  onSettingsClick,
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

  const getNavLinkClass = (route: string) => {
    return `top-nav-link ${currentRoute === route ? 'top-nav-link-active' : ''}`;
  };

  return (
    <header className="activity-bar">
      {/* Left section - Brand and Navigation */}
      <div className="activity-left">
        <h1 className="activity-title">Perch</h1>
        <nav className="top-nav">
          <button
            type="button"
            className={getNavLinkClass('library')}
            onClick={() => onViewChange('library')}
          >
            <Library size={16} />
            Library
          </button>
          <button
            type="button"
            className={getNavLinkClass('research')}
            onClick={() => onViewChange('research')}
          >
            <Brain size={16} />
            Semantic research
          </button>
          <button
            type="button"
            className={getNavLinkClass('reports')}
            onClick={() => onViewChange('reports')}
          >
            <FileText size={16} />
            Reports
          </button>
          <button
            type="button"
            className={getNavLinkClass('alerts')}
            onClick={() => onViewChange('alerts')}
          >
            <Bell size={16} />
            Alerts
          </button>
        </nav>
      </div>

      {/* Right section - User and Settings */}
      <div className="activity-right">
        <div className="activity-user" ref={userMenuRef}>
          <button
            type="button"
            className="activity-compact-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            title="Account menu"
          >
            <User size={18} />
          </button>

          {showUserMenu && (
            <div className="user-menu">
              <div className="user-menu-item">
                <User size={14} />
                <span>talikim@gmail.com</span>
              </div>
              <div className="user-menu-divider" />
              <button type="button" className="user-menu-item" onClick={onSettingsClick}>
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button type="button" className="user-menu-item">
                <HelpCircle size={14} />
                <span>Help</span>
              </button>
              <div className="user-menu-divider" />
              <button type="button" className="user-menu-item user-menu-logout">
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
