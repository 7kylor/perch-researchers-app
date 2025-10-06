import React, { useMemo } from 'react';
import type { SidebarNode } from '../../../../shared/sidebar';
import { Folder, Tag } from 'lucide-react';

type SidebarTreeProps = {
  nodes: SidebarNode[];
  selectedId: string;
  collapsedIds: string[];
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string, open: boolean) => void | Promise<void>;
};

type TreeNode = SidebarNode & { children: TreeNode[] };

export const SidebarTree: React.FC<SidebarTreeProps> = ({
  nodes,
  selectedId,
  collapsedIds,
  onSelect,
  onToggleCollapse,
}) => {
  const tree = useMemo(() => {
    const byParent = new Map<string | null, TreeNode[]>();
    for (const n of nodes) {
      const tn: TreeNode = { ...n, children: [] };
      const list = byParent.get(n.parentId) ?? [];
      list.push(tn);
      byParent.set(n.parentId, list);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => a.orderIndex - b.orderIndex);
    }
    function attach(node: TreeNode): TreeNode {
      node.children = (byParent.get(node.id) ?? []).map(attach);
      return node;
    }
    return (byParent.get(null) ?? []).map(attach);
  }, [nodes]);

  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isCollapsed = collapsedIds.includes(node.id);
    return (
      <li key={node.id}>
        <button
          type="button"
          className={`sidebar-item ${selectedId === node.id ? 'selected' : ''}`}
          onClick={() => onSelect(node.id)}
        >
          <span className="item-icon" aria-hidden="true">
            {isFolder ? <Folder className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
          </span>
          <span className="item-text">{node.name}</span>
        </button>
        {isFolder && !isCollapsed && node.children.length > 0 && (
          <ul className="section-items">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="sidebar-section">
      <h3 className="section-title">Categories</h3>
      <ul className="section-items">{tree.map((n) => renderNode(n))}</ul>
    </div>
  );
};
