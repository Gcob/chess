<template>
  <span class="player-avatar">
    <span class="player-avatar__emoji">{{ emoji }}</span>
  </span>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {AVATARS} from '@/themes/avatars'

const props = defineProps<{ id: string }>()

const emoji = computed(() => AVATARS.find(a => a.id === props.id)?.emoji ?? '')
</script>

<style lang="scss" scoped>
.player-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  // size the emoji relative to whatever box the consumer gives us
  container-type: size;

  &__emoji {
    font-size: 75cqmin;
    line-height: 1;
  }
}
</style>
