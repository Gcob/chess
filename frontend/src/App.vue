<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import SuperTopBar from '@/components/SuperTopBar.vue'

useTheme()
</script>

<template>
  <div id="app-main">
    <SuperTopBar />
    <RouterView />
  </div>
</template>

<style lang="scss">
#app-main {
  transition: background-color $transition-base;
}
</style>
