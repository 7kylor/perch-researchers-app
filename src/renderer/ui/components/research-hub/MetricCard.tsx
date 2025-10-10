import type React from 'react';
import type { LucideIcon } from 'lucide-react';

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  iconColor: string;
  iconBg: string;
};

export const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
}) => {
  return (
    <div className="metric-card">
      <div className="metric-card-content">
        <div className={`metric-card-icon ${iconBg}`}>
          <Icon className={iconColor} />
        </div>

        <div className="metric-card-data">
          <p className="metric-card-label">{label}</p>
          <p className="metric-card-value">{value}</p>
        </div>
      </div>
    </div>
  );
};
