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
import NewGameForm from '@/components/NewGameForm.vue'

function onStart() {
  // TODO: navigate to game page
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
