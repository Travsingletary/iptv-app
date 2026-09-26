import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useIptvStore } from '../../store/useIptvStore'

export function AutomationToasts() {
  const toasts = useIptvStore((s) => s.automationToasts)
  const playChannel = useIptvStore((s) => s.playChannel)
  const clearAutomationToast = useIptvStore((s) => s.clearAutomationToast)

  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-[60] flex w-[min(24rem,calc(100%-2.5rem))] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-5 sm:translate-x-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto rounded-xl border border-white/15 bg-ink-950/95 p-3 shadow-glow backdrop-blur"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-400">
                  <Sparkles size={12} /> Automation
                </p>
                <p className="mt-1 text-sm text-sand-50">{toast.message}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss automation toast"
                onClick={() => clearAutomationToast(toast.id)}
                className="rounded-full border border-white/10 p-1 text-mist-400 hover:text-sand-50"
              >
                <X size={14} />
              </button>
            </div>
            {toast.fallbackSuggestions && toast.fallbackSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {toast.fallbackSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.channelId}
                    type="button"
                    onClick={() => {
                      playChannel(suggestion.channelId)
                      clearAutomationToast(toast.id)
                    }}
                    className="rounded-lg border border-white/10 bg-ink-850 px-2 py-1 text-xs text-sand-50 hover:border-ember-400/40"
                  >
                    {suggestion.channelName}
                  </button>
                ))}
              </div>
            )}
            {toast.kind === 'auto_switch_fallback' && toast.channelId && (
              <p className="mt-2 text-xs text-ember-300">
                Switched toward {toast.channelName ?? toast.channelId}.
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
