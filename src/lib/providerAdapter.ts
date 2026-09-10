/**
 * Optional OpenAI-compatible chat + multi-round tools loop.
 * Mock agent remains the default when keys are missing.
 */
import { isToolAllowed, runAgentTurn, type AgentStep } from './agentLoop.js'
import type {
  AssistantContextSnapshot,
  AssistantToolCall,
} from './assistantCore.js'

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: ProviderToolCall[]
  name?: string
}

export interface ProviderToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ProviderToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ProviderChatOptions {
  apiKey: string
  provider?: string
  baseUrl?: string
  model?: string
  messages: ProviderMessage[]
  tools?: ProviderToolDefinition[]
  temperature?: number
}

export interface ProviderRoundResult {
  content: string
  toolCalls: ProviderToolCall[]
  rawModel: string
  finishReason?: string
}

/** @deprecated Prefer ProviderRoundResult + runProviderToolLoop */
export interface ProviderChatResult {
  content: string
  toolNames: string[]
  rawModel: string
}

const DEFAULT_TOOLS: ProviderToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'play_channel',
      description:
        'Switch playback to a channel. Pass an exact channel id from the catalog, or the channel display name.',
      parameters: {
        type: 'object',
        properties: {
          channelId: {
            type: 'string',
            description: 'Exact channel id from the catalog, or the channel name',
          },
        },
        required: ['channelId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_mute',
      description: 'Mute or unmute audio',
      parameters: {
        type: 'object',
        properties: { muted: { type: 'boolean' } },
        required: ['muted'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_reminder',
      description: 'Schedule a reminder for an upcoming program',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_now',
      description:
        'Recommend channels to watch now. Optional category: News, Sports, Movies, Kids, Entertainment, Music, Documentary, Local.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Normalized category bucket such as Sports or Kids',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_epg',
      description:
        'Search the electronic program guide. Supports NL like sports in next 2 hours or movies under 2h.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_guide',
      description: 'Open the TV guide view',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clear_reminders',
      description: 'Dismiss all active reminders (requires user confirmation)',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_fallback',
      description: 'Suggest an alternate stream in the same group',
      parameters: {
        type: 'object',
        properties: { channelId: { type: 'string' } },
      },
    },
  },
]

export function isProviderConfigured(env: {
  apiKey?: string
  provider?: string
}): boolean {
  return Boolean(env.apiKey)
}

function processEnv(key: string): string | undefined {
  try {
    const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process
    return proc?.env?.[key]
  } catch {
    return undefined
  }
}

/** Single chat/completions round. */
export async function chatCompletionsRound(
  options: ProviderChatOptions,
): Promise<ProviderRoundResult | null> {
  if (!options.apiKey) return null

  const base = (
    options.baseUrl ||
    processEnv('OPENAI_BASE_URL') ||
    'https://api.openai.com/v1'
  ).replace(/\/$/, '')
  const model = options.model || processEnv('OPENAI_MODEL') || 'gpt-4o-mini'

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.3,
        messages: options.messages,
        tools: options.tools ?? DEFAULT_TOOLS,
      }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      choices?: Array<{
        finish_reason?: string
        message?: {
          content?: string | null
          tool_calls?: ProviderToolCall[]
        }
      }>
    }
    const choice = json.choices?.[0]
    const message = choice?.message
    const content = message?.content?.trim() || ''
    const toolCalls = message?.tool_calls ?? []
    if (!content && !toolCalls.length) return null
    return {
      content,
      toolCalls,
      rawModel: model,
      finishReason: choice?.finish_reason,
    }
  } catch {
    return null
  }
}

/** Legacy single-shot helper used by older callers/tests. */
export async function chatWithTools(
  options: ProviderChatOptions,
): Promise<ProviderChatResult | null> {
  const round = await chatCompletionsRound(options)
  if (!round) return null
  return {
    content:
      round.content ||
      (round.toolCalls.length
        ? `I'll run: ${round.toolCalls.map((t) => t.function.name).join(', ')}.`
        : 'Done.'),
    toolNames: round.toolCalls.map((t) => t.function.name).filter(Boolean),
    rawModel: round.rawModel,
  }
}

export interface ProviderToolLoopResult {
  response: string
  toolCalls: AssistantToolCall[]
  steps: AgentStep[]
  needsConfirmation: boolean
  providerModel: string
  rounds: number
}

function parseToolArgs(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw || '{}') as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = typeof v === 'boolean' || typeof v === 'number' ? String(v) : String(v ?? '')
    }
    return out
  } catch {
    return { query: raw }
  }
}

/**
 * Robust OpenAI-compatible tools loop:
 * model → tool_calls → local allowlisted execution → tool results → model…
 * Falls back to null so callers can use the mock agent.
 */
