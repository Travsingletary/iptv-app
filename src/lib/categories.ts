/**
 * Normalize messy provider group titles into clean browse buckets,
 * and rank category chips / channel search for large live catalogs.
 */
import type { Channel } from '../types/iptv.js'

/** Canonical Live browse buckets (provider originals stay on `channel.group`). */
export const NORMALIZED_CATEGORIES = [
  'News',
  'Sports',
  'Movies',
  'Kids',
  'Entertainment',
  'Music',
  'Documentary',
  'Local',
  'Other',
] as const

export type NormalizedCategory = (typeof NORMALIZED_CATEGORIES)[number]

/** Special chip ids used in Live browse (not provider groups). */
export const FAVORITES_CHIP = '__favorites__'
export const ALL_CHIP = null

/** Shared aliases for browse + assistant + NL EPG. */
export const CATEGORY_ALIASES: Record<NormalizedCategory, string[]> = {
  News: ['news', 'bulletin', 'headline', 'cnn', 'bbc news', 'fox news', 'msnbc', 'al jazeera'],
  Sports: [
    'sport',
    'sports',
    'match',
    'football',
    'soccer',
    'nba',
    'nfl',
    'mlb',
    'nhl',
    'espn',
    'ufc',
    'racing',
    'tennis',
    'golf',
    'cricket',
  ],
  Movies: ['movie', 'movies', 'film', 'films', 'cinema', 'hollywood', 'cinemax', 'hbo'],
  Kids: ['kids', 'children', 'cartoon', 'anime', 'disney', 'nick', 'junior', 'family'],
  Entertainment: [
    'entertainment',
    'general',
    'lifestyle',
    'reality',
    'comedy',
    'drama',
    'series',
    'show',
    'shows',
    'tv shows',
  ],
  Music: ['music', 'concert', 'mtv', 'radio', 'hits', 'karaoke'],
  Documentary: ['doc', 'docs', 'documentary', 'documentaries', 'discovery', 'nat geo', 'history', 'science'],
  Local: ['local', 'regional', 'usa', 'uk', 'canada', 'australia', 'latino', 'arabic', 'india', 'pakistan'],
  Other: ['other', 'misc', 'various', 'uncategorized'],
}

const TIME_BUCKET_BIAS: Record<string, NormalizedCategory[]> = {
  morning: ['News', 'Local', 'Kids'],
  afternoon: ['Sports', 'Kids', 'Entertainment'],
  evening: ['Movies', 'Entertainment', 'Sports'],
  late: ['Movies', 'Music', 'Entertainment'],
}

function hourBucket(date: Date) {
  const hour = date.getHours()
  if (hour < 11) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'late'
}

function hayIncludesAlias(hay: string, aliases: string[]): boolean {
  return aliases.some((alias) => {
    if (alias.length <= 3) {
      return new RegExp(`(?:^|[^a-z0-9])${alias}(?:[^a-z0-9]|$)`, 'i').test(hay)
    }
    return hay.includes(alias)
  })
}

/** Map a provider group (+ optional channel name) into a normalized bucket. */
export function normalizeCategory(
  group: string | undefined | null,
  name = '',
): NormalizedCategory {
  const hay = `${group ?? ''} ${name}`.toLowerCase().trim()
  if (!hay) return 'Other'

  // Prefer group-title signals over channel name to avoid “ESPN News” → News over Sports.
  const groupHay = (group ?? '').toLowerCase()
  const ordered: NormalizedCategory[] = [
    'Sports',
    'News',
    'Kids',
    'Movies',
    'Music',
    'Documentary',
    'Local',
    'Entertainment',
    'Other',
  ]

  for (const cat of ordered) {
    if (cat === 'Other') continue
    const aliases = CATEGORY_ALIASES[cat]
    if (groupHay && hayIncludesAlias(groupHay, aliases)) return cat
  }
  for (const cat of ordered) {
    if (cat === 'Other' || cat === 'Entertainment') continue
    if (hayIncludesAlias(hay, CATEGORY_ALIASES[cat])) return cat
  }
  if (hayIncludesAlias(hay, CATEGORY_ALIASES.Entertainment)) return 'Entertainment'
  return 'Other'
}

