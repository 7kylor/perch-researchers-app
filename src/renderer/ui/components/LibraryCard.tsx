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
  '#8b5cf6', // purple
  '#a855f7', // violet
  '#7c3aed', // indigo
  '#dc2626', // red
  '#ea580c', // orange
  '#059669', // emerald
  '#0891b2', // cyan
  '#7c2d12', // brown
  '#4338ca', // blue
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
