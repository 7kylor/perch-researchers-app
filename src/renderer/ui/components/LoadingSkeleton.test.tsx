import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSkeleton } from './LoadingSkeleton';
import React from 'react';

describe('LoadingSkeleton', () => {
  it('renders the default number of skeleton items', () => {
    render(<LoadingSkeleton />);

    // Should render 6 skeleton items by default
    const skeletonItems = screen.getAllByText('', { selector: '.book-card.loading-skeleton' });
    expect(skeletonItems).toHaveLength(6);
  });

  it('renders the specified number of skeleton items', () => {
    render(<LoadingSkeleton count={3} />);

    // Should render 3 skeleton items when count is specified
    const skeletonItems = screen.getAllByText('', { selector: '.book-card.loading-skeleton' });
    expect(skeletonItems).toHaveLength(3);
  });

  it('renders with correct CSS classes and structure', () => {
    render(<LoadingSkeleton count={2} />);

    // Check that the main container has the correct class
    const container = screen.getByText('', { selector: '.library-grid' });
    expect(container).toBeInTheDocument();

    // Check that each skeleton item has the loading-skeleton class
    const skeletonItems = screen.getAllByText('', { selector: '.book-card.loading-skeleton' });
    skeletonItems.forEach((item) => {
      expect(item).toHaveClass('loading-skeleton');
    });

    // Check that book-cover elements exist
    const bookCovers = screen.getAllByText('', { selector: '.book-cover' });
    expect(bookCovers).toHaveLength(2);
  });

  it('applies animation delay styles correctly', () => {
    render(<LoadingSkeleton count={3} />);

    const skeletonItems = screen.getAllByText('', { selector: '.book-card.loading-skeleton' });

    // Check that each item has animation delay applied
    skeletonItems.forEach((item, index) => {
      const style = window.getComputedStyle(item);
      expect(style.animationDelay).toBe(`${index * 0.1}s`);
    });
  });
});
