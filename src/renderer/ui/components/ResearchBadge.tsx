import { getColor, withOpacity } from '../../../shared/utils/colors';

type ResearchBadgeProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'subtle' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * ResearchBadge component that uses the new research color
 * Demonstrates how to use the research color system
 */
export const ResearchBadge = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}: ResearchBadgeProps) => {
  const getVariantStyles = () => {
    const baseColor = getColor('PRIMARY');

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: baseColor,
          color: 'white',
          border: 'none',
        };
      case 'subtle':
        return {
          backgroundColor: withOpacity(baseColor, 0.1),
          color: baseColor,
          border: `1px solid ${baseColor}`,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: baseColor,
          border: `1px solid ${baseColor}`,
        };
      default:
        return {
          backgroundColor: baseColor,
          color: 'white',
          border: 'none',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '2px 8px',
          fontSize: '12px',
        };
      case 'lg':
        return {
          padding: '8px 16px',
          fontSize: '16px',
        };
      default:
        return {
          padding: '4px 12px',
          fontSize: '14px',
        };
    }
  };

  return (
    <span
      className={`research-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '4px',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        cursor: 'default',
        ...getVariantStyles(),
        ...getSizeStyles(),
      }}
    >
      {children}
    </span>
  );
};
