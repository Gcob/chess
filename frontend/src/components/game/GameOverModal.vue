<template>
  <cModal
    :model-value="view.resultOpen"
    size="sm"
    flush
    @update:model-value="view.hideResult()"
  >
    <div class="game-over" :class="{ 'game-over--draw': isDraw }">
      <button class="game-over__close" :aria-label="$t('common.close')" @click="view.hideResult()">
        <X :size="16" />
      </button>

      <!-- Celebration is for a winner. A draw renders none of it: no rays, no halo, no
           sparkles — just the two players and what happened. -->
      <div v-if="winner" class="game-over__fx" aria-hidden="true">
        <span class="game-over__rays" />
        <span class="game-over__halo" />
        <span
          v-for="spark in sparkles"
          :key="spark.id"
          class="game-over__sparkle"
          :style="spark.style"
        />
      </div>

      <!-- A win crowns someone: rotating ring, glint, shimmering name. A draw crowns nobody,
           so both avatars simply sit side by side. The ending's emoji stays in the badge, and
           only there — showing it twice on one screen read as a glitch. -->
      <div v-if="winner" class="game-over__winner">
        <span class="game-over__ring" />
        <span class="game-over__disc">
          <PlayerAvatar v-if="winner.metas.image" :id="winner.metas.image" />
          <span class="game-over__glint" />
        </span>
      </div>

      <div v-else class="game-over__pair">
        <span class="game-over__face">
          <PlayerAvatar v-if="drawAvatars.white" :id="drawAvatars.white" />
        </span>
        <span class="game-over__face">
          <PlayerAvatar v-if="drawAvatars.black" :id="drawAvatars.black" />
        </span>
      </div>

      <h2 class="game-over__title" :class="{ 'game-over__title--shine': !!winner }">
        {{ title }}
      </h2>

      <p v-if="reasonLabel" class="game-over__badge" :class="{ 'game-over__badge--plain': isDraw }">
        <span aria-hidden="true">{{ emoji }}</span>
        {{ reasonLabel }}
      </p>

      <p class="game-over__kind">
        <span>{{ headline }}</span>
        <span>{{ subline }}</span>
      </p>

      <div class="game-over__actions">
        <cButton variant="ter" @click="emit('home')">{{ $t('common.backHome') }}</cButton>
        <cButton @click="emit('rematch')">
          <Swords :size="16" />
          {{ $t('game.over.rematch') }}
        </cButton>
      </div>
    </div>
  </cModal>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {Swords, X} from 'lucide-vue-next'
import type {GameView} from '@/composables/useGameView'
import {GAME_END_EMOJI} from '@/themes/gameEnd'
import PlayerAvatar from '@/components/parts/PlayerAvatar.vue'

// Vertical anchor of the aura: the avatar's centre. Defined ONCE in the stylesheet as
// --aura-center (top padding + half the avatar) and read back here, so moving the avatar can
// never leave the rays and sparkles orbiting the wrong point.
const AURA_CENTER = 'var(--aura-center)'

const props = defineProps<{ view: GameView }>()

const emit = defineEmits<{ home: []; rematch: [] }>()

const {t} = useI18n()

const result = computed(() => props.view.game?.result ?? null)
const isDraw = computed(() => !result.value?.winner)
const winner = computed(() => {
  const color = result.value?.winner
  return color ? props.view.game?.players[color] : undefined
})

const emoji = computed(() => (result.value ? GAME_END_EMOJI[result.value.reason] : ''))
const reasonLabel = computed(() => (result.value ? t(`game.state.reason.${result.value.reason}`) : ''))

// Both faces, in board order — only ever rendered on a draw.
const drawAvatars = computed(() => ({
  white: props.view.whitePlayer?.metas.image,
  black: props.view.blackPlayer?.metas.image,
}))

const title = computed(() =>
  winner.value
    ? t('game.over.winner', {name: winner.value.metas.name})
    : t('game.over.draw'),
)

// First line under the title: who took it, or what kind of draw this was. On a checkmate whose
// author is unambiguous (see matingPiece in engine/game.ts), the piece and its square are folded
// into that same sentence rather than tacked on as a separate fragment.
const headline = computed(() => {
  const res = result.value
  if (!res) {
    return ''
  }

  if (!res.winner) {
    return t(`game.over.drawKind.${res.reason}`)
  }

  const mate = props.view.mateBy
  if (!mate) {
    return t(`game.over.winnerColor.${res.winner}`)
  }

  return t(`game.over.winnerColorMate.${res.winner}`, {
    piece: t(`game.over.mateByPiece.${mate.pieceType}`),
    square: mate.square,
  })
})

