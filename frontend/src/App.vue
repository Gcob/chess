<script setup lang="ts">
import {RouterView} from 'vue-router'
import SuperTopBar from '@/components/SuperTopBar.vue'
</script>

<template>
  <div id="app-main">
    <SuperTopBar/>
    <RouterView/>
  </div>
</template>

<style lang="scss">
@use '@/assets/styles/variables' as *;


</style>
