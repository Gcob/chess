<template>
  <div class="c-square" :style="{ background: squareBackground }" />
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import type {Square} from '@/types/chess'
import {useChessTheme} from '@/composables/useChessTheme'

// A square is now purely the board background and a click/drop target.
// Pieces live in cBoard's absolute overlay so they can animate across squares.
const props = defineProps<{ square: Square }>()

const {boardTheme} = useChessTheme()

const squareBackground = computed(() =>
  props.square.color === 'light' ? boardTheme.value?.lightSquare : boardTheme.value?.darkSquare,
)
</script>

<style lang="scss">
.c-square {
  // fills its grid cell exactly — size is driven by cBoard
  width: 100%;
  height: 100%;
}
</style>
