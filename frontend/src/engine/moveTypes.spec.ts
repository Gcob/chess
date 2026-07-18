import {describe, it, expect} from 'vitest'
import {MOVE_TYPES, getPieceMoveTypes} from './moveTypes'
import type {MoveTypeId, PieceType} from '@/types/chess'

describe('MOVE_TYPES registry', () => {
  it('holds one instance per move type, self-identified', () => {
    for (const [id, moveType] of Object.entries(MOVE_TYPES)) {
      expect(moveType.id).toBe(id)
    }
  })
})

describe('getPieceMoveTypes', () => {
  it('maps each piece type to its move types', () => {
    const expected: Record<PieceType, MoveTypeId[]> = {
      king: ['simple', 'castling'],
      pawn: ['linear-forward', 'linear-forward-double', 'diagonal-forward-capture', 'en-passant'],
      queen: ['diagonal', 'linear'],
      rook: ['linear'],
      bishop: ['diagonal'],
      knight: ['l-shape'],
    }

    for (const [pieceType, ids] of Object.entries(expected) as [PieceType, MoveTypeId[]][]) {
      expect(getPieceMoveTypes(pieceType).map(type => type.id)).toEqual(ids)
    }
  })
})

describe('slidesAlong', () => {
  it('is true only for linear/diagonal, each on its own direction set', () => {
    expect(MOVE_TYPES['linear'].slidesAlong('top')).toBe(true)
    expect(MOVE_TYPES['linear'].slidesAlong('top-right')).toBe(false)
    expect(MOVE_TYPES['diagonal'].slidesAlong('top-right')).toBe(true)
    expect(MOVE_TYPES['diagonal'].slidesAlong('top')).toBe(false)
    expect(MOVE_TYPES['simple'].slidesAlong('top')).toBe(false)
    expect(MOVE_TYPES['l-shape'].slidesAlong('top')).toBe(false)
  })
})

describe('attacksAlong', () => {
  it('lets sliders attack at any range along their directions', () => {
    expect(MOVE_TYPES['linear'].attacksAlong('top', 5, 'white')).toBe(true)
    expect(MOVE_TYPES['diagonal'].attacksAlong('top-left', 3, 'black')).toBe(true)
    expect(MOVE_TYPES['linear'].attacksAlong('top-right', 2, 'white')).toBe(false)
  })

  it('limits the king to distance 1', () => {
    expect(MOVE_TYPES['simple'].attacksAlong('top', 1, 'white')).toBe(true)
    expect(MOVE_TYPES['simple'].attacksAlong('top', 2, 'white')).toBe(false)
  })

  it('makes the pawn capture color-aware', () => {
    // Seen from the attacked square, a white pawn sits diagonally below.
    expect(MOVE_TYPES['diagonal-forward-capture'].attacksAlong('bottom-left', 1, 'white')).toBe(true)
    expect(MOVE_TYPES['diagonal-forward-capture'].attacksAlong('top-left', 1, 'white')).toBe(false)
    expect(MOVE_TYPES['diagonal-forward-capture'].attacksAlong('top-right', 1, 'black')).toBe(true)
    expect(MOVE_TYPES['diagonal-forward-capture'].attacksAlong('bottom-left', 2, 'white')).toBe(false)
  })

  it('keeps non-capturing move types and stubs harmless', () => {
    expect(MOVE_TYPES['linear-forward'].attacksAlong('top', 1, 'white')).toBe(false)
    expect(MOVE_TYPES['castling'].attacksAlong('top', 1, 'white')).toBe(false)
    expect(MOVE_TYPES['en-passant'].attacksAlong('top-left', 1, 'white')).toBe(false)
    expect(MOVE_TYPES['promotion'].attacksAlong('top', 1, 'white')).toBe(false)
  })
})
