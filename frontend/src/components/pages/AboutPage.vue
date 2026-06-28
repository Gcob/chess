<template>
  <main class="c-page" id="about-page">
    <h1 class="c-h1">{{ $t('about.title') }}</h1>

    <section class="about__section">
      <h2 class="c-h3">{{ $t('about.motivation') }}</h2>
      <p class="c-text-base c-text-secondary">{{ $t('about.motivationText') }}</p>
    </section>

    <section class="about__section">
      <h2 class="c-h3">{{ $t('about.stack') }}</h2>
      <p class="c-text-base c-text-secondary">{{ $t('about.stackText') }}</p>
    </section>

    <section class="about__section">
      <h2 class="c-h3">{{ $t('about.roadmap') }}</h2>
      <p class="c-text-base c-text-secondary">{{ $t('about.roadmapText') }}</p>
    </section>

    <cButton variant="ter" :to="{ name: 'home' }" class="c-mt-4">
      {{ $t('common.backHome') }}
    </cButton>
  </main>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
#about-page {
  max-width: 48rem;
  margin: 0 auto;
  align-items: flex-start;
  gap: $spacing-8;
}

.about__section {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;
}
</style>
