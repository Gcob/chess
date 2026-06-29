import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import cPiece from './cPiece.vue'

function mountPiece(props = {}) {
  return mount(cPiece, {
    props: {col: 0, row: 0, color: 'white', type: 'pawn', animated: false, ...props},
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

  it('applies the animated class only when animated is true', () => {
    expect(mountPiece({animated: false}).classes()).not.toContain('c-piece--animated')
    expect(mountPiece({animated: true}).classes()).toContain('c-piece--animated')
  })

  it('renders an image described by color and type', () => {
    const img = mountPiece({color: 'black', type: 'queen'}).get('img')
    expect(img.attributes('alt')).toBe('black queen')
    expect(img.attributes('src')).toBeTruthy()
  })
})
