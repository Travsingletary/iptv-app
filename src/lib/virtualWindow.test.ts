import { describe, expect, it } from 'vitest'
import { computeVirtualWindow, estimateDomSavings } from './virtualWindow'

describe('computeVirtualWindow', () => {
  it('windows a 6897-channel list to a small DOM set', () => {
    const win = computeVirtualWindow({
      scrollTop: 0,
      viewportHeight: 720,
      itemCount: 6897,
      itemHeight: 56,
      overscan: 8,
    })
    expect(win.totalHeight).toBe(6897 * 56)
    expect(win.start).toBe(0)
    expect(win.visibleCount).toBeLessThan(40)
    expect(win.visibleCount).toBeGreaterThan(10)
  })

  it('advances start index when scrolled', () => {
    const win = computeVirtualWindow({
      scrollTop: 5600,
      viewportHeight: 600,
      itemCount: 2000,
      itemHeight: 56,
      overscan: 4,
    })
    expect(win.start).toBeGreaterThan(90)
    expect(win.end).toBeLessThan(130)
    expect(win.offsetY).toBe(win.start * 56)
  })

  it('handles empty lists', () => {
    expect(
      computeVirtualWindow({
        scrollTop: 0,
        viewportHeight: 400,
        itemCount: 0,
        itemHeight: 56,
      }),
    ).toEqual({ start: 0, end: 0, offsetY: 0, totalHeight: 0, visibleCount: 0 })
  })
})

describe('estimateDomSavings', () => {
  it('reports large savings for MegaOTT-scale catalogs', () => {
    const savings = estimateDomSavings(6897, 720, 56, 8)
    expect(savings.full).toBe(6897)
    expect(savings.virtual).toBeLessThan(50)
    expect(savings.ratio).toBeLessThan(0.01)
  })
})
