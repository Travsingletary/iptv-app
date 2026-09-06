import type { Channel, EpgProgram } from '../types/iptv.js'
import { buildForYouNow } from './recommendations.js'
import { findUpcomingPrograms } from './reminders.js'
import type {
  AssistantContextSnapshot,
  AssistantToolCall,
  AssistantToolName,
} from './assistantCore.js'

export type ToolRisk = 'safe' | 'confirm'

export interface ToolPolicy {
  tool: AssistantToolName | 'clear_reminders' | 'suggest_fallback'
  risk: ToolRisk
  description: string
}

/** Hard allowlist — unknown tools never execute. */
export const TOOL_ALLOWLIST: Record<string, ToolPolicy> = {
  search_epg: { tool: 'search_epg', risk: 'safe', description: 'Search the TV guide' },
  recommend_now: { tool: 'recommend_now', risk: 'safe', description: 'Recommend channels' },
  play_channel: {
    tool: 'play_channel',
    risk: 'safe',
    description: 'Switch live/VOD playback',
  },
  set_mute: { tool: 'set_mute', risk: 'safe', description: 'Mute or unmute audio' },
  open_guide: { tool: 'open_guide', risk: 'safe', description: 'Open the TV guide' },
  set_reminder: { tool: 'set_reminder', risk: 'safe', description: 'Schedule a program reminder' },
  clear_reminders: {
    tool: 'clear_reminders',
    risk: 'confirm',
    description: 'Dismiss all active reminders',
  },
  suggest_fallback: {
    tool: 'suggest_fallback',
    risk: 'safe',
    description: 'Surface alternate streams',
  },
}

export type ExtendedToolName = keyof typeof TOOL_ALLOWLIST

export type AgentStepStatus =
  | 'planned'
  | 'executed'
  | 'pending_confirm'
  | 'skipped'
  | 'denied'
  | 'failed'

export interface AgentStep {
  id: string
  tool: ExtendedToolName
  risk: ToolRisk
  status: AgentStepStatus
  input: Record<string, string>
  result?: string
  data?: AssistantToolCall['data'] & {
    clearedReminderIds?: string[]
    fallbackChannelId?: string
  }
}

export interface AgentPlan {
  steps: AgentStep[]
  notes: string[]
}

export interface AgentRunOptions {
  /** When true, execute confirm-risk tools; otherwise leave them pending. */
  confirmed?: boolean
  /** Override risk for play_channel (e.g. automation auto-switch). */
  forceConfirmTools?: ExtendedToolName[]
}

export interface AgentRunResult {
  response: string
  steps: AgentStep[]
  toolCalls: AssistantToolCall[]
  needsConfirmation: boolean
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

  return epg
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
    .slice(0, limit)
}

function stepId(tool: string, index: number) {
  return `step_${index}_${tool}`
}

/**
 * Multi-intent planner: one utterance can yield several allowlisted tool steps.
 */
