<script setup lang="ts">
import { RouterView } from 'vue-router'
import SuperTopBar from '@/components/SuperTopBar.vue'
</script>

<template>
  <SuperTopBar />
  <RouterView />
</template>

<style lang="scss">
@use '@/assets/styles/variables' as *;

#app {
  min-height: 100vh;
}
</style>
