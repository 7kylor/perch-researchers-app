export interface AIProvider {
  name: string;
  summarize(text: string, _context?: string): Promise<string>;
  answerQuestion(question: string, _context: string): Promise<string>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';

  constructor(
    private apiKey: string,
    private model = 'gpt-3.5-turbo',
  ) {}

  async summarize(text: string, _context?: string): Promise<string> {
    // In a real implementation, this would call OpenAI API
    // For now, return a simple summary
    return `Summary of: ${text.substring(0, 100)}...`;
  }

  async answerQuestion(question: string, _context: string): Promise<string> {
    // In a real implementation, this would call OpenAI API with RAG
    // For now, return a simple answer
    return `Based on the context, the answer to "${question}" appears to be related to: ${_context.substring(0, 100)}...`;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // In a real implementation, this would call OpenAI embeddings API
    // For now, return simple embeddings
    return texts.map((text) => {
      const hash = text.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

      const vector: number[] = [];
      for (let i = 0; i < 1536; i++) {
        // OpenAI embedding dimension
        const seed = hash + i;
        vector.push((Math.sin(seed) * 0.5 + 0.5) * 2 - 1);
      }

      return vector;
    });
  }
}

export class LocalProvider implements AIProvider {
  name = 'local';

  async summarize(text: string, _context?: string): Promise<string> {
    // Simple local summarization
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const summary = sentences.slice(0, 3).join('. ');
    return summary.length > 0 ? summary + '.' : 'No content to summarize.';
  }

  async answerQuestion(question: string, _context: string): Promise<string> {
    // Simple local Q&A
    const lowerQuestion = question.toLowerCase();
    if (
      lowerQuestion.includes('what') ||
      lowerQuestion.includes('who') ||
      lowerQuestion.includes('when')
    ) {
      return `Based on the provided context, this appears to be a ${lowerQuestion.includes('what') ? 'description' : lowerQuestion.includes('who') ? 'biography' : 'timeline'} of the subject matter.`;
    }
    return 'I need more context to provide a detailed answer.';
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Simple local embeddings (same as pipeline)
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
}

export function createAIProvider(type: 'openai' | 'local', apiKey?: string): AIProvider {
  if (type === 'openai') {
    if (!apiKey) throw new Error('OpenAI API key required');
    return new OpenAIProvider(apiKey);
  }
  return new LocalProvider();
}
