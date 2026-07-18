import type {PieceType} from '@/types/chess'

export interface PromotionSlot {
  piece: PieceType
  // Grid units (0..8), measured from the board's top-left — the slot circle's center.
  x: number
  y: number
}

// The promotion ring geometry: the queen sits ON the anchor square — pre-armed under the
// cursor, an immediate release picks her — and the three underpromotions fan out on an arc
// deployed toward the board interior on BOTH axes: away from the promotion edge and squeezed
// into a quadrant on the border files. The slot order stays stable for muscle memory; only
// the fan direction adapts. View coordinates only — a promotion anchors on an edge row, and
// the ring opens away from it whatever the board orientation.
export function promotionSlotCenters(col: number, row: number): PromotionSlot[] {
  const centerX = col + 0.5
  const centerY = row + 0.5
  // Away from the promotion edge: an anchor on the top row opens downward, and vice versa.
  const inward = row === 0 ? 1 : -1
  // Tight ring — neighbouring slots may overlap a touch, deliberately (a compact target zone).
  const radius = 1

  // Angles on the inward half-circle (0° = right, 90° = straight inward, 180° = left) for
  // (knight, rook, bishop), windowed by the file so no slot ever leaves the board.
  let angles: [number, number, number]
  if (col === 0) {
    angles = [90, 45, 0]
  } else if (col === 7) {
    angles = [90, 135, 180]
  } else {
    angles = [90, 145, 35]
  }

  const satellites: PieceType[] = ['knight', 'rook', 'bishop']
  return [
    {piece: 'queen', x: centerX, y: centerY},
    ...satellites.map((piece, i) => ({
      piece,
      x: centerX + radius * Math.cos((angles[i]! * Math.PI) / 180),
      y: centerY + inward * radius * Math.sin((angles[i]! * Math.PI) / 180),
    })),
  ]
}
