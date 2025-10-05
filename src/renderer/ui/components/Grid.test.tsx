import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Grid } from './Grid';

describe('Grid', () => {
  it('renders items correctly', () => {
    const items = [
      { id: '1', title: 'Test Paper 1', meta: '2023 • Venue' },
      { id: '2', title: 'Test Paper 2', meta: '2024 • Conference' },
    ];

    render(<Grid items={items} />);

    expect(screen.getByText('Test Paper 1')).toBeInTheDocument();
    expect(screen.getByText('Test Paper 2')).toBeInTheDocument();
    expect(screen.getByText('2023 • Venue')).toBeInTheDocument();
    expect(screen.getByText('2024 • Conference')).toBeInTheDocument();
  });

  it('renders empty grid when no items', () => {
    const { container } = render(<Grid items={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
