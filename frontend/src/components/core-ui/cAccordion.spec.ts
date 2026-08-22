import {describe, it, expect, vi, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import cAccordion from './cAccordion.vue'

function mountAccordion(props = {}, slots = {}) {
  return mount(cAccordion, {
    props: {title: 'Section', ...props},
    slots: {default: 'Body', ...slots},
  })
}

describe('cAccordion', () => {
  beforeEach(() => {
    // jsdom implements no scrolling at all; the component calls this optionally.
    Element.prototype.scrollIntoView = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({matches: false}) as unknown as typeof window.matchMedia
  })

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

  it('scrolls itself into view when it opens', async () => {
    const wrapper = mountAccordion()
    await wrapper.find('.c-accordion__trigger').trigger('click')
    await wrapper.vm.$nextTick()

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({block: 'start'}),
    )
  })

  it('does not scroll when it closes', async () => {
    const wrapper = mountAccordion({open: true})
    await wrapper.find('.c-accordion__trigger').trigger('click')
    await wrapper.vm.$nextTick()

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('stays put when scrollOnOpen is off', async () => {
    const wrapper = mountAccordion({scrollOnOpen: false})
    await wrapper.find('.c-accordion__trigger').trigger('click')
    await wrapper.vm.$nextTick()

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('jumps instead of gliding under prefers-reduced-motion', async () => {
    window.matchMedia = vi.fn().mockReturnValue({matches: true}) as unknown as typeof window.matchMedia
    const wrapper = mountAccordion()
    await wrapper.find('.c-accordion__trigger').trigger('click')
    await wrapper.vm.$nextTick()

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({behavior: 'auto'}),
    )
  })

  // Sticky positioning dies inside an `overflow: hidden` ancestor, and the collapsing panel
  // needs exactly that overflow to clip its content. So the heading must stay OUTSIDE the panel.
  it('keeps the heading outside the clipped panel, so it can stick', () => {
    const wrapper = mountAccordion({open: true})
    const heading = wrapper.find('.c-accordion__heading')

    expect(heading.exists()).toBe(true)
    expect(wrapper.find('.c-accordion__panel .c-accordion__heading').exists()).toBe(false)
    expect(heading.element.parentElement).toBe(wrapper.element)
  })

  it('renders an icon slot when given one', () => {
    const wrapper = mountAccordion({}, {icon: '<span class="test-icon" />'})
    expect(wrapper.find('.c-accordion__icon .test-icon').exists()).toBe(true)
  })

  it('has no icon wrapper without the slot', () => {
    expect(mountAccordion().find('.c-accordion__icon').exists()).toBe(false)
  })
})
