import React from 'react';

export type GridProps = {
  items: Array<{ id: string; title: string; meta?: string }>;
};

export const Grid: React.FC<GridProps> = ({ items }) => {
  return (
    <div className="grid-cards">
      {items.map((i) => (
        <div key={i.id} className="card">
          <div className="card-title">{i.title}</div>
          {i.meta && <div className="card-meta">{i.meta}</div>}
        </div>
      ))}
    </div>
  );
};
