/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // другие VITE_* переменные при необходимости
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

