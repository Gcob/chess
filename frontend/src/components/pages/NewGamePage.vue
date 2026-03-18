<template>
  <main class="c-page" id="new-game-page">
    <div class="new-game-page__header">
      <h1 class="c-h1">{{ $t('newGame.title') }}</h1>
      <p class="c-text-lg c-text-muted">{{ $t('newGame.subtitle') }}</p>
    </div>

    <NewGameForm @start="onStart" />
  </main>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import NewGameForm from '@/components/NewGameForm.vue'
import { useNewGameStore } from '@/stores/useNewGameStore'
import { useGamesStore } from '@/stores/useGamesStore'
import { toBackendPayload } from '@/composables/factories/gameFactory'

const router = useRouter()
const newGameStore = useNewGameStore()
const gamesStore = useGamesStore()

function onStart() {
  const payload = toBackendPayload(newGameStore.settings)
  const session = gamesStore.open(payload)
  router.push({ name: 'game', params: { id: session.id } })
}
</script>

<style lang="scss" scoped>
#new-game-page {
  gap: $spacing-8;

  .new-game-page__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-2;
  }
}
</style>
