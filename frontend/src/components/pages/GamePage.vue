<template>
  <main id="game-page" class="c-page">
    <cBoard v-if="game" :board="game.board" />
  </main>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { useGameSession } from '@/composables/useGameSession'
import cBoard from '@/components/chess/cBoard.vue'

const route = useRoute()
const { game } = useGameSession(Number(route.params.id))
</script>
