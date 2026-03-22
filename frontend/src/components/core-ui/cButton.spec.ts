import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import UiButton from './cButton.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

function mountBtn(props = {}, slots = {}) {
  return mount(UiButton, {
    props,
    slots: { default: 'Click me', ...slots },
    global: { plugins: [router] },
  })
}

describe('UiButton', () => {
  it('renders as a <button> by default', () => {
    const wrapper = mountBtn()
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.text()).toContain('Click me')
  })

  it('renders as a <router-link> when "to" is provided', () => {
    const wrapper = mountBtn({ to: '/' })
    expect(wrapper.element.tagName).toBe('A')
  })

  it('applies variant class', () => {
    const sec = mountBtn({ variant: 'sec' })
    expect(sec.classes()).toContain('c-button--sec')

    const ter = mountBtn({ variant: 'ter' })
    expect(ter.classes()).toContain('c-button--ter')
  })

  it('defaults to main variant', () => {
    const wrapper = mountBtn()
    expect(wrapper.classes()).toContain('c-button--main')
  })

  it('disables the button', () => {
    const wrapper = mountBtn({ disabled: true })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('c-button--disabled')
  })

  it('shows spinner when loading', () => {
    const wrapper = mountBtn({ loading: true })
    expect(wrapper.find('.c-button__spinner').exists()).toBe(true)
    expect(wrapper.classes()).toContain('c-button--loading')
  })

  it('emits click event', async () => {
    const wrapper = mountBtn()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
