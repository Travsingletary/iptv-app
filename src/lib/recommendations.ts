import type { Channel } from '../types/iptv.js'
import {
  channelCategory,
  detectCategoryMention,
  type NormalizedCategory,
} from './categories.js'

export interface RecommendationContext {
  channels: Channel[]
  favorites: string[]
  recentIds: string[]
  /** Profile interest tags (sports, kids, …) bias scoring. */
  interestTags?: string[]
  /** Optional normalized category filter (Sports, Kids, …). */
  category?: NormalizedCategory | string
  now?: Date
}

function hourBucket(date: Date) {
  const hour = date.getHours()
  if (hour < 11) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 22) return 'evening'
  return 'late'
}

function scoreByTime(channel: Channel, bucket: ReturnType<typeof hourBucket>) {
  const cat = channelCategory(channel).toLowerCase()
  if (bucket === 'morning' && cat === 'news') return 28
  if (bucket === 'afternoon' && (cat === 'sports' || cat === 'kids')) return 26
  if (bucket === 'evening' && (cat === 'movies' || cat === 'entertainment')) return 30
  if (bucket === 'late' && (cat === 'movies' || cat === 'music')) return 24
  return channel.kind === 'live' ? 12 : 8
}

function scoreByInterests(channel: Channel, tags: string[]) {
  if (!tags.length) return 0
  const cat = channelCategory(channel).toLowerCase()
  const hay = `${channel.group} ${channel.name} ${channel.description ?? ''} ${cat}`.toLowerCase()
  let score = 0
  for (const tag of tags) {
    const t = tag.toLowerCase().trim()
    if (!t) continue
    const mentioned = detectCategoryMention(t)
    if (mentioned && channelCategory(channel) === mentioned) score += 28
    else if (hay.includes(t) || cat.includes(t)) score += 22
  }
  return score
}

export function buildForYouNow(context: RecommendationContext, limit = 10): Channel[] {
  const {
    channels,
    favorites,
    recentIds,
    interestTags = [],
    category,
    now = new Date(),
  } = context
  if (!channels.length) return []

  const recentWeights = new Map(recentIds.map((id, index) => [id, Math.max(24 - index * 3, 0)]))
  const favSet = new Set(favorites)
  const bucket = hourBucket(now)
  const categoryFilter =
    typeof category === 'string' && category
      ? detectCategoryMention(category) ?? (category as NormalizedCategory)
      : undefined

  return [...channels]
    .filter((channel) => {
      if (!categoryFilter) return true
      return channelCategory(channel) === categoryFilter
    })
    .map((channel) => {
      const favoriteBoost = favSet.has(channel.id) ? 34 : 0
      const recentBoost = recentWeights.get(channel.id) ?? 0
      const timeBoost = scoreByTime(channel, bucket)
      const kindBoost = channel.kind === 'live' ? 10 : 4
      const interestBoost = scoreByInterests(channel, interestTags)
      const categoryBoost = categoryFilter && channelCategory(channel) === categoryFilter ? 20 : 0
      return {
        channel,
        score: favoriteBoost + recentBoost + timeBoost + kindBoost + interestBoost + categoryBoost,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.channel)
}
