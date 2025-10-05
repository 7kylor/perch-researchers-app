import type React from 'react';

type EmptyStateProps = {
  category: string;
  onAddItem: () => void;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ category, onAddItem }) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
      case 'ai-models':
        return 'AI Models';
      case 'ml':
        return 'ML';
      case 'segmentation':
        return 'Segmentation';
      default:
        return 'Library';
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-icon">📚</div>
      <h3 className="empty-title">No {getCategoryDisplayName(category)} found</h3>
      <p className="empty-description">
        Start building your library by adding your first paper or document.
      </p>
      <button type="button" className="empty-action" onClick={onAddItem}>
        Add your first item
      </button>
    </div>
  );
};
