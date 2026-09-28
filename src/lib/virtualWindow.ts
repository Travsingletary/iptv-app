/**
 * Fixed-row virtual window math for large TV lists (Live / Guide).
 * Keeps DOM node count bounded on Fire Stick / WebView.
 */

export interface VirtualWindowInput {
  scrollTop: number
  viewportHeight: number
  itemCount: number
  itemHeight: number
  /** Extra rows above/below the viewport. */
  overscan?: number
}

export interface VirtualWindow {
  start: number
  end: number
  offsetY: number
  totalHeight: number
  visibleCount: number
}

export function computeVirtualWindow(input: VirtualWindowInput): VirtualWindow {
  const itemHeight = Math.max(1, input.itemHeight)
  const itemCount = Math.max(0, Math.floor(input.itemCount))
  const overscan = Math.max(0, Math.floor(input.overscan ?? 6))
  const viewportHeight = Math.max(0, input.viewportHeight)
  const scrollTop = Math.max(0, input.scrollTop)

  const totalHeight = itemCount * itemHeight
  if (itemCount === 0) {
    return { start: 0, end: 0, offsetY: 0, totalHeight: 0, visibleCount: 0 }
  }

  const rawStart = Math.floor(scrollTop / itemHeight)
  const visible = Math.ceil(viewportHeight / itemHeight) + 1
  const start = Math.max(0, rawStart - overscan)
  const end = Math.min(itemCount, rawStart + visible + overscan)
  return {
    start,
    end,
    offsetY: start * itemHeight,
    totalHeight,
    visibleCount: Math.max(0, end - start),
  }
}

/** Estimate how many DOM rows a naive full list would create vs a virtual window. */
export function estimateDomSavings(
  itemCount: number,
  viewportHeight: number,
  itemHeight: number,
  overscan = 6,
): { full: number; virtual: number; ratio: number } {
  const win = computeVirtualWindow({
    scrollTop: 0,
    viewportHeight,
    itemCount,
    itemHeight,
    overscan,
  })
  const full = itemCount
  const virtual = win.visibleCount
  return {
    full,
    virtual,
    ratio: full === 0 ? 1 : virtual / full,
  }
}
