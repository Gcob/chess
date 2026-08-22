<template>
  <main id="game-page">
    <template v-if="view.game">
      <GameLayoutMobile v-if="isMobile" :view="view" />
      <GameLayoutDesktop v-else :view="view" />

      <GameOverModal :view="view" @home="goHome" @rematch="playRematch" />
    </template>

    <div v-else class="game-page__not-found">
      <h1 class="c-h1">{{ $t('game.notFound') }}</h1>
      <p class="c-text-muted">{{ $t('game.notFoundDesc', { id: route.params.id }) }}</p>
      <div class="game-page__not-found-actions">
        <cButton variant="ter" :to="{ name: 'home' }">{{ $t('common.backHome') }}</cButton>
        <cButton :to="{ name: 'new-game' }">{{ $t('game.newGame') }}</cButton>
      </div>
    </div>
  </main>
</template>

<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router'
import {useGameView} from '@/composables/useGameView'
import {useIsMobile} from '@/composables/useMediaQuery'
import {usePreventLeave} from '@/composables/usePreventLeave'
import {useSettingsStore} from '@/stores/useSettingsStore'
import GameLayoutDesktop from '@/components/game/GameLayoutDesktop.vue'
import GameLayoutMobile from '@/components/game/GameLayoutMobile.vue'
import GameOverModal from '@/components/game/GameOverModal.vue'
import {useGameLauncher} from '@/composables/useGameLauncher'
import {useGamesStore} from '@/stores/useGamesStore'

const route = useRoute()
const router = useRouter()

// route.params.id is string | string[] — normalize to one string; an unknown or malformed id
// simply finds no session and falls into the not-found state below.
const rawId = route.params.id
const view = useGameView(Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? ''))
const isMobile = useIsMobile()

// Warn only while a live game could be lost — a finished game has nothing to protect, and the
// dev tooling (devMode setting) iterates too fast to pay a confirm on every hop.
const settingsStore = useSettingsStore()
usePreventLeave(() => !!view.game && !view.isGameOver && !settingsStore.settings.devMode)

const gamesStore = useGamesStore()
const {rematch} = useGameLauncher()

function goHome() {
  view.hideResult()
  void router.push({name: 'home'})
}

// Same shape as the dev panel's restart: replace rather than push (the finished game is done,
// and a browser back into a closed session would only find the not-found state), then drop it.
async function playRematch() {
  const game = view.game
  if (!game) {
    return
  }

  const previousId = String(route.params.id ?? '')
  const session = rematch(game)
  view.hideResult()
  await router.replace({name: 'game', params: {id: session.id}})
  gamesStore.close(previousId)
}
</script>

<style lang="scss" scoped>
#game-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: $spacing-4;
  // Mobile: grow to fill so the fixed-height footer sticks to the bottom; still grows (never
  // shrinks) with tall content, letting the page scroll normally.
  flex: 1 0 auto;

  // Desktop: a DEFINITE height (viewport minus the fixed top bar and the fixed-height footer)
  // so the flex chain can bound the board — no page scroll; inner zones (history) scroll instead.
  // A flex:1 / min-height chain alone doesn't work here: #app-main is min-height (auto), so there
  // is no free space to distribute and nothing bounds the board → it grows past the viewport.
  @include lg {
    flex: 0 0 auto;
    height: calc(100svh - #{$topbar-height} - #{$footer-height});
    overflow: hidden;
  }
}

.game-page__not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-4;
  text-align: center;

  &-actions {
    display: flex;
    gap: $spacing-3;
    margin-top: $spacing-2;
  }
}
</style>
