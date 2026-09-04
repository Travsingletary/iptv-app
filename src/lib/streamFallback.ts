import type { Channel } from '../types/iptv.js'

export interface StreamFallbackSuggestion {
  channelId: string
  channelName: string
  group: string
  kind: Channel['kind']
  reason: string
}

/**
 * Suggest an alternate title when the current stream fatally errors.
 * Prefer same group, then same kind, excluding the failed channel.
 */
export function suggestStreamFallback(
  failedChannelId: string,
  channels: Channel[],
): StreamFallbackSuggestion | null {
  const failed = channels.find((ch) => ch.id === failedChannelId)
  if (!failed) return null

  const others = channels.filter((ch) => ch.id !== failedChannelId && Boolean(ch.url))
  if (!others.length) return null

  const sameGroup = others.filter(
    (ch) => ch.group === failed.group && ch.kind === failed.kind,
  )
  const sameKind = others.filter((ch) => ch.kind === failed.kind)
  const pick = sameGroup[0] || sameKind[0] || others[0]
  if (!pick) return null

  const reason =
    pick.group === failed.group && pick.kind === failed.kind
      ? `Same group · ${pick.group}`
      : pick.kind === failed.kind
        ? `Same library · ${pick.kind}`
        : 'Next available title'

  return {
    channelId: pick.id,
    channelName: pick.name,
    group: pick.group,
    kind: pick.kind,
    reason,
  }
}

/** Ranked list for UI chips (up to `limit`). */
export function suggestStreamFallbacks(
  failedChannelId: string,
  channels: Channel[],
  limit = 3,
): StreamFallbackSuggestion[] {
  const failed = channels.find((ch) => ch.id === failedChannelId)
  if (!failed) return []

  const others = channels.filter((ch) => ch.id !== failedChannelId && Boolean(ch.url))
  const ranked = [...others].sort((a, b) => {
    const score = (ch: Channel) => {
      let s = 0
      if (ch.group === failed.group) s += 40
      if (ch.kind === failed.kind) s += 20
      return s
    }
    return score(b) - score(a)
  })

  return ranked.slice(0, limit).map((pick) => ({
    channelId: pick.id,
    channelName: pick.name,
    group: pick.group,
    kind: pick.kind,
    reason:
      pick.group === failed.group
        ? `Same group · ${pick.group}`
        : pick.kind === failed.kind
          ? `Same library · ${pick.kind}`
          : 'Available title',
  }))
}
