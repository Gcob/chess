<template>
  <section class="chess-hero">
    <div class="chess-hero__image-wrap">
      <img
        src="@/assets/images/chess-knight.png"
        alt="Low-poly chess knight"
        class="chess-hero__image"
      />
      <div class="chess-hero__glow" aria-hidden="true" />
    </div>

    <div class="chess-hero__text">
      <h1 class="chess-hero__title">{{ $t('app.title') }}</h1>
    </div>
  </section>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
.chess-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-6;
  padding: $spacing-8 $spacing-4;
  width: 100%;
  max-width: 400px;
}

.chess-hero__image-wrap {
  position: relative;
  width: 200px;
  height: 200px;

  @include sm {
    width: 300px;
    height: 300px;
  }
}

.chess-hero__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 4px 24px rgba(74, 158, 221, 0.3));
  transition: transform $transition-base, filter $transition-base;
}

.chess-hero__glow {
  position: absolute;
  inset: 10%;
  border-radius: $border-radius-full;
  background: radial-gradient(
      circle,
      rgba(74, 158, 221, 0.15) 0%,
      transparent 70%
  );
  filter: blur(30px);
  z-index: 0;
  transition: opacity $transition-base;
}

:global([data-theme="light"]) .chess-hero__glow {
  background: radial-gradient(
      circle,
      rgba(74, 158, 221, 0.10) 0%,
      transparent 70%
  );
}

.chess-hero__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-2;
  text-align: center;
}

.chess-hero__title {
  font-family: $font-family-display;
  font-size: clamp(2rem, 8vw, 3.2rem);
  font-weight: $font-weight-bold;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

.chess-hero__subtitle {
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

.chess-hero__actions {
  margin-top: $spacing-2;
}

@media (prefers-reduced-motion: reduce) {
  .chess-hero__image {
    transition: none;
  }
}
</style>
