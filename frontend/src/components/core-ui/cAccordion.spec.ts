import {describe, it, expect} from 'vitest'
import {mount} from '@vue/test-utils'
import cAccordion from './cAccordion.vue'

function mountAccordion(props = {}, slots = {}) {
  return mount(cAccordion, {
    props: {title: 'Section', ...props},
    slots: {default: 'Body', ...slots},
  })
}

describe('cAccordion', () => {
  it('renders its title', () => {
    expect(mountAccordion().find('.c-accordion__title').text()).toBe('Section')
  })

  it('starts collapsed by default', () => {
    const wrapper = mountAccordion()
    expect(wrapper.classes()).not.toContain('c-accordion--open')
    expect(wrapper.find('.c-accordion__trigger').attributes('aria-expanded')).toBe('false')
  })

  it('starts expanded when asked', () => {
    const wrapper = mountAccordion({open: true})
    expect(wrapper.classes()).toContain('c-accordion--open')
    expect(wrapper.find('.c-accordion__trigger').attributes('aria-expanded')).toBe('true')
  })

  // The panel is always rendered — the height animation needs the content to exist and be
  // measurable, so collapsing hides it in CSS rather than removing it from the DOM.
  it('keeps the content mounted while collapsed', () => {
    expect(mountAccordion().find('.c-accordion__content').text()).toBe('Body')
  })

  it('toggles open and shut on click', async () => {
    const wrapper = mountAccordion()
    const trigger = wrapper.find('.c-accordion__trigger')

    await trigger.trigger('click')
    expect(wrapper.classes()).toContain('c-accordion--open')

    await trigger.trigger('click')
    expect(wrapper.classes()).not.toContain('c-accordion--open')
  })

  it('emits its new state on every toggle', async () => {
    const wrapper = mountAccordion()
    await wrapper.find('.c-accordion__trigger').trigger('click')
    await wrapper.find('.c-accordion__trigger').trigger('click')

    expect(wrapper.emitted('toggle')).toEqual([[true], [false]])
  })

  it('wires the trigger to the panel it controls', () => {
    const wrapper = mountAccordion()
    const controls = wrapper.find('.c-accordion__trigger').attributes('aria-controls')

    expect(controls).toBeTruthy()
    expect(wrapper.find('.c-accordion__panel').attributes('id')).toBe(controls)
  })

  it('renders an icon slot when given one', () => {
    const wrapper = mountAccordion({}, {icon: '<span class="test-icon" />'})
    expect(wrapper.find('.c-accordion__icon .test-icon').exists()).toBe(true)
  })

  it('has no icon wrapper without the slot', () => {
    expect(mountAccordion().find('.c-accordion__icon').exists()).toBe(false)
  })
})
