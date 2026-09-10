/**
 * Natural-language EPG search with structured filters.
 * Examples: "sports in next 2 hours", "movies under 2h", "news tonight".
 */
import type { Channel, EpgProgram } from '../types/iptv.js'
import {
  CATEGORY_ALIASES,
  channelCategory,
  detectCategoryMention,
  categoryAliasesForSlug,
} from './categories.js'

export interface NlEpgFilters {
  rawQuery: string
  category?: string
  /** Inclusive window start (ms). */
  windowStartMs: number
  /** Inclusive window end (ms). */
  windowEndMs: number
  /** Max program duration in ms (e.g. movies under 2h). */
  maxDurationMs?: number
  /** Prefer live-kind / movie / series channel kinds. */
  kind?: 'live' | 'movie' | 'series'
  textTokens: string[]
}

export interface NlEpgHit {
  id: string
  title: string
  channelId: string
  channelName?: string
  category?: string
  start: number
  end: number
  durationMs: number
  score: number
}

function parseDurationHours(q: string): number | undefined {
  const under = q.match(
    /\b(?:under|less than|shorter than|<)\s*(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes)?\b/i,
  )
  if (under) {
    const n = Number(under[1])
    const unit = (under[2] || 'h').toLowerCase()
    if (unit.startsWith('m')) return n * 60_000
    return n * 3_600_000
  }
  const max = q.match(/\bmax(?:imum)?\s*(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)?\b/i)
  if (max) return Number(max[1]) * 3_600_000
  return undefined
}

function parseWindowHours(q: string, now: number): { start: number; end: number } {
  const next = q.match(/\b(?:in\s+the\s+)?next\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes)?\b/i)
  if (next) {
    const n = Number(next[1])
    const unit = (next[2] || 'h').toLowerCase()
    const span = unit.startsWith('m') ? n * 60_000 : n * 3_600_000
    return { start: now, end: now + span }
  }
  if (/\btonight\b/.test(q)) {
    const d = new Date(now)
    d.setHours(18, 0, 0, 0)
    const start = Math.max(now, d.getTime())
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { start, end: end.getTime() }
  }
  if (/\b(this\s+)?morning\b/.test(q)) {
    const d = new Date(now)
    d.setHours(5, 0, 0, 0)
    const end = new Date(now)
    end.setHours(12, 0, 0, 0)
    return { start: d.getTime(), end: end.getTime() }
  }
  if (/\b(this\s+)?afternoon\b/.test(q)) {
    const d = new Date(now)
    d.setHours(12, 0, 0, 0)
    const end = new Date(now)
    end.setHours(18, 0, 0, 0)
    return { start: Math.max(now, d.getTime()), end: end.getTime() }
  }
  if (/\b(now|currently|on now|what's on|what is on)\b/.test(q)) {
    return { start: now - 5 * 60_000, end: now + 30 * 60_000 }
  }
  // Default: next 6 hours overlapping now
  return { start: now - 15 * 60_000, end: now + 6 * 3_600_000 }
}

function detectCategory(q: string): string | undefined {
  const hit = detectCategoryMention(q)
  return hit
}

function detectKind(q: string): NlEpgFilters['kind'] | undefined {
  if (/\b(movie|movies|film|films)\b/i.test(q)) return 'movie'
  if (/\b(series|show|episode)\b/i.test(q) && !/\b(tv\s+show)\b/i.test(q)) return 'series'
  return undefined
}

