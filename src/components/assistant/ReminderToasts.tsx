import { AnimatePresence, motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useIptvStore } from '../../store/useIptvStore'
import { formatClock } from '../../lib/time'

export function ReminderToasts() {
  const toasts = useIptvStore((s) => s.reminderToasts)
  const playChannel = useIptvStore((s) => s.playChannel)
  const clearReminderToast = useIptvStore((s) => s.clearReminderToast)
  const dismissReminder = useIptvStore((s) => s.dismissReminder)

  return (
    <div className="pointer-events-none absolute bottom-20 right-5 z-50 flex w-[min(22rem,calc(100%-2.5rem))] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto rounded-xl border border-ember-400/40 bg-ink-950/95 p-3 shadow-glow backdrop-blur"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-400">
                  <Bell size={12} /> Starting soon
                </p>
                <p className="mt-1 truncate font-display text-base font-semibold text-sand-50">
                  {toast.programTitle}
                </p>
                <p className="truncate text-xs text-mist-300">
                  {toast.channelName} · {formatClock(toast.fireAt)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Dismiss reminder toast"
                onClick={() => clearReminderToast(toast.id)}
                className="rounded-full border border-white/10 p-1 text-mist-400 hover:text-sand-50"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playChannel(toast.channelId)
                  clearReminderToast(toast.id)
                }}
                className="rounded-lg bg-ember-500 px-3 py-1.5 text-xs font-semibold text-ink-950"
              >
                Tune now
              </button>
              <button
                type="button"
                onClick={() => dismissReminder(toast.id)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-mist-200"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
