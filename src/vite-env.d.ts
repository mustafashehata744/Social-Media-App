/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** URL of a server-side AI proxy. Never put a provider API key in the frontend. */
  readonly VITE_AI_API_URL?: string
  readonly VITE_AI_MODEL?: string
}
