import type { Channel, EpgProgram } from '../types/iptv.js'
import { runAgentTurn, type AgentStep } from './agentLoop.js'
import { chatWithTools, isProviderConfigured } from './providerAdapter.js'

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
    clearedReminderIds?: string[]
  }
}

export interface AssistantApiResult {
  response: string
  toolCalls: AssistantToolCall[]
  /** Phase 3 multi-step plan details. */
  steps?: AgentStep[]
  needsConfirmation?: boolean
}

interface ResolveAssistantOptions {
  modelConfigured?: boolean
  /** Optional OpenAI-compatible API key when a real provider is wired. */
  apiKey?: string
  provider?: string
  baseUrl?: string
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
  }
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
  if (!apiKey || !isProviderConfigured({ apiKey, provider: options.provider })) {
    return null
  }

  const history = (context.history ?? []).slice(-8).map((turn) => ({
    role: (turn.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
    content: turn.text,
  }))

  const provider = await chatWithTools({
    apiKey,
    provider: options.provider,
    baseUrl: options.baseUrl,
    messages: [
      {
        role: 'system',
        content:
          'You are Aether, a concise IPTV assistant. Prefer short replies. Tools are executed locally via an allowlisted agent loop; do not invent channel IDs.',
      },
      ...history,
      {
        role: 'user',
        content: `${message}\n\nContext view=${context.view} channel=${context.currentChannelId ?? 'none'}`,
      },
    ],
  })

  if (!provider) return null

  // Always run the deterministic local agent for tool execution.
  const local = buildMockReply(message, context, options)
  return {
    response: provider.content,
    toolCalls: local.toolCalls,
    steps: local.steps,
    needsConfirmation: local.needsConfirmation,
  }
}

export async function resolveAssistantReply(
  message: string,
  context: AssistantContextSnapshot,
  options: ResolveAssistantOptions = {},
): Promise<AssistantApiResult> {
  if (options.modelConfigured || options.apiKey) {
    const provider = await tryProviderReply(message, context, options)
    if (provider) return provider
  }
  return buildMockReply(message, context, options)
}
