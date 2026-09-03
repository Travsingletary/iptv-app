import type { Channel } from '../types/iptv.js'

export interface AssistantContextSnapshot {
  view: string
  currentChannelId: string | null
  favorites: string[]
  recentIds: string[]
  channels: Channel[]
}

export interface AssistantToolCall {
  tool: 'search_epg' | 'recommend_now' | 'play_channel'
  status: 'stubbed'
  input: Record<string, string>
  result: string
}

export interface AssistantApiResult {
  response: string
  toolCalls: AssistantToolCall[]
}

interface ResolveAssistantOptions {
  modelConfigured?: boolean
}

function buildMockReply(message: string, context: AssistantContextSnapshot): AssistantApiResult {
  const q = message.toLowerCase()
  const toolCalls: AssistantToolCall[] = []

  if (q.includes('recommend') || q.includes('watch')) {
    toolCalls.push({
      tool: 'recommend_now',
      status: 'stubbed',
      input: { source: 'heuristic' },
      result: `Suggested ${Math.min(context.channels.length, 5)} candidates from favorites and recents.`,
    })
  }

  if (q.includes('guide') || q.includes('what is on')) {
    toolCalls.push({
      tool: 'search_epg',
      status: 'stubbed',
      input: { query: message.slice(0, 80) },
      result: 'EPG lookup stub executed. Hook provider in Phase 2.',
    })
  }

  if (q.includes('play') || q.includes('switch')) {
    const first = context.channels[0]
    toolCalls.push({
      tool: 'play_channel',
      status: 'stubbed',
      input: { channelId: first?.id ?? 'unknown' },
      result: first ? `Would switch playback to ${first.name}.` : 'No channels available.',
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
