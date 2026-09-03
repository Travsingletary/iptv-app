export function formatClock(ts = Date.now()): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(ts)
}

export function formatDayLabel(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function formatTimeRange(start: number, end: number): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

export function startOfHour(ts = Date.now()): number {
  const d = new Date(ts)
  d.setMinutes(0, 0, 0)
  return d.getTime()
}

export function hoursGrid(from: number, hours: number): number[] {
  return Array.from({ length: hours }, (_, i) => from + i * 60 * 60_000)
}
