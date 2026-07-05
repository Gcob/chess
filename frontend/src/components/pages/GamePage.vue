<template>
  <main id="game-page">
    <template v-if="view.game">
      <GameLayoutMobile v-if="isMobile" :view="view" />
      <GameLayoutDesktop v-else :view="view" />
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
import {useRoute} from 'vue-router'
import {useGameView} from '@/composables/useGameView'
import {useIsMobile} from '@/composables/useMediaQuery'
import {usePreventLeave} from '@/composables/usePreventLeave'
import GameLayoutDesktop from '@/components/game/GameLayoutDesktop.vue'
import GameLayoutMobile from '@/components/game/GameLayoutMobile.vue'

const route = useRoute()

// route.params.id is string | string[] — normalize to one string; an unknown or malformed id
// simply finds no session and falls into the not-found state below.
const rawId = route.params.id
const view = useGameView(Array.isArray(rawId) ? (rawId[0] ?? '') : (rawId ?? ''))
const isMobile = useIsMobile()

usePreventLeave(() => !!view.game)
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
