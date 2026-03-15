<script setup lang="ts">
</script>

<template>
  <main class="game">
    <h1 class="game__title">Game</h1>
    <p class="game__placeholder">Board goes here</p>

    <button class="game__back-btn" @click="$router.push({ name: 'home' })">
      Back to home
    </button>
  </main>
</template>

<style lang="scss" scoped>
.game {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: $spacing-4;

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__placeholder {
    color: $color-gray-400;
    font-style: italic;
  }

  &__back-btn {
    margin-top: $spacing-6;
    padding: $spacing-2 $spacing-6;
    font-size: $font-size-sm;
    color: $color-gray-600;
    border: $border-width-thin solid $color-gray-300;
    border-radius: $border-radius-base;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-900;
      border-color: $color-gray-400;
    }
  }
}
</style>
