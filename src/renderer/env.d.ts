/// <reference types="vite/client" />

declare interface Window {
  api: import('../preload/preload').PreloadAPI;
}

declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
