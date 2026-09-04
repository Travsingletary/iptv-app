import type { Channel, EpgProgram } from '../types/iptv.js'
import { buildForYouNow } from './recommendations.js'

export interface AssistantContextSnapshot {
  view: string
  currentChannelId: string | null
  favorites: string[]
  recentIds: string[]
  channels: Channel[]
  epg?: EpgProgram[]
}

export interface AssistantToolCall {
  tool: 'search_epg' | 'recommend_now' | 'play_channel'
  status: 'executed'
  input: Record<string, string>
  result: string
  data?: {
    channelId?: string
    channelIds?: string[]
    programs?: Array<{
      id: string
      title: string
      channelId: string
      channelName?: string
    }>
  }
}

export interface AssistantApiResult {
  response: string
  toolCalls: AssistantToolCall[]
}

interface ResolveAssistantOptions {
  modelConfigured?: boolean
}

function findChannelByMessage(message: string, channels: Channel[]): Channel | undefined {
  const lower = message.toLowerCase()
  const sorted = [...channels].sort((a, b) => b.name.length - a.name.length)
  return sorted.find((ch) => lower.includes(ch.name.toLowerCase()))
}

function searchEpgPrograms(
  query: string,
  channels: Channel[],
  epg: EpgProgram[],
  limit = 5,
) {
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, ' ').trim()
  const tokens = normalized.split(/\s+/).filter((token) => token.length > 2)
  const channelByTvg = new Map(
    channels.flatMap((ch) => {
      const keys = [ch.id, ch.tvgId, ch.name].filter(Boolean) as string[]
      return keys.map((key) => [key.toLowerCase(), ch] as const)
    }),
  )

  const scored = epg
    .map((program) => {
      const channel =
        channelByTvg.get(program.channelId.toLowerCase()) ||
        channels.find((ch) => ch.tvgId === program.channelId || ch.id === program.channelId)
      const hay = [
        program.title,
        program.description ?? '',
        program.category ?? '',
        channel?.name ?? '',
        channel?.group ?? '',
      ]
        .join(' ')
        .toLowerCase()

      const hit =
        (normalized.length > 2 && hay.includes(normalized)) ||
        tokens.some((token) => hay.includes(token))
      if (!hit) return null
      return {
        id: program.id,
        title: program.title,
        channelId: channel?.id ?? program.channelId,
        channelName: channel?.name,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  return scored.slice(0, limit)
}

function buildMockReply(message: string, context: AssistantContextSnapshot): AssistantApiResult {
  const q = message.toLowerCase()
  const toolCalls: AssistantToolCall[] = []

  if (q.includes('recommend') || q.includes('watch') || q.includes('suggest')) {
    const picks = buildForYouNow(
      {
        channels: context.channels,
        favorites: context.favorites,
        recentIds: context.recentIds,
      },
      5,
    )
    toolCalls.push({
      tool: 'recommend_now',
      status: 'executed',
      input: { source: 'heuristic' },
      result:
        picks.length > 0
          ? `Suggested: ${picks.map((ch) => ch.name).join(', ')}.`
          : 'No recommendation candidates available.',
      data: { channelIds: picks.map((ch) => ch.id) },
    })
  }

  if (q.includes('guide') || q.includes('what is on') || q.includes("what's on") || q.includes('epg')) {
    const epg = context.epg ?? []
    const query = message.replace(/^(what('?s| is) on|search|find|guide)\s*/i, '').trim() || message
    const programs = searchEpgPrograms(query, context.channels, epg)
    toolCalls.push({
      tool: 'search_epg',
      status: 'executed',
      input: { query: query.slice(0, 80) },
      result:
        programs.length > 0
          ? `Found ${programs.length} guide matches: ${programs.map((p) => p.title).join(', ')}.`
          : 'No matching guide entries for that query.',
      data: { programs },
    })
  }

  if (q.includes('play') || q.includes('switch') || q.includes('tune')) {
    const matched = findChannelByMessage(message, context.channels) ?? context.channels[0]
    toolCalls.push({
      tool: 'play_channel',
      status: 'executed',
      input: { channelId: matched?.id ?? 'unknown' },
      result: matched ? `Switching playback to ${matched.name}.` : 'No channels available.',
      data: matched ? { channelId: matched.id } : undefined,
    })
  }

  const activeName =
    context.channels.find((ch) => ch.id === context.currentChannelId)?.name ?? 'nothing yet'
  const response = [
    `I can help with channel discovery, "what's on now", and quick play actions.`,
    `You are currently on ${context.view} and watching ${activeName}.`,
    `Try: "Recommend something upbeat", "What is on in sports?", or "Play Aether One".`,
  ].join(' ')

  return { response, toolCalls }
}

export async function resolveAssistantReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions = {},
): Promise<AssistantApiResult> {
  if (!options.modelConfigured) return buildMockReply(message, context)

  // Provider integration intentionally deferred. This deterministic path keeps dev usable.
  return buildMockReply(message, context)
}
