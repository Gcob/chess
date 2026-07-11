import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import cSquare from './cSquare.vue'
import type {Square} from '@/types/chess'

const square: Square = {
  color: 'light',
  file: 'e',
  rank: 4,
  piece: null,
  neighbors: {
    'top': null, 'top-right': null, 'right': null, 'bottom-right': null,
    'bottom': null, 'bottom-left': null, 'left': null, 'top-left': null,
  },
}

describe('cSquare', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders no highlight overlay by default', () => {
    const wrapper = mount(cSquare, {props: {square}})
    expect(wrapper.findAll('.c-square__highlight')).toHaveLength(0)
  })

  it('renders one overlay per highlight, with a modifier class each', () => {
    const wrapper = mount(cSquare, {props: {square, highlights: ['drop-target', 'last-move']}})
    expect(wrapper.findAll('.c-square__highlight')).toHaveLength(2)
    expect(wrapper.find('.c-square__highlight--drop-target').exists()).toBe(true)
    expect(wrapper.find('.c-square__highlight--last-move').exists()).toBe(true)
  })

  it('renders the check overlay', () => {
    const wrapper = mount(cSquare, {props: {square, highlights: ['check']}})
    expect(wrapper.find('.c-square__highlight--check').exists()).toBe(true)
  })
})
