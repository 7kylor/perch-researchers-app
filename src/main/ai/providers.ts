export interface AIProvider {
  name: string;
  summarize(text: string, _context?: string): Promise<string>;
  answerQuestion(question: string, _context: string): Promise<string>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly chatModel: string = 'gpt-4o-mini',
    private readonly embeddingModel: string = 'text-embedding-3-small',
  ) {}

  private async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages,
        temperature: 0.2,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI chat error: ${res.status} ${res.statusText} ${errText}`);
    }
    type ChatChoice = { message: { role: 'assistant' | 'user' | 'system'; content: string } };
    type ChatResponse = { choices: ChatChoice[] };
    const json = (await res.json()) as ChatResponse;
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty response from OpenAI');
    return content;
  }

  async summarize(text: string, _context?: string): Promise<string> {
    const system =
      'You are a concise academic assistant. Summarize clearly in 3-5 bullet points. Avoid fluff.';
    const user = _context
      ? `Summarize the following text. Use the provided context to disambiguate terms.\n\nContext:\n${_context}\n\nText:\n${text}`
      : `Summarize the following text in 3-5 bullet points:\n\n${text}`;
    return await this.chat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
  }

  async answerQuestion(question: string, _context: string): Promise<string> {
    const system =
      'You are a precise research assistant. Answer strictly from the given context. If unknown, say you do not know.';
    const user = `Question: ${question}\n\nContext:\n${_context}`;
    return await this.chat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: texts,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI embeddings error: ${res.status} ${res.statusText} ${errText}`);
    }
    type EmbeddingItem = { embedding: number[] };
    type EmbeddingsResponse = { data: EmbeddingItem[] };
    const json = (await res.json()) as EmbeddingsResponse;
    const vectors = json.data?.map((d) => d.embedding) ?? [];
    return vectors;
  }
}

export class LocalProvider implements AIProvider {
  name = 'local';

  async summarize(text: string, _context?: string): Promise<string> {
    const { llamaServerManager } = await import('../local-ai/llama-server.js');
    const prompt = _context
      ? `Summarize the following text in 3-5 bullet points. Use the provided context to disambiguate.\n\nContext:\n${_context}\n\nText:\n${text}`
      : `Summarize the following text in 3-5 bullet points.\n\n${text}`;
    return await llamaServerManager.chat([
      { role: 'system', content: 'You are a concise academic assistant.' },
      { role: 'user', content: prompt },
    ]);
  }

  async answerQuestion(question: string, _context: string): Promise<string> {
    const { llamaServerManager } = await import('../local-ai/llama-server.js');
    const prompt = `Answer strictly from the given context. If the answer is unknown, say so.\n\nQuestion: ${question}\n\nContext:\n${_context}`;
    return await llamaServerManager.chat([
      { role: 'system', content: 'You are a precise research assistant.' },
      { role: 'user', content: prompt },
    ]);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const { getLocalAIConfig } = await import('../local-ai/config.js');
    const { generateEmbeddings } = await import('../local-ai/embeddings.js');
    const cfg = getLocalAIConfig();
    if (!cfg.embeddingProviderUrl) {
      // fallback simple embedding if no provider configured
      return texts.map((text) => {
        const hash = text.split('').reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);
        const vector: number[] = [];
        for (let i = 0; i < 384; i++) {
          const seed = hash + i;
          vector.push((Math.sin(seed) * 0.5 + 0.5) * 2 - 1);
        }
        return vector;
      });
    }
    return await generateEmbeddings(texts, cfg.embeddingProviderUrl, cfg.embeddingModel);
  }
}

export function createAIProvider(type: 'openai' | 'local', apiKey?: string): AIProvider {
  if (type === 'openai') {
    if (!apiKey) throw new Error('OpenAI API key required');
    return new OpenAIProvider(apiKey);
  }
  return new LocalProvider();
}
