import {describe, it, expect, beforeEach} from 'vitest'
import {mount} from '@vue/test-utils'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import GameOverModal from './GameOverModal.vue'
import cModal from '@/components/core-ui/cModal.vue'
import cButton from '@/components/core-ui/cButton.vue'
import {useGamesStore} from '@/stores/useGamesStore'
import {useGameView} from '@/composables/useGameView'
import {resign, replayMoves, acceptDraw, offerDraw} from '@/engine/game'
import {stubMatchMedia} from '@/test/mediaQuery'
import fr from '@/assets/i18n/locales/fr'
import type {CreateGamePayload} from '@/types/chess'
import type {GameView} from '@/composables/useGameView'

// The real French bundle — the modal is mostly copy, so stubbed keys would test nothing.
const i18n = createI18n({legacy: false, locale: 'fr', messages: {fr}})

const payload: CreateGamePayload = {
  mode: 'local',
  players: {white: {name: 'Alice', avatar: 'fox'}, black: {name: 'Bob', avatar: 'panda'}},
}

function mountModal(prepare: (view: GameView) => void) {
  const session = useGamesStore().open(payload)
  const view = useGameView(session.id)
  prepare(view)

  return mount(GameOverModal, {
    props: {view},
    global: {plugins: [i18n], components: {cModal, cButton}, stubs: {RouterLink: true}},
    attachTo: document.body,
  })
}

describe('GameOverModal', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    stubMatchMedia(false)
  })

  it('stays closed while the game is running', () => {
    const wrapper = mountModal(() => {})
    expect(wrapper.find('.game-over').exists()).toBe(false)
  })

  it('opens by itself when the game ends', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.game-over').exists()).toBe(true)
  })

  it('celebrates the winner by name and salutes the loser', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.game-over__title').text()).toBe('Bravo Alice !')
    expect(wrapper.find('.game-over__kind').text()).toContain('Belle bataille, Bob !')
  })

  it('crowns the winner — aura, ring and glint, one avatar', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.game-over__fx').exists()).toBe(true)
    expect(wrapper.find('.game-over__ring').exists()).toBe(true)
    expect(wrapper.find('.game-over__glint').exists()).toBe(true)
    expect(wrapper.find('.game-over__pair').exists()).toBe(false)
  })

  it('shows the ending emoji next to its reason', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    const badge = wrapper.find('.game-over__badge')
    expect(badge.text()).toContain('🏳️')
    expect(badge.text()).toContain('Abandon')
  })

  it('folds the mating piece into the winning sentence', async () => {
    const wrapper = mountModal(view => replayMoves(view.game!, [
      ['e2', 'e4'], ['e7', 'e5'],
      ['f1', 'c4'], ['b8', 'c6'],
      ['d1', 'h5'], ['g8', 'f6'],
      ['h5', 'f7'],
    ]))
    await wrapper.vm.$nextTick()

    const lines = wrapper.findAll('.game-over__kind span').map(span => span.text())
    expect(lines[0]).toBe('Les blancs l\'emportent avec un mat de la dame en f7.')
    expect(lines[1]).toBe('Belle bataille, Bob !')
  })

  it('keeps the plain winning sentence on any other ending', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    const lines = wrapper.findAll('.game-over__kind span').map(span => span.text())
    expect(lines[0]).toBe('Les blancs l\'emportent.')
  })

  it('stays neutral on a draw — both faces, no celebration at all', async () => {
    const wrapper = mountModal(view => {
      // A draw can only be offered in an ACTIVE game — the first move starts it.
      replayMoves(view.game!, [['e2', 'e4']])
      offerDraw(view.game!, 'black')
      acceptDraw(view.game!)
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.game-over__title').text()).toBe('Match nul !')
    expect(wrapper.find('.game-over__pair').exists()).toBe(true)
    expect(wrapper.find('.game-over__kind').text()).toContain('Bien joué les deux !')
    expect(wrapper.find('.game-over').classes()).toContain('game-over--draw')
  })

  it('renders no effect layer whatsoever on a draw', async () => {
    const wrapper = mountModal(view => {
      replayMoves(view.game!, [['e2', 'e4']])
      offerDraw(view.game!, 'black')
      acceptDraw(view.game!)
    })
    await wrapper.vm.$nextTick()

    for (const part of ['__fx', '__rays', '__halo', '__sparkle', '__ring', '__glint']) {
      expect(wrapper.find(`.game-over${part}`).exists()).toBe(false)
    }
    // The shimmer belongs to a winner's name too.
    expect(wrapper.find('.game-over__title').classes()).not.toContain('game-over__title--shine')
  })

  it('emits home and rematch from its two buttons', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.game-over__actions .c-button')
    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('home')).toHaveLength(1)
    expect(wrapper.emitted('rematch')).toHaveLength(1)
  })

  it('closes through the view so the state stays shared with the rest of the page', async () => {
    const wrapper = mountModal(view => resign(view.game!, 'black'))
    await wrapper.vm.$nextTick()

    await wrapper.find('.game-over__close').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.props('view').resultOpen).toBe(false)
    expect(wrapper.find('.game-over').exists()).toBe(false)
  })
})
