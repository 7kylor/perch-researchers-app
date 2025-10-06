import React from 'react';
import { useSidebarStore } from '../../sidebar/store';
import { SidebarTree } from './SidebarTree';
import { BookOpen, Clock, FolderOpen, Plus } from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';

type SidebarProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ selectedId, onSelect }) => {
  const { nodes, prefs, counts, actions } = useSidebarStore();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
    setTimeout(() => {
      const el = document.getElementById('sidebar-rename-input');
      if (el) (el as HTMLInputElement).focus();
    }, 0);
  };

  const commitRename = async () => {
    if (renamingId && renameValue.trim()) {
      await actions.update(renamingId, { name: renameValue.trim() });
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const addLabelRoot = async () => {
    const id = await actions.create({ type: 'label', name: 'New Category', parentId: null });
    startRename(id, 'New Category');
  };

  const addFolderRoot = async () => {
    const id = await actions.create({ type: 'folder', name: 'New Folder', parentId: null });
    startRename(id, 'New Folder');
  };

  return (
    <nav
      className={`library-sidebar ${prefs.sidebarCollapsed ? 'collapsed' : ''}`}
      aria-label="Library sidebar"
    >
      <div className="sidebar-grid">
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
                <span className={`item-text ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                  Recent
                </span>
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
                <span className={`item-text ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                  Unfiled
                </span>
                <span className={`item-count ${prefs.sidebarCollapsed ? 'hidden' : ''}`}>
                  {counts.find((c) => c.nodeId === 'builtin:unfiled')?.paperCount ?? 0}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3 className="section-title">
            Categories
            {!prefs.sidebarCollapsed && (
              <button
                type="button"
                className="add-category-title-btn"
                title="Add category"
                aria-label="Add category"
                onClick={addLabelRoot}
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </h3>
          <SidebarTree
            nodes={nodes}
            collapsedIds={prefs.collapsedNodeIds}
            selectedId={selectedId}
            onSelect={onSelect}
            onMove={(id, parentId, index) => actions.move(id, parentId, index)}
            onToggleCollapse={async (id, open) => {
              const set = new Set(prefs.collapsedNodeIds);
              if (!open) set.add(id);
              else set.delete(id);
              await actions.setCollapsedNodeIds(Array.from(set));
            }}
          />
        </div>

        {renamingId && <div style={{ display: 'none' }} />}
      </div>

      <SidebarFooter collapsed={prefs.sidebarCollapsed} />

      {renamingId && (
        <input
          id={`sidebar-rename-input-${renamingId}`}
          className="category-edit-input"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setRenamingId(null);
              setRenameValue('');
            }
          }}
        />
      )}
    </nav>
  );
};
