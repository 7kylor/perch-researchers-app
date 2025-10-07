import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from './Toast';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckCircle: ({ size }: { size: number }) => (
    <div data-testid="check-circle-icon" data-size={size} />
  ),
  AlertCircle: ({ size }: { size: number }) => (
    <div data-testid="alert-circle-icon" data-size={size} />
  ),
  Info: ({ size }: { size: number }) => <div data-testid="info-icon" data-size={size} />,
  X: ({ size }: { size: number }) => <div data-testid="x-icon" data-size={size} />,
}));

describe('Toast', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when not visible', () => {
    render(<Toast message="Test message" type="success" isVisible={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('renders success toast with correct styling and icon', () => {
    render(
      <Toast message="Success message" type="success" isVisible={true} onClose={mockOnClose} />,
    );

    const toast = screen.getByText('Success message').closest('.toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveStyle({ backgroundColor: 'rgb(16, 185, 129)' });

    const icon = screen.getByTestId('check-circle-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-size', '16');
  });

  it('renders error toast with correct styling and icon', () => {
    render(<Toast message="Error message" type="error" isVisible={true} onClose={mockOnClose} />);

    const toast = screen.getByText('Error message').closest('.toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveStyle({ backgroundColor: 'rgb(239, 68, 68)' });

    const icon = screen.getByTestId('alert-circle-icon');
    expect(icon).toBeInTheDocument();
  });

  it('renders info toast with correct styling and icon', () => {
    render(<Toast message="Info message" type="info" isVisible={true} onClose={mockOnClose} />);

    const toast = screen.getByText('Info message').closest('.toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveStyle({ backgroundColor: 'rgb(59, 130, 246)' });

    const icon = screen.getByTestId('info-icon');
    expect(icon).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast message="Test message" type="success" isVisible={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('x-icon').closest('button');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after 3 seconds', async () => {
    await act(async () => {
      render(
        <Toast
          message="Auto-close message"
          type="success"
          isVisible={true}
          onClose={mockOnClose}
        />,
      );
    });

    // Toast should be visible initially
    expect(screen.getByText('Auto-close message')).toBeInTheDocument();

    // Fast-forward time by 3 seconds
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('clears timeout when component unmounts', async () => {
    let unmount: () => void;

    await act(async () => {
      const result = render(
        <Toast message="Unmount message" type="success" isVisible={true} onClose={mockOnClose} />,
      );
      unmount = result.unmount;
    });

    expect(screen.getByText('Unmount message')).toBeInTheDocument();

    // Unmount before the 3-second timeout
    await act(async () => {
      unmount();
    });

    // Fast-forward time - should not call onClose since component was unmounted
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('restarts timer when isVisible changes', async () => {
    let rerender: (ui: React.ReactElement) => void;

    await act(async () => {
      const result = render(
        <Toast
          message="Restart timer message"
          type="success"
          isVisible={true}
          onClose={mockOnClose}
        />,
      );
      rerender = result.rerender;
    });

    // Advance time but not enough to trigger auto-close
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(mockOnClose).not.toHaveBeenCalled();

    // Change visibility to false then back to true - should restart the timer
    await act(async () => {
      rerender(
        <Toast
          message="Restart timer message"
          type="success"
          isVisible={false}
          onClose={mockOnClose}
        />,
      );
    });

    await act(async () => {
      rerender(
        <Toast
          message="Restart timer message"
          type="success"
          isVisible={true}
          onClose={mockOnClose}
        />,
      );
    });

    // Should not have called onClose yet since timer restarted
    expect(mockOnClose).not.toHaveBeenCalled();

    // Advance full 3 seconds from when it became visible again
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
