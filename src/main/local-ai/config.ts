export type LocalAIConfig = {
  embeddingProviderUrl: string | null;
  embeddingModel: 'BAAI/bge-base-en-v1.5' | 'thenlper/gte-small';
};

let currentConfig: LocalAIConfig = {
  embeddingProviderUrl: null,
  embeddingModel: 'BAAI/bge-base-en-v1.5',
};

export function setLocalAIConfig(cfg: Partial<LocalAIConfig>): void {
  currentConfig = { ...currentConfig, ...cfg };
}

export function getLocalAIConfig(): LocalAIConfig {
  return currentConfig;
}
