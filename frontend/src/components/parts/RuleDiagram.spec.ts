import {describe, it, expect, beforeEach, vi} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import RuleDiagram from './RuleDiagram.vue'
import {PIECE_DIAGRAMS, SPECIAL_DIAGRAMS, TIP_DIAGRAMS, type RuleDiagram as Diagram} from './ruleDiagrams'

// jsdom has no matchMedia; the component asks it whether to animate at all.
function stubReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function mountDiagram(props: Diagram & { label?: string }) {
  return mount(RuleDiagram, {props})
}

describe('RuleDiagram', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    stubReducedMotion(false)
    vi.useFakeTimers()
  })

  it('draws all 64 squares', () => {
    const wrapper = mountDiagram(PIECE_DIAGRAMS.knight!)
    expect(wrapper.findAll('.rule-diagram__cell')).toHaveLength(64)
  })

  it('renders one sprite per piece on the board', () => {
    // Knight, both kings, and the eight pawns ringing it.
    const wrapper = mountDiagram(PIECE_DIAGRAMS.knight!)
    expect(wrapper.findAll('.rule-diagram__piece')).toHaveLength(11)
  })

  it('marks the piece and every square the engine says it may reach', () => {
    const wrapper = mountDiagram(PIECE_DIAGRAMS.king!)
    expect(wrapper.findAll('.rule-diagram__cell--origin')).toHaveLength(1)
    expect(wrapper.findAll('.rule-diagram__cell--target')).toHaveLength(8)
  })

  it('rings a capture instead of veiling it', () => {
    // The pawn on e2 may take the black pawn on f3.
    const wrapper = mountDiagram(PIECE_DIAGRAMS.pawn!)
    expect(wrapper.findAll('.rule-diagram__cell--capture')).toHaveLength(1)
    expect(wrapper.findAll('.rule-diagram__cell--target')).toHaveLength(2)
  })

  it('shows a pinned piece with nowhere to go', () => {
    const wrapper = mountDiagram(TIP_DIAGRAMS.pin!)
    expect(wrapper.findAll('.rule-diagram__cell--origin')).toHaveLength(1)
    expect(wrapper.findAll('.rule-diagram__cell--target')).toHaveLength(0)
    // The line of attack is traced for the reader instead.
    expect(wrapper.findAll('.rule-diagram__cell--threat').length).toBeGreaterThan(0)
  })

  it('shades an authored zone', () => {
    const wrapper = mountDiagram(TIP_DIAGRAMS.centre!)
    expect(wrapper.findAll('.rule-diagram__cell--zone')).toHaveLength(4)
  })

  it('plays a sequence on a loop, and resets to the starting position', async () => {
    const wrapper = mountDiagram(SPECIAL_DIAGRAMS.castling!)
    const kingAt = () => wrapper.findAll('.rule-diagram__piece')

    expect(kingAt()).toHaveLength(3)

    await vi.advanceTimersByTimeAsync(1500)
    await wrapper.vm.$nextTick()
    // Castling moved two pieces, so both squares of the move are marked.
    expect(wrapper.findAll('.rule-diagram__cell--target').length).toBeGreaterThan(0)

    // After the reset the board is whole again — the rook is back beside the king.
    await vi.advanceTimersByTimeAsync(4000)
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.rule-diagram__piece')).toHaveLength(3)
  })

  it('promotes the pawn for real — the sprite becomes a queen', async () => {
    const wrapper = mountDiagram(SPECIAL_DIAGRAMS.promotion!)
    const sprites = () => wrapper.findAll('.rule-diagram__piece').map(img => img.attributes('alt'))

    expect(sprites()).toContain('Pawn')

    await vi.advanceTimersByTimeAsync(1500)
    await wrapper.vm.$nextTick()

    expect(sprites()).toContain('Queen')
    expect(sprites()).not.toContain('Pawn')
  })

  it('plays nothing under prefers-reduced-motion, but still marks the move', async () => {
    stubReducedMotion(true)
    const wrapper = mountDiagram(SPECIAL_DIAGRAMS.promotion!)

    await vi.advanceTimersByTimeAsync(10_000)
    await wrapper.vm.$nextTick()

    // Nothing was played: the pawn never became a queen.
    const sprites = wrapper.findAll('.rule-diagram__piece').map(img => img.attributes('alt'))
    expect(sprites).toContain('Pawn')
    expect(sprites).not.toContain('Queen')

    // The squares of the move stay marked, so the still diagram still shows what happens.
    expect(wrapper.findAll('.rule-diagram__cell--target').length).toBeGreaterThan(0)
  })

  it('renders a caption only when given one', () => {
    expect(mountDiagram(PIECE_DIAGRAMS.rook!).find('.rule-diagram__label').exists()).toBe(false)
    const labelled = mountDiagram({...PIECE_DIAGRAMS.rook!, label: 'The rook'})
    expect(labelled.find('.rule-diagram__label').text()).toBe('The rook')
  })
})
