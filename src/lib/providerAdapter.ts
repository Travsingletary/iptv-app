/**
 * Optional OpenAI-compatible chat + tools adapter.
 * Returns null when keys are missing or the request fails so callers
 * can fall back to the deterministic mock agent.
 */

export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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
  /** e.g. openai | compatible */
  provider?: string
  /** Override base URL for OpenAI-compatible gateways. */
  baseUrl?: string
  model?: string
  messages: ProviderMessage[]
  tools?: ProviderToolDefinition[]
  temperature?: number
}

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
      description: 'Switch playback to a channel by id',
      parameters: {
        type: 'object',
        properties: { channelId: { type: 'string' } },
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
      description: 'Recommend channels to watch now',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_epg',
      description: 'Search the electronic program guide',
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
]

export function isProviderConfigured(env: {
  apiKey?: string
  provider?: string
}): boolean {
  return Boolean(env.apiKey || env.provider)
}

export async function chatWithTools(
  options: ProviderChatOptions,
): Promise<ProviderChatResult | null> {
  if (!options.apiKey) return null

  const base =
    (options.baseUrl || processEnv('OPENAI_BASE_URL') || 'https://api.openai.com/v1').replace(
      /\/$/,
      '',
    )
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
        message?: {
          content?: string | null
          tool_calls?: Array<{ function?: { name?: string } }>
        }
      }>
    }
    const message = json.choices?.[0]?.message
    const content = message?.content?.trim() || ''
    const toolNames =
      message?.tool_calls
        ?.map((t) => t.function?.name)
        .filter((n): n is string => Boolean(n)) ?? []
    if (!content && !toolNames.length) return null
    return {
      content:
        content ||
        (toolNames.length
          ? `I'll run: ${toolNames.join(', ')}.`
          : 'Done.'),
      toolNames,
      rawModel: model,
    }
  } catch {
    return null
  }
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

export { DEFAULT_TOOLS }
