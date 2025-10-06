import React from 'react';
import { X } from 'lucide-react';

type SettingsPanelProps = {
  onClose: () => void;
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    // Apply theme to document
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
  };

  React.useEffect(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      handleThemeChange(savedTheme);
    }
  }, []);

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
              <label>Theme</label>
              <div className="theme-options">
                <button
                  type="button"
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  Dark
                </button>
                <button
                  type="button"
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  System
                </button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>Library</h3>
            <div className="setting-item">
              <label>Default View</label>
              <div className="setting-info">Grid view (List view removed)</div>
            </div>
          </div>

          <div className="settings-section">
            <h3>About</h3>
            <div className="setting-item">
              <label>Version</label>
              <div className="setting-info">Perch App v1.0.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
