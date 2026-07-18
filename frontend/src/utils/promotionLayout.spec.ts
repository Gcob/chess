import {describe, it, expect} from 'vitest'
import {promotionRingCenter, promotionSlotCenters} from './promotionLayout'

describe('promotionRingCenter', () => {
  it('sits at the heart of the slots, not on the queen', () => {
    const slots = promotionSlotCenters(4, 0)
    const center = promotionRingCenter(slots)
    expect(center.x).toBeCloseTo(4.5) // symmetric fan on a central file
    expect(center.y).toBeGreaterThan(slots[0]!.y) // pulled inward, away from the queen
  })

  it('stays roughly equidistant from every slot', () => {
    for (const [col, row] of [[0, 0], [3, 0], [7, 0], [4, 7]] as const) {
      const slots = promotionSlotCenters(col, row)
      const center = promotionRingCenter(slots)
      const distances = slots.map(slot => Math.hypot(slot.x - center.x, slot.y - center.y))
      expect(Math.max(...distances) - Math.min(...distances), `col ${col}`).toBeLessThan(0.5)
    }
  })
})

describe('promotionSlotCenters', () => {
  it('pre-arms the queen on the anchor square itself', () => {
    const slots = promotionSlotCenters(4, 0)
    expect(slots[0]).toMatchObject({piece: 'queen', x: 4.5, y: 0.5})
  })

  it('offers all four choices exactly once', () => {
    const slots = promotionSlotCenters(4, 0)
    expect(slots.map(s => s.piece).sort()).toEqual(['bishop', 'knight', 'queen', 'rook'])
  })

  it('deploys downward for white, upward for black', () => {
    for (const slot of promotionSlotCenters(4, 0).slice(1)) {
      expect(slot.y).toBeGreaterThan(0.5)
    }

    for (const slot of promotionSlotCenters(4, 7).slice(1)) {
      expect(slot.y).toBeLessThan(7.5)
    }
  })

  it('keeps every slot on the board, corners included', () => {
    for (const [col, row] of [[0, 0], [7, 0], [0, 7], [7, 7], [3, 0]] as const) {
      for (const slot of promotionSlotCenters(col, row)) {
        expect(slot.x, `col ${col} slot ${slot.piece}`).toBeGreaterThanOrEqual(0.5)
        expect(slot.x, `col ${col} slot ${slot.piece}`).toBeLessThanOrEqual(7.5)
        expect(slot.y, `row ${row} slot ${slot.piece}`).toBeGreaterThanOrEqual(0.5)
        expect(slot.y, `row ${row} slot ${slot.piece}`).toBeLessThanOrEqual(7.5)
      }
    }
  })

  // A slight overlap between neighbours is deliberate (compact ring) — but two slots must
  // never collapse into an ambiguous target.
  it('keeps every pair of slots clearly apart', () => {
    for (const col of [0, 3, 7]) {
      const slots = promotionSlotCenters(col, 0)
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const distance = Math.hypot(slots[i]!.x - slots[j]!.x, slots[i]!.y - slots[j]!.y)
          expect(distance, `col ${col}: ${slots[i]!.piece} vs ${slots[j]!.piece}`).toBeGreaterThan(0.7)
        }
      }
    }
  })
})
