/// <reference types="vite/client" />

declare interface Window {
  api: import('../preload/preload').PreloadAPI;
}

declare const navigator: {
  clipboard: {
    writeText(text: string): Promise<void>;
  };
};
