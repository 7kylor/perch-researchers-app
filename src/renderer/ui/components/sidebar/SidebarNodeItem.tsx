import type React from 'react';
import type { SidebarNode } from '../../../../shared/sidebar';

type SidebarNodeItemProps = {
  node: SidebarNode;
  selected: boolean;
  onSelect: (id: string) => void;
};

export const SidebarNodeItem: React.FC<SidebarNodeItemProps> = ({ node, selected, onSelect }) => {
  return (
    <button
      type="button"
      className={`sidebar-item ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(node.id)}
    >
      <span className="item-icon" aria-hidden="true">
        {node.type === 'folder' ? '📁' : '🏷️'}
      </span>
      <span className="item-text">{node.name}</span>
    </button>
  );
};
