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
          className="book-card loading-skeleton"
          style={{
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'both',
          }}
        >
          <div className="book-cover">
            <div className="book-spine"></div>
            <div className="book-front">
              <div className="book-title-badge skeleton-badge"></div>
              <div className="book-main-title skeleton-title"></div>
              <div className="book-status skeleton-status"></div>
              <div className="book-notes skeleton-notes"></div>
            </div>
            <div className="book-pages">
              <div className="page"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
