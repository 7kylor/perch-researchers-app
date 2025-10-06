import React from 'react';
import {
  X,
  Palette,
  Database,
  Keyboard,
  Info,
  Monitor,
  Sun,
  Moon,
  Download,
  Upload,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

type SettingsPanelProps = {
  onClose: () => void;
};

type TabId = 'appearance' | 'library' | 'shortcuts' | 'about';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = React.useState<TabId>('appearance');

  const tabs: { id: TabId; label: string; icon: React.ReactElement }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'library', label: 'Library', icon: <Database size={16} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
    { id: 'about', label: 'About', icon: <Info size={16} /> },
  ];

  const shortcuts = [
    { keys: ['⌘', ','], description: 'Open settings' },
    { keys: ['Esc'], description: 'Close modal or panel' },
    { keys: ['F2'], description: 'Rename category' },
    { keys: ['⌥', '↑/↓'], description: 'Reorder categories' },
    { keys: ['⌥', '←/→'], description: 'Change category nesting' },
  ];

  const handleExportData = async () => {
    try {
      const papers = await window.api.papers.search('');
      const dataStr = JSON.stringify(papers, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `perch-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button type="button" className="settings-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'appearance' && (
            <>
              <div className="settings-section">
                <h3>Theme</h3>
                <div className="setting-item">
                  <div className="setting-label">Color Scheme</div>
                  <div className="theme-options">
                    <button
                      type="button"
                      className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun size={16} />
                      <span>Light</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon size={16} />
                      <span>Dark</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                      onClick={() => setTheme('system')}
                    >
                      <Monitor size={16} />
                      <span>System</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Display</h3>
                <div className="setting-item">
                  <div className="setting-label">Default View</div>
                  <div className="setting-info">Grid view with responsive layout</div>
                </div>
                <div className="setting-item">
                  <div className="setting-label">Cards per Row</div>
                  <div className="setting-info">Automatically adjusts based on screen size</div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'library' && (
            <>
              <div className="settings-section">
                <h3>Data Management</h3>
                <div className="setting-item">
                  <div className="setting-label">Export Library</div>
                  <button type="button" className="setting-action-btn" onClick={handleExportData}>
                    <Download size={16} />
                    <span>Export as JSON</span>
                  </button>
                  <div className="setting-description">Download all your papers and metadata</div>
                </div>
                <div className="setting-item">
                  <div className="setting-label">Import Library</div>
                  <button type="button" className="setting-action-btn" disabled>
                    <Upload size={16} />
                    <span>Import from JSON</span>
                  </button>
                  <div className="setting-description">
                    Coming soon: Import papers from exported files
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Danger Zone</h3>
                <div className="setting-item">
                  <div className="setting-label">Clear All Papers</div>
                  <button
                    type="button"
                    className="setting-action-btn danger"
                    onClick={async () => {
                      if (
                        window.confirm(
                          'Are you sure you want to clear all papers? This cannot be undone.',
                        )
                      ) {
                        try {
                          const papers = await window.api.papers.search('');
                          for (const paper of papers) {
                            await window.api.papers.delete(paper.id);
                          }
                          alert('Library cleared successfully!');
                          onClose();
                        } catch {
                          alert('Failed to clear library. Please try again.');
                        }
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Clear Library</span>
                  </button>
                  <div className="setting-description">
                    Remove all papers from your library. This action cannot be undone.
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'shortcuts' && (
            <>
              <div className="settings-section">
                <h3>Keyboard Shortcuts</h3>
                <div className="shortcuts-list">
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.description} className="shortcut-item">
                      <div className="shortcut-keys">
                        {shortcut.keys.map((key) => (
                          <React.Fragment key={`${shortcut.description}-${key}`}>
                            <kbd className="shortcut-key">{key}</kbd>
                            {key !== shortcut.keys[shortcut.keys.length - 1] && (
                              <span className="shortcut-plus">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="shortcut-description">{shortcut.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'about' && (
            <>
              <div className="settings-section">
                <h3>Application</h3>
                <div className="setting-item">
                  <div className="setting-label">Version</div>
                  <div className="setting-value">Perch v1.0.0</div>
                </div>
                <div className="setting-item">
                  <div className="setting-label">Build Date</div>
                  <div className="setting-value">October 2025</div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Features</h3>
                <div className="features-list">
                  <div className="feature-item">
                    <CheckCircle size={16} className="feature-icon" />
                    <span>Paper management and organization</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={16} className="feature-icon" />
                    <span>PDF viewer and annotation</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={16} className="feature-icon" />
                    <span>Smart categorization</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={16} className="feature-icon" />
                    <span>Full-text search</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={16} className="feature-icon" />
                    <span>Drag and drop organization</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
