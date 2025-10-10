import React from 'react';
import { AlertConfig } from './research-hub/AlertConfig';
import { AlertInbox } from './research-hub/AlertInbox';

export const AlertsView: React.FC = () => {
  return (
    <div className="alerts-view">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <AlertConfig />
        <AlertInbox />
      </div>
    </div>
  );
};
