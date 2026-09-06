import { describe, expect, it } from 'vitest'
import { directionFromKey, findSpatialNeighbor } from './tvFocus'

function fakeEl(x: number, y: number, id: string): HTMLElement {
  const el = document.createElement('button')
  el.id = id
  el.getBoundingClientRect = () =>
    ({
      left: x,
      top: y,
      width: 40,
      height: 20,
      right: x + 40,
      bottom: y + 20,
      x,
      y,
      toJSON: () => ({}),
    }) as DOMRect
  return el
}

describe('tvFocus', () => {
  it('maps arrow keys to directions', () => {
    expect(directionFromKey('ArrowLeft')).toBe('left')
    expect(directionFromKey('Enter')).toBeNull()
  })

  it('finds spatial neighbors', () => {
    const a = fakeEl(0, 0, 'a')
    const right = fakeEl(100, 0, 'right')
    const down = fakeEl(0, 100, 'down')
    const far = fakeEl(500, 500, 'far')
    expect(findSpatialNeighbor(a, 'right', [a, right, down, far])?.id).toBe('right')
    expect(findSpatialNeighbor(a, 'down', [a, right, down, far])?.id).toBe('down')
  })
})
