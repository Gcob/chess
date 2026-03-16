<template>
  <section class="chess-hero">

    <div class="chess-hero__header">
      <h1
        class="chess-hero__title"
        :aria-label="$t('app.title')"
        :data-text="$t('app.title').toUpperCase()"
      >{{ $t('app.title').toUpperCase() }}</h1>
      <p class="chess-hero__subtitle">v0.1.0</p>
    </div>

    <div class="chess-hero__board-container">
      <div class="chess-hero__coords chess-hero__coords--files">
        <span></span>
        <span v-for="file in FILES" :key="file">{{ file }}</span>
        <span></span>
      </div>

      <div class="chess-hero__board-row">
        <div class="chess-hero__coords chess-hero__coords--ranks">
          <span v-for="rank in RANKS" :key="`l-${rank}`">{{ rank }}</span>
        </div>

        <div class="chess-hero__board" role="img" aria-label="Chess board in starting position">
          <div
            v-for="(cell, index) in cells"
            :key="index"
            class="chess-hero__cell"
            :class="{ 'chess-hero__cell--light': cell.isLight }"
          >
            <span
              v-if="cell.piece"
              class="chess-hero__piece"
              :class="cell.isWhitePiece ? 'chess-hero__piece--white' : 'chess-hero__piece--black'"
              :style="{ animationDelay: `${cell.delay}ms` }"
              aria-hidden="true"
            >{{ cell.piece }}</span>
          </div>
        </div>

        <div class="chess-hero__coords chess-hero__coords--ranks">
          <span v-for="rank in RANKS" :key="`r-${rank}`">{{ rank }}</span>
        </div>
      </div>

      <div class="chess-hero__coords chess-hero__coords--files">
        <span></span>
        <span v-for="file in FILES" :key="file">{{ file }}</span>
        <span></span>
      </div>

      <div class="chess-hero__scanline" aria-hidden="true" />
    </div>

  </section>
</template>

<script lang="ts" setup>
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

const STARTING_POSITION: (string | null)[][] = [
  ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
  ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
  ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'],
]

const WHITE_PIECES = new Set(['♔', '♕', '♖', '♗', '♘', '♙'])

interface Cell {
  piece: string | null
  isLight: boolean
  isWhitePiece: boolean
  delay: number
}

let pieceIndex = 0
const cells: Cell[] = []
for (let rank = 0; rank < 8; rank++) {
  for (let file = 0; file < 8; file++) {
    const piece = STARTING_POSITION[rank][file]
    cells.push({
      piece,
      isLight: (rank + file) % 2 === 0,
      isWhitePiece: piece !== null && WHITE_PIECES.has(piece),
      delay: piece !== null ? pieceIndex++ * 40 : 0,
    })
  }
}
</script>

<style lang="scss" scoped>
.chess-hero {
  // Phosphore green tokens — self-contained, always dark
  --ph: #00ff41;
  --ph-dim: rgba(0, 255, 65, 0.75);
  --ph-muted: rgba(0, 255, 65, 0.42);
  --ph-subtle: rgba(0, 255, 65, 0.14);
  --ph-faint: rgba(0, 255, 65, 0.05);
  --ph-glow: rgba(0, 255, 65, 0.35);
  --ph-bg: #020d02;
  --coord-size: 14px;
  --cell-size: 38px;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-6;
  padding: $spacing-8 $spacing-4;
  width: 100%;

  @include breakpoint-down($breakpoint-sm) {
    --cell-size: 30px;
    gap: $spacing-4;
    padding: $spacing-6 $spacing-3;
  }
}

// Light mode: dial down glow slightly, board sits on its own dark island
:global([data-theme="light"]) .chess-hero {
  --ph: #00dd37;
  --ph-dim: rgba(0, 221, 55, 0.72);
  --ph-muted: rgba(0, 221, 55, 0.40);
  --ph-subtle: rgba(0, 221, 55, 0.13);
  --ph-faint: rgba(0, 221, 55, 0.05);
  --ph-glow: rgba(0, 221, 55, 0.28);
  --ph-bg: #010b01;
}

// ─── Header ───────────────────────────────────────────────────────────────────

.chess-hero__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-2;
}

.chess-hero__title {
  position: relative;
  font-family: $font-family-display;
  font-size: clamp(3rem, 10vw, 5rem);
  font-weight: $font-weight-bold;
  letter-spacing: 0.18em;
  color: var(--ph);
  text-shadow:
    0 0 12px var(--ph-glow),
    0 0 30px rgba(0, 255, 65, 0.15);
  user-select: none;

  // Glitch ghost layers — invisible by default, flash briefly
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute;
    inset: 0;
  }

  &::before {
    color: rgba(0, 220, 255, 0.75);
    animation: glitch-1 5s infinite steps(1);
  }

  &::after {
    color: rgba(255, 30, 90, 0.6);
    animation: glitch-2 5s 1.4s infinite steps(1);
  }
}

