<template>
  <main class="c-page" id="home-page">
    <h1 class="c-h1">{{ $t('app.title') }}</h1>
    <p class="c-text-lg c-text-muted">{{ $t('home.subtitle') }}</p>

    <div class="home__actions">
      <cButton :to="{ name: 'new-game' }">
        {{ $t('home.playButton') }}
      </cButton>
    </div>
  </main>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.home__actions {
  margin-top: $spacing-8;
}
</style>
