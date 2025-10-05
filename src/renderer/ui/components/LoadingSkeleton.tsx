import type React from 'react';

type LoadingSkeletonProps = {
  count?: number;
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="library-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="library-card loading-skeleton"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both',
          }}
        >
          <div className="skeleton-tag" />
          <div className="skeleton-content">
            <div className="skeleton-title" />
            <div className="skeleton-status" />
          </div>
          <div className="skeleton-footer">
            <div className="skeleton-icon" />
            <div className="skeleton-count" />
          </div>
        </div>
      ))}
    </div>
  );
};
