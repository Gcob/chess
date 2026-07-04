<template>
  <div class="about-content">
    <section class="about-content__section">
      <h2 class="c-h3">{{ $t('about.motivation') }}</h2>
      <p class="c-text-base c-text-secondary">{{ $t('about.motivationText') }}</p>
    </section>

    <section class="about-content__section">
      <h2 class="c-h3">{{ $t('about.stack') }}</h2>
      <p class="c-text-base c-text-secondary">{{ $t('about.stackText') }}</p>
    </section>

    <section class="about-content__section">
      <h2 class="c-h3">{{ $t('about.roadmap') }}</h2>
      <p class="c-text-base c-text-secondary">{{ $t('about.roadmapText') }}</p>
    </section>
  </div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.about-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-6;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }
}
</style>
