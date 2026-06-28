import { describe, it, expect, vi } from 'vitest'

// jsdom does not implement matchMedia — required by useTheme
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
})
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '../App.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }],
})

describe('App', () => {
  it('renders the app shell', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [router, createPinia()],
        stubs: {
          SuperTopBar: true,
          AppFooter: true,
          RouterView: true,
        },
      },
    })
    await router.isReady()
    expect(wrapper.find('#app-main').exists()).toBe(true)
  })
})
