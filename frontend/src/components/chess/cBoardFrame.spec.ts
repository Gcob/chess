import {describe, it, expect} from 'vitest'
import {mount} from '@vue/test-utils'
import cBoardFrame from './cBoardFrame.vue'

function labels(wrapper: ReturnType<typeof mount>, side: string): string[] {
  return wrapper.findAll(`.c-board-frame__${side} span`).map(s => s.text())
}

describe('cBoardFrame', () => {
  it('orders files a→h and ranks 8→1 for white', () => {
    const wrapper = mount(cBoardFrame, {props: {orientation: 'white'}})
    expect(labels(wrapper, 'files--top')).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    expect(labels(wrapper, 'ranks--left')).toEqual(['8', '7', '6', '5', '4', '3', '2', '1'])
  })

  it('flips the order for black', () => {
    const wrapper = mount(cBoardFrame, {props: {orientation: 'black'}})
    expect(labels(wrapper, 'files--top')).toEqual(['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'])
    expect(labels(wrapper, 'ranks--left')).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
  })

  it('marks the hovered file and rank active on both of their sides', () => {
    const wrapper = mount(cBoardFrame, {props: {orientation: 'white', highlightFile: 'c', highlightRank: 4}})
    const active = wrapper.findAll('.c-board-frame__label--active').map(s => s.text())
    // file 'c' appears top + bottom, rank '4' appears left + right
    expect(active.filter(t => t === 'c')).toHaveLength(2)
    expect(active.filter(t => t === '4')).toHaveLength(2)
    expect(active).toHaveLength(4)
  })

  it('renders the default slot as the board', () => {
    const wrapper = mount(cBoardFrame, {
      props: {orientation: 'white'},
      slots: {default: '<div class="board-stub" />'},
    })
    expect(wrapper.find('.c-board-frame__board .board-stub').exists()).toBe(true)
  })
})
