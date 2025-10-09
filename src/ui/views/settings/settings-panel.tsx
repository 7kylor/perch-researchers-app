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

type TabId = 'appearance' | 'library' | 'ai' | 'shortcuts' | 'about';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = React.useState<TabId>('appearance');

  const tabs: { id: TabId; label: string; icon: React.ReactElement }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'library', label: 'Library', icon: <Database size={16} /> },
    { id: 'ai', label: 'AI', icon: <Info size={16} /> },
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

          {activeTab === 'ai' && (
            <>
              <div className="settings-section">
                <h3>AI Provider</h3>
                <div className="setting-item">
                  <div className="setting-label">Mode</div>
                  <div className="theme-options">
                    <button
                      type="button"
                      className={`theme-btn ${localStorage.getItem('aiMode') === 'local' ? 'active' : ''}`}
                      onClick={async () => {
                        localStorage.setItem('aiMode', 'local');
                        await window.api.ai.init('local');
                        alert('AI set to Local mode.');
                      }}
                    >
                      <span>Local</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-btn ${localStorage.getItem('aiMode') === 'openai' ? 'active' : ''}`}
                      onClick={async () => {
                        const key = localStorage.getItem('openaiKey') || '';
                        if (!key) {
                          alert('Please set your OpenAI API key below first.');
                          return;
                        }
                        localStorage.setItem('aiMode', 'openai');
                        await window.api.ai.init('openai', key);
                        alert('AI set to OpenAI mode.');
                      }}
                    >
                      <span>OpenAI</span>
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">OpenAI API Key</div>
                  <div className="setting-description">Stored locally on your device.</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="password"
                      defaultValue={localStorage.getItem('openaiKey') || ''}
                      placeholder="sk-..."
                      onChange={(e) => localStorage.setItem('openaiKey', e.target.value.trim())}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="setting-action-btn"
                      onClick={async () => {
                        const mode = localStorage.getItem('aiMode') || 'local';
                        const key = localStorage.getItem('openaiKey') || '';
                        if (mode === 'openai') {
                          if (!key) {
                            alert('Please enter an API key.');
                            return;
                          }
                          await window.api.ai.init('openai', key);
                          alert('OpenAI initialized.');
                        } else {
                          await window.api.ai.init('local');
                          alert('Local AI initialized.');
                        }
                      }}
                    >
                      <span>Apply</span>
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Local LLM (llama.cpp)</div>
                  <div className="setting-description">
                    Configure Unsloth GGUF + llama.cpp server
                  </div>
                  <details>
                    <summary>Advanced setup</summary>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="/absolute/path/to/llama-server"
                        defaultValue={localStorage.getItem('llamaServerBin') || ''}
                        onChange={(e) =>
                          localStorage.setItem('llamaServerBin', e.target.value.trim())
                        }
                      />
                      <input
                        type="text"
                        placeholder="/absolute/path/to/model.gguf (e.g., Q4_K_M.gguf)"
                        defaultValue={localStorage.getItem('llamaModelPath') || ''}
                        onChange={(e) =>
                          localStorage.setItem('llamaModelPath', e.target.value.trim())
                        }
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number"
                          placeholder="Port (8080)"
                          defaultValue={localStorage.getItem('llamaPort') || '8080'}
                          onChange={(e) => localStorage.setItem('llamaPort', e.target.value.trim())}
                          style={{ width: 120 }}
                        />
                        <input
                          type="number"
                          placeholder="Context (8192)"
                          defaultValue={localStorage.getItem('llamaCtx') || '8192'}
                          onChange={(e) => localStorage.setItem('llamaCtx', e.target.value.trim())}
                          style={{ width: 140 }}
                        />
                        <input
                          type="number"
                          placeholder="GPU layers (-ngl)"
                          defaultValue={localStorage.getItem('llamaNgl') || ''}
                          onChange={(e) => localStorage.setItem('llamaNgl', e.target.value.trim())}
                          style={{ width: 160 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="setting-action-btn"
                          onClick={async () => {
                            const bin = localStorage.getItem('llamaServerBin') || '';
                            const model = localStorage.getItem('llamaModelPath') || '';
                            const port = Number(localStorage.getItem('llamaPort') || '8080');
                            const ctx = Number(localStorage.getItem('llamaCtx') || '8192');
                            const nglStr = localStorage.getItem('llamaNgl') || '';
                            const gpuLayers = nglStr ? Number(nglStr) : undefined;
                            if (!bin || !model) {
                              alert('Please set both llama-server binary and model GGUF path.');
                              return;
                            }
                            try {
                              const url = await window.api.localAI.start({
                                binaryPath: bin,
                                modelPath: model,
                                port,
                                contextSize: ctx,
                                gpuLayers,
                              });
                              alert(`Local LLM started at ${url}`);
                            } catch {
                              alert('Failed to start local LLM. Check paths and permissions.');
                            }
                          }}
                        >
                          <span>Start Server</span>
                        </button>
                        <button
                          type="button"
                          className="setting-action-btn"
                          onClick={async () => {
                            await window.api.localAI.stop();
                            alert('Local LLM stopped.');
                          }}
                        >
                          <span>Stop Server</span>
                        </button>
                        <button
                          type="button"
                          className="setting-action-btn"
                          onClick={async () => {
                            const s = await window.api.localAI.status();
                            alert(s.running ? `Running at ${s.url}` : 'Not running');
                          }}
                        >
                          <span>Status</span>
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="GGUF URL (e.g., https://huggingface.co/unsloth/Qwen3-8B-GGUF/...)"
                          defaultValue={localStorage.getItem('llamaModelUrl') || ''}
                          onChange={(e) =>
                            localStorage.setItem('llamaModelUrl', e.target.value.trim())
                          }
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          placeholder="Download folder"
                          defaultValue={localStorage.getItem('llamaModelDir') || ''}
                          onChange={(e) =>
                            localStorage.setItem('llamaModelDir', e.target.value.trim())
                          }
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="setting-action-btn"
                          onClick={async () => {
                            const url = localStorage.getItem('llamaModelUrl') || '';
                            const destDir = localStorage.getItem('llamaModelDir') || '';
                            if (!url || !destDir) {
                              alert('Please provide a GGUF URL and download folder.');
                              return;
                            }
                            try {
                              const filePath = await window.api.localAI.downloadModel({
                                url,
                                destDir,
                              });
                              localStorage.setItem('llamaModelPath', filePath);
                              alert('Model downloaded. Model path updated.');
                            } catch {
                              alert('Failed to download model.');
                            }
                          }}
                        >
                          <span>Download model</span>
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Embeddings Provider</div>
                  <div className="setting-description">
                    Optional local embeddings API for BGE/GTE
                  </div>
                  <details>
                    <summary>Advanced setup</summary>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        defaultValue={localStorage.getItem('embedModel') || 'BAAI/bge-base-en-v1.5'}
                        onChange={(e) => localStorage.setItem('embedModel', e.target.value)}
                      >
                        <option value="BAAI/bge-base-en-v1.5">BAAI/bge-base-en-v1.5</option>
                        <option value="thenlper/gte-small">thenlper/gte-small</option>
                      </select>
                      <input
                        type="text"
                        placeholder="http://127.0.0.1:8000"
                        defaultValue={localStorage.getItem('embedUrl') || ''}
                        onChange={(e) => localStorage.setItem('embedUrl', e.target.value.trim())}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="setting-action-btn"
                        onClick={async () => {
                          const { setLocalAIConfig } = await import(
                            '../../../main/local-ai/config.js'
                          );
                          setLocalAIConfig({
                            embeddingProviderUrl: localStorage.getItem('embedUrl') || null,
                            embeddingModel:
                              (localStorage.getItem('embedModel') as
                                | 'BAAI/bge-base-en-v1.5'
                                | 'thenlper/gte-small'
                                | null) || 'BAAI/bge-base-en-v1.5',
                          });
                          alert('Embeddings config applied.');
                        }}
                      >
                        <span>Apply</span>
                      </button>
                    </div>
                  </details>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Access</div>
                  <div className="setting-description">
                    Pro users can enable Local AI and advanced options
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      className="setting-action-btn"
                      onClick={async () => {
                        await window.api.license.set(true);
                        alert('Pro enabled for this session.');
                      }}
                    >
                      <span>Enable Pro</span>
                    </button>
                    <button
                      type="button"
                      className="setting-action-btn"
                      onClick={async () => {
                        await window.api.license.set(false);
                        alert('Pro disabled. Settings reset to default.');
                        localStorage.removeItem('llamaServerBin');
                        localStorage.removeItem('llamaModelPath');
                        localStorage.removeItem('llamaPort');
                        localStorage.removeItem('llamaCtx');
                        localStorage.removeItem('llamaNgl');
                        localStorage.removeItem('embedModel');
                        localStorage.removeItem('embedUrl');
                      }}
                    >
                      <span>Disable Pro</span>
                    </button>
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
