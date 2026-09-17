import {
  appendChannelDigit,
  clearAllSurfingTimers,
  clearDigitCommitTimer,
  scheduleDigitCommit,
  scheduleZapOsdHide,
  scheduleZapTune,
  stepZapIndex,
  matchChannelByNumber,
  DIGIT_COMMIT_MS,
} from './channelSurfing'
import { useIptvStore } from '../store/useIptvStore'
import { selectLiveChannels } from '../store/useIptvStore'

function liveList() {
  return selectLiveChannels(useIptvStore.getState().channels)
}

function previewOrTunedIndex(live: ReturnType<typeof liveList>) {
  const s = useIptvStore.getState()
  const preview = s.surfing.previewChannelId || s.player.channelId
  return live.findIndex((c) => c.id === preview)
}

function showOsdFor(channelId: string) {
  useIptvStore.getState().setSurfing({
    previewChannelId: channelId,
    osdVisible: true,
    digitEntryActive: false,
    digitBuffer: '',
  })
  useIptvStore.getState().setPlayer({ overlayVisible: false })
  scheduleZapOsdHide(() => {
    useIptvStore.getState().setSurfing({ osdVisible: false })
  })
}

function tuneQuiet(channelId: string) {
  const s = useIptvStore.getState()
  if (s.player.channelId === channelId) {
    // Already on this stream — just sync preview / OSD.
    s.setSurfing({ previewChannelId: channelId })
    return
  }
  s.playChannel(channelId, { quiet: true })
}

/** TiviMate-like → : hop to previous recent channel, else zap −1. */
export function playPreviousChannel() {
  clearDigitCommitTimer()
  const s = useIptvStore.getState()
  const live = liveList()
  if (!live.length) return
  const current = s.surfing.previewChannelId || s.player.channelId
  const recent = s.recentIds.filter((id) => id !== current && live.some((c) => c.id === id))
  const targetId = recent[0] ?? live[stepZapIndex(previewOrTunedIndex(live), -1, live.length)]?.id
  if (!targetId) return
  showOsdFor(targetId)
  scheduleZapTune(targetId, tuneQuiet)
}

/** Immersive ↑/↓: update OSD immediately; debounce the actual stream tune. */
export function zapByDirection(dir: -1 | 1) {
  clearDigitCommitTimer()
  const live = liveList()
  if (!live.length) return
  const idx = previewOrTunedIndex(live)
  const nextIdx = stepZapIndex(idx, dir, live.length)
  if (nextIdx < 0) return
  const next = live[nextIdx]
  showOsdFor(next.id)
  scheduleZapTune(next.id, tuneQuiet)
}

/** Commit digit buffer to a matching LCN / index and tune. */
export function commitDigitEntry() {
  clearDigitCommitTimer()
  const s = useIptvStore.getState()
  const digits = s.surfing.digitBuffer
  if (!digits) {
    s.setSurfing({ digitEntryActive: false, digitBuffer: '' })
    return
  }
  const match = matchChannelByNumber(liveList(), digits)
  s.setSurfing({ digitEntryActive: false, digitBuffer: '' })
  if (!match) return
  showOsdFor(match.channel.id)
  // Number entry is intentional — tune promptly (still quiet chrome).
  tuneQuiet(match.channel.id)
}

/** Immersive digit pad: build channel number, preview match, commit after idle. */
export function handleChannelDigit(digit: string) {
  const s = useIptvStore.getState()
  const next = appendChannelDigit(s.surfing.digitBuffer, digit)
  const match = matchChannelByNumber(liveList(), next)
  s.setSurfing({
    digitBuffer: next,
    digitEntryActive: true,
    osdVisible: false,
    previewChannelId: match?.channel.id ?? s.surfing.previewChannelId,
  })
  s.setPlayer({ overlayVisible: false })
  scheduleDigitCommit(commitDigitEntry, DIGIT_COMMIT_MS)
}

export function cancelDigitEntry() {
  clearDigitCommitTimer()
  useIptvStore.getState().setSurfing({
    digitEntryActive: false,
    digitBuffer: '',
  })
}

export function resetSurfingSession() {
  clearAllSurfingTimers()
  useIptvStore.getState().clearSurfingHud()
}
