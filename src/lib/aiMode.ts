/**
 * Detect whether the assistant is running Mock or Live AI.
 * Priority: BYOK (Settings) → server /api/assistant → VITE_* env fallback.
 */

import {
  byokToProviderOptions,
  getProviderPreset,
  hasByokApiKey,
  loadAiByokSettings,
  readViteAiEnvFallback,
} from './aiByok'

export type AiMode = 'mock' | 'live'

export interface AiModeStatus {
  mode: AiMode
  source: 'byok' | 'server' | 'client' | 'unknown'
  label: string
  detail: string
  providerLabel?: string
}

/** Synchronous best-effort (BYOK + client env). Prefer probeAiModeStatus for UI. */
export function getClientAiModeHint(): AiModeStatus {
  const byok = loadAiByokSettings()
  if (hasByokApiKey(byok)) {
    const preset = getProviderPreset(byok.provider)
    return {
      mode: 'live',
      source: 'byok',
      label: `Live AI · ${preset.label}`,
      detail: `Bring-your-own-key stored on this device (${preset.label}).`,
      providerLabel: preset.label,
    }
  }
  const env = readViteAiEnvFallback()
  if (env.apiKey) {
    return {
      mode: 'live',
      source: 'client',
      label: 'Live AI',
      detail: 'VITE_OPENAI_API_KEY is set (client fallback path).',
    }
  }
  return {
    mode: 'mock',
    source: 'unknown',
    label: 'Mock AI',
    detail: 'No API key. Add one in Settings → Assistant AI, or probe the server…',
  }
}

/**
 * Probe BYOK first, then GET /api/assistant, then VITE env.
 * Never throws — always returns a displayable status.
 */
export async function probeAiModeStatus(): Promise<AiModeStatus> {
  const byokHint = getClientAiModeHint()
  if (byokHint.source === 'byok' && byokHint.mode === 'live') {
    return byokHint
  }

  try {
    const res = await fetch('/api/assistant', { method: 'GET' })
    if (res.ok) {
      const json = (await res.json()) as { aiMode?: string; configured?: boolean }
      if (json.aiMode === 'live' || json.configured === true) {
        return {
          mode: 'live',
          source: 'server',
          label: 'Live AI · server',
          detail: 'OPENAI_API_KEY configured on the assistant API.',
        }
      }
      if (json.aiMode === 'mock') {
        if (byokHint.mode === 'live') return byokHint
        return {
          mode: 'mock',
          source: 'server',
          label: 'Mock AI',
          detail:
            'Assistant API is up; deterministic mock agent (no key). Add your key in Settings for Live AI.',
        }
      }
    }
  } catch {
    // fall through — common on Capacitor APK with no local API
  }

  if (byokHint.mode === 'live') return byokHint

  return {
    mode: 'mock',
    source: 'unknown',
    label: 'Mock AI',
    detail:
      'Deterministic on-device agent. Open Settings → Assistant AI and paste a provider API key for Live AI.',
  }
}

/** Provider options for the local assistant path when BYOK or VITE env is set. */
export function resolveClientProviderOptions(): {
  apiKey: string
  provider?: string
  baseUrl?: string
  model?: string
  modelConfigured: boolean
} | null {
  const byok = byokToProviderOptions()
  if (byok) return byok
  const env = readViteAiEnvFallback()
  if (!env.apiKey) return null
  return {
    apiKey: env.apiKey,
    provider: env.provider,
    baseUrl: env.baseUrl,
    model: env.model,
    modelConfigured: true,
  }
}
