<script setup lang="ts">
</script>

<template>
  <main class="home">
    <h1 class="c-h1">{{ $t('app.title') }}</h1>
    <p class="home__subtitle">{{ $t('home.subtitle') }}</p>

    <div class="home__actions">
      <cButton :to="{ name: 'game' }">
        {{ $t('home.playButton') }}
      </cButton>
    </div>
  </main>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: $spacing-4;

  &__subtitle {
    font-size: $font-size-lg;
    color: rgba($color3, 0.5);
  }

  &__actions {
    margin-top: $spacing-8;
  }
}
</style>
