<template>
  <div class="players-panel">
    <PlayerCard :view="view" :color="view.topColor" />
    <PlayerCard :view="view" :color="view.bottomColor" />
  </div>
</template>

<script lang="ts" setup>
import type {GameView} from '@/composables/useGameView'
import PlayerCard from '@/components/game/PlayerCard.vue'

// Both players grouped at the top; ordered by orientation (top-of-board color first) so they
// still follow the board rotation.
defineProps<{ view: GameView }>()
</script>

<style lang="scss" scoped>
.players-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
}
</style>