export function channelCategory(channel: Pick<Channel, 'group' | 'name' | 'category'>): NormalizedCategory {
  if (channel.category && (NORMALIZED_CATEGORIES as readonly string[]).includes(channel.category)) {
    return channel.category as NormalizedCategory
  }
  return normalizeCategory(channel.group, channel.name)
}

export function withNormalizedCategory<T extends Channel>(channel: T): T {
  return {
    ...channel,
    category: normalizeCategory(channel.group, channel.name),
  }
}

export function enrichChannelsWithCategories(channels: Channel[]): Channel[] {
  return channels.map(withNormalizedCategory)
}

export function channelMatchesCategoryFilter(
  channel: Channel,
  filter: string | null,
  favoriteIds: Iterable<string> = [],
): boolean {
  if (!filter) return true
  if (filter === FAVORITES_CHIP) {
    const set = favoriteIds instanceof Set ? favoriteIds : new Set(favoriteIds)
    return set.has(channel.id)
  }
  // Accept either normalized bucket or exact provider group (legacy / deep links).
  if (channel.group === filter) return true
  return channelCategory(channel) === filter
}

export interface CategoryChip {
  id: string
  label: string
  count: number
  score: number
}

export interface RankCategoryChipsOptions {
  channels: Channel[]
  favorites?: string[]
  recentIds?: string[]
  now?: Date
  /** Max normalized chips after Favorites (All is separate). */
  limit?: number
}

/** Rank normalized category chips: pin Favorites, then relevance-sorted buckets. */
export function rankCategoryChips(options: RankCategoryChipsOptions): CategoryChip[] {
  const {
    channels,
    favorites = [],
    recentIds = [],
    now = new Date(),
    limit = 9,
  } = options
  const favSet = new Set(favorites)
  const recentWeights = new Map(recentIds.map((id, i) => [id, Math.max(20 - i * 2, 0)]))
  const bucket = hourBucket(now)
  const timeBias = new Set(TIME_BUCKET_BIAS[bucket] ?? [])

  const stats = new Map<NormalizedCategory, { count: number; favs: number; recent: number }>()
  for (const cat of NORMALIZED_CATEGORIES) {
    stats.set(cat, { count: 0, favs: 0, recent: 0 })
  }

  for (const ch of channels) {
    if (ch.kind && ch.kind !== 'live') continue
    const cat = channelCategory(ch)
    const row = stats.get(cat)!
    row.count += 1
    if (favSet.has(ch.id)) row.favs += 1
    row.recent += recentWeights.get(ch.id) ?? 0
  }

  const ranked = NORMALIZED_CATEGORIES.filter((cat) => (stats.get(cat)?.count ?? 0) > 0)
    .map((cat) => {
      const row = stats.get(cat)!
      const timeBoost = timeBias.has(cat) ? 40 : 0
      const favBoost = row.favs * 12
      const recentBoost = row.recent
      const countBoost = Math.min(row.count, 80) * 0.15
      const otherPenalty = cat === 'Other' ? -25 : 0
      return {
        id: cat,
        label: cat,
        count: row.count,
        score: timeBoost + favBoost + recentBoost + countBoost + otherPenalty,
      } satisfies CategoryChip
    })
    .sort((a, b) => b.score - a.score || b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)

  const favCount = channels.filter((ch) => favSet.has(ch.id) && (!ch.kind || ch.kind === 'live')).length
  const chips: CategoryChip[] = []
  if (favCount > 0) {
    chips.push({ id: FAVORITES_CHIP, label: 'Favorites', count: favCount, score: Number.POSITIVE_INFINITY })
  }
  chips.push(...ranked)
  return chips
}

