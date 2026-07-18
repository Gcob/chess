<template>
  <!-- Interactive mode (click-to-move / touch): a backdrop swallows stray clicks — anywhere
       outside the slots cancels the pending move. Drag mode has no backdrop: the release
       decides, the picker is pure feedback. -->
  <div
    v-if="interactive"
    class="c-promotion-picker__backdrop"
    @click="$emit('cancel')"
    @contextmenu.prevent
  />

  <div class="c-promotion-picker" :class="{ 'c-promotion-picker--centered': centered }">
    <!-- Drag mode: the keep-open halo made visible — release inside keeps the ring, outside cancels. -->
    <div v-if="haloRadius" class="c-promotion-picker__halo" :style="haloStyle" />

    <button
      v-for="slot in slots"
      :key="slot.piece"
      type="button"
      class="c-promotion-picker__slot"
      :class="{ 'c-promotion-picker__slot--hovered': slot.piece === hovered }"
      :style="centered ? undefined : slotStyle(slot)"
      :disabled="!interactive"
      @click="$emit('pick', slot.piece)"
    >
      <img
        class="c-promotion-picker__img"
        :src="getPieceImage(color, slot.piece)"
        :alt="`${color} ${slot.piece}`"
        draggable="false"
      />
    </button>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {PieceColor, PieceType} from '@/types/chess'
import type {PromotionSlot} from '@/utils/promotionLayout'
import {useChessTheme} from '@/composables/useChessTheme'

// The promotion ring. Anchored mode: slots sit in absolute board coordinates (grid units from
// promotionSlotCenters — the queen on the promotion square itself). Centered mode (mobile
// pending choice): one fixed row of big touch targets over the board's center.
const props = defineProps<{
  slots: PromotionSlot[]
  color: PieceColor
  // Drag mode feedback: the slot the cursor is currently over.
  hovered?: PieceType | null
  // Pending-choice mode: slots are real buttons and a backdrop cancels. Drag mode: display only.
  interactive: boolean
  centered: boolean
  // Drag mode: the keep-open zone's radius (grid units) — rendered as a visible boundary.
  haloRadius?: number | null
}>()

defineEmits<{ pick: [piece: PieceType]; cancel: [] }>()

const {getPieceImage} = useChessTheme()

// % of the board: a grid unit is one square = 12.5%. The slot is square-sized, centered on
// its computed point.
function slotStyle(slot: PromotionSlot) {
  return {
    left: `${(slot.x - 0.5) * 12.5}%`,
    top: `${(slot.y - 0.5) * 12.5}%`,
  }
}

// The halo circle, centered on the anchor slot (the queen — always first).
const haloStyle = computed(() => {
  const radius = props.haloRadius
  const anchor = props.slots[0]
  if (!radius || !anchor) {
    return undefined
  }

  return {
    left: `${(anchor.x - radius) * 12.5}%`,
    top: `${(anchor.y - radius) * 12.5}%`,
    width: `${radius * 2 * 12.5}%`,
    height: `${radius * 2 * 12.5}%`,
  }
})
</script>

<style lang="scss">
.c-promotion-picker {
  position: absolute;
  inset: 0;
  z-index: 5;
  // The container is a pass-through layer; only the slots (and the backdrop) catch events.
  pointer-events: none;

  &__backdrop {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: rgba(0, 0, 0, 0.35);
  }

  // The ring's presence: a frosted grey disc softly blurring the board beneath — compact on
  // purpose (the satellites poke out), while the logical cancel zone stays wider around it.
  &__halo {
    position: absolute;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.35);
    backdrop-filter: blur(0.5px);
    animation: c-promotion-pop 0.12s ease-out;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }

  &__slot {
    position: absolute;
    width: 12.5%;
    height: 12.5%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: $border-width-base solid var(--border-color);
    border-radius: 50%;
    background: var(--bg-elevated);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    pointer-events: auto;
    cursor: pointer;
    animation: c-promotion-pop 0.12s ease-out;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }

    &:hover,
    &--hovered {
      border-color: var(--accent);
      // The accent is a translucent tint — layered OVER the elevated base, which stays opaque
      // so the board never shows through the slot.
      background-image: linear-gradient(var(--accent-subtle), var(--accent-subtle));
      // Composes under the sprite scale — the whole slot swells toward the cursor.
      scale: 1.12;
      // The swollen slot rides over its overlapping neighbours (the ring is deliberately tight).
      z-index: 1;
    }

    &:disabled {
      cursor: inherit;
    }
  }

  &__img {
    width: 82%;
    height: 82%;
    object-fit: contain;
    user-select: none;
    -webkit-user-select: none;
  }

  // Mobile pending choice: one centered row of big fixed targets, easy under any thumb.
  &--centered {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-3;

    .c-promotion-picker__slot {
      position: static;
      width: 18%;
      height: 18%;
    }
  }
}

@keyframes c-promotion-pop {
  from {
    scale: 0.6;
    opacity: 0;
  }
}
</style>
