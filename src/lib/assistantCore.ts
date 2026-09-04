import type { Channel, EpgProgram } from '../types/iptv.js'
import { buildForYouNow } from './recommendations.js'
import { findUpcomingPrograms } from './reminders.js'

export interface AssistantContextSnapshot {
  view: string
  currentChannelId: string | null
  favorites: string[]
  recentIds: string[]
  channels: Channel[]
  epg?: EpgProgram[]
  /** Short session transcript for optional provider / mock continuity. */
  history?: Array<{ role: 'user' | 'assistant'; text: string }>
}

export type AssistantToolName =
  | 'search_epg'
  | 'recommend_now'
  | 'play_channel'
  | 'set_mute'
  | 'open_guide'
  | 'set_reminder'

export interface AssistantToolCall {
  tool: AssistantToolName
  status: 'executed'
  input: Record<string, string>
  result: string
  data?: {
    channelId?: string
    channelIds?: string[]
    muted?: boolean
    view?: string
    programs?: Array<{
      id: string
      title: string
      channelId: string
      channelName?: string
    }>
    reminders?: Array<{
      programId: string
      programTitle: string
      channelId: string
      channelName: string
      fireAt: number
    }>
  }
}

export interface AssistantApiResult {
  response: string
  toolCalls: AssistantToolCall[]
}

interface ResolveAssistantOptions {
  modelConfigured?: boolean
  /** Optional OpenAI-compatible API key when a real provider is wired. */
  apiKey?: string
  provider?: string
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

function wantsRecommend(q: string) {
  return (
    q.includes('recommend') ||
    q.includes('suggest') ||
    q.includes('what should i watch') ||
    /\bfind me something\b/.test(q)
  )
}

function wantsGuide(q: string) {
  return (
    q.includes('guide') ||
    q.includes('what is on') ||
    q.includes("what's on") ||
    q.includes('epg') ||
    /\bsearch guide\b/.test(q)
  )
}

function wantsPlay(q: string) {
  return /\b(play|switch|tune)\b/.test(q)
}

function wantsMute(q: string) {
  return /\b(mute|silence|quiet)\b/.test(q) && !/\bunmute\b/.test(q)
}

function wantsUnmute(q: string) {
  return /\bunmute\b/.test(q) || /sound on|volume on/.test(q)
}

function wantsRemind(q: string) {
  return /\bremind\b/.test(q) || /\breminder\b/.test(q)
}

function buildMockReply(message: string, context: AssistantContextSnapshot): AssistantApiResult {
  const q = message.toLowerCase()
  const toolCalls: AssistantToolCall[] = []
  const notes: string[] = []

  if (wantsMute(q)) {
    toolCalls.push({
      tool: 'set_mute',
      status: 'executed',
      input: { muted: 'true' },
      result: 'Muted playback audio.',
      data: { muted: true },
    })
    notes.push('Audio muted.')
  } else if (wantsUnmute(q)) {
    toolCalls.push({
      tool: 'set_mute',
      status: 'executed',
      input: { muted: 'false' },
      result: 'Unmuted playback audio.',
      data: { muted: false },
    })
    notes.push('Audio unmuted.')
  }

  if (wantsRemind(q)) {
    const query = message
      .replace(/^(remind me(?:\s+(?:when|about|for))?|set (?:a )?reminder(?:\s+(?:for|when|about))?)\s*/i, '')
      .replace(/\s+starts?$/i, '')
      .trim() || message
    const drafts = findUpcomingPrograms(query, context.channels, context.epg ?? [], Date.now(), 3)
    toolCalls.push({
      tool: 'set_reminder',
      status: 'executed',
      input: { query: query.slice(0, 80) },
      result:
        drafts.length > 0
          ? `Scheduled reminder for ${drafts[0].programTitle} on ${drafts[0].channelName}.`
          : 'No upcoming guide matches for that reminder.',
      data: { reminders: drafts },
    })
    notes.push(
      drafts.length
        ? `Reminder armed for “${drafts[0].programTitle}”.`
        : 'Could not find an upcoming program to remind you about.',
    )
  }

  if (wantsRecommend(q)) {
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

  if (wantsGuide(q)) {
    const epg = context.epg ?? []
    const query =
      message.replace(/^(what('?s| is) on|search(?:\s+guide)?|find|guide)\s*/i, '').trim() || message
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
    toolCalls.push({
      tool: 'open_guide',
      status: 'executed',
      input: {},
      result: 'Opening the TV guide.',
      data: { view: 'guide' },
    })
  }

  if (wantsPlay(q)) {
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
  const memoryHint =
    context.history && context.history.length > 0
      ? ` I remember our last ${Math.min(context.history.length, 6)} turns.`
      : ''
  const response =
    notes.length > 0
      ? `${notes.join(' ')}${memoryHint}`
      : [
          `I can help with channel discovery, reminders, mute, "what's on now", and quick play actions.`,
          `You are currently on ${context.view} and watching ${activeName}.${memoryHint}`,
          `Try: "Recommend something", "Remind me when Match Center starts", "Mute", or "Play Aether One".`,
        ].join(' ')

  return { response, toolCalls }
}

/**
 * Optional OpenAI-compatible chat completion. Falls back to mock on any failure
 * so the product stays usable without keys.
 */
async function tryProviderReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions,
): Promise<AssistantApiResult | null> {
  const apiKey = options.apiKey
  if (!apiKey || !options.modelConfigured) return null

  try {
    const history = (context.history ?? []).slice(-6).map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      content: turn.text,
    }))
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'You are Aether, a concise IPTV assistant. Prefer short replies. Tools are executed locally; do not invent channel IDs.',
          },
          ...history,
          {
            role: 'user',
            content: `${message}\n\nContext view=${context.view} channel=${context.currentChannelId ?? 'none'}`,
          },
        ],
      }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content?.trim()
    if (!content) return null

    // Still run local tools from the user utterance so actions remain deterministic.
    const local = buildMockReply(message, context)
    return {
      response: content,
      toolCalls: local.toolCalls,
    }
  } catch {
    return null
  }
}

export async function resolveAssistantReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions = {},
): Promise<AssistantApiResult> {
  if (options.modelConfigured) {
    const provider = await tryProviderReply(message, context, options)
    if (provider) return provider
  }
  return buildMockReply(message, context)
}
