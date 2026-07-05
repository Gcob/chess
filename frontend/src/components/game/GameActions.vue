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

  // both buttons share the row, with a slimmer vertical padding than the default cButton
  :deep(.c-button) {
    flex: 1;
    padding-top: $spacing-2;
    padding-bottom: $spacing-2;
    font-size: 0.8rem;
  }
}
</style>
