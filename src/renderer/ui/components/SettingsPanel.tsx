import React from 'react';

type Props = {
  onClose: () => void;
};

export function SettingsPanel({ onClose }: Props) {
  const [aiType, setAiType] = React.useState<'local' | 'openai'>('local');
  const [apiKey, setApiKey] = React.useState('');
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = React.useState<'en' | 'ar'>('en');

  const handleSave = async () => {
    // Initialize AI provider
    if (aiType === 'openai' && apiKey) {
      await window.api.ai.init('openai', apiKey);
    } else {
      await window.api.ai.init('local');
    }

    // Save theme preference (would be stored in localStorage or DB)
    if (theme !== 'system') {
      document.documentElement.dataset.theme = theme;
    }

    // Save language preference
    // In a real app, this would update the i18n system

    onClose();
  };

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>AI Provider</h3>
            <div className="setting-item">
              <label>
                <input
                  type="radio"
                  value="local"
                  checked={aiType === 'local'}
                  onChange={(e) => setAiType(e.target.value as 'local')}
                />
                Local AI (Free)
              </label>
            </div>
            <div className="setting-item">
              <label>
                <input
                  type="radio"
                  value="openai"
                  checked={aiType === 'openai'}
                  onChange={(e) => setAiType(e.target.value as 'openai')}
                />
                OpenAI (Requires API Key)
              </label>
              {aiType === 'openai' && (
                <input
                  type="password"
                  placeholder="OpenAI API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input"
                />
              )}
            </div>
          </div>

          <div className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-item">
              <label>Theme:</label>
              <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Language</h3>
            <div className="setting-item">
              <label>Language:</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>Subscription</h3>
            <div className="setting-item">
              <p className="muted">
                Free tier: 5 AI actions per day
                <br />
                Pro tier: Unlimited AI, OCR, sync, and more
              </p>
              <button type="button" className="btn primary">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button type="button" className="btn primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
