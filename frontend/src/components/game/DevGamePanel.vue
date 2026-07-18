<template>
  <div v-if="settingsStore.settings.devMode" class="dev-panel">
    <h2 class="c-h4 dev-panel__title">
      <FlaskConical :size="16" />
      {{ $t('game.dev.title') }}
    </h2>

    <label class="c-label">
      <span>{{ $t('newGame.scenario.label') }}</span>
      <select class="c-select" v-model="newGameStore.settings.scenarioId">
        <option v-for="scenario in DEV_SCENARIOS" :key="scenario.id" :value="scenario.id">
          {{ scenario.name }}
        </option>
      </select>
    </label>

    <div class="dev-panel__buttons">
      <cButton variant="ter" :to="{ name: 'new-game' }">{{ $t('game.dev.editSetup') }}</cButton>
      <cButton variant="ter" @click="restart">
        <RotateCcw :size="16" />
        {{ $t('game.dev.restart') }}
      </cButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router'
import {FlaskConical, RotateCcw} from 'lucide-vue-next'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {useGamesStore} from '@/stores/useGamesStore'
import {useGameLauncher} from '@/composables/useGameLauncher'
import {DEV_SCENARIOS} from '@/dev/scenarios'

// In-game dev tooling: reseed a fresh game with a QA scenario without leaving the game page.
// Viewer tooling gated by the devMode setting — the game DTO never knows it exists.
const settingsStore = useSettingsStore()
const newGameStore = useNewGameStore()
const gamesStore = useGamesStore()
const route = useRoute()
const router = useRouter()
const {launch} = useGameLauncher()

// The panel may show over a game launched without a scenario — settle a valid default once.
if (!DEV_SCENARIOS.some(scenario => scenario.id === newGameStore.settings.scenarioId)) {
  newGameStore.settings.scenarioId = DEV_SCENARIOS[0]!.id
}

// Restarting from here IS choosing the dev mode — the persisted form follows along.
async function restart() {
  newGameStore.settings.mode = 'dev'
  const previousId = String(route.params.id ?? '')
  const session = launch()
  await router.replace({name: 'game', params: {id: session.id}})
  gamesStore.close(previousId)
}
</script>

<style lang="scss" scoped>
.dev-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-3;

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__buttons {
    display: flex;
    gap: $spacing-2;

    :deep(.c-button) {
      flex: 1;
      padding: $spacing-2 $spacing-1;
      font-size: 0.8rem;
    }
  }
}
</style>
