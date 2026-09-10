import type { EpgProgram } from '../types/iptv'

function parseXmlTime(value: string): number {
  // XMLTV: 20240101120000 +0000 or 20240101120000
  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?/,
  )
  if (!m) return Date.parse(value) || Date.now()
  const [, y, mo, d, h, mi, s, tz] = m
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}${tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : 'Z'}`
  return Date.parse(iso)
}

function textOf(node: Element | null, tag: string): string | undefined {
  return node?.getElementsByTagName(tag)[0]?.textContent?.trim() || undefined
}

/** Parse XMLTV EPG into programs keyed later by channel tvg-id. */
export function parseXmltv(xml: string): EpgProgram[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const nodes = Array.from(doc.getElementsByTagName('programme'))
  return nodes.map((node, idx) => {
    const channelId = node.getAttribute('channel') || 'unknown'
    const start = parseXmlTime(node.getAttribute('start') || '')
    const end = parseXmlTime(node.getAttribute('stop') || '')
    return {
      id: `epg_${channelId}_${start}_${idx}`,
      channelId,
      title: textOf(node, 'title') || 'Program',
      description: textOf(node, 'desc'),
      category: textOf(node, 'category'),
      start,
      end: Number.isFinite(end) && end > start ? end : start + 30 * 60_000,
    }
  })
}

export function programsForChannel(
  programs: EpgProgram[],
  channelKey: string,
  now = Date.now(),
  windowMs = 6 * 60 * 60_000,
): EpgProgram[] {
  const from = now - 60 * 60_000
  const to = now + windowMs
  return programs
    .filter(
      (p) =>
        (p.channelId === channelKey ||
          p.channelId.toLowerCase() === channelKey.toLowerCase()) &&
        p.end > from &&
        p.start < to,
    )
    .sort((a, b) => a.start - b.start)
}

export function nowPlaying(
  programs: EpgProgram[],
  channelKey: string,
  now = Date.now(),
): EpgProgram | undefined {
  return programs.find(
    (p) =>
      (p.channelId === channelKey ||
        p.channelId.toLowerCase() === channelKey.toLowerCase()) &&
      p.start <= now &&
      p.end > now,
  )
}

export function progressPct(program: EpgProgram, now = Date.now()): number {
  const span = program.end - program.start
  if (span <= 0) return 0
  return Math.min(100, Math.max(0, ((now - program.start) / span) * 100))
}
