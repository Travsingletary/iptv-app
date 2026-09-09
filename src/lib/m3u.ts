import type { Channel, ContentKind } from '../types/iptv'
import { normalizeCategory } from './categories'

function hashId(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return `ch_${Math.abs(h).toString(36)}`
}

function inferKind(group: string, name: string): ContentKind {
  const hay = `${group} ${name}`.toLowerCase()
  if (/(vod|movie|film|cinema)/.test(hay)) return 'movie'
  if (/(series|show|season|episode)/.test(hay)) return 'series'
  return 'live'
}

function attr(line: string, key: string): string | undefined {
  const re = new RegExp(`${key}="([^"]*)"`, 'i')
  return line.match(re)?.[1]
}

/** Parse an M3U / M3U8 playlist into channels. */
export function parseM3U(raw: string): Channel[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim())
  const channels: Channel[] = []
  let meta: Partial<Channel> | null = null

  for (const line of lines) {
    if (!line || line.startsWith('#EXTM3U')) continue

    if (line.startsWith('#EXTINF:')) {
      const comma = line.lastIndexOf(',')
      const name = comma >= 0 ? line.slice(comma + 1).trim() : 'Unknown'
      const group =
        attr(line, 'group-title') ||
        attr(line, 'group') ||
        'Uncategorized'
      const logo = attr(line, 'tvg-logo') || attr(line, 'logo')
      const tvgId = attr(line, 'tvg-id')
      const tvgName = attr(line, 'tvg-name')
      const kind = inferKind(group, name)

      meta = {
        name,
        group,
        logo,
        tvgId,
        tvgName,
        kind,
        catchup: /catchup/i.test(line),
      }
      continue
    }

    if (line.startsWith('#')) continue

    if (meta) {
      const url = line
      const id = hashId(`${meta.name}|${url}|${meta.group}`)
      const group = meta.group || 'Uncategorized'
      const name = meta.name || 'Unknown'
      channels.push({
        id,
        name,
        group,
        category: normalizeCategory(group, name),
        url,
        kind: meta.kind || 'live',
        logo: meta.logo,
        tvgId: meta.tvgId,
        tvgName: meta.tvgName,
        catchup: meta.catchup,
      })
      meta = null
    }
  }

  return channels
}

export function channelsByGroup(channels: Channel[]): Record<string, Channel[]> {
  return channels.reduce<Record<string, Channel[]>>((acc, ch) => {
    const key = ch.group || 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(ch)
    return acc
  }, {})
}

export async function fetchM3U(url: string): Promise<Channel[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch playlist (${res.status})`)
  const text = await res.text()
  return parseM3U(text)
}
