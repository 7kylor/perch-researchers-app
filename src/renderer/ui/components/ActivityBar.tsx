import React from 'react';
import { Settings, PanelLeftOpen, PanelLeftClose, HelpCircle, Command } from 'lucide-react';

type ActivityBarProps = {
  onSettingsClick: () => void;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
};

export const ActivityBar: React.FC<ActivityBarProps> = ({
  onSettingsClick,
  isSidebarCollapsed,
  onSidebarToggle,
}) => {
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const quickActionsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        quickActionsRef.current &&
        e.target &&
        !quickActionsRef.current.contains(e.target as HTMLElement)
      ) {
        setShowQuickActions(false);
      }
    };

    if (showQuickActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQuickActions]);

  return (
    <header className="activity-bar">
      {/* Left section - Logo and Sidebar toggle */}
      <div className="activity-left">
        <button
          type="button"
          className="activity-sidebar-toggle"
          onClick={onSidebarToggle}
          title={isSidebarCollapsed ? 'Show sidebar (⌘B)' : 'Hide sidebar (⌘B)'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div className="activity-divider" />
        <h1 className="activity-title">Perch</h1>
      </div>

      {/* Right section - Actions */}
      <div className="activity-right">
        <div className="activity-actions" ref={quickActionsRef}>
          <button
            type="button"
            className="activity-compact-btn"
            onClick={() => setShowQuickActions(!showQuickActions)}
            title="Quick actions (⌘K)"
          >
            <Command size={18} />
          </button>

          {showQuickActions && (
            <div className="quick-actions-menu">
              <div className="quick-actions-section">
                <div className="quick-action-label">Quick Actions</div>
                <button type="button" className="quick-action-item" onClick={onSettingsClick}>
                  <Settings className="quick-action-icon" />
                  <div className="quick-action-content">
                    <div className="quick-action-title">Settings</div>
                    <div className="quick-action-shortcut">⌘,</div>
                  </div>
                </button>
                <button type="button" className="quick-action-item">
                  <HelpCircle className="quick-action-icon" />
                  <div className="quick-action-content">
                    <div className="quick-action-title">Help & Shortcuts</div>
                    <div className="quick-action-shortcut">⌘?</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

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
