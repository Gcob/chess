import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {nextTick} from 'vue'
import {mount, type VueWrapper} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import cBoard from './cBoard.vue'
import cSquare from './cSquare.vue'
import cPiece from './cPiece.vue'
import {useGamesStore} from '@/stores/useGamesStore'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useGameView} from '@/composables/useGameView'
import {makeMove, resign} from '@/engine/game'
import {stubMatchMedia} from '@/test/mediaQuery'
import type {CreateGamePayload, Game} from '@/types/chess'
import type {GameView} from '@/composables/useGameView'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

// A real view over a real session — cBoard consumes the same DTO as in the app.
function freshView(): { view: GameView; game: Game } {
  const session = useGamesStore().open(payload)
  return {view: useGameView(session.id), game: session.game}
}

function findSquare(wrapper: VueWrapper, key: string) {
  return wrapper.findAllComponents(cSquare).find(
    s => `${s.props('square').file}${s.props('square').rank}` === key,
  )!
}

// Clicks a square by its key — the same path as a click-to-move tap.
function clickSquare(wrapper: VueWrapper, key: string): Promise<void> {
  return findSquare(wrapper, key).trigger('click')
}

// jsdom has no layout: gives the board a real 800×800 rect so the drag math works
// (squares are 100px). Square centers: x = (col + 0.5) * 100, y = (row + 0.5) * 100.
function mockBoardRect() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 800, width: 800, height: 800,
    toJSON: () => ({}),
  } as DOMRect)
}

// Drives a real drag through the same window listeners the app uses. pointerType rides on
// the event as a plain property — jsdom has no PointerEvent.
async function drag(wrapper: VueWrapper, from: string, to: {x: number; y: number}, pointerType = 'mouse') {
  const piece = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === from)!
  await piece.trigger('pointerdown', {pointerType})
  window.dispatchEvent(new MouseEvent('pointermove', {clientX: to.x, clientY: to.y, buttons: 1}))
  // flush between move and release, as separate frames do in a real browser — otherwise the
  // draggingId watcher never sees the intermediate dragging state
  await nextTick()
  window.dispatchEvent(new MouseEvent('pointerup', {clientX: to.x, clientY: to.y}))
  await nextTick()
}

