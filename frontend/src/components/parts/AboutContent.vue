<script setup lang="ts">
// Order matters: what the project refuses to depend on, then the layer that makes it possible,
// then the decisions built on top, then how it is kept honest.
const TECH_POINTS = [
  'noDeps',
  'layers',
  'reactivity',
  'viewDto',
  'objects',
  'strategy',
  'tests',
  'docs',
  'polish',
] as const
</script>

<template>
  <div class="about-content">
    <section class="about-content__section">
      <h3 class="about-content__title">{{ $t('about.dream') }}</h3>
      <p>{{ $t('about.dreamStartText') }}</p>
      <p>{{ $t('about.dreamNieceText') }}</p>
      <p>{{ $t('about.dreamProjectText') }}</p>
    </section>

    <section class="about-content__section">
      <h3 class="about-content__title">{{ $t('about.engine') }}</h3>
      <p>{{ $t('about.engineHardText') }}</p>
      <p>{{ $t('about.engineBlindText') }}</p>
      <p>{{ $t('about.engineCompareText') }}</p>
      <p>{{ $t('about.engineTestedText') }}</p>
      <p>{{ $t('about.engineClosingText') }}</p>
    </section>

    <section class="about-content__section">
      <h3 class="about-content__title">{{ $t('about.tech') }}</h3>
      <p class="about-content__lead">{{ $t('about.techIntro') }}</p>

      <ul class="about-content__points">
        <li v-for="point in TECH_POINTS" :key="point" class="about-content__point">
          <h4 class="about-content__point-title">{{ $t(`about.techPoints.${point}.title`) }}</h4>
          <p>{{ $t(`about.techPoints.${point}.text`) }}</p>
        </li>
      </ul>
    </section>

    <section class="about-content__section">
      <h3 class="about-content__title">{{ $t('about.stack') }}</h3>
      <p>{{ $t('about.stackText') }}</p>
    </section>

    <section class="about-content__section">
      <h3 class="about-content__title">{{ $t('about.roadmap') }}</h3>
      <p>{{ $t('about.roadmapText') }}</p>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.about-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  // The modal content is mono by default; long-form reading wants the body face.
  font-family: $font-family-base;
  color: var(--text-secondary);
  line-height: $line-height-relaxed;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__title {
    font-family: $font-family-display;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  &__lead {
    color: var(--text-muted);
  }

  // Numbered plates: the points are a list of decisions, and the numbers make a long section
  // scannable instead of a wall.
  &__points {
    display: flex;
    flex-direction: column;
    gap: $spacing-5;
    margin: $spacing-2 0 0;
    padding: 0;
    list-style: none;
    counter-reset: point;
  }

  &__point {
    position: relative;
    counter-increment: point;
    padding-left: $spacing-8;
  }

  &__point-title {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-1;
    font-family: $font-family-display;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);

    &::before {
      content: counter(point);
      position: absolute;
      left: 0;
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: $border-radius-full;
      background: var(--accent-subtle);
      color: var(--accent);
      font-family: $font-family-mono;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      line-height: 1;
    }
  }
}
</style>
