<template>
  <div v-if="settingsStore.settings.devMode" class="dev-panel">
    <div class="dev-panel__header">
      <FlaskConical :size="14" />
      {{ $t('game.dev.title') }}
    </div>

    <div class="dev-panel__body">
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
        <cButton variant="ter" @click="copyPgn">
          <ClipboardCopy :size="16" />
          {{ $t('game.dev.copyPgn') }}
        </cButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useRoute, useRouter} from 'vue-router'
import {ClipboardCopy, FlaskConical, RotateCcw} from 'lucide-vue-next'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {useNewGameStore} from '@/stores/useNewGameStore'
import {useGamesStore} from '@/stores/useGamesStore'
import {useGameLauncher} from '@/composables/useGameLauncher'
import {buildPgn} from '@/engine/pgn'
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

// Dev QA affordance: the current game as PGN, ready to paste into Lichess/chess.com to
// verify the round-trip. Clipboard failure is swallowed — this is dev tooling.
async function copyPgn() {
  const session = gamesStore.get(String(route.params.id ?? ''))
  if (!session) {
    return
  }

  await navigator.clipboard.writeText(buildPgn(session.game))
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
// Dressed like the move-history panel — the sidebar speaks one visual language.
.dev-panel {
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border: $border-width-base solid var(--border-color);
  border-radius: $border-radius-base;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: var(--text-secondary);
    border-bottom: $border-width-thin solid var(--border-color);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    padding: $spacing-3;
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    :deep(.c-button) {
      font-size: 0.8rem;
    }
  }
}
</style>
