<template>
  <!-- Everything here acts on the live game — nothing to offer once it's finished. -->
  <div v-if="!view.isGameOver" class="game-actions">
    <template v-if="view.drawOffer">
      <div class="game-actions__offer">
        <span class="game-actions__offer-label">{{ $t(`game.actions.drawOfferedBy.${view.drawOffer}`) }}</span>
        <div class="game-actions__buttons">
          <cButton variant="ter" @click="view.acceptDraw()">
            <Check :size="16" />
            {{ $t('game.actions.acceptDraw') }}
          </cButton>
          <cButton variant="ter" @click="view.declineDraw()">
            <X :size="16" />
            {{ $t('game.actions.declineDraw') }}
          </cButton>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="game-actions__buttons">
        <cButton variant="ter" @click="view.offerDraw()">
          <Handshake :size="16" />
          {{ $t('game.actions.offerDraw') }}
        </cButton>
        <cButton variant="ter" @click="onResign">
          <Flag :size="16" />
          {{ $t('game.actions.resign') }}
        </cButton>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n'
import {Handshake, Flag, Check, X} from 'lucide-vue-next'
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
  &__buttons {
    display: flex;
    gap: $spacing-2;
  }

  &__offer {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__offer-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-secondary);
    text-align: center;
  }

  // both buttons share the row, with a slimmer vertical padding than the default cButton
  :deep(.c-button) {
    flex: 1;
    padding: $spacing-2 $spacing-1;
    font-size: 0.8rem;
  }
}
</style>
