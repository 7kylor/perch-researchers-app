import React from 'react';
import { BookOpen } from 'lucide-react';

type EmptyStateProps = {
  category: string;
  onAddItem: () => void;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ category, onAddItem }) => {
  const getCategoryDisplayName = (categoryId: string) => {
    switch (categoryId) {
      case 'all':
        return 'papers';
      case 'recent':
        return 'recent papers';
      case 'ai-models':
        return 'AI models';
      case 'ml':
        return 'ML papers';
      case 'segmentation':
        return 'segmentation papers';
      default:
        // Try to find the category name from localStorage
        try {
          const saved = localStorage.getItem('categories');
          if (saved) {
            const categories = JSON.parse(saved);
            const category = categories.find((c: any) => c.id === categoryId);
            return category ? `${category.name.toLowerCase()} papers` : 'papers';
          }
        } catch {
          // Fall back to default
        }
        return 'papers';
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <BookOpen size={48} />
      </div>
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
