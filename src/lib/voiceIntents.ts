/**
 * Map free-form (voice or typed) utterances to assistant/player intents.
 * Used by press-to-talk and as a lightweight local command parser.
 */

export type VoiceIntentKind =
  | 'play'
  | 'guide'
  | 'mute'
  | 'unmute'
  | 'recommend'
  | 'search'
  | 'remind'
  | 'unknown'

export interface VoiceIntent {
  kind: VoiceIntentKind
  /** Residual query / channel / program phrase after the command verb. */
  query: string
  /** Normalized text that can be sent through the assistant pipeline. */
  assistantMessage: string
}

const PLAY_RE = /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:please\s+)?(?:play|tune(?:\s+to)?|switch(?:\s+to)?|watch)\s+(.+)$/i
const GUIDE_RE =
  /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:what(?:'s| is)\s+on(?:\s+(?:now|tv|the\s+guide)?)?|guide|epg|search(?:\s+(?:the\s+)?guide)?)\s*(.*)$/i
const MUTE_RE = /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:mute|silence|quiet)(?:\s+(?:it|audio|sound|volume))?$/i
const UNMUTE_RE = /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:unmute|sound\s+on|turn\s+(?:the\s+)?(?:sound|volume)\s+on)$/i
const RECOMMEND_RE =
  /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:recommend|suggest|what\s+should\s+i\s+watch|find\s+me\s+something)(?:\s+(.+))?$/i
const SEARCH_RE = /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:search|find|look\s+up)\s+(.+)$/i
const REMIND_RE =
  /^(?:hey\s+)?(?:(?:aether|steadystream)[, ]+)?(?:remind\s+me(?:\s+(?:when|about|for))?|set\s+(?:a\s+)?reminder(?:\s+(?:for|when|about))?)\s+(.+)$/i

export function parseVoiceIntent(raw: string): VoiceIntent {
  const text = raw.trim().replace(/\s+/g, ' ')
  if (!text) {
    return { kind: 'unknown', query: '', assistantMessage: '' }
  }

  let match = text.match(MUTE_RE)
  if (match) {
    return { kind: 'mute', query: '', assistantMessage: 'Mute the audio' }
  }

  match = text.match(UNMUTE_RE)
  if (match) {
    return { kind: 'unmute', query: '', assistantMessage: 'Unmute the audio' }
  }

  match = text.match(REMIND_RE)
  if (match) {
    const query = (match[1] || '').trim()
    return {
      kind: 'remind',
      query,
      assistantMessage: `Remind me when ${query}`,
    }
  }

  match = text.match(PLAY_RE)
  if (match) {
    const query = (match[1] || '').trim()
    return {
      kind: 'play',
      query,
      assistantMessage: `Play ${query}`,
    }
  }

  match = text.match(RECOMMEND_RE)
  if (match) {
    const query = (match[1] || '').trim()
    return {
      kind: 'recommend',
      query,
      assistantMessage: query ? `Recommend ${query}` : 'Recommend something to watch',
    }
  }

  match = text.match(SEARCH_RE)
  if (match) {
    const query = (match[1] || '').trim()
    return {
      kind: 'search',
      query,
      assistantMessage: `Search guide for ${query}`,
    }
  }

  match = text.match(GUIDE_RE)
  if (match) {
    const query = (match[1] || '').trim()
    return {
      kind: 'guide',
      query,
      assistantMessage: query ? `What is on ${query}` : "What is on now",
    }
  }

  return {
    kind: 'unknown',
    query: text,
    assistantMessage: text,
  }
}

/** Minimal SpeechRecognition surface so we do not require full DOM lib typings. */
export interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export type SpeechRecognitionStatus = 'unsupported' | 'available' | 'listening' | 'error'

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof globalThis === 'undefined') return null
  const w = globalThis as typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
    window?: typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
  }
  return (
    w.SpeechRecognition ||
    w.webkitSpeechRecognition ||
    w.window?.SpeechRecognition ||
    w.window?.webkitSpeechRecognition ||
    null
  )
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor())
}
