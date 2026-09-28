/**
 * Bring-your-own-key (BYOK) AI settings for SteadyStream testers.
 * Keys stay on-device (localStorage / Capacitor WebView). Never commit keys.
 */

export type AiProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'openrouter'
  | 'custom'

export interface AiProviderPreset {
  id: AiProviderId
  label: string
  /** OpenAI-compatible chat/completions base (…/v1). Empty for Anthropic Messages. */
  defaultBaseUrl: string
  defaultModel: string
  /** Short TV-friendly hint shown in Settings. */
  hint: string
  /** true = Anthropic Messages API (not chat/completions). */
  anthropicMessages?: boolean
  /** Browser CORS often blocked without a proxy. */
  corsRisk: 'low' | 'medium' | 'high'
}

export interface AiByokSettings {
  provider: AiProviderId
  /** Raw API key — never log or commit. */
  apiKey: string
  /** Optional model override. */
  model: string
  /** Optional base URL override (required for custom). */
  baseUrl: string
  /**
   * Optional self-hosted OpenAI-compatible relay for browser/WebView CORS.
   * When set, chat calls go to `{proxyUrl}/chat/completions` with the same Bearer key.
   */
  proxyUrl: string
}

export const AI_BYOK_STORAGE_KEY = 'steadystream_ai_byok'

export const AI_PROVIDER_PRESETS: AiProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    hint: 'Browser CORS often blocks openai.com — use OpenRouter or an API proxy URL on web/APK.',
    corsRisk: 'high',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-haiku-latest',
    hint: 'Uses Anthropic Messages API. Browser CORS may block — prefer OpenRouter or a proxy.',
    anthropicMessages: true,
    corsRisk: 'high',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.0-flash',
    hint: 'OpenAI-compatible Gemini endpoint. CORS varies; proxy if the WebView blocks it.',
    corsRisk: 'medium',
  },
  {
    id: 'groq',
    label: 'Groq',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    hint: 'Fast OpenAI-compatible API. CORS usually works from browsers.',
    corsRisk: 'low',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    hint: 'Best for Fire Stick / browser — one key, many models, browser CORS friendly.',
    corsRisk: 'low',
  },
  {
    id: 'custom',
    label: 'Custom OpenAI-compatible',
    defaultBaseUrl: '',
    defaultModel: 'gpt-4o-mini',
    hint: 'Any OpenAI-compatible base URL (…/v1) + model. Ideal for self-hosted gateways.',
    corsRisk: 'medium',
  },
]

const DEFAULT_SETTINGS: AiByokSettings = {
  provider: 'openrouter',
  apiKey: '',
  model: '',
  baseUrl: '',
  proxyUrl: '',
}

export function getProviderPreset(id: AiProviderId): AiProviderPreset {
  return AI_PROVIDER_PRESETS.find((p) => p.id === id) ?? AI_PROVIDER_PRESETS[4]!
}

function canUseStorage(): boolean {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
}

function sanitizeSettings(raw: Partial<AiByokSettings> | null | undefined): AiByokSettings {
  const provider = AI_PROVIDER_PRESETS.some((p) => p.id === raw?.provider)
    ? (raw!.provider as AiProviderId)
    : DEFAULT_SETTINGS.provider
  return {
    provider,
    apiKey: typeof raw?.apiKey === 'string' ? raw.apiKey.trim() : '',
    model: typeof raw?.model === 'string' ? raw.model.trim() : '',
    baseUrl: typeof raw?.baseUrl === 'string' ? raw.baseUrl.trim() : '',
    proxyUrl: typeof raw?.proxyUrl === 'string' ? raw.proxyUrl.trim() : '',
  }
}

