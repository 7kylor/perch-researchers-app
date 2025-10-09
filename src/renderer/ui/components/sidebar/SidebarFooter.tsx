import React from 'react';
import { User, Settings, HelpCircle, LogOut, ChevronUp } from 'lucide-react';

type UserProfile = {
  name: string;
  email: string;
  avatar?: string;
};

type SidebarFooterProps = {
  collapsed: boolean;
  user?: UserProfile;
};

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed, user }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const handleProfile = () => {
    // TODO: Open user profile modal/page
    setShowMenu(false);
  };

  const handleSettings = () => {
    // TODO: Open settings modal
    setShowMenu(false);
  };

  const handleHelp = () => {
    // TODO: Open help/documentation
    setShowMenu(false);
  };

  const handleSignOut = () => {
    // TODO: Implement sign out logic
    if (confirm('Are you sure you want to sign out?')) {
      // Handle sign out
    }
    setShowMenu(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && e.target && !menuRef.current.contains(e.target as HTMLElement)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  if (collapsed) {
    return (
      <div className="sidebar-collapsed-footer">
        <button
          type="button"
          className="sidebar-collapsed-profile"
          onClick={() => setShowMenu(!showMenu)}
          data-tooltip={`${user?.name || 'User'}`}
          title={`${user?.name || 'User'} - ${user?.email || ''}`}
        >
          <div className="sidebar-collapsed-avatar">
            {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <User size={16} />}
          </div>
        </button>
        {showMenu && (
          <div className="sidebar-collapsed-menu">
            <button type="button" className="collapsed-menu-item" onClick={handleProfile}>
              <User className="menu-item-icon" />
              <span>Profile</span>
            </button>
            <button type="button" className="collapsed-menu-item" onClick={handleSettings}>
              <Settings className="menu-item-icon" />
              <span>Settings</span>
            </button>
            <button type="button" className="collapsed-menu-item" onClick={handleHelp}>
              <HelpCircle className="menu-item-icon" />
              <span>Help</span>
            </button>
            <div className="collapsed-menu-divider" />
            <button type="button" className="collapsed-menu-item danger" onClick={handleSignOut}>
              <LogOut className="menu-item-icon" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sidebar-footer" ref={menuRef}>
      {showMenu && (
        <div className="sidebar-account-menu">
          <button type="button" className="account-menu-item" onClick={handleProfile}>
            <User className="menu-item-icon" />
            <span>Profile</span>
          </button>
          <button type="button" className="account-menu-item" onClick={handleSettings}>
            <Settings className="menu-item-icon" />
            <span>Settings</span>
          </button>
          <button type="button" className="account-menu-item" onClick={handleHelp}>
            <HelpCircle className="menu-item-icon" />
            <span>Help</span>
          </button>
          <div className="account-menu-divider" />
          <button type="button" className="account-menu-item danger" onClick={handleSignOut}>
            <LogOut className="menu-item-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
      <button type="button" className="sidebar-account-btn" onClick={() => setShowMenu(!showMenu)}>
        <div className="sidebar-avatar">
          {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <User size={16} />}
        </div>
        <div className="account-info">
          <div className="account-name">{user?.name || 'User'}</div>
          <div className="account-email">{user?.email || ''}</div>
        </div>
        <ChevronUp size={16} className={`account-chevron ${showMenu ? 'rotated' : ''}`} />
      </button>
    </div>
  );
};
