/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** SRS interval length in ms. Default: 14400000 (4 hours). Set lower for testing (e.g. 60000 = 1 min). */
  readonly VITE_MS_PER_INTERVAL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