.chess-hero__subtitle {
  font-family: $font-family-mono;
  font-size: $font-size-xs;
  letter-spacing: 0.14em;
  color: var(--ph-muted);
}

// ─── Board container ──────────────────────────────────────────────────────────

.chess-hero__board-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chess-hero__board-row {
  display: flex;
  align-items: stretch;
}

// ─── Coordinates ──────────────────────────────────────────────────────────────

.chess-hero__coords {
  font-family: $font-family-mono;
  font-size: 0.6rem;
  color: var(--ph-muted);

  &--files {
    display: grid;
    // Spacer columns match rank coord width so letters align with board columns
    grid-template-columns: var(--coord-size) repeat(8, var(--cell-size)) var(--coord-size);
    place-items: center;
    height: var(--coord-size);
  }

  &--ranks {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    width: var(--coord-size);
  }
}

// ─── Board ────────────────────────────────────────────────────────────────────

.chess-hero__board {
  display: grid;
  grid-template-columns: repeat(8, var(--cell-size));
  grid-template-rows: repeat(8, var(--cell-size));
  border: 1px solid var(--ph-subtle);
  box-shadow:
    0 0 24px rgba(0, 255, 65, 0.06),
    inset 0 0 40px rgba(0, 0, 0, 0.6);
}

.chess-hero__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ph-faint);

  &--light {
    background-color: var(--ph-subtle);
  }
}

.chess-hero__piece {
  font-size: calc(var(--cell-size) * 0.62);
  line-height: 1;
  opacity: 0;
  animation: piece-appear 280ms ease forwards;
  user-select: none;

  &--white {
    color: var(--ph);
    filter: drop-shadow(0 0 4px var(--ph-glow));
  }

  &--black {
    color: var(--ph-muted);
  }
}

// ─── Scanline overlay ─────────────────────────────────────────────────────────

.chess-hero__scanline {
  @include absolute-fill;
  pointer-events: none;

  // Static scanlines
  background: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.09) 2px,
    rgba(0, 0, 0, 0.09) 4px
  );

  // Moving phosphore band
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 17%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 255, 65, 0.04) 50%,
      transparent 100%
    );
    animation: scanline-scroll 5s linear infinite;
  }
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

.chess-hero__terminal {
  display: flex;
  align-items: center;
  gap: 2px;
  font-family: $font-family-mono;
  font-size: $font-size-sm;
  color: var(--ph-dim);

  @include breakpoint-down($breakpoint-sm) {
    font-size: $font-size-xs;
  }
}

.chess-hero__cursor {
  color: var(--ph);
  animation: cursor-blink 1s step-end infinite;
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

// Glitch ghost: invisible most of the time, fires briefly every ~5s
@keyframes glitch-1 {
  0%, 90%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
  91%           { clip-path: inset(10% 0 65% 0); transform: translate(-4px, 0); }
  93%           { clip-path: inset(60% 0 15% 0); transform: translate(3px, 0); }
  95%           { clip-path: inset(30% 0 45% 0); transform: translate(-3px, 0); }
  97%           { clip-path: inset(75% 0 5%  0); transform: translate(4px, 0); }
  99%           { clip-path: inset(5%  0 80% 0); transform: translate(-2px, 0); }
}

@keyframes glitch-2 {
  0%, 85%, 100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
  86%           { clip-path: inset(80% 0 5%  0); transform: translate(3px, 0); }
  88%           { clip-path: inset(20% 0 65% 0); transform: translate(-4px, 0); }
  90%           { clip-path: inset(45% 0 40% 0); transform: translate(3px, 0); }
  92%           { clip-path: inset(5%  0 85% 0); transform: translate(-2px, 0); }
  94%           { clip-path: inset(55% 0 30% 0); transform: translate(4px, 0); }
}

@keyframes piece-appear {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}

@keyframes scanline-scroll {
  from { transform: translateY(-100%); }
  to   { transform: translateY(500%); }
}

// ─── Prefers reduced motion ───────────────────────────────────────────────────

@media (prefers-reduced-motion: reduce) {
  .chess-hero__title {
    &::before,
    &::after {
      animation: none;
      clip-path: inset(0 0 100% 0);
    }
  }

  .chess-hero__piece {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .chess-hero__cursor {
    animation: none;
  }

  .chess-hero__scanline::after {
    animation: none;
  }
}
</style>
