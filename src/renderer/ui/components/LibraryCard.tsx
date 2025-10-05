import type React from 'react';

type LibraryCardProps = {
  id: string;
  title: string;
  identifier: string;
  status: string;
  category: string;
  isNew?: boolean;
  count: number;
  onClick: (id: string) => void;
};

const cardColors = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#ef4444', // red
  '#84cc16', // lime
  '#f97316', // orange
  '#64748b', // slate
];

export const LibraryCard: React.FC<LibraryCardProps> = ({
  id,
  title,
  identifier,
  status,
  category,
  isNew = false,
  count,
  onClick,
}) => {
  const colorIndex =
    id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % cardColors.length;
  const backgroundColor = cardColors[colorIndex];

  return (
    <button
      type="button"
      className="library-card"
      style={{ backgroundColor }}
      onClick={() => onClick(id)}
    >
      <div className="card-tag">
        {isNew && <span className="new-badge">NEW • </span>}
        {category}
      </div>
      <div className="card-content">
        <div className="card-title">{title || identifier}</div>
        <div className="card-status">{status}</div>
      </div>
      <div className="card-footer">
        <span className="card-icon">📄</span>
        <span className="card-count">{count}</span>
      </div>
    </button>
  );
};