export async function runProviderToolLoop(
  message: string,
  context: AssistantContextSnapshot,
  options: {
    apiKey: string
    provider?: string
    baseUrl?: string
    model?: string
    confirmed?: boolean
    maxRounds?: number
  },
): Promise<ProviderToolLoopResult | null> {
  if (!options.apiKey) return null

  const history = (context.history ?? []).slice(-8).map((turn) => ({
    role: (turn.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
    content: turn.text,
  }))

  const catalog = buildChannelCatalog(context)
  const messages: ProviderMessage[] = [
    {
      role: 'system',
      content: [
        'You are SteadyStream, a concise IPTV assistant.',
        'Use tools for play, mute, remind, recommend, EPG search, guide, fallbacks.',
        'Prefer short replies.',
        'Never invent channel IDs — pick an exact id from Channels, or pass the channel name as channelId.',
        'After tools run, summarize only what the tool results confirm (do not claim a different channel played).',
        `Context: view=${context.view} channel=${context.currentChannelId ?? 'none'} favorites=${context.favorites.slice(0, 8).join(',')}`,
        catalog ? `Channels (id=name): ${catalog}` : 'Channels: (none loaded)',
      ].join(' '),
    },
    ...history,
    { role: 'user', content: message },
  ]

  const allSteps: AgentStep[] = []
  const allToolCalls: AssistantToolCall[] = []
  let needsConfirmation = false
  let lastContent = ''
  let model = options.model || 'gpt-4o-mini'
  const maxRounds = options.maxRounds ?? 4

  for (let round = 0; round < maxRounds; round += 1) {
    const result = await chatCompletionsRound({
      apiKey: options.apiKey,
      provider: options.provider,
      baseUrl: options.baseUrl,
      model: options.model,
      messages,
      tools: DEFAULT_TOOLS,
    })
    if (!result) {
      if (round === 0) return null
      break
    }
    model = result.rawModel
    lastContent = result.content

    if (!result.toolCalls.length) {
      return {
        response: lastContent || 'Done.',
        toolCalls: allToolCalls,
        steps: allSteps,
        needsConfirmation,
        providerModel: model,
        rounds: round + 1,
      }
    }

    messages.push({
      role: 'assistant',
      content: result.content || '',
      tool_calls: result.toolCalls,
    })

    for (const call of result.toolCalls) {
      const name = call.function?.name || ''
      const input = parseToolArgs(call.function?.arguments || '{}')

      if (!isToolAllowed(name)) {
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name,
          content: JSON.stringify({ error: 'Tool not on allowlist' }),
        })
        continue
      }

      // Build a synthetic utterance the local agent understands for this tool
      const synthetic = syntheticMessageForTool(name, input, message, context)
      const local = runAgentTurn(synthetic, context, { confirmed: options.confirmed })
      allSteps.push(...local.steps)
      allToolCalls.push(...local.toolCalls)
      if (local.needsConfirmation) needsConfirmation = true

      const payload = {
        result: local.response,
        steps: local.steps.map((s) => ({
          tool: s.tool,
          status: s.status,
          result: s.result,
          data: s.data,
        })),
        needsConfirmation: local.needsConfirmation,
      }
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        name,
        content: JSON.stringify(payload),
      })
    }
  }

  // Final summarize pass without tools if we still have tool chatter
  const summary = await chatCompletionsRound({
    apiKey: options.apiKey,
    provider: options.provider,
    baseUrl: options.baseUrl,
    model: options.model,
    messages: [
      ...messages,
      {
        role: 'user',
        content: 'Summarize what you did in one short sentence for the viewer.',
      },
    ],
    tools: [],
  })

  return {
    response: summary?.content || lastContent || 'Done.',
    toolCalls: allToolCalls,
    steps: allSteps,
    needsConfirmation,
    providerModel: model,
    rounds: maxRounds,
  }
}

/** Compact id=name catalog so the model can pass real channel ids. */
export function buildChannelCatalog(
  context: Pick<AssistantContextSnapshot, 'channels'>,
  limit = 48,
): string {
  return context.channels
    .slice(0, limit)
    .map((ch) => `${ch.id}=${ch.name}`)
    .join('; ')
}

/**
 * Map a provider tool call into an utterance the local allowlisted agent understands.
 * For play_channel, prefer the original user utterance when it names a channel so
 * hallucinated model ids (often the current channel) do not win.
 */
export function syntheticMessageForTool(
  tool: string,
  input: Record<string, string>,
  original: string,
  context?: Pick<AssistantContextSnapshot, 'channels'>,
): string {
  switch (tool) {
    case 'set_mute':
      return input.muted === 'false' ? 'unmute' : 'mute'
    case 'set_reminder':
      return `Remind me ${input.query || original}`
    case 'recommend_now':
      return input.category
        ? `Recommend ${input.category} to watch`
        : 'Recommend something to watch'
    case 'search_epg':
      return `What is on ${input.query || original}`
    case 'open_guide':
      return 'Open the guide'
    case 'play_channel': {
      const requested = (input.channelId || '').trim()
      const channels = context?.channels ?? []
      // If the user utterance names a channel, prefer that over a model id
      // (models often echo the current channel id).
      const namedInOriginal = [...channels]
        .sort((a, b) => b.name.length - a.name.length)
        .find((ch) => original.toLowerCase().includes(ch.name.toLowerCase()))
      if (namedInOriginal) return `Play ${namedInOriginal.name}`

      const knownId = Boolean(requested && channels.some((ch) => ch.id === requested))
      if (knownId) return `Play ${requested}`

      if (/\b(play|watch|tune|switch)\b/i.test(original)) return original
      return requested ? `Play ${requested}` : original
    }
    case 'clear_reminders':
      return 'Clear all reminders'
    case 'suggest_fallback':
      return 'Suggest a fallback alternate stream'
    default:
      return original
  }
}

export { DEFAULT_TOOLS }
