/**
 * Detect whether the assistant is running Mock or Live AI.
 * Live = server/client OpenAI-compatible key present.
 */

export type AiMode = 'mock' | 'live'

export interface AiModeStatus {
  mode: AiMode
  source: 'server' | 'client' | 'unknown'
  label: string
  detail: string
}

function clientKeyPresent(): boolean {
  try {
    return Boolean(
      (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim(),
    )
  } catch {
    return false
  }
}

/** Synchronous best-effort (client env only). Prefer probeAiModeStatus for UI. */
export function getClientAiModeHint(): AiModeStatus {
  if (clientKeyPresent()) {
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
    detail: 'No client key. Probing server…',
  }
}

/**
 * Probe GET /api/assistant (status) then fall back to client env.
 * Never throws — always returns a displayable status.
 */
export async function probeAiModeStatus(): Promise<AiModeStatus> {
  try {
    const res = await fetch('/api/assistant', { method: 'GET' })
    if (res.ok) {
      const json = (await res.json()) as { aiMode?: string; configured?: boolean }
      if (json.aiMode === 'live' || json.configured === true) {
        return {
          mode: 'live',
          source: 'server',
          label: 'Live AI',
          detail: 'OPENAI_API_KEY configured on the assistant API.',
        }
      }
      if (json.aiMode === 'mock') {
        return {
          mode: 'mock',
          source: 'server',
          label: 'Mock AI',
          detail: 'Assistant API is up; using deterministic mock agent (no OPENAI_API_KEY).',
        }
      }
    }
  } catch {
    // fall through
  }

  if (clientKeyPresent()) {
    return {
      mode: 'live',
      source: 'client',
      label: 'Live AI',
      detail: 'VITE_OPENAI_API_KEY is set (client fallback).',
    }
  }

  return {
    mode: 'mock',
    source: 'unknown',
    label: 'Mock AI',
    detail: 'Deterministic on-device agent. Set OPENAI_API_KEY for live model replies.',
  }
}
