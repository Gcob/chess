<template>
  <cModal :model-value="modelValue" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>{{ $t('settings.title') }}</template>

    <div class="settings-modal">
      <label class="c-label">
        <span>{{ $t('settings.sound') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="store.settings.sound" />
      </label>

      <label class="c-label">
        <span>{{ $t('settings.boardTheme') }}</span>
        <select class="c-select" v-model="store.settings.boardTheme">
          <option value="classic">{{ $t('settings.boardThemeClassic') }}</option>
          <option value="modern">{{ $t('settings.boardThemeModern') }}</option>
          <option value="wood">{{ $t('settings.boardThemeWood') }}</option>
        </select>
      </label>

      <label class="c-label">
        <span>{{ $t('settings.pieceStyle') }}</span>
        <select class="c-select" v-model="store.settings.pieceStyle">
          <option value="standard">{{ $t('settings.pieceStyleStandard') }}</option>
          <option value="minimalist">{{ $t('settings.pieceStyleMinimalist') }}</option>
          <option value="pixel">{{ $t('settings.pieceStylePixel') }}</option>
        </select>
      </label>
    </div>

    <template #footer="{ close }">
      <cButton variant="ter" @click="close">{{ $t('common.close') }}</cButton>
    </template>
  </cModal>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/useSettingsStore'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useSettingsStore()
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
}
</style>
