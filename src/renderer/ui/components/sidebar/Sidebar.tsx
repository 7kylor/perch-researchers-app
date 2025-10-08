import React from 'react';
import { useSidebarStore } from '../../sidebar/store';
import { SidebarTree } from './SidebarTree';
import { BookOpen, Clock, FolderOpen, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';
import type { SidebarNode } from '../../../../shared/sidebar';

type SidebarProps = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export const Sidebar: React.FC<SidebarProps> = ({ selectedId, onSelect }) => {
  const { nodes, prefs, counts, actions } = useSidebarStore();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [categoriesExpanded, setCategoriesExpanded] = React.useState(true);

  // Debug logging
  React.useEffect(() => {
    console.log('Sidebar component re-rendered, collapsed state:', prefs.sidebarCollapsed);
  }, [prefs.sidebarCollapsed]);

  // Count the actual number of categories (folders and labels)
  const categoryCount = React.useMemo(() => {
    return nodes.filter((node: SidebarNode) => node.type === 'folder' || node.type === 'label')
      .length;
  }, [nodes]);

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
    setTimeout(() => {
      const el = document.getElementById(`sidebar-rename-input-${id}`);
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

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const addLabelRoot = async () => {
    const id = await actions.create({ type: 'label', name: 'New Category', parentId: null });
    startRename(id, 'New Category');
  };

  const deleteNode = async (id: string) => {
    if (confirm('Delete this category?')) {
      await actions.remove(id);
      if (selectedId === id) onSelect('builtin:all');
    }
  };

  if (prefs.sidebarCollapsed) {
    return <nav className="library-sidebar collapsed" aria-label="Sidebar" />;
  }

  return (
    <nav className="library-sidebar" aria-label="Sidebar">
      <div className="sidebar-grid">
        {/* Main Navigation Section */}
        <div className="sidebar-section categories-section">
          <ul className="section-items">
            <li>
              <button
                type="button"
                className={`sidebar-item ${selectedId === 'builtin:all' ? 'selected' : ''}`}
                aria-current={selectedId === 'builtin:all' ? 'page' : undefined}
                onClick={() => onSelect('builtin:all')}
              >
                <span className="item-icon" aria-hidden="true">
                  <BookOpen size={16} />
                </span>
                <span className="item-text">All Papers</span>
                <span className="item-count">
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
                  <Clock size={16} />
                </span>
                <span className="item-text">Recent</span>
                <span className="item-count">
                  {counts.find((c) => c.nodeId === 'builtin:recent')?.paperCount ?? 0}
                </span>
              </button>
            </li>
            <li>
              <div className="categories-header">
                <button
                  type="button"
                  className={`sidebar-item ${selectedId === 'builtin:categories' ? 'selected' : ''}`}
                  aria-current={selectedId === 'builtin:categories' ? 'page' : undefined}
                  onClick={() => {
                    onSelect('builtin:categories');
                    setCategoriesExpanded(!categoriesExpanded);
                  }}
                >
                  <span className="item-icon" aria-hidden="true">
                    <FolderOpen size={16} />
                  </span>
                  <span className="item-text">Categories</span>
                  <div className="item-expand-indicator">
                    {categoriesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                  <span className="item-count">{categoryCount}</span>
                </button>
                <button
                  type="button"
                  className="section-action-btn categories-add-btn"
                  onClick={addLabelRoot}
                  title="Add category"
                >
                  <Plus size={14} />
                </button>
              </div>
              {/* Categories Section - now nested under main Categories item */}
              {categoriesExpanded && (
                <div className="sidebar-section sidebar-section-scrollable nested-categories">
                  <div className="categories-scroll-container">
                    <SidebarTree
                      nodes={nodes}
                      collapsedIds={prefs.collapsedNodeIds}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onMove={(id, parentId, index) => actions.move(id, parentId, index)}
                      _onToggleCollapse={async (id: string, open: boolean) => {
                        const set = new Set(prefs.collapsedNodeIds);
                        if (!open) set.add(id);
                        else set.delete(id);
                        await actions.setCollapsedNodeIds(Array.from(set));
                      }}
                      renamingId={renamingId}
                      renameValue={renameValue}
                      onRenameChange={setRenameValue}
                      onRenameCommit={commitRename}
                      onRenameCancel={cancelRename}
                      onRenameStart={startRename}
                      onRequestDelete={deleteNode}
                    />
                  </div>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>

      <SidebarFooter collapsed={false} user={{ name: 'User', email: 'user@example.com' }} />
    </nav>
  );
};
