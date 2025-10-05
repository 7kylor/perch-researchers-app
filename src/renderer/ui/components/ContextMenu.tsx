import React from 'react';

type ContextMenuProps = {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  items: Array<{
    label: string;
    icon: string | React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
  }>;
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ isOpen, x, y, onClose, items }) => {
  React.useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.context-menu')) {
          onClose();
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
      }}
    >
      <div className="context-menu-content">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            <span className="context-menu-icon">
              {typeof item.icon === 'string' ? item.icon : item.icon}
            </span>
            <span className="context-menu-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
