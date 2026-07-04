<template>
  <div class="game-actions">
    <cButton variant="ter" @click="view.proposeDraw()">
      <Handshake :size="16" />
      {{ $t('game.actions.proposeDraw') }}
    </cButton>
    <cButton variant="ter" @click="onResign">
      <Flag :size="16" />
      {{ $t('game.actions.resign') }}
    </cButton>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {Handshake, Flag} from 'lucide-vue-next'
import type {GameView} from '@/composables/useGameView'

const props = defineProps<{ view: GameView }>()

const {t} = useI18n()

function onResign() {
  if (window.confirm(t('game.actions.resignConfirm'))) {
    props.view.resign()
  }
}
</script>

<style lang="scss" scoped>
.game-actions {
  display: flex;
  gap: $spacing-2;

  // both buttons share the row
  > * {
    flex: 1;
  }
}
</style>
