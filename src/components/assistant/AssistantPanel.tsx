import { FormEvent, useMemo, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { useIptvStore } from '../../store/useIptvStore'
import type { AssistantApiResult } from '../../lib/assistantCore'

interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export function AssistantPanel() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'seed',
      role: 'assistant',
      text: 'Hi, I am your Aether assistant. Ask for recommendations or channel changes.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const view = useIptvStore((s) => s.view)
  const favorites = useIptvStore((s) => s.favorites)
  const recentIds = useIptvStore((s) => s.recentIds)
  const channels = useIptvStore((s) => s.channels)
  const currentChannelId = useIptvStore((s) => s.player.channelId)

  const snapshot = useMemo(
    () => ({
      view,
      favorites,
      recentIds,
      channels,
      currentChannelId,
    }),
    [channels, currentChannelId, favorites, recentIds, view],
  )

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || loading) return

    const userMessage: AssistantMessage = {
      id: `u_${Date.now().toString(36)}`,
      role: 'user',
      text: message,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          context: snapshot,
        }),
      })
      if (!response.ok) throw new Error(`Assistant request failed (${response.status})`)

      const data = (await response.json()) as AssistantApiResult
      const toolLine =
        data.toolCalls.length > 0
          ? `\n\nTool stubs: ${data.toolCalls.map((tool) => tool.tool).join(', ')}.`
          : ''

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now().toString(36)}`,
          role: 'assistant',
          text: `${data.response}${toolLine}`,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown assistant error')
    } finally {
      setLoading(false)
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
                Phase 1
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
                {message.text}
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
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-850 px-2 py-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for channels, guide help, or recommendations"
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
