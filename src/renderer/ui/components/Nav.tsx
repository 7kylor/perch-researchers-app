import React from 'react';

type Item = { id: string; label: string };
const items: Item[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'reading', label: 'Reading list' },
  { id: 'discover', label: 'Discover' },
  { id: 'library', label: 'My library' },
];

export const Nav: React.FC = () => {
  return (
    <aside className="nav">
      {items.map((i) => (
        <button key={i.id} className="nav-item">
          {i.label}
        </button>
      ))}
    </aside>
  );
};



