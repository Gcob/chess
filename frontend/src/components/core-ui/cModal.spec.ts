import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import cModal from './cModal.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: { common: { close: 'Close' } },
  },
})

function mountModal(props = {}, slots = {}) {
  return mount(cModal, {
    props: { modelValue: false, ...props },
    slots,
    global: { plugins: [i18n] },
    attachTo: document.body,
  })
}

describe('cModal', () => {
  it('is hidden when modelValue is false', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.c-modal').exists()).toBe(false)
  })

  it('shows when modelValue is true', () => {
    const wrapper = mountModal({ modelValue: true }, { default: 'Hello' })
    expect(wrapper.find('.c-modal').exists()).toBe(true)
    expect(wrapper.find('.c-modal__content').text()).toBe('Hello')
  })

  it('renders header slot', () => {
    const wrapper = mountModal(
      { modelValue: true },
      { header: 'My Title', default: 'Body' },
    )
    expect(wrapper.find('.c-modal__header-content').text()).toBe('My Title')
  })

  it('hides header when no header slot', () => {
    const wrapper = mountModal(
      { modelValue: true },
      { default: 'Body only' },
    )
    expect(wrapper.find('.c-modal__header').exists()).toBe(false)
  })

  it('renders footer slot', () => {
    const wrapper = mountModal(
      { modelValue: true },
      { default: 'Body', footer: 'Footer content' },
    )
    expect(wrapper.find('.c-modal__footer').text()).toBe('Footer content')
  })

  it('hides footer when no footer slot', () => {
    const wrapper = mountModal(
      { modelValue: true },
      { default: 'Body only' },
    )
    expect(wrapper.find('.c-modal__footer').exists()).toBe(false)
  })

  it('applies size class', () => {
    const wrapper = mountModal(
      { modelValue: true, size: 'lg' },
      { default: 'Big modal' },
    )
    expect(wrapper.find('.c-modal__wrapper--lg').exists()).toBe(true)
  })

  it('emits close on X button click', async () => {
    const wrapper = mountModal(
      { modelValue: true },
      { header: 'Title', default: 'Body' },
    )
    await wrapper.find('.c-modal__close').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close on overlay click', async () => {
    const wrapper = mountModal(
      { modelValue: true },
      { default: 'Body' },
    )
    await wrapper.find('.c-modal').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('does not close on overlay click when closeOnOverlay is false', async () => {
    const wrapper = mountModal(
      { modelValue: true, closeOnOverlay: false },
      { default: 'Body' },
    )
    await wrapper.find('.c-modal').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes on Escape key', async () => {
    const wrapper = mountModal(
      { modelValue: true },
      { default: 'Body' },
    )
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('does not close on Escape when closeOnEsc is false', async () => {
    const wrapper = mountModal(
      { modelValue: true, closeOnEsc: false },
      { default: 'Body' },
    )
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('passes close function to footer slot', () => {
    const wrapper = mountModal(
      { modelValue: true },
      {
        default: 'Body',
        footer: `<template #footer="{ close }">
          <button class="test-close" @click="close">Done</button>
        </template>`,
      },
    )
    expect(wrapper.find('.c-modal__footer').exists()).toBe(true)
  })
})
