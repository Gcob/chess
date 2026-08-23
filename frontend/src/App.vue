<template>
  <div id="app-main">
    <SuperTopBar />
    <!-- Keyed on the path so a same-route param change (game/:a → game/:b) remounts the page —
         pages read their params once at setup. -->
    <RouterView :key="$route.path" />
    <AppFooter />
    <Analytics :before-send="beforeSend" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Analytics } from '@vercel/analytics/vue'
import { createPageviewDedupe } from '@/utils/analyticsDedupe'
import { useTheme } from '@/composables/useTheme'
import SuperTopBar from '@/components/SuperTopBar.vue'
import AppFooter from '@/components/AppFooter.vue'

useTheme()

const beforeSend = createPageviewDedupe()
</script>

<style lang="scss">
#app-main {
  transition: background-color $transition-base;
}
</style>
