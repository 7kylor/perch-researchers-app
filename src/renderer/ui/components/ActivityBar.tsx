import React from 'react';
import { Settings, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

type ActivityBarProps = {
  currentCategory: string;
  onSettingsClick: () => void;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
};

export const ActivityBar: React.FC<ActivityBarProps> = ({
  currentCategory,
  onSettingsClick,
  isSidebarCollapsed,
  onSidebarToggle,
}) => {
  return (
    <header className="activity-bar">
      {/* Left section - Sidebar toggle only */}
      <div className="activity-left">
        <button
          type="button"
          className="activity-sidebar-toggle"
          onClick={onSidebarToggle}
          title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="h-3 w-3" />
          ) : (
            <PanelLeftClose className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Center section - App name only */}
      <div className="activity-center">
        <h1 className="activity-title">Perch</h1>
      </div>

      {/* Right section - Settings icon */}
      <div className="activity-right">
        <button
          type="button"
          className="activity-compact-btn"
          onClick={onSettingsClick}
          title="Settings"
        >
          <Settings className="h-3 w-3" />
        </button>
      </div>
    </header>
  );
};
