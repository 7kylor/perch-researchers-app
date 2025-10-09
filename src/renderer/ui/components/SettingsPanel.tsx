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
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

type SettingsPanelProps = {
  onClose: () => void;
};

type TabId = 'appearance' | 'library' | 'ai' | 'updates' | 'shortcuts' | 'about';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = React.useState<TabId>('appearance');
  const [downloadState, setDownloadState] = React.useState<{
    id: string;
    percent: number;
    filePath?: string;
    fileName?: string;
    destPath?: string;
  } | null>(null);
  const [licensePro, setLicensePro] = React.useState<boolean>(false);
  const [aiMode, setAiMode] = React.useState<'local' | 'openai'>(
    (localStorage.getItem('aiMode') as 'local' | 'openai') || 'local',
  );
  const [openAIReady, setOpenAIReady] = React.useState<boolean>(false);
  const [localReady, setLocalReady] = React.useState<boolean>(false);
  const [downloadedModels, setDownloadedModels] = React.useState<
    Array<{ fileName: string; filePath: string }>
  >([]);
  const [detectedBinary, setDetectedBinary] = React.useState<string | null>(null);
  const [embeddingsConfigured, setEmbeddingsConfigured] = React.useState<boolean>(
    !!(localStorage.getItem('embedUrl') && localStorage.getItem('embedModel')),
  );

  React.useEffect(() => {
    // Download events for local model
    window.api.on('local-ai:download:started', (payload: unknown) => {
      const p = payload as { id: string; fileName?: string; destPath?: string };
      setDownloadState({ id: p.id, percent: 0, fileName: p.fileName, destPath: p.destPath });
    });
    window.api.on('local-ai:download:progress', (payload: unknown) => {
      const p = payload as { id: string; percent?: number };
      setDownloadState((prev) =>
        prev && prev.id === p.id ? { ...prev, percent: p.percent ?? 0 } : prev,
      );
    });
    window.api.on('local-ai:download:done', (payload: unknown) => {
      const p = payload as { id: string; filePath: string };
      setDownloadState((prev) =>
        prev && prev.id === p.id ? { ...prev, percent: 100, filePath: p.filePath } : prev,
      );
    });
  }, []);

  // Ensure license is active in dev for testing; otherwise respect license lock
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const lic = await window.api.license.get();
        if (!mounted) return;
        if (!lic.pro && import.meta.env.MODE === 'development') {
          await window.api.license.set(true);
        }
        const st = await window.api.license.get();
        if (!mounted) return;
        setLicensePro(!!st.pro);
      } catch {
        setLicensePro(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Refresh local status, models, and binary detection when AI tab is active
  React.useEffect(() => {
    if (activeTab !== 'ai') return;
    let mounted = true;
    (async () => {
      try {
        const models = await window.api.localAI.listModels();
        if (!mounted) return;
        setDownloadedModels(models);
      } catch {
        setDownloadedModels([]);
      }
      try {
        const det = await window.api.localAI.detectBinary();
        if (!mounted) return;
        setDetectedBinary(det.binaryPath);
      } catch {
        setDetectedBinary(null);
      }
      try {
        const st = await window.api.localAI.status();
        if (!mounted) return;
        setLocalReady(!!st.running);
      } catch {
        setLocalReady(false);
      }
      try {
        const cfg = await window.api.localAI.getConfig();
        if (!mounted) return;
        if (cfg.embeddingProviderUrl) {
          localStorage.setItem('embedUrl', cfg.embeddingProviderUrl);
        }
        localStorage.setItem('embedModel', cfg.embeddingModel);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const tabs: { id: TabId; label: string; icon: React.ReactElement }[] = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'library', label: 'Library', icon: <Database size={16} /> },
    { id: 'ai', label: 'AI', icon: <Info size={16} /> },
    { id: 'updates', label: 'Updates', icon: <RefreshCw size={16} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
    { id: 'about', label: 'About', icon: <Info size={16} /> },
  ];

  const shortcuts = [
    { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
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

  const [autoUpdateEnabled, setAutoUpdateEnabled] = React.useState<boolean>(true);
  const [updateStatus, setUpdateStatus] = React.useState<
    'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error'
  >('idle');
  const [_updateInfo, setUpdateInfo] = React.useState<unknown | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await window.api.settings.get();
        if (!mounted) return;
        setAutoUpdateEnabled(!!s.autoUpdateEnabled);
      } catch {
        // ignore
      }
    })();
    window.api.updates.onAvailable((info) => {
      setUpdateInfo(info);
      setUpdateStatus('available');
    });
    window.api.updates.onDownloaded((info) => {
      setUpdateInfo(info);
      setUpdateStatus('downloaded');
    });
    window.api.updates.onNotAvailable(() => {
      setUpdateStatus('not-available');
    });
    window.api.updates.onError((msg) => {
      setErrorMessage(msg);
      setUpdateStatus('error');
    });
    return () => {
      mounted = false;
    };
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
                      className={`theme-btn ${aiMode === 'local' ? 'active' : ''}`}
                      onClick={async () => {
                        localStorage.setItem('aiMode', 'local');
                        setAiMode('local');
                        await window.api.ai.init('local');
                        alert('AI set to Local mode.');
                      }}
                    >
                      <span>Local {localReady ? '✓' : ''}</span>
                    </button>
                    <button
                      type="button"
                      className={`theme-btn ${aiMode === 'openai' ? 'active' : ''}`}
                      onClick={async () => {
                        const key = localStorage.getItem('openaiKey') || '';
                        if (!key) {
                          alert('Please set your OpenAI API key below first.');
                          return;
                        }
                        localStorage.setItem('aiMode', 'openai');
                        setAiMode('openai');
                        await window.api.ai.init('openai', key);
                        alert('AI set to OpenAI mode.');
                      }}
                    >
                      <span>OpenAI {openAIReady ? '✓' : ''}</span>
                    </button>
                  </div>
                </div>

                {aiMode === 'openai' && (
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
                          const key = localStorage.getItem('openaiKey') || '';
                          if (!key) {
                            alert('Please enter an API key.');
                            return;
                          }
                          await window.api.ai.init('openai', key);
                          alert('OpenAI initialized.');
                        }}
                      >
                        <span>Apply</span>
                      </button>
                      <button
                        type="button"
                        className="setting-action-btn"
                        onClick={async () => {
                          const key = localStorage.getItem('openaiKey') || '';
                          if (!key) {
                            alert('Please enter an API key.');
                            return;
                          }
                          const ok = await window.api.ai.testOpenAI(key);
                          setOpenAIReady(ok);
                          alert(ok ? 'OpenAI connection OK' : 'OpenAI connection failed');
                        }}
                      >
                        <span>Test</span>
                      </button>
                    </div>
                <h3>AI Assistant</h3>

                <div className="ai-providers">
                  <button
                    type="button"
                    className={`ai-provider ${aiMode === 'openai' ? 'active' : ''}`}
                    onClick={async () => {
                      const key = localStorage.getItem('openaiKey') || '';
                      if (!key) {
                        alert('Please set up your OpenAI API key first.');
                        return;
                      }
                      localStorage.setItem('aiMode', 'openai');
                      setAiMode('openai');
                      await window.api.ai.init('openai', key);
                    }}
                  >
                    <span className="provider-name">OpenAI</span>
                    <span className="provider-desc">Cloud AI • Fast</span>
                  </button>

                  <button
                    type="button"
                    className={`ai-provider ${aiMode === 'local' ? 'active' : ''}`}
                    onClick={async () => {
                      localStorage.setItem('aiMode', 'local');
                      setAiMode('local');
                      await window.api.ai.init('local');
                    }}
                  >
                    <span className="provider-name">Local AI</span>
                    <span className="provider-desc">Private • On-device</span>
                  </button>
                </div>

                {aiMode === 'openai' && (
                  <>
                    <h3>AI Assistant</h3>

                    <div className="ai-providers">
                  <button
                    type="button"
                    className={`ai-provider ${aiMode === 'openai' ? 'active' : ''}`}
                    onClick={async () => {
                      const key = localStorage.getItem('openaiKey') || '';
                      if (!key) {
                        alert('Please set up your OpenAI API key first.');
                        return;
                      }
                      localStorage.setItem('aiMode', 'openai');
                      setAiMode('openai');
                      await window.api.ai.init('openai', key);
                    }}
                  >
                    <span className="provider-name">OpenAI</span>
                    <span className="provider-desc">Cloud AI • Fast</span>
                  </button>

                  <button
                    type="button"
                    className={`ai-provider ${aiMode === 'local' ? 'active' : ''}`}
                    onClick={async () => {
                      localStorage.setItem('aiMode', 'local');
                      setAiMode('local');
                      await window.api.ai.init('local');
                    }}
                  >
                    <span className="provider-name">Local AI</span>
                    <span className="provider-desc">Private • On-device</span>
                  </button>
                </div>

                {aiMode === 'openai' && (
                  <div className="ai-setup">
                    <div className="input-row">
                      <input
                        type="password"
                        placeholder="OpenAI API Key (sk-...)"
                        defaultValue={localStorage.getItem('openaiKey') || ''}
                        onChange={(e) => localStorage.setItem('openaiKey', e.target.value.trim())}
                      />
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={async () => {
                          const key = localStorage.getItem('openaiKey') || '';
                          if (!key) {
                            alert('Please enter your API key first.');
                            return;
                          }
                          try {
                            await window.api.ai.init('openai', key);
                            alert('✅ Connected');
                          } catch {
                            alert('❌ Failed to connect');
                          }
                        }}
                      >
                        Connect
                      </button>
                    </div>
                    <p className="hint">
                      Get your key from{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        platform.openai.com
                      </a>
                    </p>
                  </div>
                  </>
                )}

                {aiMode === 'local' && (
                  <>
                    <div className="setting-item">
                      <div className="setting-label">Local LLM</div>
                      <div className="setting-description">Pick, download, and start</div>
                      <details>
                        <summary>Setup</summary>
                        <div style={{ display: 'grid', gap: 8 }}>
                          <select
                            defaultValue={localStorage.getItem('llamaModelUrl') || ''}
                            onChange={(e) => localStorage.setItem('llamaModelUrl', e.target.value)}
                          >
                            <option value="">Select a model…</option>
                            <option value="https://huggingface.co/unsloth/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf?download=true">
                              Qwen3-8B Q4_K_M (Unsloth)
                            </option>
                            <option value="https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf?download=true">
                              Qwen3-1.7B Q4_K_M (Unsloth)
                            </option>
                            <option value="https://huggingface.co/unsloth/Phi-4-mini-reasoning-GGUF/resolve/main/Phi-4-mini-reasoning-Q4_K_M.gguf?download=true">
                              Phi-4-mini-reasoning Q4_K_M (Unsloth)
                            </option>
                          </select>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              className="setting-action-btn"
                              onClick={async () => {
                                const url = localStorage.getItem('llamaModelUrl') || '';
                                if (!url) {
                                  alert('Please select a model first.');
                                  return;
                                }
                                try {
                                  const filePath = await window.api.localAI.downloadModel({ url });
                                  localStorage.setItem('llamaModelPath', filePath);
                                  alert('Model downloaded and set.');
                                  const models = await window.api.localAI.listModels();
                                  setDownloadedModels(models);
                                } catch (err) {
                                  alert((err as Error).message || 'Failed to download model.');
                                }
                              }}
                            >
                              <span>Download & Use</span>
                            </button>
                            <select
                              defaultValue=""
                              onChange={(e) =>
                                localStorage.setItem('llamaModelPath', e.target.value)
                              }
                            >
                              <option value="">Use existing…</option>
                              {downloadedModels.map((m) => (
                                <option key={m.filePath} value={m.filePath}>
                                  {m.fileName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              className="setting-action-btn"
                              onClick={async () => {
                                try {
                                  const det = await window.api.localAI.detectBinary();
                                  if (det.binaryPath) {
                                    localStorage.setItem('llamaServerBin', det.binaryPath);
                                    setDetectedBinary(det.binaryPath);
                                    alert('Detected and set llama-server binary.');
                                  } else {
                                    alert('Could not detect llama-server binary.');
                                  }
                                } catch {
                                  alert('Detection failed.');
                                }
                              }}
                            >
                              <span>{detectedBinary ? 'Binary detected ✓' : 'Detect binary'}</span>
                            </button>
                            <button
                              type="button"
                              className="setting-action-btn"
                              onClick={async () => {
                                const modelPath = localStorage.getItem('llamaModelPath') || '';
                                const bin = localStorage.getItem('llamaServerBin') || '';
                                if (!bin || !modelPath) {
                                  alert('Binary or model path missing.');
                                  return;
                                }
                                try {
                                  const url = await window.api.localAI.start({
                                    binaryPath: bin,
                                    modelPath,
                                  });
                                  setLocalReady(true);
                                  alert(`Local LLM started at ${url}`);
                                } catch (err) {
                                  setLocalReady(false);
                                  alert((err as Error).message || 'Failed to start local LLM.');
                                }
                              }}
                            >
                              <span>Start</span>
                            </button>
                          </div>
                          {downloadState && (
                            <div style={{ display: 'grid', gap: 8 }}>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {downloadState.fileName || 'Downloading model...'}
                              </div>
                              <div
                                style={{ background: 'var(--border)', height: 6, borderRadius: 4 }}
                              >
                                <div
                                  style={{
                                    width: `${downloadState.percent}%`,
                                    height: 6,
                                    background: 'var(--primary)',
                                    borderRadius: 4,
                                    transition: 'width 0.2s ease',
                                  }}
                                />
                              </div>
                              {downloadState.filePath && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: 'var(--text-secondary)',
                                      flex: 1,
                                    }}
                                  >
                                    Saved to: {downloadState.filePath}
                                  </div>
                                  <button
                                    type="button"
                                    className="setting-action-btn"
                                    onClick={() => {
                                      localStorage.setItem(
                                        'llamaModelPath',
                                        downloadState.filePath || '',
                                      );
                                      alert('Set as current model path.');
                                    }}
                                  >
                                    <span>Use downloaded model</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </details>

                      <details>
                        <summary>Advanced parameters</summary>
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
                              onChange={(e) =>
                                localStorage.setItem('llamaPort', e.target.value.trim())
                              }
                              style={{ width: 120 }}
                            />
                            <input
                              type="number"
                              placeholder="Context (8192)"
                              defaultValue={localStorage.getItem('llamaCtx') || '8192'}
                              onChange={(e) =>
                                localStorage.setItem('llamaCtx', e.target.value.trim())
                              }
                              style={{ width: 140 }}
                            />
                            <input
                              type="number"
                              placeholder="GPU layers (-ngl)"
                              defaultValue={localStorage.getItem('llamaNgl') || ''}
                              onChange={(e) =>
                                localStorage.setItem('llamaNgl', e.target.value.trim())
                              }
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
                                } catch (err) {
                                  alert((err as Error).message || 'Failed to start local LLM.');
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
                              placeholder="GGUF URL (e.g., https://huggingface.co/...)"
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
                                } catch (err) {
                                  alert((err as Error).message || 'Failed to download model.');
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
                      <div className="setting-description">Optional local embeddings API</div>
                      <details>
                        <summary>Advanced setup</summary>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            defaultValue={
                              localStorage.getItem('embedModel') || 'BAAI/bge-base-en-v1.5'
                            }
                            onChange={(e) => localStorage.setItem('embedModel', e.target.value)}
                          >
                            <option value="BAAI/bge-base-en-v1.5">BAAI/bge-base-en-v1.5</option>
                            <option value="thenlper/gte-small">thenlper/gte-small</option>
                          </select>
                          <input
                            type="text"
                            placeholder="http://127.0.0.1:8090"
                            defaultValue={localStorage.getItem('embedUrl') || ''}
                            onChange={(e) =>
                              localStorage.setItem('embedUrl', e.target.value.trim())
                            }
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="setting-action-btn"
                            onClick={async () => {
                              const embedModel =
                                (localStorage.getItem('embedModel') as
                                  | 'BAAI/bge-base-en-v1.5'
                                  | 'thenlper/gte-small'
                                  | null) || 'BAAI/bge-base-en-v1.5';
                              await window.api.localAI.setConfig({
                                embeddingProviderUrl: localStorage.getItem('embedUrl') || null,
                                embeddingModel: embedModel,
                              });
                              alert('Embeddings config applied.');
                            }}
                          >
                            <span>Apply</span>
                          </button>
                        </div>
                      </details>
                    </div>
                  </>
                )}

                {/* Access / Pro controls removed; gating enforced automatically */}
                  <div className="ai-setup">
                    <div className="input-row">
                      <select
                        defaultValue={localStorage.getItem('llamaModelUrl') || ''}
                        onChange={(e) => localStorage.setItem('llamaModelUrl', e.target.value)}
                      >
                        <option value="">Choose AI Model...</option>
                        <option value="https://huggingface.co/unsloth/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf?download=true">
                          Qwen3-8B (Best)
                        </option>
                        <option value="https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf?download=true">
                          Qwen3-1.7B (Fast)
                        </option>
                        <option value="https://huggingface.co/unsloth/Phi-4-mini-reasoning-GGUF/resolve/main/Phi-4-mini-reasoning-Q4_K_M.gguf?download=true">
                          Phi-4-mini (Light)
                        </option>
                      </select>
                      <button
                        type="button"
                        className={`mini-btn ${localReady ? 'secondary' : 'primary'}`}
                        disabled={!localStorage.getItem('llamaModelUrl') && !localReady}
                        onClick={async () => {
                          if (localReady) {
                            // Restart if already running
                            try {
                              await window.api.localAI.stop();
                              setLocalReady(false);

                              const bin = localStorage.getItem('llamaServerBin') || '';
                              const model = localStorage.getItem('llamaModelPath') || '';
                              if (bin && model) {
                                const url = await window.api.localAI.start({
                                  binaryPath: bin,
                                  modelPath: model,
                                });
                                setLocalReady(true);
                                alert(`✅ Restarted at ${url}`);
                              }
                            } catch (err) {
                              alert(`❌ ${(err as Error).message || 'Failed to restart'}`);
                            }
                            return;
                          }

                          const url = localStorage.getItem('llamaModelUrl') || '';
                          if (!url) return;

                          try {
                            setDownloadState({ id: 'model', percent: 0 });
                            const filePath = await window.api.localAI.downloadModel({ url });
                            localStorage.setItem('llamaModelPath', filePath);

                            const bin = await window.api.localAI.detectBinary();
                            if (bin.binaryPath) {
                              localStorage.setItem('llamaServerBin', bin.binaryPath);
                              const startUrl = await window.api.localAI.start({
                                binaryPath: bin.binaryPath,
                                modelPath: filePath,
                              });
                              setLocalReady(true);
                              alert(`✅ Running at ${startUrl}`);
                            } else {
                              alert('❌ Server not found');
                            }
                          } catch (err) {
                            alert(`❌ ${(err as Error).message || 'Failed'}`);
                          } finally {
                            setDownloadState(null);
                          }
                        }}
                      >
                        {downloadState
                          ? 'Setting up...'
                          : localReady
                            ? 'Ready • Restart'
                            : 'Start AI'}
                      </button>
                    </div>

                    {downloadState && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${downloadState.percent}%` }}
                        />
                      </div>
                    )}

                    {localReady && <div className="status-good">✓ Running</div>}

                    {/* Embedding Models Section */}
                    <div className="embeddings-section">
                      <h4>Embedding Models</h4>
                      <p className="section-desc">
                        Configure embedding models for semantic search and RAG
                      </p>

                      <div className="input-row embeddings-controls">
                        <select
                          defaultValue={
                            localStorage.getItem('embedModel') || 'BAAI/bge-base-en-v1.5'
                          }
                          onChange={(e) => {
                            localStorage.setItem('embedModel', e.target.value);
                            setEmbeddingsConfigured(false);
                          }}
                        >
                          <option value="BAAI/bge-base-en-v1.5">BGE Base (Best Quality)</option>
                          <option value="thenlper/gte-small">GTE Small (Faster)</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Embedding server URL (e.g., http://localhost:8090)"
                          defaultValue={localStorage.getItem('embedUrl') || ''}
                          onChange={(e) => {
                            localStorage.setItem('embedUrl', e.target.value.trim());
                            setEmbeddingsConfigured(false);
                          }}
                        />
                        <button
                          type="button"
                          className={`mini-btn ${embeddingsConfigured ? 'secondary' : ''}`}
                          onClick={async () => {
                            const embedModel =
                              localStorage.getItem('embedModel') || 'BAAI/bge-base-en-v1.5';
                            const embedUrl = localStorage.getItem('embedUrl') || '';

                            if (!embedUrl) {
                              alert('Please enter embedding server URL');
                              return;
                            }

                            try {
                              await window.api.localAI.setConfig({
                                embeddingProviderUrl: embedUrl,
                                embeddingModel: embedModel as
                                  | 'BAAI/bge-base-en-v1.5'
                                  | 'thenlper/gte-small',
                              });
                              setEmbeddingsConfigured(true);
                              alert('✅ Embedding config saved');
                            } catch (err) {
                              alert(`❌ ${(err as Error).message || 'Failed to save config'}`);
                            }
                          }}
                        >
                          {embeddingsConfigured ? 'Applied' : 'Apply'}
                        </button>
                      </div>

                      {embeddingsConfigured && <div className="status-good">✓ Configured</div>}
                    </div>

                    <details className="advanced">
                      <summary>Advanced</summary>
                      <div className="advanced-options">
                        <input
                          type="text"
                          placeholder="Server path"
                          defaultValue={localStorage.getItem('llamaServerBin') || ''}
                          onChange={(e) =>
                            localStorage.setItem('llamaServerBin', e.target.value.trim())
                          }
                        />
                        <input
                          type="text"
                          placeholder="Model path"
                          defaultValue={localStorage.getItem('llamaModelPath') || ''}
                          onChange={(e) =>
                            localStorage.setItem('llamaModelPath', e.target.value.trim())
                          }
                        />
                        <input
                          type="number"
                          placeholder="Port (8080)"
                          defaultValue={localStorage.getItem('llamaPort') || '8080'}
                          onChange={(e) => localStorage.setItem('llamaPort', e.target.value.trim())}
                        />
                        <div className="btn-row">
                          <button
                            type="button"
                            className="mini-btn"
                            onClick={async () => {
                              const bin = localStorage.getItem('llamaServerBin') || '';
                              const model = localStorage.getItem('llamaModelPath') || '';
                              if (!bin || !model) return;

                              try {
                                const url = await window.api.localAI.start({
                                  binaryPath: bin,
                                  modelPath: model,
                                });
                                setLocalReady(true);
                                alert(`✅ ${url}`);
                              } catch (err) {
                                alert(`❌ ${(err as Error).message || 'Failed'}`);
                              }
                            }}
                          >
                            Start
                          </button>
                          <button
                            type="button"
                            className="mini-btn"
                            onClick={async () => {
                              await window.api.localAI.stop();
                              setLocalReady(false);
                              alert('⏸ Stopped');
                            }}
                          >
                            Stop
                          </button>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'updates' && (
            <>
              <div className="settings-section">
                <h3>Automatic Updates</h3>
                <div className="setting-item">
                  <div className="setting-label">Enable automatic updates</div>
                  <button
                    type="button"
                    className="setting-action-btn"
                    onClick={async () => {
                      const next = !autoUpdateEnabled;
                      setAutoUpdateEnabled(next);
                      await window.api.settings.set({ autoUpdateEnabled: next });
                    }}
                  >
                    {autoUpdateEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    <span>{autoUpdateEnabled ? 'On' : 'Off'}</span>
                  </button>
                  <div className="setting-description">
                    Downloads updates automatically in the background and installs on restart.
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>Manual Update</h3>
                <div className="setting-item">
                  <div className="setting-label">Status</div>
                  <div className="setting-value">
                    {updateStatus === 'idle' && 'Idle'}
                    {updateStatus === 'checking' && 'Checking for updates...'}
                    {updateStatus === 'available' && 'Update available, downloading...'}
                    {updateStatus === 'downloading' && 'Downloading update...'}
                    {updateStatus === 'downloaded' && 'Update ready to install'}
                    {updateStatus === 'not-available' && 'No updates available'}
                    {updateStatus === 'error' && `Error: ${errorMessage ?? 'Unknown error'}`}
                  </div>
                </div>
                <div className="setting-item" style={{ gap: 8 }}>
                  <button
                    type="button"
                    className="setting-action-btn"
                    onClick={async () => {
                      setUpdateStatus('checking');
                      const res = await window.api.updates.check();
                      if (!res.success) {
                        setErrorMessage(res.error || 'Failed to check');
                        setUpdateStatus('error');
                        return;
                      }
                      if (res.updateInfo) {
                        setUpdateInfo(res.updateInfo);
                        setUpdateStatus('available');
                      } else {
                        setUpdateStatus('not-available');
                      }
                    }}
                  >
                    <RefreshCw size={16} />
                    <span>Check for updates</span>
                  </button>

                  {updateStatus === 'downloaded' && (
                    <button
                      type="button"
                      className="setting-action-btn"
                      onClick={async () => {
                        await window.api.updates.quitAndInstall();
                      }}
                    >
                      <span>Restart to update</span>
                    </button>
                  )}
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