describe('cBoard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('highlights the from and to squares of the last move', () => {
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-square__highlight--last-move')).toHaveLength(2)
  })

  it('shows no last-move highlight before any move', () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-square__highlight--last-move')).toHaveLength(0)
  })

  it('hides the last-move highlight when the setting is off', () => {
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    useSettingsStore().settings.highlightLastMove = false
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-square__highlight--last-move')).toHaveLength(0)
  })

  it('shows no check highlight at the start', () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-square__highlight--check')).toHaveLength(0)
  })

  it('highlights the checked king, and clears it once the check is blocked', async () => {
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    makeMove(game, 'd7', 'd5')
    makeMove(game, 'f1', 'b5') // Bb5+ through the freed d7 square
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-square__highlight--check')).toHaveLength(1)

    // raw engine call on purpose: proves the session from open() is the reactive proxy
    makeMove(game, 'c7', 'c6') // blocks the diagonal
    await nextTick()
    expect(wrapper.findAll('.c-square__highlight--check')).toHaveLength(0)
  })

  it('shows the legal destination hints for the selected piece', async () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    await clickSquare(wrapper, 'e2')
    expect(wrapper.findAll('.c-square__highlight--legal-move')).toHaveLength(2) // e3, e4
    expect(wrapper.findAll('.c-square__highlight--legal-capture')).toHaveLength(0)
  })

  it('marks a capturable destination with the capture hint', async () => {
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    makeMove(game, 'd7', 'd5')
    const wrapper = mount(cBoard, {props: {view}})
    await clickSquare(wrapper, 'e4')
    expect(wrapper.findAll('.c-square__highlight--legal-move')).toHaveLength(1) // e5
    expect(wrapper.findAll('.c-square__highlight--legal-capture')).toHaveLength(1) // d5
  })

  it('marks the origin and shows the hints from the press, before any drag', async () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    const pawn = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === 'e2')!
    await pawn.trigger('pointerdown') // MouseEvent's button defaults to 0 — the primary button
    expect(wrapper.findAll('.c-square__highlight--selected')).toHaveLength(1)
    expect(wrapper.findAll('.c-square__highlight--legal-move')).toHaveLength(2)
  })

  it('recreates a hint kept by a new selection, so its pop-in replays', async () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    await clickSquare(wrapper, 'b1') // knight hints a3 + c3
    const before = findSquare(wrapper, 'c3').find('.c-square__highlight--legal-move').element
    await clickSquare(wrapper, 'c2') // pawn hints c3 + c4 — c3 stays, but from a new origin
    const after = findSquare(wrapper, 'c3').find('.c-square__highlight--legal-move').element
    expect(after).not.toBe(before)
  })

  it('clears the hints on deselection', async () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    await clickSquare(wrapper, 'e2')
    await clickSquare(wrapper, 'e2')
    expect(wrapper.findAll('.c-square__highlight--legal-move')).toHaveLength(0)
  })

  it('hides the hints when the setting is off', async () => {
    const {view} = freshView()
    useSettingsStore().settings.showLegalMoves = false
    const wrapper = mount(cBoard, {props: {view}})
    await clickSquare(wrapper, 'e2')
    expect(wrapper.findAll('.c-square__highlight--legal-move')).toHaveLength(0)
  })

  it('plays a legal drag drop, with an instant landing', async () => {
    mockBoardRect()
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    await drag(wrapper, 'e2', {x: 450, y: 450}) // e4
    expect(view.moves).toHaveLength(1)
    expect(view.moves[0]).toMatchObject({from: 'e2', to: 'e4'})
    expect(wrapper.findAll('.c-piece--anim-snap-back')).toHaveLength(0)
  })

  it('slides the castling rook while the dropped king lands instantly', async () => {
    mockBoardRect()
    const {view, game} = freshView()
    game.board.squares['f1'].piece = null
    game.board.squares['g1'].piece = null
    const wrapper = mount(cBoard, {props: {view}})
    await drag(wrapper, 'e1', {x: 650, y: 750}) // g1 — castles king-side
    expect(view.moves[0]).toMatchObject({castling: 'king-side'})
    const king = wrapper.findAllComponents(cPiece).find(p => p.props('piece').id === 'Ke1')!
    const rook = wrapper.findAllComponents(cPiece).find(p => p.props('piece').id === 'Rh1')!
    expect(king.props('animation')).toBe('none') // already under the cursor
    expect(rook.props('animation')).toBe('slide') // rides along visibly
  })

  it('slides the piece back home after a refused drop', async () => {
    mockBoardRect()
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    await drag(wrapper, 'e2', {x: 450, y: 350}) // e5 — a triple advance, refused
    expect(view.moves).toHaveLength(0)
    expect(wrapper.find('.c-piece--anim-snap-back').exists()).toBe(true)
  })

  it('gives knights the hop animation for their slides', async () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    await nextTick() // mount teleport frame…
    await nextTick() // …then the slide mode arms
    const knights = wrapper.findAllComponents(cPiece).filter(p => p.props('piece').type === 'knight')
    expect(knights).toHaveLength(4)
    for (const knight of knights) {
      expect(knight.classes()).toContain('c-piece--anim-hop')
    }
    const pawn = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === 'e2')!
    expect(pawn.classes()).toContain('c-piece--anim-slide')
  })

  it('grows a touch-dragged piece and targets the square under the finger', async () => {
    mockBoardRect()
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    const pawn = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === 'e2')!
    await pawn.trigger('pointerdown', {pointerType: 'touch'})
    window.dispatchEvent(new MouseEvent('pointermove', {clientX: 450, clientY: 450, buttons: 1})) // over e4
    await nextTick()
    expect(wrapper.find('.c-piece__img--lifted').exists()).toBe(true)
    // the drop target is the square under the finger — shown as the popped-out square
    expect(findSquare(wrapper, 'e4').find('.c-square__highlight--drop-target-touch').exists()).toBe(true)
    expect(wrapper.find('.c-square__highlight--drop-target').exists()).toBe(false)
  })

  it('only pops legal touch targets — even with the hints setting off', async () => {
    mockBoardRect()
    const {view} = freshView()
    useSettingsStore().settings.showLegalMoves = false
    const wrapper = mount(cBoard, {props: {view}})
    const pawn = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === 'e2')!
    await pawn.trigger('pointerdown', {pointerType: 'touch'})
    // e6 — three squares ahead, not a pawn move: the crossed square stays quiet
    window.dispatchEvent(new MouseEvent('pointermove', {clientX: 450, clientY: 250, buttons: 1}))
    await nextTick()
    expect(wrapper.find('.c-square__highlight--drop-target-touch').exists()).toBe(false)
    // e4 — legal: pops despite the hints being off (drop feedback is not a hint)
    window.dispatchEvent(new MouseEvent('pointermove', {clientX: 450, clientY: 450, buttons: 1}))
    await nextTick()
    expect(findSquare(wrapper, 'e4').find('.c-square__highlight--drop-target-touch').exists()).toBe(true)
  })

  it('grows the piece standing on the touch target with the popped square', async () => {
    mockBoardRect()
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    makeMove(game, 'd7', 'd5')
    const wrapper = mount(cBoard, {props: {view}})
    const pawn = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === 'e4')!
    await pawn.trigger('pointerdown', {pointerType: 'touch'})
    window.dispatchEvent(new MouseEvent('pointermove', {clientX: 350, clientY: 350, buttons: 1})) // over d5, the target
    await nextTick()
    const enemy = wrapper.findAllComponents(cPiece).find(p => p.props('piece').square === 'd5')!
    expect(enemy.classes()).toContain('c-piece--popped')
    expect(enemy.get('img').classes()).toContain('c-piece__img--popped')
  })

  it('turns the sprites toward the player to move — mobile face-à-face', async () => {
    stubMatchMedia(true)
    const {view, game} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-piece__flip--flipped')).toHaveLength(0)
    makeMove(game, 'e2', 'e4')
    await nextTick()
    expect(wrapper.findAll('.c-piece__flip--flipped')).toHaveLength(32)
  })

  it('only lets the player to move grab pieces', () => {
    const {view} = freshView()
    const wrapper = mount(cBoard, {props: {view}})
    // white to move: the 16 black pieces ignore the pointer
    expect(wrapper.findAll('.c-piece')).toHaveLength(32)
    expect(wrapper.findAll('.c-piece--static')).toHaveLength(16)
  })

  it('freezes every piece once the game is finished', () => {
    const {view, game} = freshView()
    resign(game, 'white')
    const wrapper = mount(cBoard, {props: {view}})
    expect(wrapper.findAll('.c-piece--static')).toHaveLength(32)
  })
})
