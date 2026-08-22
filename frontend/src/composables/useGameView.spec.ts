import {describe, it, expect, beforeEach} from 'vitest'
import {nextTick} from 'vue'
import {createPinia, setActivePinia} from 'pinia'
import {useGamesStore} from '@/stores/useGamesStore'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useGameView} from './useGameView'
import {makeMove, replayMoves, resign} from '@/engine/game'
import {stubMatchMedia} from '@/test/mediaQuery'
import type {CreateGamePayload, Game} from '@/types/chess'
import type {GameView} from './useGameView'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshView(): { view: GameView; game: Game } {
  const session = useGamesStore().open(payload)
  return {view: useGameView(session.id), game: session.game}
}

describe('useGameView — local view policies', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    stubMatchMedia(false)
  })

  it('never re-orients the board — white-down like a physical board', () => {
    stubMatchMedia(true)
    const {view, game} = freshView()
    expect(view.orientation).toBe('white')
    makeMove(game, 'e2', 'e4')
    expect(view.orientation).toBe('white')
    expect(view.topColor).toBe('black')
  })

  it('mobile: turns the pieces toward the player to move — the default', () => {
    stubMatchMedia(true)
    const {view, game} = freshView()
    expect(view.piecesFlipped).toBe(false)
    makeMove(game, 'e2', 'e4')
    expect(view.piecesFlipped).toBe(true)
    makeMove(game, 'e7', 'e5')
    expect(view.piecesFlipped).toBe(false)
  })

  it('mobile: keeps the pieces upright when the toggle is off', () => {
    stubMatchMedia(true)
    useSettingsStore().settings.autoFlipPieces = false
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    expect(view.piecesFlipped).toBe(false)
  })

  it('desktop: never turns the pieces', () => {
    const {view, game} = freshView()
    makeMove(game, 'e2', 'e4')
    expect(view.piecesFlipped).toBe(false)
  })
})

describe('useGameView — end-of-game result', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    stubMatchMedia(false)
  })

  it('opens the result on the transition to finished', async () => {
    const {view, game} = freshView()
    expect(view.resultOpen).toBe(false)

    resign(game, 'white')
    await nextTick()

    expect(view.resultOpen).toBe(true)
  })

  it('stays closed over a game that was already finished when the view was built', async () => {
    const session = useGamesStore().open(payload)
    resign(session.game, 'white')

    const view = useGameView(session.id)
    await nextTick()

    expect(view.isGameOver).toBe(true)
    expect(view.resultOpen).toBe(false)
  })

  it('closes and reopens on demand', async () => {
    const {view, game} = freshView()
    resign(game, 'white')
    await nextTick()

    view.hideResult()
    expect(view.resultOpen).toBe(false)

    view.showResult()
    expect(view.resultOpen).toBe(true)
  })

  it('names the mating piece read from the position, not from the last move', async () => {
    const {view, game} = freshView()
    // Scholar's mate — the queen lands on f7 and is the only checker.
    replayMoves(game, [
      ['e2', 'e4'], ['e7', 'e5'],
      ['f1', 'c4'], ['b8', 'c6'],
      ['d1', 'h5'], ['g8', 'f6'],
      ['h5', 'f7'],
    ])
    await nextTick()

    expect(view.game?.result?.reason).toBe('checkmate')
    expect(view.mateBy).toEqual({pieceType: 'queen', square: 'f7'})
  })

  it('has no mating piece on any other ending', async () => {
    const {view, game} = freshView()
    resign(game, 'white')
    await nextTick()

    expect(view.mateBy).toBeNull()
  })
})
