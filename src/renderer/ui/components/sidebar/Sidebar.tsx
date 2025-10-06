import React from 'react';
import { useSidebarStore } from '../../sidebar/store';
import { SidebarTree } from './SidebarTree';
import { BookOpen, Clock, FolderOpen } from 'lucide-react';

type SidebarProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ selectedId, onSelect }) => {
  const { nodes, prefs, counts, actions } = useSidebarStore();

  return (
    <nav
      className={`library-sidebar ${prefs.sidebarCollapsed ? 'collapsed' : ''}`}
      aria-label="Library sidebar"
    >
      {/* Built-ins */}
      <div className="sidebar-section">
        <h3 className={`section-title ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>Library</h3>
        <ul className="section-items">
          <li>
            <button
              type="button"
              className={`sidebar-item ${selectedId === 'builtin:all' ? 'selected' : ''}`}
              aria-current={selectedId === 'builtin:all' ? 'page' : undefined}
              onClick={() => onSelect('builtin:all')}
            >
              <span className="item-icon" aria-hidden="true">
                <BookOpen className="h-3 w-3" />
              </span>
              <span className={`item-text ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                All Papers
              </span>
              <span className={`item-count ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                {counts.find((c) => c.nodeId === 'builtin:all')?.paperCount ?? 0}
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sidebar-item ${selectedId === 'builtin:recent' ? 'selected' : ''}`}
              aria-current={selectedId === 'builtin:recent' ? 'page' : undefined}
              onClick={() => onSelect('builtin:recent')}
            >
              <span className="item-icon" aria-hidden="true">
                <Clock className="h-3 w-3" />
              </span>
              <span className={`item-text ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>Recent</span>
              <span className={`item-count ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                {counts.find((c) => c.nodeId === 'builtin:recent')?.paperCount ?? 0}
              </span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className={`sidebar-item ${selectedId === 'builtin:unfiled' ? 'selected' : ''}`}
              aria-current={selectedId === 'builtin:unfiled' ? 'page' : undefined}
              onClick={() => onSelect('builtin:unfiled')}
            >
              <span className="item-icon" aria-hidden="true">
                <FolderOpen className="h-3 w-3" />
              </span>
              <span className={`item-text ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>Unfiled</span>
              <span className={`item-count ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                {counts.find((c) => c.nodeId === 'builtin:unfiled')?.paperCount ?? 0}
              </span>
            </button>
          </li>
        </ul>
      </div>

      {/* User Tree */}
      <SidebarTree
        nodes={nodes}
        collapsedIds={prefs.collapsedNodeIds}
        selectedId={selectedId}
        onSelect={onSelect}
        onToggleCollapse={async (id, open) => {
          const set = new Set(prefs.collapsedNodeIds);
          if (!open) set.add(id);
          else set.delete(id);
          await actions.setCollapsedNodeIds(Array.from(set));
        }}
      />
    </nav>
  );
};
