import React from 'react';
import { Library, Brain, Plus, User, Settings, HelpCircle, LogOut } from 'lucide-react';

type NavbarProps = {
  currentView?: string;
  onViewChange?: (view: 'library' | 'research') => void;
  onAddPaperClick?: () => void;
  onSettingsClick?: () => void;
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView = 'library',
  onViewChange,
  onAddPaperClick,
  onSettingsClick,
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

  const getTitleForView = (view: string) => {
    switch (view) {
      case 'library':
        return 'Library';
      case 'research':
        return 'Semantic Research';
      default:
        return 'Researchers App';
    }
  };

  const getNavButtonClass = (route: string) => {
    return `navbar-nav-button ${currentView === route ? 'navbar-nav-button-active' : ''}`;
  };

  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">{/* Window controls are handled by Electron natively */}</div>

        <div className="navbar-center">
          <div className="navbar-title">
            <span className="navbar-brand">Perch</span>
            <span className="navbar-separator">•</span>
            <span className="navbar-current-view">{getTitleForView(currentView)}</span>
          </div>
        </div>

        <div className="navbar-right">
          <nav className="navbar-nav">
            <button
              type="button"
              className={getNavButtonClass('library')}
              onClick={() => onViewChange?.('library')}
              title="Library"
            >
              <Library size={16} />
            </button>
            <button
              type="button"
              className={getNavButtonClass('research')}
              onClick={() => onViewChange?.('research')}
              title="Semantic Research"
            >
              <Brain size={16} />
            </button>
            <button
              type="button"
              className="navbar-nav-button"
              onClick={onAddPaperClick}
              title="Add Research Paper"
            >
              <Plus size={16} />
            </button>
            <div className="navbar-user" ref={userMenuRef}>
              <button
                type="button"
                className="navbar-nav-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title="Account menu"
              >
                <User size={16} />
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
          </nav>
        </div>
      </div>
    </header>
  );
};
