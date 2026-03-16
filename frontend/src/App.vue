<template>
  <div id="app-main">
    <SuperTopBar />
    <RouterView />
    <AppFooter v-if="!route.meta.hideFooter" />
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import SuperTopBar from '@/components/SuperTopBar.vue'
import AppFooter from '@/components/AppFooter.vue'

useTheme()

const route = useRoute()
</script>

<style lang="scss">
#app-main {
  transition: background-color $transition-base;
}
</style>
