/**
 * Xtream Codes API client with graceful demo fallback.
 * Spec: player_api.php?username=&password=&action=
 */
import type { Channel, ContentKind, PlaylistSource } from '../types/iptv.js'
import { DEMO_CHANNELS, DEMO_SOURCE, refreshDemoEpg } from './demoData.js'

export interface XtreamCredentials {
  server: string
  username: string
  password: string
}

export interface XtreamIngestResult {
  ok: boolean
  source: PlaylistSource
  channels: Channel[]
  usedDemoFallback: boolean
  message: string
  liveCount: number
  vodCount: number
  seriesCount: number
}

interface XtreamStreamRow {
  stream_id?: number | string
  name?: string
  category_name?: string
  category_id?: string | number
  stream_icon?: string
  epg_channel_id?: string
  tv_archive?: number
  container_extension?: string
  rating?: string
  plot?: string
  cover?: string
  stream_type?: string
}

function normalizeServer(server: string): string {
  let s = server.trim().replace(/\/$/, '')
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`
  return s
}

export function buildXtreamApiUrl(
  creds: XtreamCredentials,
  action?: string,
  extra: Record<string, string> = {},
): string {
  const base = normalizeServer(creds.server)
  const params = new URLSearchParams({
    username: creds.username,
    password: creds.password,
    ...extra,
  })
  if (action) params.set('action', action)
  return `${base}/player_api.php?${params.toString()}`
}

export function buildXtreamStreamUrl(
  creds: XtreamCredentials,
  kind: 'live' | 'movie' | 'series',
  streamId: string | number,
  extension = 'm3u8',
): string {
  const base = normalizeServer(creds.server)
  const path =
    kind === 'live' ? 'live' : kind === 'movie' ? 'movie' : 'series'
  return `${base}/${path}/${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}/${streamId}.${extension}`
}

/** Catch-up / timeshift URL when provider supports tv_archive. */
export function buildXtreamCatchupUrl(
  creds: XtreamCredentials,
  streamId: string | number,
  startUnix: number,
  durationSec: number,
): string {
  const base = normalizeServer(creds.server)
  return `${base}/streaming/timeshift.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&stream=${streamId}&start=${startUnix}&duration=${durationSec}`
}

function mapRow(
  row: XtreamStreamRow,
  creds: XtreamCredentials,
  kind: ContentKind,
  groupFallback: string,
): Channel | null {
  const streamId = row.stream_id
  if (streamId == null || !row.name) return null
  const ext = row.container_extension || 'm3u8'
  const streamKind = kind === 'live' ? 'live' : kind === 'series' ? 'series' : 'movie'
  return {
    id: `xtream_${kind}_${streamId}`,
    name: row.name,
    group: row.category_name || groupFallback,
    url: buildXtreamStreamUrl(creds, streamKind === 'live' ? 'live' : streamKind === 'series' ? 'series' : 'movie', streamId, ext),
    kind,
    logo: row.stream_icon || row.cover,
    tvgId: row.epg_channel_id,
    catchup: Boolean(row.tv_archive),
    poster: row.cover || row.stream_icon,
    rating: row.rating,
    description: row.plot,
    quality: kind === 'live' ? 'HD' : undefined,
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function fetchAction(
  creds: XtreamCredentials,
  action: string,
  signal?: AbortSignal,
): Promise<XtreamStreamRow[]> {
  const url = buildXtreamApiUrl(creds, action)
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Xtream ${action} failed (${res.status})`)
  const json = (await res.json()) as unknown
  if (!Array.isArray(json)) return []
  return json as XtreamStreamRow[]
}

async function authenticate(
  creds: XtreamCredentials,
  signal?: AbortSignal,
): Promise<boolean> {
  const url = buildXtreamApiUrl(creds)
  const res = await fetch(url, { signal })
  if (!res.ok) return false
  const json = (await res.json()) as { user_info?: { auth?: number | string } }
  const auth = json?.user_info?.auth
  return auth === 1 || auth === '1'
}

