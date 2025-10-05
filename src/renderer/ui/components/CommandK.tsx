import React from 'react';

export const CommandK: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal className="cmdk">
      <input className="cmdk-input" placeholder="Type a command…" autoFocus />
    </div>
  );
};



