<template>
  <span class="player-avatar" v-html="svg" />
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {AVATARS} from '@/themes/avatars'

// Renders a placeholder avatar by id. The SVG markup is static and trusted (no user input),
// so v-html is safe here.
const props = defineProps<{ id: string }>()

const svg = computed(() => AVATARS.find(a => a.id === props.id)?.svg ?? '')
</script>

<style lang="scss" scoped>
.player-avatar {
  display: inline-flex;
  width: 100%;
  height: 100%;

  :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
