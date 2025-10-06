import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from './ThemeProvider';

type SettingsPanelProps = {
  onClose: () => void;
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button type="button" className="settings-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <div
                style={{
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                }}
              >
                Theme
              </div>
              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
                <button
                  type="button"
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  System
                </button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Library</h3>
            <div className="setting-item">
              <div
                style={{
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                }}
              >
                Default View
              </div>
              <div className="setting-info">Grid view (List view removed)</div>
            </div>
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <div className="setting-item">
              <div
                style={{
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text)',
                }}
              >
                Version
              </div>
              <div className="setting-info">Perch App v1.0.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
