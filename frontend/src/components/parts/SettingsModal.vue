<template>
  <cModal :model-value="modelValue" size="sm"
          @update:model-value="$emit('update:modelValue', $event)">
    <template #header>{{ $t('settings.title') }}</template>

    <div class="settings-modal">
      <label class="c-label">
        <span>{{ $t('settings.boardTheme') }}</span>
        <select class="c-select" v-model="store.settings.boardThemeId">
          <option v-for="opt in boardThemeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>

      <label class="c-label">
        <span>{{ $t('settings.pieceStyle') }}</span>
        <select class="c-select" v-model="store.settings.pieceThemeId">
          <option v-for="opt in pieceThemeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
    </div>

    <template #footer="{ close }">
      <cButton variant="ter" @click="close">{{ $t('common.close') }}</cButton>
    </template>
  </cModal>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useSettingsStore} from '@/stores/useSettingsStore'
import {BoardThemes, PieceThemes} from '@/types/look-and-feel'
import {enumToOptions} from '@/utils/enumOptions'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useSettingsStore()
const {t} = useI18n()

const boardThemeOptions = computed(() => enumToOptions(BoardThemes, 'settings.boardThemes', t as (key: string) => string))
const pieceThemeOptions = computed(() => enumToOptions(PieceThemes, 'settings.pieceThemes', t as (key: string) => string))
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
}
</style>
