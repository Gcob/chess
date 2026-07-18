import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import MoveHistory from './MoveHistory.vue'
import {useGamesStore} from '@/stores/useGamesStore'
import {useGameView} from '@/composables/useGameView'
import type {CreateGamePayload, Game, Move, PieceColor, SquareKey} from '@/types/chess'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {en: {game: {history: 'Move history'}}},
})

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function move(color: PieceColor, san: string): Move {
  // from/to/pieceType don't matter for the pairing — any values keep the object honest
  const square: SquareKey = 'e4'
  return {san, color, pieceType: 'pawn', from: square, to: square, elapsedSeconds: 0}
}

function mountWithMoves(moves: Move[]) {
  const session = useGamesStore().open(payload)
  session.game.moves.push(...moves)
  const view = useGameView(session.id)
  return mount(MoveHistory, {props: {view}, global: {plugins: [i18n]}})
}

function renderedTurns(wrapper: ReturnType<typeof mountWithMoves>): string[] {
  return wrapper.findAll('.move-history__turn').map(turn =>
    turn.findAll('span').map(cell => cell.text()).filter(Boolean).join(' '),
  )
}

describe('MoveHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders nothing without moves', () => {
    const wrapper = mountWithMoves([])
    expect(wrapper.findAll('.move-history__turn')).toHaveLength(0)
  })

  it('pairs a normal white/black alternation by turn', () => {
    const wrapper = mountWithMoves([
      move('white', 'e4'), move('black', 'e5'),
      move('white', 'Nf3'), move('black', 'Nc6'),
    ])
    expect(renderedTurns(wrapper)).toEqual(['1. e4 e5', '2. Nf3 Nc6'])
  })

  it('leaves the black cell empty on an unfinished turn', () => {
    const wrapper = mountWithMoves([move('white', 'e4'), move('black', 'e5'), move('white', 'Nf3')])
    expect(renderedTurns(wrapper)).toEqual(['1. e4 e5', '2. Nf3'])
  })

  it('shows a placeholder white cell when black starts (future FEN resume)', () => {
    const wrapper = mountWithMoves([move('black', 'e5'), move('white', 'Nf3')])
    expect(renderedTurns(wrapper)).toEqual(['1. … e5', '2. Nf3'])
  })

  it('never merges two black moves into one turn', () => {
    const wrapper = mountWithMoves([move('black', 'e5'), move('black', 'Nc6')])
    expect(renderedTurns(wrapper)).toEqual(['1. … e5', '2. … Nc6'])
  })
})
