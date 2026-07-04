<template>
  <main class="c-page" id="not-found-page">
    <p class="not-found__code">404</p>
    <h1 class="c-h1">{{ $t('notFound.title') }}</h1>
    <p class="c-text-lg c-text-muted">{{ $t('notFound.message') }}</p>
    <cButton :to="{ name: 'home' }" class="c-mt-4">{{ $t('common.backHome') }}</cButton>
  </main>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
#not-found-page {
  align-items: center;
  text-align: center;
  gap: $spacing-3;
}

.not-found__code {
  font-family: $font-family-display;
  font-size: 5rem;
  font-weight: $font-weight-bold;
  line-height: 1;
  color: var(--accent);
}
</style>
