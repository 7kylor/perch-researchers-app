import React from 'react';
import { User, Settings, HelpCircle, LogOut, ChevronUp } from 'lucide-react';

type SidebarFooterProps = {
  collapsed: boolean;
};

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ collapsed }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

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

  if (collapsed) return null;

  return (
    <div className="sidebar-footer" ref={menuRef}>
      {showMenu && (
        <div className="sidebar-account-menu">
          <button type="button" className="account-menu-item">
            <User className="menu-item-icon" />
            <span>Profile</span>
          </button>
          <button type="button" className="account-menu-item">
            <Settings className="menu-item-icon" />
            <span>Settings</span>
          </button>
          <button type="button" className="account-menu-item">
            <HelpCircle className="menu-item-icon" />
            <span>Help</span>
          </button>
          <div className="account-menu-divider" />
          <button type="button" className="account-menu-item danger">
            <LogOut className="menu-item-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
      <button type="button" className="sidebar-account-btn" onClick={() => setShowMenu(!showMenu)}>
        <div className="sidebar-avatar">
          <User size={16} />
        </div>
        <div className="account-info">
          <div className="account-name">John Doe</div>
          <div className="account-email">john@example.com</div>
        </div>
        <ChevronUp size={16} className={`account-chevron ${showMenu ? 'rotated' : ''}`} />
      </button>
    </div>
  );
};
