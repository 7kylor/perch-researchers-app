type ResearchHighlightProps = {
  children: string | number | React.ReactNode;
  className?: string;
};

/**
 * ResearchHighlight component that uses the research color for highlighting
 * Demonstrates CSS custom property usage with the new research color
 */
export const ResearchHighlight: React.FC<ResearchHighlightProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`research-highlight ${className}`}
      style={{
        backgroundColor: 'var(--research)',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '0.9em',
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  );
};
