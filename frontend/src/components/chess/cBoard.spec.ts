import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import cBoard from './cBoard.vue'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {Board, CreateGamePayload} from '@/types/chess'

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function freshBoard(): Board {
  return createGameSession(payload, 'test-id').game.board
}

describe('cBoard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('highlights the from and to squares of the last move', () => {
    const wrapper = mount(cBoard, {props: {board: freshBoard(), lastMove: {from: 'e2', to: 'e4'}}})
    expect(wrapper.findAll('.c-square__highlight--last-move')).toHaveLength(2)
  })

  it('shows no last-move highlight when there is none', () => {
    const wrapper = mount(cBoard, {props: {board: freshBoard(), lastMove: null}})
    expect(wrapper.findAll('.c-square__highlight--last-move')).toHaveLength(0)
  })

  it('marks opponent pieces static under a movableColor policy', () => {
    const wrapper = mount(cBoard, {props: {board: freshBoard(), movableColor: 'white'}})
    // the 16 black pieces ignore the pointer; the 16 white ones stay grabbable
    expect(wrapper.findAll('.c-piece--static')).toHaveLength(16)
    expect(wrapper.findAll('.c-piece')).toHaveLength(32)
  })

  it('leaves every piece grabbable without a movableColor policy', () => {
    const wrapper = mount(cBoard, {props: {board: freshBoard()}})
    expect(wrapper.findAll('.c-piece--static')).toHaveLength(0)
  })
})
