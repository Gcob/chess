<template>
  <main class="c-page" id="privacy-page">
    <h1 class="c-h1">{{ $t('privacy.title') }}</h1>
    <p class="c-text-lg c-text-muted">{{ $t('privacy.placeholder') }}</p>
    <cButton variant="ter" :to="{ name: 'home' }" class="c-mt-8">
      {{ $t('common.backHome') }}
    </cButton>
  </main>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
#privacy-page {
  gap: $spacing-4;
}
</style>
