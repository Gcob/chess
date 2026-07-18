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
import { useGameLauncher } from '@/composables/useGameLauncher'

const router = useRouter()
const { launch } = useGameLauncher()

function onStart() {
  const session = launch()
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
