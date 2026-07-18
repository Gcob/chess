import {describe, it, expect, beforeEach} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {useGamesStore} from '@/stores/useGamesStore'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useGameView} from './useGameView'
import {makeMove} from '@/engine/game'
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
