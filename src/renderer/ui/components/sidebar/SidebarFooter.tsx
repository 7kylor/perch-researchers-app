import React from 'react';

export const SidebarFooter: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  return (
    <div className={`sidebar-footer ${collapsed ? 'collapsed' : ''}`}>
      <button
        type="button"
        className={`sidebar-item sidebar-account-btn ${collapsed ? 'collapsed' : ''}`}
      >
        <div className="sidebar-avatar" aria-hidden="true">
          JD
        </div>
        <span className={`item-text ${collapsed ? 'hidden' : ''}`}>John Doe</span>
      </button>
    </div>
  );
};