/**
 * Ingest live + VOD + series from an Xtream panel.
 * On network/auth failure, returns demo pack with usedDemoFallback=true.
 */
export async function ingestXtream(
  creds: XtreamCredentials,
  options: { signal?: AbortSignal; demoOnFailure?: boolean; timeoutMs?: number } = {},
): Promise<XtreamIngestResult> {
  const demoOnFailure = options.demoOnFailure !== false
  const timeoutMs = options.timeoutMs ?? 4_000
  const sourceBase: PlaylistSource = {
    id: `xtream_${Date.now().toString(36)}`,
    name: `Xtream · ${creds.username}`,
    type: 'xtream',
    url: normalizeServer(creds.server),
    username: creds.username,
    password: creds.password,
    createdAt: Date.now(),
  }

  const run = async (): Promise<XtreamIngestResult> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const onParentAbort = () => controller.abort()
    options.signal?.addEventListener('abort', onParentAbort)
    try {
      const signal = controller.signal
      const ok = await authenticate(creds, signal)
      if (!ok) throw new Error('Xtream authentication failed')

      const [liveRows, vodRows, seriesRows] = await Promise.all([
        fetchAction(creds, 'get_live_streams', signal),
        fetchAction(creds, 'get_vod_streams', signal),
        fetchAction(creds, 'get_series', signal),
      ])

      const live = liveRows
        .map((row) => mapRow(row, creds, 'live', 'Live'))
        .filter((c): c is Channel => Boolean(c))
      const vod = vodRows
        .map((row) => mapRow(row, creds, 'movie', 'VOD'))
        .filter((c): c is Channel => Boolean(c))
      const series = seriesRows
        .map((row) => mapRow(row, creds, 'series', 'Series'))
        .filter((c): c is Channel => Boolean(c))

      const channels = [...live, ...vod, ...series]
      if (!channels.length) throw new Error('Xtream returned no streams')

      return {
        ok: true,
        source: sourceBase,
        channels,
        usedDemoFallback: false,
        message: `Imported ${live.length} live, ${vod.length} VOD, ${series.length} series.`,
        liveCount: live.length,
        vodCount: vod.length,
        seriesCount: series.length,
      }
    } finally {
      clearTimeout(timer)
      options.signal?.removeEventListener('abort', onParentAbort)
    }
  }

  try {
    return await withTimeout(run(), timeoutMs + 500, 'Xtream ingest')
  } catch (err) {
    if (!demoOnFailure) throw err
    return {
      ok: false,
      source: { ...DEMO_SOURCE, createdAt: Date.now() },
      channels: DEMO_CHANNELS,
      usedDemoFallback: true,
      message: `Xtream unavailable (${err instanceof Error ? err.message : 'error'}). Loaded demo pack instead.`,
      liveCount: DEMO_CHANNELS.filter((c) => c.kind === 'live').length,
      vodCount: DEMO_CHANNELS.filter((c) => c.kind === 'movie').length,
      seriesCount: DEMO_CHANNELS.filter((c) => c.kind === 'series').length,
    }
  }
}

/** Demo catchup stub: replay the channel URL with a documented timeshift offset. */
export function buildDemoCatchupStub(channel: Channel, minutesAgo: number): {
  url: string
  label: string
  supported: boolean
} {
  if (!channel.catchup) {
    return {
      url: channel.url,
      label: 'Catch-up not advertised for this channel',
      supported: false,
    }
  }
  // Public demo HLS has no real archive — surface a clear stub URL marker for UI/docs.
  const stub = `${channel.url}${channel.url.includes('?') ? '&' : '?'}aether_catchup=${minutesAgo}m`
  return {
    url: stub,
    label: `Timeshift stub · ${minutesAgo} min (demo streams have no archive)`,
    supported: true,
  }
}

export function xtreamDemoEpg() {
  return refreshDemoEpg()
}
