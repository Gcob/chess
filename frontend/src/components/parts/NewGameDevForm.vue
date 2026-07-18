<template>
  <section class="scenario-section">
    <h2 class="c-h4">{{ $t('newGame.scenario.title') }}</h2>
    <label class="c-label">
      <span>{{ $t('newGame.scenario.label') }}</span>
      <select class="c-select" v-model="settings.scenarioId">
        <option v-for="scenario in DEV_SCENARIOS" :key="scenario.id" :value="scenario.id">
          {{ scenario.name }}
        </option>
      </select>
    </label>
    <p v-if="selectedScenario" class="scenario-section__desc">{{ selectedScenario.description }}</p>
  </section>

  <NewGamePlayersSection ref="playersSection" :settings="settings" />
  <NewGameTimerSection :settings="settings" />
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'
import {DEV_SCENARIOS} from '@/dev/scenarios'
import NewGamePlayersSection from '@/components/parts/NewGamePlayersSection.vue'
import NewGameTimerSection from '@/components/parts/NewGameTimerSection.vue'
import type {NewGameSettings} from '@/stores/useNewGameStore'

// Strategy form for the 'dev' FORM mode: a local game seeded by a QA scenario (replayed move
// list — the created game is a genuine local game). Same contract as every mode form: one
// `settings` DTO prop + an exposed `validate()`. Multi-root on purpose, like the local form.
const props = defineProps<{ settings: NewGameSettings }>()

// A dev game always has a scenario — default the selection instead of validating it.
if (!DEV_SCENARIOS.some(scenario => scenario.id === props.settings.scenarioId)) {
  props.settings.scenarioId = DEV_SCENARIOS[0]!.id
}

const selectedScenario = computed(() =>
  DEV_SCENARIOS.find(scenario => scenario.id === props.settings.scenarioId),
)

const playersSection = ref<InstanceType<typeof NewGamePlayersSection> | null>(null)

function validate(): boolean {
  return playersSection.value?.validate() ?? false
}

defineExpose({validate})
</script>

<style lang="scss" scoped>
.scenario-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__desc {
    margin: 0;
    font-size: $font-size-xs;
    color: var(--text-muted);
    line-height: $line-height-base;
  }
}
</style>
