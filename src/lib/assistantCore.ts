import type { Channel, EpgProgram } from '../types/iptv.js'
import { runAgentTurn, type AgentStep } from './agentLoop.js'
import {
  isProviderConfigured,
  runProviderToolLoop,
} from './providerAdapter.js'

export interface AssistantContextSnapshot {
  view: string
  currentChannelId: string | null
  favorites: string[]
  recentIds: string[]
  channels: Channel[]
  epg?: EpgProgram[]
  /** Short session transcript for optional provider / mock continuity. */
  history?: Array<{ role: 'user' | 'assistant'; text: string }>
  /** Active household profile id (Phase 4). */
  profileId?: string
  /** Interest tags from the active profile. */
  interestTags?: string[]
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
      category?: string
      start?: number
      end?: number
      durationMs?: number
    }>
    epgFilters?: {
      category?: string
      windowStartMs?: number
      windowEndMs?: number
      maxDurationMs?: number
    }
    reminders?: Array<{
      programId: string
      programTitle: string
      channelId: string
      channelName: string
      fireAt: number
    }>
    clearedReminderIds?: string[]
  }
}

export interface AssistantApiResult {
  response: string
  toolCalls: AssistantToolCall[]
  /** Phase 3+ multi-step plan details. */
  steps?: AgentStep[]
  needsConfirmation?: boolean
  /** When a real provider answered. */
  providerModel?: string
  providerRounds?: number
  /** Mock = deterministic agent; Live = OpenAI-compatible loop. */
  aiMode?: 'mock' | 'live'
}

interface ResolveAssistantOptions {
  modelConfigured?: boolean
  /** Optional OpenAI-compatible API key when a real provider is wired. */
  apiKey?: string
  provider?: string
  baseUrl?: string
  model?: string
  /** Execute confirm-risk tools (e.g. clear_reminders). */
  confirmed?: boolean
}

function buildMockReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions = {},
): AssistantApiResult {
  const result = runAgentTurn(message, context, { confirmed: options.confirmed })
  return {
    response: result.response,
    toolCalls: result.toolCalls,
    steps: result.steps,
    needsConfirmation: result.needsConfirmation,
    aiMode: 'mock',
  }
}

/**
 * Real multi-round OpenAI-compatible tools loop when an API key is present.
 * Falls back to mock on any failure so the product stays usable without keys.
 */
async function tryProviderReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions,
): Promise<AssistantApiResult | null> {
  const apiKey = options.apiKey
  if (!apiKey || !isProviderConfigured({ apiKey, provider: options.provider })) {
    return null
  }

  const loop = await runProviderToolLoop(message, context, {
    apiKey,
    provider: options.provider,
    baseUrl: options.baseUrl,
    model: options.model,
    confirmed: options.confirmed,
  })
  if (!loop) return null

  return {
    response: loop.response,
    toolCalls: loop.toolCalls,
    steps: loop.steps,
    needsConfirmation: loop.needsConfirmation,
    providerModel: loop.providerModel,
    providerRounds: loop.rounds,
    aiMode: 'live',
  }
}

/**
 * Short imperative commands where the local agent is authoritative.
 * Used to fill Live AI gaps when the model replies without calling tools.
 */
function isCommandLikeIntent(message: string): boolean {
  const q = message.trim()
  if (!q || q.length > 140) return false
  return (
    /^(please\s+)?(mute|unmute|silence|quiet)(\s+please)?[!?.]*$/i.test(q) ||
    /^(sound on|volume on)[!?.]*$/i.test(q) ||
    /\bremind( me)?\b/i.test(q) ||
    /^(recommend|suggest)\b/i.test(q) ||
    /^play\b/i.test(q) ||
    /\b(sports?|movies?|films?|news|kids)\b.*\b(next|under|hour|hours|min)\b/i.test(q)
  )
}

/** Ensure Live AI cannot drop clear local tool intents (mute/remind flake guard). */
function mergeMissingLocalTools(
  provider: AssistantApiResult,
  mock: AssistantApiResult,
  message: string,
): AssistantApiResult {
  if (!isCommandLikeIntent(message) || !mock.toolCalls.length) return provider

  const missing = mock.toolCalls.filter(
    (local) => !provider.toolCalls.some((live) => live.tool === local.tool),
  )
  if (!missing.length) return provider

  const missingSteps = (mock.steps ?? []).filter((step) =>
    missing.some((tool) => tool.tool === step.tool),
  )

  return {
    ...provider,
    toolCalls: [...provider.toolCalls, ...missing],
    steps: [...(provider.steps ?? []), ...missingSteps],
    response:
      provider.toolCalls.length > 0
        ? provider.response
        : [provider.response, mock.response].filter(Boolean).join(' ').trim() || mock.response,
  }
}

export async function resolveAssistantReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions = {},
): Promise<AssistantApiResult> {
  const mock = buildMockReply(message, context, options)

  if (options.modelConfigured || options.apiKey) {
    const provider = await tryProviderReply(message, context, options)
    if (provider) return mergeMissingLocalTools(provider, mock, message)
  }
  return mock
}