// Second line: the loser is saluted, never diminished — a draw salutes both.
const subline = computed(() => {
  const color = result.value?.winner
  if (!color) {
    return t('game.over.drawBoth')
  }

  const loser = props.view.game?.players[color === 'white' ? 'black' : 'white']
  return loser ? t('game.over.loser', {name: loser.metas.name}) : ''
})

// Sparkle positions are decorative noise, in a crown around the winner's avatar. Only ever
// evaluated on a victory — the whole effect layer is absent from a draw.
const SPARKLE_COUNT = 11

const sparkles = computed(() =>
  Array.from({length: SPARKLE_COUNT}, (_, i) => {
    const angle = (i / SPARKLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const distance = 64 + Math.random() * 66
    return {
      id: i,
      style: {
        left: `calc(50% + ${Math.cos(angle) * distance}px)`,
        top: `calc(${AURA_CENTER} + ${Math.sin(angle) * distance * 0.8}px)`,
        '--sparkle-size': `${8 + Math.random() * 7}px`,
        '--sparkle-delay': `${Math.random() * 2.2}s`,
      },
    }
  }),
)
</script>

<style lang="scss" scoped>
// The avatar's box and the space above it — the aura's geometry derives from these two.
$avatar-size: 5.75rem;
$avatar-top: 4rem;

.game-over {
  // Single source of truth for where the aura is centred: consumed by the rays and the halo
  // below, and read from the script to place the sparkles.
  --aura-center: calc(#{$avatar-top} + #{$avatar-size} / 2);

  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-2;
  padding: $avatar-top $spacing-6 $spacing-5;
  overflow: hidden;
  // cModal's wrapper rounds its corners but does not clip — with flush content, the effect
  // layer reaches the edges, so the rounding has to be honoured right here.
  border-radius: $border-radius-base;
  text-align: center;
  // cModal's content is mono by default; the celebration speaks in the display voice.
  font-family: $font-family-base;
  // New stacking context so the effect layer can never escape above the modal chrome.
  isolation: isolate;

  &__close {
    position: absolute;
    top: $spacing-2;
    right: $spacing-2;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: $border-radius-full;
    color: var(--text-muted);
    transition: all $transition-fast;

    &:hover {
      background-color: var(--bg-hover);
      color: var(--text-primary);
    }
  }

  // ─── Effect layer ──────────────────────────────────────────────────────────

  &__fx {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__rays {
    position: absolute;
    top: var(--aura-center);
    left: 50%;
    width: 32.5rem;
    height: 32.5rem;
    margin: -16.25rem 0 0 -16.25rem;
    background: repeating-conic-gradient(
        from 0deg,
        var(--celebrate-rays) 0deg 7deg,
        transparent 7deg 20deg
    );
    // Hollows out the middle so the avatar sits on clean background, then fades the rays out
    // before the modal edges. Now that the content is flush, they reach much further out.
    -webkit-mask-image: radial-gradient(circle, #000 8%, transparent 70%);
    mask-image: radial-gradient(circle, #000 8%, transparent 70%);
    animation: rays-spin 16s linear infinite;
  }

  &__halo {
    position: absolute;
    top: var(--aura-center);
    left: 50%;
    width: 11rem;
    height: 11rem;
    margin: -5.5rem 0 0 -5.5rem;
    border-radius: $border-radius-full;
    background: radial-gradient(circle, var(--celebrate-halo), transparent 70%);
    animation: halo-pulse 2.8s ease-in-out infinite;
  }

  &__sparkle {
    position: absolute;
    width: var(--sparkle-size);
    height: var(--sparkle-size);
    background: var(--celebrate-spark);
    clip-path: polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%);
    opacity: 0;
    animation: sparkle-pop 2.4s ease-in-out infinite;
    animation-delay: var(--sparkle-delay);
  }

  // ─── The winner ────────────────────────────────────────────────────────────

  &__winner {
    position: relative;
    z-index: 3;
    width: $avatar-size;
    height: $avatar-size;
  }

  // A conic sweep masked down to a thin ring — the gold that runs around the avatar.
  &__ring {
    position: absolute;
    inset: -0.375rem;
    border-radius: $border-radius-full;
    background: conic-gradient(
        from 0deg,
        transparent 0deg,
        var(--celebrate-gold) 45deg,
        var(--celebrate-glint) 75deg,
        var(--celebrate-gold) 105deg,
        transparent 180deg,
        transparent 360deg
    );
    -webkit-mask-image: radial-gradient(circle, transparent 85%, #000 87%);
    mask-image: radial-gradient(circle, transparent 85%, #000 87%);
    animation: ring-spin 3s linear infinite;
  }

  &__disc {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: $border-width-base solid color-mix(in srgb, var(--celebrate-gold) 40%, transparent);
    border-radius: $border-radius-full;
    // A faint gold wash so the sweep below has something to catch on in both themes.
    background: color-mix(in srgb, var(--celebrate-gold) 8%, var(--modal-bg));
  }

  &__glint {
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 38%, var(--celebrate-glint) 50%, transparent 62%);
    transform: translateX(-170%);
    animation: glint 4s ease-in-out infinite;
  }

  // ─── The draw pair ─────────────────────────────────────────────────────────

  &__pair {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__face {
    display: flex;
    width: 4rem;
    height: 4rem;
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-full;
    background: var(--modal-bg);
  }

  // ─── Copy ──────────────────────────────────────────────────────────────────

  &__title {
    position: relative;
    z-index: 3;
    margin-top: $spacing-1;
    font-family: $font-family-display;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    color: var(--text-primary);
  }

  // A gold highlight travelling across the winner's name.
  &__title--shine {
    background: linear-gradient(
        100deg,
        var(--text-primary) 32%,
        var(--celebrate-gold) 46%,
        color-mix(in srgb, var(--celebrate-gold) 40%, white) 50%,
        var(--celebrate-gold) 54%,
        var(--text-primary) 68%
    );
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  &__badge {
    position: relative;
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-1 $spacing-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: var(--celebrate-gold);
    border: $border-width-thin solid color-mix(in srgb, var(--celebrate-gold) 35%, transparent);
    border-radius: $border-radius-full;
    // Opaque, not translucent: the rays passing behind the reason made it hard to read.
    background: color-mix(in srgb, var(--celebrate-gold) 8%, var(--modal-bg));

    &--plain {
      color: var(--text-secondary);
      border-color: var(--border-color);
      background: var(--modal-bg);
    }
  }

  &__kind {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    font-size: $font-size-sm;
    line-height: $line-height-relaxed;
    color: var(--text-secondary);
  }

  &__actions {
    position: relative;
    z-index: 3;
    display: flex;
    gap: $spacing-3;
    width: 100%;
    margin-top: $spacing-4;

    :deep(.c-button) {
      flex: 1;
    }

    // The tertiary variant is transparent by design, which lets the rays run behind its label.
    // Give it the modal's own background so it reads as a solid button here.
    :deep(.c-button--ter) {
      background-color: var(--modal-bg);

      // --bg-hover is a translucent veil: reusing it would bring the rays straight back on
      // hover. This is its opaque equivalent — it darkens in light, lightens in dark, exactly
      // like the veil does, because --text-primary flips with the theme.
      &:hover:not(.c-button--disabled) {
        background-color: color-mix(in srgb, var(--text-primary) 6%, var(--modal-bg));
      }
    }
  }

  // The generous top space exists to let the rays breathe. With no rays, it is just a hole.
  &--draw {
    padding-top: $spacing-8;
  }
}

@keyframes rays-spin {
  to { transform: rotate(360deg); }
}

@keyframes halo-pulse {
  0%, 100% { transform: scale(0.92); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}

@keyframes sparkle-pop {
  0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1) rotate(90deg); opacity: 1; }
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

@keyframes glint {
  0%, 60% { transform: translateX(-170%); }
  80%, 100% { transform: translateX(170%); }
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -100% 0; }
}

// The celebration is decoration: every moving part stops, everything readable stays. The
// shimmering title must fall back to a painted colour, or the winner's name stays transparent.
@media (prefers-reduced-motion: reduce) {
  .game-over {
    &__rays,
    &__halo,
    &__sparkle,
    &__ring,
    &__glint,
    &__title--shine {
      animation: none;
    }

    &__sparkle {
      opacity: 0.9;
      transform: scale(1);
    }

    &__glint {
      opacity: 0;
    }

    &__title--shine {
      -webkit-text-fill-color: var(--text-primary);
    }
  }
}
</style>