export function loadAiByokSettings(): AiByokSettings {
  if (!canUseStorage()) return { ...DEFAULT_SETTINGS }
  try {
    const raw = globalThis.localStorage.getItem(AI_BYOK_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return sanitizeSettings(JSON.parse(raw) as Partial<AiByokSettings>)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveAiByokSettings(next: Partial<AiByokSettings>): AiByokSettings {
  const merged = sanitizeSettings({ ...loadAiByokSettings(), ...next })
  if (canUseStorage()) {
    globalThis.localStorage.setItem(AI_BYOK_STORAGE_KEY, JSON.stringify(merged))
  }
  return merged
}

export function clearAiByokKey(): AiByokSettings {
  return saveAiByokSettings({ apiKey: '' })
}

export function clearAiByokSettings(): AiByokSettings {
  const cleared = { ...DEFAULT_SETTINGS }
  if (canUseStorage()) {
    globalThis.localStorage.removeItem(AI_BYOK_STORAGE_KEY)
  }
  return cleared
}

/** Mask for UI — never expose the full key. */
export function maskApiKey(apiKey: string): string {
  const key = apiKey.trim()
  if (!key) return ''
  if (key.length <= 8) return '••••••••'
  return `${'•'.repeat(Math.min(12, key.length - 4))}${key.slice(-4)}`
}

export function hasByokApiKey(settings: AiByokSettings = loadAiByokSettings()): boolean {
  return Boolean(settings.apiKey.trim())
}

export interface ResolvedByokEndpoint {
  apiKey: string
  provider: AiProviderId
  baseUrl: string
  model: string
  /** When true, use Anthropic Messages instead of chat/completions. */
  anthropicMessages: boolean
  /** Effective transport base after proxy override. */
  transportBaseUrl: string
  usingProxy: boolean
  label: string
}

/**
 * Resolve runtime endpoint from BYOK settings.
 * Proxy URL (when set) wins for OpenAI-compatible transports.
 */
export function resolveByokEndpoint(
  settings: AiByokSettings = loadAiByokSettings(),
): ResolvedByokEndpoint | null {
  const apiKey = settings.apiKey.trim()
  if (!apiKey) return null

  const preset = getProviderPreset(settings.provider)
  const model = settings.model.trim() || preset.defaultModel
  const baseUrl = (settings.baseUrl.trim() || preset.defaultBaseUrl).replace(/\/$/, '')
  const proxyUrl = settings.proxyUrl.trim().replace(/\/$/, '')
  const anthropicMessages = Boolean(preset.anthropicMessages) && !proxyUrl

  if (settings.provider === 'custom' && !baseUrl && !proxyUrl) {
    return null
  }

  const transportBaseUrl = proxyUrl || baseUrl
  if (!transportBaseUrl) return null

  return {
    apiKey,
    provider: settings.provider,
    baseUrl,
    model,
    anthropicMessages,
    transportBaseUrl,
    usingProxy: Boolean(proxyUrl),
    label: preset.label,
  }
}

/** Env fallback used only when BYOK is empty (dev static hosting). */
export function readViteAiEnvFallback(): {
  apiKey?: string
  provider?: string
  baseUrl?: string
  model?: string
} {
  try {
    const apiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim()
    if (!apiKey) return {}
    return {
      apiKey,
      provider: (import.meta.env.VITE_AI_PROVIDER as string | undefined) || 'openai',
      baseUrl: (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined) || undefined,
      model: (import.meta.env.VITE_OPENAI_MODEL as string | undefined) || undefined,
    }
  } catch {
    return {}
  }
}

/** Options for resolveAssistantReply / provider loop. */
export function byokToProviderOptions(
  settings: AiByokSettings = loadAiByokSettings(),
): {
  apiKey: string
  provider: string
  baseUrl: string
  model: string
  modelConfigured: true
} | null {
  const resolved = resolveByokEndpoint(settings)
  if (!resolved) return null
  return {
    apiKey: resolved.apiKey,
    provider: resolved.provider,
    baseUrl: resolved.transportBaseUrl,
    model: resolved.model,
    modelConfigured: true,
  }
}
