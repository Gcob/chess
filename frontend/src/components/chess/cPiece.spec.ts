import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import cPiece from './cPiece.vue'
import type {PieceAnimation, PlacedPiece} from '@/types/look-and-feel'

function placed(overrides: Partial<PlacedPiece> = {}): PlacedPiece {
  return {
    id: 'Pe2',
    color: 'white',
    type: 'pawn',
    square: 'e2',
    col: 0,
    row: 0,
    movable: true,
    ...overrides,
  }
}

// Render-state props, distinct from the PlacedPiece DTO — typed so the two
// parameters can't be swapped silently.
interface RenderProps {
  animation?: PieceAnimation
  dragging?: boolean
  dragX?: number
  dragY?: number
  lifted?: boolean
}

function mountPiece(piece: Partial<PlacedPiece> = {}, props: RenderProps = {}) {
  return mount(cPiece, {
    props: {piece: placed(piece), animation: 'none', ...props},
  })
}

describe('cPiece', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('positions itself via a translate transform from col/row', () => {
    const wrapper = mountPiece({col: 4, row: 6})
    expect(wrapper.attributes('style')).toContain('translate(400%, 600%)')
  })

  it('sits at the origin for col/row 0', () => {
    const wrapper = mountPiece({col: 0, row: 0})
    expect(wrapper.attributes('style')).toContain('translate(0%, 0%)')
  })

  it('maps the animation prop to a class, and none to no class', () => {
    expect(mountPiece({}, {animation: 'none'}).classes().some(c => c.startsWith('c-piece--anim-'))).toBe(false)
    expect(mountPiece({}, {animation: 'slide'}).classes()).toContain('c-piece--anim-slide')
    expect(mountPiece({}, {animation: 'hop'}).classes()).toContain('c-piece--anim-hop')
  })

  it('renders an image described by color and type', () => {
    const img = mountPiece({color: 'black', type: 'queen'}).get('img')
    expect(img.attributes('alt')).toBe('black queen')
    expect(img.attributes('src')).toBeTruthy()
  })

  it('follows the cursor in px and drops the transition while dragging', () => {
    const wrapper = mountPiece({col: 2, row: 3}, {animation: 'slide', dragging: true, dragX: 120, dragY: 45})
    expect(wrapper.attributes('style')).toContain('translate(120px, 45px)')
    expect(wrapper.classes().some(c => c.startsWith('c-piece--anim-'))).toBe(false)
    expect(wrapper.classes()).toContain('c-piece--moving')
  })

  it('grows the sprite on demand — the touch grab', () => {
    const lifted = mountPiece({}, {dragging: true, lifted: true})
    expect(lifted.get('img').classes()).toContain('c-piece__img--lifted')
    expect(mountPiece({}, {dragging: true}).get('img').classes()).not.toContain('c-piece__img--lifted')
  })

  it('goes pointer-inert when not movable', () => {
    expect(mountPiece({movable: false}).classes()).toContain('c-piece--static')
    expect(mountPiece({movable: true}).classes()).not.toContain('c-piece--static')
  })
})
