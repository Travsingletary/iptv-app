import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Bell, Mic, MicOff, MessageCircle, Send, X } from 'lucide-react'
import { useIptvStore } from '../../store/useIptvStore'
import { askAssistant } from '../../lib/assistantClient'
import type { AssistantToolCall } from '../../lib/assistantCore'
import { activeReminders } from '../../lib/reminders'
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  parseVoiceIntent,
  type SpeechRecognitionLike,
} from '../../lib/voiceIntents'
import { formatClock } from '../../lib/time'

interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  tools?: AssistantToolCall[]
  source?: 'api' | 'local'
}

export function AssistantPanel() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'seed',
      role: 'assistant',
      text: 'Hi, I am your Aether assistant. Ask for recommendations, reminders, mute, or channel changes. Hold the mic if your browser supports voice.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const view = useIptvStore((s) => s.view)
  const favorites = useIptvStore((s) => s.favorites)
  const recentIds = useIptvStore((s) => s.recentIds)
  const channels = useIptvStore((s) => s.channels)
  const epg = useIptvStore((s) => s.epg)
  const currentChannelId = useIptvStore((s) => s.player.channelId)
  const playChannel = useIptvStore((s) => s.playChannel)
  const setPlayer = useIptvStore((s) => s.setPlayer)
  const setView = useIptvStore((s) => s.setView)
  const addReminder = useIptvStore((s) => s.addReminder)
  const dismissReminder = useIptvStore((s) => s.dismissReminder)
  const reminders = useIptvStore((s) => s.reminders)
  const tickReminders = useIptvStore((s) => s.tickReminders)

  const speechSupported = useMemo(() => isSpeechRecognitionSupported(), [])
  const upcomingReminders = useMemo(() => activeReminders(reminders).slice(0, 6), [reminders])

  const snapshot = useMemo(
    () => ({
      view,
      favorites,
      recentIds,
      channels,
      epg,
      currentChannelId,
      history: messages
        .filter((m) => m.id !== 'seed')
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text })),
    }),
    [channels, currentChannelId, epg, favorites, messages, recentIds, view],
  )

  useEffect(() => {
    const id = window.setInterval(() => tickReminders(), 15_000)
    tickReminders()
    return () => window.clearInterval(id)
  }, [tickReminders])

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const applyToolCalls = (toolCalls: AssistantToolCall[]) => {
    for (const tool of toolCalls) {
      if (tool.tool === 'play_channel' && tool.data?.channelId) {
        playChannel(tool.data.channelId)
      }
      if (tool.tool === 'set_mute' && typeof tool.data?.muted === 'boolean') {
        setPlayer({ muted: tool.data.muted })
      }
      if (tool.tool === 'open_guide' && tool.data?.view === 'guide') {
        setView('guide')
      }
      if (tool.tool === 'set_reminder' && tool.data?.reminders?.length) {
        for (const draft of tool.data.reminders.slice(0, 1)) {
          addReminder(draft)
        }
      }
    }
  }

  const submitMessage = async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed || loading) return

    const userMessage: AssistantMessage = {
      id: `u_${Date.now().toString(36)}`,
      role: 'user',
      text: trimmed,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const { result, source } = await askAssistant(trimmed, snapshot)
      applyToolCalls(result.toolCalls)

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now().toString(36)}`,
          role: 'assistant',
          text: result.response,
          tools: result.toolCalls,
          source,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown assistant error')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await submitMessage(input)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const startListening = () => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setVoiceHint('Voice unsupported here — type play, mute, remind, or recommend commands.')
      return
    }

    try {
      recognitionRef.current?.abort()
      const recognition = new Ctor()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || ''
        if (!transcript) return
        const intent = parseVoiceIntent(transcript)
        setVoiceHint(`Heard: “${transcript}” → ${intent.kind}`)
        void submitMessage(intent.assistantMessage || transcript)
      }
      recognition.onerror = (event) => {
        setListening(false)
        setVoiceHint(event.error === 'not-allowed'
          ? 'Microphone permission denied — use typed commands.'
          : `Voice error (${event.error ?? 'unknown'}). You can still type.`)
      }
      recognition.onend = () => setListening(false)
      recognitionRef.current = recognition
      recognition.start()
      setListening(true)
      setVoiceHint('Listening…')
    } catch {
      setListening(false)
      setVoiceHint('Voice failed to start — type your command instead.')
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-ink-900/90 px-4 py-2.5 text-sm font-medium text-sand-50 shadow-glow backdrop-blur transition hover:border-ember-400/50"
        >
          <MessageCircle size={16} className="text-ember-400" />
          Assistant
        </button>
      )}

      {open && (
        <aside className="absolute right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-ink-950/95 backdrop-blur-xl sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="font-display text-lg font-bold">Aether Assistant</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-400">
                Phase 2 · voice · reminders
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/15 p-2 text-mist-300 hover:text-sand-50"
              aria-label="Close assistant"
            >
              <X size={16} />
            </button>
          </div>

          {upcomingReminders.length > 0 && (
            <div className="border-b border-white/10 px-4 py-2">
              <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-400">
                <Bell size={12} /> Reminders
              </p>
              <ul className="space-y-1.5">
                {upcomingReminders.map((reminder) => (
                  <li
                    key={reminder.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-ink-900/60 px-2 py-1.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sand-50">{reminder.programTitle}</p>
                      <p className="truncate text-mist-400">
                        {reminder.channelName} · {formatClock(reminder.fireAt)}
                        {reminder.fired ? ' · due' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {reminder.fired && (
                        <button
                          type="button"
                          onClick={() => playChannel(reminder.channelId)}
                          className="rounded-md border border-ember-400/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ember-300"
                        >
                          Tune
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => dismissReminder(reminder.id)}
                        className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-mist-300"
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-auto bg-ember-500/20 text-sand-50'
                    : 'bg-ink-800 text-mist-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.source === 'local' && (
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-400">
                    Local fallback
                  </p>
                )}
                {message.tools?.map((tool) => (
                  <div
                    key={`${message.id}_${tool.tool}_${tool.result}`}
                    className="mt-2 rounded-xl border border-white/10 bg-ink-900/70 p-2"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ember-400">
                      {tool.tool} · {tool.status}
                    </p>
                    <p className="mt-1 text-xs text-mist-200">{tool.result}</p>
                    {tool.tool === 'recommend_now' && tool.data?.channelIds && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tool.data.channelIds.map((id) => {
                          const channel = channels.find((ch) => ch.id === id)
                          if (!channel) return null
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => playChannel(id)}
                              className="rounded-lg border border-white/10 bg-ink-850 px-2 py-1 text-xs text-sand-50 hover:border-ember-400/40"
                            >
                              {channel.name}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {tool.tool === 'search_epg' && tool.data?.programs && tool.data.programs.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tool.data.programs.map((program) => (
                          <li key={program.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="min-w-0 truncate text-mist-100">
                              {program.title}
                              {program.channelName ? ` · ${program.channelName}` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => playChannel(program.channelId)}
                              className="shrink-0 rounded-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ember-400 hover:border-ember-400/40"
                            >
                              Tune
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {tool.tool === 'play_channel' && tool.data?.channelId && (
                      <p className="mt-1 text-xs text-ember-300">Playback updated.</p>
                    )}
                    {tool.tool === 'set_reminder' && tool.data?.reminders?.[0] && (
                      <p className="mt-1 text-xs text-ember-300">
                        Reminder saved for {tool.data.reminders[0].programTitle}.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {loading && (
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-mist-400">
                Assistant is thinking…
              </p>
            )}
            {error && (
              <p className="rounded-lg border border-red-400/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-white/10 p-3">
            {voiceHint && (
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mist-400">
                {voiceHint}
              </p>
            )}
            {!speechSupported && (
              <p className="mb-2 text-[11px] text-mist-400">
                Voice unsupported in this browser — typed intents still work (play, mute, remind, recommend).
              </p>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-850 px-2 py-2">
              <button
                type="button"
                aria-label={listening ? 'Stop listening' : 'Press to talk'}
                title={speechSupported ? 'Press to talk' : 'Voice unsupported — type instead'}
                onClick={() => (listening ? stopListening() : startListening())}
                className={`rounded-lg border px-2.5 py-2 ${
                  listening
                    ? 'border-ember-400/60 bg-ember-500/20 text-ember-300'
                    : 'border-white/10 text-mist-200 hover:border-ember-400/40'
                }`}
              >
                {listening ? <Mic size={14} /> : speechSupported ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask, remind, mute, or press mic"
                className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-lg bg-ember-500 px-3 py-2 text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </aside>
      )}
    </>
  )
}
