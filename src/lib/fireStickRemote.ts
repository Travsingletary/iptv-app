/**
 * Fire Stick / lean-back remote key map helpers.
 * Browser simulation: Arrow keys = D-pad, Enter = OK, Escape/Backspace = Back.
 *
 * Default map mimics common TiviMate lean-back behavior (not a clone of their UI):
 * - ↑↓ zap while watching
 * - ← opens channel list (side rail)
 * - → previous / recent channel
 * - OK shows player chrome; OK again (no focus) opens channel list
 * - Back dismisses overlays, then opens Guide when already immersive
 * - Menu toggles the overlay shell
 */

export type RemoteAction =
  | 'toggle-menu'
  | 'open-menu'
  | /** TiviMate-style: open Live channel side panel over video. */
    'open-live-browser'
  | 'open-guide'
  | 'show-chrome'
  | 'previous-channel'
  | 'dismiss-menu'
  | 'hide-chrome'
  | 'noop-immersive'
  | 'select-focused'
  | 'channel-zap-up'
  | 'channel-zap-down'
  | 'focus-nav'
  | 'ignore'

export type RemoteShellState = {
  menuOpen: boolean
  overlayVisible: boolean
  /** True when spatial focus should own arrows (overlay / guide / settings / etc.). */
  focusMode: boolean
}

/** Fire TV / Android often emit keyCode 82 for MENU; browsers use ContextMenu. */
export function isMenuKey(event: Pick<KeyboardEvent, 'key' | 'code' | 'keyCode'>): boolean {
  if (event.key === 'ContextMenu' || event.key === 'Menu') return true
  if (event.code === 'ContextMenu') return true
  // Android KEYCODE_MENU is 82 — same numeric code as browser KeyR, so only
  // treat 82 as Menu when the key string is not a printable letter.
  if (event.keyCode === 82) {
    const k = event.key || ''
    if (!k || k === 'Unidentified' || k === 'Menu' || k === 'ContextMenu') return true
  }
  return false
}

export function isSelectKey(event: Pick<KeyboardEvent, 'key' | 'code'>): boolean {
  return (
    event.key === 'Enter' ||
    event.key === 'OK' ||
    event.key === 'Select' ||
    event.code === 'NumpadEnter' ||
    event.key === 'NumpadEnter'
  )
}

export function isBackKey(event: Pick<KeyboardEvent, 'key' | 'code'>): boolean {
  return (
    event.key === 'Escape' ||
    event.key === 'Backspace' ||
    event.key === 'BrowserBack' ||
    event.key === 'GoBack' ||
    event.code === 'Escape' ||
    event.code === 'Backspace'
  )
}

export function isRemoteToggleLetter(event: Pick<KeyboardEvent, 'key'>): boolean {
  return event.key === 'r' || event.key === 'R'
}

/**
 * Pure resolver for Fire Stick–style remote actions on the TV overlay shell.
 * Callers still decide whether D-pad spatial focus consumed the event first.
 */
export function resolveRemoteAction(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'keyCode'>,
  state: RemoteShellState,
  options: { hasFocusedControl?: boolean } = {},
): RemoteAction {
  if (isRemoteToggleLetter(event) || isMenuKey(event)) {
    return 'toggle-menu'
  }

  if (isBackKey(event)) {
    if (state.menuOpen) return 'dismiss-menu'
    if (state.overlayVisible) return 'hide-chrome'
    // TiviMate-like: Back from pure TV opens the Guide overlay.
    return 'open-guide'
  }

  if (isSelectKey(event)) {
    if (!state.menuOpen) {
      if (options.hasFocusedControl) return 'select-focused'
      // First OK → player chrome / info; second OK (chrome up, nothing focused) → channel list.
      if (!state.overlayVisible) return 'show-chrome'
      return 'open-live-browser'
    }
    return 'select-focused'
  }

  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (state.menuOpen) return 'focus-nav'
    return event.key === 'ArrowUp' ? 'channel-zap-up' : 'channel-zap-down'
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    if (state.menuOpen || state.focusMode) return 'focus-nav'
    // Chrome visible: ←/→ move among chrome controls (TiviMate info panel).
    if (state.overlayVisible) return 'focus-nav'
    // Immersive: ← channel list, → previous/recent channel.
    if (event.key === 'ArrowLeft') return 'open-live-browser'
    return 'previous-channel'
  }

  return 'ignore'
}

/** Whether document.activeElement is a real interactive control (not body/html). */
export function hasActiveTvControl(active: Element | null = document.activeElement): boolean {
  if (!active || !(active instanceof HTMLElement)) return false
  const tag = active.tagName
  if (tag === 'BODY' || tag === 'HTML') return false
  return true
}
