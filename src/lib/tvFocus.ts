/**
 * Spatial / D-pad focus helpers for Android TV–style navigation.
 */
export function isFocusable(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (el.hasAttribute('disabled')) return false
  if (el.getAttribute('aria-disabled') === 'true') return false
  if (el.tabIndex < 0 && !el.hasAttribute('data-tv-focus')) return false
  const style = window.getComputedStyle(el)
  if (style.visibility === 'hidden' || style.display === 'none') return false
  return true
}

export function collectFocusables(root: ParentNode = document): HTMLElement[] {
  const nodes = root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [data-tv-focus]',
  )
  return Array.from(nodes).filter(isFocusable)
}

function centerOf(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export type FocusDirection = 'up' | 'down' | 'left' | 'right'

/** Pick the nearest focusable neighbor in a cardinal direction. */
export function findSpatialNeighbor(
  current: HTMLElement,
  direction: FocusDirection,
  candidates: HTMLElement[],
): HTMLElement | null {
  const origin = centerOf(current)
  let best: HTMLElement | null = null
  let bestScore = Infinity

  for (const el of candidates) {
    if (el === current) continue
    const c = centerOf(el)
    const dx = c.x - origin.x
    const dy = c.y - origin.y
    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    let primary = 0
    let secondary = 0
    if (direction === 'left') {
      if (dx >= -4) continue
      primary = -dx
      secondary = absY
    } else if (direction === 'right') {
      if (dx <= 4) continue
      primary = dx
      secondary = absY
    } else if (direction === 'up') {
      if (dy >= -4) continue
      primary = -dy
      secondary = absX
    } else {
      if (dy <= 4) continue
      primary = dy
      secondary = absX
    }

    // Prefer aligned neighbors
    const score = primary + secondary * 2.2
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}

export function directionFromKey(key: string): FocusDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    default:
      return null
  }
}

/** Handle D-pad keydown: move focus spatially when not inside a text field. */
export function handleTvDirectionalKey(
  event: KeyboardEvent,
  root: ParentNode = document,
): boolean {
  const direction = directionFromKey(event.key)
  if (!direction) return false
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false

  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return false

  const candidates = collectFocusables(root)
  const next = findSpatialNeighbor(active, direction, candidates)
  if (!next) return false
  event.preventDefault()
  next.focus()
  return true
}
