<template>
  <div class="captured-pieces">
    <img
      v-for="(piece, i) in pieces"
      :key="i"
      class="captured-pieces__piece"
      :src="getPieceImage(piece.color, piece.type, 'small')"
      :alt="`${piece.color} ${piece.type}`"
    />
  </div>
</template>

<script lang="ts" setup>
import {useChessTheme} from '@/composables/useChessTheme'
import type {CapturedPiece} from '@/engine/material'

defineProps<{ pieces: CapturedPiece[] }>()

const {getPieceImage} = useChessTheme()
</script>

<style lang="scss" scoped>
.captured-pieces {
  display: flex;
  align-items: center;
  min-height: 1rem;

  &__piece {
    width: 1rem;
    height: 1rem;
    object-fit: contain;

    // slight overlap to tighten the row
    &:not(:first-child) {
      margin-left: -3px;
    }
  }
}
</style>
