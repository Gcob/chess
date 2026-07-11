import {describe, it, expect, beforeEach} from 'vitest'
import {nextTick} from 'vue'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import cBoard from './cBoard.vue'
import {useGamesStore} from '@/stores/useGamesStore'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useGameView} from '@/composables/useGameView'
import {makeMove, resign} from '@/engine/game'
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

describe('cBoard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
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

    // through the view command: mutating the raw game after mount bypasses reactivity
    view.move('c7', 'c6') // blocks the diagonal
    await nextTick()
    expect(wrapper.findAll('.c-square__highlight--check')).toHaveLength(0)
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
