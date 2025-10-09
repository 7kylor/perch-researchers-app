import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export type LlamaServerConfig = {
  binaryPath: string;
  modelPath: string;
  port?: number;
  contextSize?: number;
  gpuLayers?: number;
  threads?: number;
  extraArgs?: string[];
};

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

class LlamaServerManager {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private cfg:
    | (Required<Pick<LlamaServerConfig, 'port' | 'contextSize'>> & LlamaServerConfig)
    | null = null;

  get url(): string | null {
    return this.cfg ? `http://127.0.0.1:${this.cfg.port}` : null;
  }

  isRunning(): boolean {
    return this.proc !== null;
  }

  async start(config: LlamaServerConfig): Promise<void> {
    if (this.proc) return;
    const port = config.port ?? 8080;
    const contextSize = config.contextSize ?? 8192;
    const args: string[] = [
      '-m',
      config.modelPath,
      '--port',
      String(port),
      '-c',
      String(contextSize),
    ];
    if (typeof config.gpuLayers === 'number') args.push('-ngl', String(config.gpuLayers));
    if (typeof config.threads === 'number') args.push('-t', String(config.threads));
    if (config.extraArgs && config.extraArgs.length > 0) args.push(...config.extraArgs);

    this.cfg = { ...config, port, contextSize };

    this.proc = spawn(config.binaryPath, args, { stdio: 'pipe' });
    this.proc.on('exit', () => {
      this.proc = null;
    });

    const url = `http://127.0.0.1:${port}`;
    await this.waitForReady(url);
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    this.proc.kill('SIGTERM');
    this.proc = null;
  }

  private async waitForReady(url: string): Promise<void> {
    const until = Date.now() + 20000;
    let lastErr = '';
    while (Date.now() < until) {
      try {
        const res = await fetch(`${url}/v1/models`);
        if (res.ok) return;
      } catch (e) {
        lastErr = (e as Error).message;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`llama.cpp server did not become ready: ${lastErr}`);
  }

  async chat(messages: ChatMessage[], temperature = 0.2): Promise<string> {
    const baseUrl = this.url;
    if (!baseUrl) throw new Error('Local LLM URL unavailable');
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'local', messages, temperature, stream: false }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Local LLM error: ${res.status} ${res.statusText} ${errText}`);
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content?.trim() ?? '';
    if (!content) throw new Error('Local LLM returned empty content');
    return content;
  }
}

export const llamaServerManager = new LlamaServerManager();