export function planAgentSteps(
  message: string,
  context: AssistantContextSnapshot,
): AgentPlan {
  const q = message.toLowerCase()
  const steps: AgentStep[] = []
  const notes: string[] = []
  let index = 0

  const push = (
    tool: ExtendedToolName,
    input: Record<string, string>,
    extras?: Partial<AgentStep>,
  ) => {
    const policy = TOOL_ALLOWLIST[tool]
    if (!policy) return
    steps.push({
      id: stepId(tool, index++),
      tool,
      risk: policy.risk,
      status: 'planned',
      input,
      ...extras,
    })
  }

  if (/\b(clear|dismiss)\s+(all\s+)?reminders?\b/.test(q)) {
    push('clear_reminders', {})
    notes.push('Clearing reminders needs your confirmation.')
  }

  if (/\b(mute|silence|quiet)\b/.test(q) && !/\bunmute\b/.test(q)) {
    push('set_mute', { muted: 'true' })
  } else if (/\bunmute\b/.test(q) || /sound on|volume on/.test(q)) {
    push('set_mute', { muted: 'false' })
  }

  if (/\bremind\b/.test(q) || /\breminder\b/.test(q)) {
    const query =
      message
        .replace(
          /^(remind me(?:\s+(?:when|about|for))?|set (?:a )?reminder(?:\s+(?:for|when|about))?)\s*/i,
          '',
        )
        .replace(/\s+starts?$/i, '')
        .trim() || message
    push('set_reminder', { query: query.slice(0, 80) })
  }

  if (
    q.includes('recommend') ||
    q.includes('suggest') ||
    q.includes('what should i watch') ||
    /\bfind me something\b/.test(q)
  ) {
    push('recommend_now', { source: 'heuristic' })
  }

  if (
    q.includes('guide') ||
    q.includes('what is on') ||
    q.includes("what's on") ||
    q.includes('epg') ||
    /\bsearch guide\b/.test(q)
  ) {
    const query =
      message.replace(/^(what('?s| is) on|search(?:\s+guide)?|find|guide)\s*/i, '').trim() ||
      message
    push('search_epg', { query: query.slice(0, 80) })
    push('open_guide', {})
  }

  if (/\b(play|switch|tune)\b/.test(q)) {
    const matched = findChannelByMessage(message, context.channels) ?? context.channels[0]
    push('play_channel', { channelId: matched?.id ?? 'unknown' })
  }

  if (/\b(fallback|alternate|another (channel|stream))\b/.test(q)) {
    push('suggest_fallback', {
      channelId: context.currentChannelId ?? '',
    })
  }

  return { steps, notes }
}

function executeStep(
  step: AgentStep,
  context: AssistantContextSnapshot,
  options: AgentRunOptions,
): AgentStep {
  const policy = TOOL_ALLOWLIST[step.tool]
  if (!policy) {
    return { ...step, status: 'denied', result: 'Tool not on allowlist.' }
  }

  const forceConfirm = options.forceConfirmTools?.includes(step.tool)
  const risk = forceConfirm ? 'confirm' : policy.risk
  if (risk === 'confirm' && !options.confirmed) {
    return {
      ...step,
      risk,
      status: 'pending_confirm',
      result: `Confirm to run ${policy.description}.`,
    }
  }

  try {
    switch (step.tool) {
      case 'set_mute': {
        const muted = step.input.muted === 'true'
        return {
          ...step,
          risk,
          status: 'executed',
          result: muted ? 'Muted playback audio.' : 'Unmuted playback audio.',
          data: { muted },
        }
      }
      case 'set_reminder': {
        const drafts = findUpcomingPrograms(
          step.input.query || '',
          context.channels,
          context.epg ?? [],
          Date.now(),
          3,
        )
        return {
          ...step,
          risk,
          status: 'executed',
          result:
            drafts.length > 0
              ? `Scheduled reminder for ${drafts[0].programTitle} on ${drafts[0].channelName}.`
              : 'No upcoming guide matches for that reminder.',
          data: { reminders: drafts },
        }
      }
      case 'recommend_now': {
        const picks = buildForYouNow(
          {
            channels: context.channels,
            favorites: context.favorites,
            recentIds: context.recentIds,
          },
          5,
        )
        return {
          ...step,
          risk,
          status: 'executed',
          result:
            picks.length > 0
              ? `Suggested: ${picks.map((ch) => ch.name).join(', ')}.`
              : 'No recommendation candidates available.',
          data: { channelIds: picks.map((ch) => ch.id) },
        }
      }
      case 'search_epg': {
        const programs = searchEpgPrograms(
          step.input.query || '',
          context.channels,
          context.epg ?? [],
        )
        return {
          ...step,
          risk,
          status: 'executed',
          result:
            programs.length > 0
              ? `Found ${programs.length} guide matches: ${programs.map((p) => p.title).join(', ')}.`
              : 'No matching guide entries for that query.',
          data: { programs },
        }
      }
      case 'open_guide':
        return {
          ...step,
          risk,
          status: 'executed',
          result: 'Opening the TV guide.',
          data: { view: 'guide' },
        }
      case 'play_channel': {
        const channel =
          context.channels.find((ch) => ch.id === step.input.channelId) ??
          findChannelByMessage(step.input.channelId, context.channels)
        return {
          ...step,
          risk,
          status: 'executed',
          result: channel ? `Switching playback to ${channel.name}.` : 'No channels available.',
          data: channel ? { channelId: channel.id } : undefined,
        }
      }
      case 'clear_reminders':
        return {
          ...step,
          risk,
          status: 'executed',
          result: 'All active reminders dismissed.',
          data: { clearedReminderIds: ['*'] },
        }
      case 'suggest_fallback': {
        const current = step.input.channelId || context.currentChannelId
        const failed = context.channels.find((ch) => ch.id === current)
        const alt = context.channels.find(
          (ch) =>
            ch.id !== current &&
            Boolean(ch.url) &&
            (failed ? ch.group === failed.group && ch.kind === failed.kind : ch.kind === 'live'),
        )
        return {
          ...step,
          risk,
          status: 'executed',
          result: alt
            ? `Suggested alternate: ${alt.name}.`
            : 'No alternate stream found in the same group.',
          data: alt
            ? { channelIds: [alt.id], fallbackChannelId: alt.id, channelId: alt.id }
            : undefined,
        }
      }
      default:
        return { ...step, status: 'denied', result: 'Tool not allowed.' }
    }
  } catch (err) {
    return {
      ...step,
      status: 'failed',
      result: err instanceof Error ? err.message : 'Tool failed',
    }
  }
}

export function executeAgentPlan(
  plan: AgentPlan,
  context: AssistantContextSnapshot,
  options: AgentRunOptions = {},
): AgentRunResult {
  const steps = plan.steps.map((step) => executeStep(step, context, options))
  const needsConfirmation = steps.some((s) => s.status === 'pending_confirm')

  const toolCalls: AssistantToolCall[] = steps
    .filter((s) => s.status === 'executed')
    .filter((s): s is AgentStep & { tool: AssistantToolName } =>
      [
        'search_epg',
        'recommend_now',
        'play_channel',
        'set_mute',
        'open_guide',
        'set_reminder',
      ].includes(s.tool),
    )
    .map((s) => ({
      tool: s.tool as AssistantToolName,
      status: 'executed' as const,
      input: s.input,
      result: s.result ?? '',
      data: s.data,
    }))

  // Surface clear_reminders / suggest_fallback via extended steps; map suggest to play-ready data
  for (const s of steps) {
    if (s.status !== 'executed') continue
    if (s.tool === 'suggest_fallback' && s.data?.channelId) {
      toolCalls.push({
        tool: 'recommend_now',
        status: 'executed',
        input: s.input,
        result: s.result ?? '',
        data: { channelIds: s.data.channelIds },
      })
    }
  }

  const executedNotes = steps
    .filter((s) => s.status === 'executed' && s.result)
    .map((s) => s.result as string)
  const pending = steps.filter((s) => s.status === 'pending_confirm')
  const memoryHint =
    context.history && context.history.length > 0
      ? ` Remembered ${Math.min(context.history.length, 8)} prior turns.`
      : ''

  let response: string
  if (needsConfirmation) {
    response = [
      ...executedNotes.slice(0, 2),
      `Confirm to continue: ${pending.map((p) => TOOL_ALLOWLIST[p.tool]?.description ?? p.tool).join(', ')}.`,
    ]
      .filter(Boolean)
      .join(' ')
  } else if (executedNotes.length > 0) {
    response = `${executedNotes.join(' ')}${memoryHint}`
  } else if (plan.notes.length) {
    response = plan.notes.join(' ')
  } else {
    const activeName =
      context.channels.find((ch) => ch.id === context.currentChannelId)?.name ?? 'nothing yet'
    response = [
      `I can run multi-step plans: mute + remind, recommend + play, clear reminders (with confirm).`,
      `You are on ${context.view} watching ${activeName}.${memoryHint}`,
      `Try: "Mute and remind me when Match Center starts" or "Clear all reminders".`,
    ].join(' ')
  }

  return { response, steps, toolCalls, needsConfirmation }
}

/** Full orchestration: plan → execute (optionally after confirm). */
export function runAgentTurn(
  message: string,
  context: AssistantContextSnapshot,
  options: AgentRunOptions = {},
): AgentRunResult {
  const plan = planAgentSteps(message, context)
  return executeAgentPlan(plan, context, options)
}

export function isToolAllowed(tool: string): boolean {
  return Boolean(TOOL_ALLOWLIST[tool])
}
