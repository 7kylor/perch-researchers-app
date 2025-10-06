import React, { useMemo } from 'react';
import type { SidebarNode } from '../../../../shared/sidebar';
import { Folder, Tag } from 'lucide-react';

type SidebarTreeProps = {
  nodes: SidebarNode[];
  selectedId: string;
  collapsedIds: string[];
  onSelect: (id: string) => void;
  onToggleCollapse: (id: string, open: boolean) => void | Promise<void>;
  onMove?: (id: string, newParentId: string | null, newIndex: number) => void | Promise<void>;
};

type TreeNode = SidebarNode & { children: TreeNode[] };

type DropTarget = {
  targetId: string;
  position: 'before' | 'after' | 'inside';
};

export const SidebarTree: React.FC<SidebarTreeProps> = ({
  nodes,
  selectedId,
  collapsedIds,
  onSelect,
  onToggleCollapse,
  onMove,
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

  const byParent = useMemo(() => {
    const map = new Map<string | null, SidebarNode[]>();
    for (const n of nodes) {
      const list = map.get(n.parentId) ?? [];
      list.push(n);
      map.set(n.parentId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.orderIndex - b.orderIndex);
    return map;
  }, [nodes]);

  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null);

  function getSiblings(parentId: string | null, excludeId?: string): SidebarNode[] {
    const list = (byParent.get(parentId) ?? []).filter((n) =>
      excludeId ? n.id !== excludeId : true,
    );
    return list;
  }

  function handleKeyReorder(e: React.KeyboardEvent<HTMLButtonElement>, node: SidebarNode): void {
    if (!onMove || !e.altKey) return;
    const siblings = getSiblings(node.parentId);
    const currentIndex = siblings.findIndex((n) => n.id === node.id);
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const targetIndex = Math.max(0, currentIndex - 1);
      onMove(node.id, node.parentId, targetIndex);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const targetIndex = Math.min(siblings.length - 1, currentIndex + 1);
      onMove(node.id, node.parentId, targetIndex);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const parent = nodes.find((n) => n.id === node.parentId) ?? null;
      const newParentId = parent ? parent.parentId : null;
      const newIndex = getSiblings(newParentId).length;
      onMove(node.id, newParentId, newIndex);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const siblingsAll = getSiblings(node.parentId);
      const idx = siblingsAll.findIndex((n) => n.id === node.id);
      for (let i = idx - 1; i >= 0; i--) {
        const candidate = siblingsAll[i];
        if (candidate.type === 'folder') {
          const endIndex = getSiblings(candidate.id).length;
          onMove(node.id, candidate.id, endIndex);
          return;
        }
      }
    }
  }

  function computePosition(
    e: React.DragEvent<HTMLElement>,
    li: HTMLLIElement,
  ): 'before' | 'after' | 'inside' {
    const rect = li.getBoundingClientRect();
    const offset = e.clientY - rect.top;
    const third = rect.height / 3;
    if (offset < third) return 'before';
    if (offset > rect.height - third) return 'after';
    return 'inside';
  }

  function handleDropOnNode(
    e: React.DragEvent<HTMLLIElement>,
    target: SidebarNode,
    li: HTMLLIElement,
  ): void {
    if (!onMove) return;
    e.preventDefault();
    const dragged = e.dataTransfer.getData('text/plain');
    if (!dragged || dragged === target.id) return;
    const pos = computePosition(e, li);
    if (pos === 'inside' && target.type === 'folder') {
      const newParentId = target.id;
      const newIndex = getSiblings(newParentId).length;
      onMove(dragged, newParentId, newIndex);
    } else {
      const parentId = target.parentId;
      const siblings = getSiblings(parentId, dragged);
      const idx = siblings.findIndex((n) => n.id === target.id);
      const insertAt = pos === 'before' ? Math.max(0, idx) : Math.max(0, idx + 1);
      onMove(dragged, parentId, insertAt);
    }
    setDropTarget(null);
  }

  function handleDropOnList(e: React.DragEvent<HTMLUListElement>, parentId: string | null): void {
    if (!onMove) return;
    e.preventDefault();
    const dragged = e.dataTransfer.getData('text/plain');
    if (!dragged) return;
    const newIndex = getSiblings(parentId).length;
    onMove(dragged, parentId, newIndex);
    setDropTarget(null);
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    const isFolder = node.type === 'folder';
    const isCollapsed = collapsedIds.includes(node.id);
    const isDropBefore = dropTarget?.targetId === node.id && dropTarget.position === 'before';
    const isDropAfter = dropTarget?.targetId === node.id && dropTarget.position === 'after';
    const isDropInside =
      dropTarget?.targetId === node.id && dropTarget.position === 'inside' && isFolder;
    return (
      <li
        key={node.id}
        onDragOver={(e) => {
          e.preventDefault();
          const li = e.currentTarget as HTMLLIElement;
          const pos = computePosition(e, li);
          setDropTarget({ targetId: node.id, position: pos });
        }}
        onDragLeave={() => {
          setDropTarget((dt) => (dt && dt.targetId === node.id ? null : dt));
        }}
        onDrop={(e) => handleDropOnNode(e, node, e.currentTarget as HTMLLIElement)}
      >
        {isDropBefore && <div className="drop-indicator" />}
        <button
          type="button"
          className={`sidebar-item ${selectedId === node.id ? 'selected' : ''} ${isDropInside ? 'drop-into' : ''}`}
          onClick={() => onSelect(node.id)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', node.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onKeyDown={(e) => handleKeyReorder(e, node)}
        >
          <span className="item-icon" aria-hidden="true">
            {isFolder ? <Folder className="h-3 w-3" /> : <Tag className="h-3 w-3" />}
          </span>
          <span className="item-text">{node.name}</span>
        </button>
        {isDropAfter && <div className="drop-indicator" />}
        {isFolder && !isCollapsed && node.children.length > 0 && (
          <ul
            className="section-items"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnList(e, node.id)}
          >
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <ul
      className="section-items"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDropOnList(e, null)}
    >
      {tree.map((n) => renderNode(n))}
    </ul>
  );
};
