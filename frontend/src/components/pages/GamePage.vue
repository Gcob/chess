<template>
  <main id="game-page" class="c-page">
    <cBoard v-if="game" :board="game.board" :size="boardSize" />

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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGameSession } from '@/composables/useGameSession'
import cBoard from '@/components/chess/cBoard.vue'

const route = useRoute()
const { game } = useGameSession(Number(route.params.id))

// Fits the board in the available viewport, capped at 640px
const boardSize = computed(() => Math.min(window.innerWidth, window.innerHeight, 640) * 0.85)
</script>

<style lang="scss" scoped>
#game-page {
  gap: $spacing-8;
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