/** Strip filter phrases so remaining tokens are free-text. */
function extractTextTokens(q: string): string[] {
  const cleaned = q
    .toLowerCase()
    .replace(/\b(?:in\s+the\s+)?next\s+\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minutes)?\b/g, ' ')
    .replace(/\b(?:under|less than|shorter than|<|max(?:imum)?)\s*\d+(?:\.\d+)?\s*(?:h|hr|hrs|hour|hours|m|min|mins|minutes)?\b/g, ' ')
    .replace(/\b(tonight|this morning|this afternoon|morning|afternoon|currently|on now|what'?s on|what is on|find|search|show me|guide)\b/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .trim()
  return cleaned.split(/\s+/).filter((t) => t.length > 2)
}

export function parseNlEpgQuery(query: string, now = Date.now()): NlEpgFilters {
  const q = query.trim()
  const window = parseWindowHours(q.toLowerCase(), now)
  return {
    rawQuery: q,
    category: detectCategory(q),
    windowStartMs: window.start,
    windowEndMs: window.end,
    maxDurationMs: parseDurationHours(q.toLowerCase()),
    kind: detectKind(q),
    textTokens: extractTextTokens(q),
  }
}

function resolveChannel(
  program: EpgProgram,
  channels: Channel[],
  channelByKey: Map<string, Channel>,
): Channel | undefined {
  return (
    channelByKey.get(program.channelId.toLowerCase()) ||
    channels.find((ch) => ch.tvgId === program.channelId || ch.id === program.channelId)
  )
}

export function searchNlEpg(
  query: string,
  channels: Channel[],
  epg: EpgProgram[],
  options: { now?: number; limit?: number; favoriteIds?: string[] } = {},
): { filters: NlEpgFilters; hits: NlEpgHit[] } {
  const now = options.now ?? Date.now()
  const limit = options.limit ?? 8
  const filters = parseNlEpgQuery(query, now)
  const favSet = new Set(options.favoriteIds ?? [])

  const channelByKey = new Map(
    channels.flatMap((ch) => {
      const keys = [ch.id, ch.tvgId, ch.name].filter(Boolean) as string[]
      return keys.map((key) => [key.toLowerCase(), ch] as const)
    }),
  )

  const hits: NlEpgHit[] = []

  for (const program of epg) {
    const durationMs = program.end - program.start
    // Overlap with window
    if (program.end < filters.windowStartMs || program.start > filters.windowEndMs) continue
    if (filters.maxDurationMs != null && durationMs > filters.maxDurationMs) continue

    const channel = resolveChannel(program, channels, channelByKey)
    if (filters.kind && channel && channel.kind !== filters.kind) {
      // Movies filter also matches Movies group / cinema category on live
      if (
        !(
          filters.kind === 'movie' &&
          (channelCategory(channel) === 'Movies' ||
            channel.group.toLowerCase().includes('movie') ||
            (program.category ?? '').toLowerCase().includes('movie'))
        )
      ) {
        continue
      }
    }

    const categoryHay = [
      program.category ?? '',
      channel?.group ?? '',
      channel ? channelCategory(channel) : '',
      program.title,
      program.description ?? '',
    ]
      .join(' ')
      .toLowerCase()

    if (filters.category) {
      const aliases = categoryAliasesForSlug(filters.category)
      const normalizedHit =
        channel != null && channelCategory(channel) === filters.category
      if (!normalizedHit && !aliases.some((a) => categoryHay.includes(a))) continue
    }

    let score = 10
    if (program.start <= now && program.end > now) score += 20
    if (channel && favSet.has(channel.id)) score += 15
    if (channel && filters.category && channelCategory(channel) === filters.category) {
      score += 12
    }

    const hay = categoryHay
    const categoryTokenSet = new Set(
      filters.category
        ? categoryAliasesForSlug(filters.category).map((a) => a.toLowerCase())
        : [],
    )
    for (const token of filters.textTokens) {
      if (categoryTokenSet.has(token)) continue
      // Skip tokens that are only category aliases from the shared map
      if (
        Object.values(CATEGORY_ALIASES).some((list) => list.includes(token)) &&
        filters.category
      ) {
        continue
      }
      if (hay.includes(token)) score += 8
      else score -= 2
    }

    // Drop weak free-text misses when tokens exist and category already filtered
    if (filters.textTokens.length && score < 8 && !filters.category) continue

    hits.push({
      id: program.id,
      title: program.title,
      channelId: channel?.id ?? program.channelId,
      channelName: channel?.name,
      category: program.category ?? (channel ? channelCategory(channel) : undefined) ?? channel?.group,
      start: program.start,
      end: program.end,
      durationMs,
      score,
    })
  }

  hits.sort((a, b) => b.score - a.score || a.start - b.start)
  return { filters, hits: hits.slice(0, limit) }
}

export function formatNlEpgSummary(filters: NlEpgFilters, hits: NlEpgHit[]): string {
  const parts: string[] = []
  if (filters.category) parts.push(filters.category)
  if (filters.maxDurationMs) {
    parts.push(`under ${Math.round(filters.maxDurationMs / 3_600_000)}h`)
  }
  const windowHrs = Math.round((filters.windowEndMs - filters.windowStartMs) / 3_600_000)
  if (windowHrs > 0 && windowHrs <= 12) parts.push(`next ~${windowHrs}h`)
  const label = parts.length ? parts.join(' · ') : 'guide'
  if (!hits.length) return `No ${label} matches.`
  return `Found ${hits.length} ${label} matches: ${hits.map((h) => h.title).join(', ')}.`
}
