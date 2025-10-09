import http, { type IncomingMessage, type ServerResponse } from 'node:http';

type ServerConfig = {
  port?: number; // default 8090
};

type EmbeddingsRequest = {
  model?: string;
  input: string[] | string;
};

class LocalEmbeddingsServer {
  private server: http.Server | null = null;
  private currentPort = 8090;

  isRunning(): boolean {
    return this.server !== null;
  }

  get url(): string | null {
    return this.server ? `http://127.0.0.1:${this.currentPort}` : null;
  }

  async start(cfg?: ServerConfig): Promise<string> {
    if (this.server) return this.url as string;
    this.currentPort = cfg?.port ?? 8090;
    this.server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
      try {
        if (req.method === 'POST' && req.url === '/v1/embeddings') {
          const body = await this.readJson(req);
          const payload = body as EmbeddingsRequest;
          const inputs = Array.isArray(payload.input) ? payload.input : [payload.input];
          const data = inputs.map((t) => ({ embedding: this.simpleHashEmbedding(t, 384) }));
          this.json(res, 200, { data });
          return;
        }
        this.json(res, 404, { error: 'Not found' });
      } catch (err) {
        this.json(res, 500, { error: (err as Error).message || 'Server error' });
      }
    });

    await new Promise<void>((resolve, reject) => {
      this.server?.listen(this.currentPort, '127.0.0.1', () => resolve());
      this.server?.on('error', (e) => reject(e));
    });
    return this.url as string;
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    this.server = null;
  }

  private async readJson(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const str = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(str || '{}');
  }

  private json(res: ServerResponse, status: number, obj: unknown): void {
    const text = JSON.stringify(obj);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(text);
  }

  private simpleHashEmbedding(text: string, dim: number): number[] {
    const hash = text.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const v: number[] = [];
    for (let i = 0; i < dim; i++) {
      const seed = hash + i;
      v.push((Math.sin(seed) * 0.5 + 0.5) * 2 - 1);
    }
    return v;
  }
}

export const localEmbeddingsServer = new LocalEmbeddingsServer();
