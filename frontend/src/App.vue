<template>
  <div id="app-main">
    <SuperTopBar />
    <RouterView />
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import SuperTopBar from '@/components/SuperTopBar.vue'
import AppFooter from '@/components/AppFooter.vue'

useTheme()
</script>

<style lang="scss">
#app-main {
  transition: background-color $transition-base;
}
</style>
