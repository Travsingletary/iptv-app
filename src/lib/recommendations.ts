import type { Channel } from '../types/iptv.js'

export interface RecommendationContext {
  channels: Channel[]
  favorites: string[]
  recentIds: string[]
  /** Profile interest tags (sports, kids, …) bias scoring. */
  interestTags?: string[]
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
  const group = channel.group.toLowerCase()
  if (bucket === 'morning' && group.includes('news')) return 28
  if (bucket === 'afternoon' && (group.includes('sports') || group.includes('kids'))) return 26
  if (bucket === 'evening' && (group.includes('movies') || group.includes('entertainment'))) return 30
  if (bucket === 'late' && (group.includes('movies') || group.includes('music'))) return 24
  return channel.kind === 'live' ? 12 : 8
}

function scoreByInterests(channel: Channel, tags: string[]) {
  if (!tags.length) return 0
  const hay = `${channel.group} ${channel.name} ${channel.description ?? ''}`.toLowerCase()
  let score = 0
  for (const tag of tags) {
    const t = tag.toLowerCase().trim()
    if (!t) continue
    if (hay.includes(t)) score += 22
  }
  return score
}

export function buildForYouNow(context: RecommendationContext, limit = 10): Channel[] {
  const { channels, favorites, recentIds, interestTags = [], now = new Date() } = context
  if (!channels.length) return []

  const recentWeights = new Map(recentIds.map((id, index) => [id, Math.max(24 - index * 3, 0)]))
  const favSet = new Set(favorites)
  const bucket = hourBucket(now)

  return [...channels]
    .map((channel) => {
      const favoriteBoost = favSet.has(channel.id) ? 34 : 0
      const recentBoost = recentWeights.get(channel.id) ?? 0
      const timeBoost = scoreByTime(channel, bucket)
      const kindBoost = channel.kind === 'live' ? 10 : 4
      const interestBoost = scoreByInterests(channel, interestTags)
      return {
        channel,
        score: favoriteBoost + recentBoost + timeBoost + kindBoost + interestBoost,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.channel)
}
