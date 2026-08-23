<template>
  <div id="app-main">
    <SuperTopBar />
    <!-- Keyed on the path so a same-route param change (game/:a → game/:b) remounts the page —
         pages read their params once at setup. -->
    <RouterView :key="$route.path" />
    <AppFooter />
    <Analytics />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
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
