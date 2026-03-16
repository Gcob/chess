<template>
  <main class="c-page" id="home-page">
    <ChessHero />

    <div class="home__actions">
      <cButton :to="{ name: 'new-game' }">
        {{ $t('home.playButton') }}
      </cButton>
    </div>
  </main>
</template>

<script lang="ts" setup>
import ChessHero from '@/components/ChessHero.vue'
</script>

<style lang="scss" scoped>
.home__actions {
  margin-top: $spacing-8;
}
</style>