export interface RankChannelSearchOptions {
  channels: Channel[]
  query: string
  selectedCategory?: string | null
  favorites?: string[]
  recentIds?: string[]
}

function matchTier(name: string, q: string): number {
  if (!q) return 0
  if (name === q) return 100
  if (name.startsWith(q)) return 70
  if (name.includes(q)) return 40
  return 0
}

/**
 * Filter + rank channels for Live/Guide search.
 * Ranking: exact name > startsWith > includes; boost selected category / favorite / recent.
 */
export function rankChannelSearch(options: RankChannelSearchOptions): Channel[] {
  const {
    channels,
    query,
    selectedCategory = null,
    favorites = [],
    recentIds = [],
  } = options
  const q = query.trim().toLowerCase()
  const favSet = new Set(favorites)
  const recentWeights = new Map(recentIds.map((id, i) => [id, Math.max(18 - i * 2, 0)]))

  // Detect typed category words so "sports" surfaces Sports bucket channels even on All.
  const queryCategory = q
    ? (NORMALIZED_CATEGORIES.find((cat) =>
        CATEGORY_ALIASES[cat].some((a) => a === q || (a.length > 3 && q.includes(a))),
      ) ?? null)
    : null

  const scored: Array<{ channel: Channel; score: number }> = []

  for (const channel of channels) {
    if (!channelMatchesCategoryFilter(channel, selectedCategory, favSet)) continue

    const name = channel.name.toLowerCase()
    const group = channel.group.toLowerCase()
    const cat = channelCategory(channel).toLowerCase()

    if (q) {
      const nameTier = matchTier(name, q)
      const groupTier = matchTier(group, q) * 0.55
      const catHit = cat.includes(q) || (queryCategory != null && channelCategory(channel) === queryCategory)
      const includesHit =
        name.includes(q) || group.includes(q) || cat.includes(q) || Boolean(queryCategory && catHit)
      if (!nameTier && !groupTier && !includesHit && !catHit) continue

      let score = Math.max(nameTier, groupTier, catHit ? 35 : 0, includesHit ? 25 : 0)
      if (selectedCategory && channelMatchesCategoryFilter(channel, selectedCategory, favSet)) {
        score += 18
      }
      if (queryCategory && channelCategory(channel) === queryCategory) score += 22
      if (favSet.has(channel.id)) score += 16
      score += recentWeights.get(channel.id) ?? 0
      scored.push({ channel, score })
    } else {
      let score = 1
      if (favSet.has(channel.id)) score += 16
      score += recentWeights.get(channel.id) ?? 0
      // Keep catalog-ish order as a weak signal when not searching.
      scored.push({ channel, score })
    }
  }

  if (!q) {
    // Preserve relative catalog order when browsing a category without search.
    return scored.map((s) => s.channel)
  }

  return scored
    .sort((a, b) => b.score - a.score || a.channel.name.localeCompare(b.channel.name))
    .map((s) => s.channel)
}

/** Resolve a free-text category mention (sports, kids, …) to a canonical bucket. */
export function detectCategoryMention(text: string): NormalizedCategory | undefined {
  const q = text.toLowerCase()
  for (const cat of NORMALIZED_CATEGORIES) {
    if (cat === 'Other') continue
    if (CATEGORY_ALIASES[cat].some((a) => new RegExp(`\\b${a}\\b`, 'i').test(q))) {
      return cat
    }
  }
  return undefined
}

/** NL EPG / assistant alias list keyed by lowercase canonical slug. */
export function categoryAliasesForSlug(slug: string): string[] {
  const key = slug.toLowerCase()
  const match = NORMALIZED_CATEGORIES.find((c) => c.toLowerCase() === key)
  if (match) return CATEGORY_ALIASES[match]
  // Accept "movies" from older NL filters
  if (key === 'movies') return CATEGORY_ALIASES.Movies
  return [key]
}
