<template>
  <main id="game-page" class="c-page">
    <cBoard v-if="game" :board="game.board" :size="boardSize"/>
  </main>
</template>

<script lang="ts" setup>
import {computed} from 'vue'
import {useRoute} from 'vue-router'
import {useGameSession} from '@/composables/useGameSession'
import cBoard from '@/components/chess/cBoard.vue'

const route = useRoute()
const {game} = useGameSession(Number(route.params.id))

// Fits the board in the available viewport, capped at 640px
const boardSize = computed(() => Math.min(window.innerWidth, window.innerHeight, 640) * 0.85)
</script>
