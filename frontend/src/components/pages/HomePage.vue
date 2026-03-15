<template>
  <main class="c-page" id="home-page">
    <h1 class="c-h1">{{ $t('app.title') }}</h1>
    <p class="home__subtitle">{{ $t('home.subtitle') }}</p>

    <div class="home__actions">
      <cButton :to="{ name: 'new-game' }">
        {{ $t('home.playButton') }}
      </cButton>
      <cButton variant="sec" @click="showRules = true">
        {{ $t('home.rulesButton') }}
      </cButton>
    </div>

    <cModal v-model="showRules" size="lg">
      <template #header>{{ $t('chessRules.title') }}</template>
      <ChessRules />
      <template #footer="{ close }">
        <cButton @click="close">{{ $t('common.close') }}</cButton>
      </template>
    </cModal>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChessRules from '@/components/parts/ChessRules.vue'

const showRules = ref(false)
</script>

<style lang="scss">
#home-page {
  .home__subtitle {
    font-size: $font-size-lg;
    color: rgba($color3, 0.5);
  }

  .home__actions {
    display: flex;
    gap: $spacing-4;
    margin-top: $spacing-8;
  }
}
</style>
