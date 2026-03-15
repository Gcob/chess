<template>
  <main class="c-page" id="home-page">
    <h1 class="c-h1">{{ $t('app.title') }}</h1>
    <p class="home__subtitle">{{ $t('home.subtitle') }}</p>

    <div class="home__actions">
      <cButton :to="{ name: 'new-game' }">
        {{ $t('home.playButton') }}
      </cButton>
    </div>
  </main>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
#home-page {
  &__subtitle {
    font-size: $font-size-lg;
    color: rgba($color3, 0.5);
  }

  &__actions {
    margin-top: $spacing-8;
  }
}
</style>
