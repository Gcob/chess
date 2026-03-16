<template>
  <cModal :model-value="modelValue" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <template #header>{{ $t('settings.title') }}</template>

    <div class="settings-modal">
      <label class="c-label">
        <span>{{ $t('settings.sound') }}</span>
        <input type="checkbox" class="c-checkbox" />
      </label>

      <label class="c-label">
        <span>{{ $t('settings.boardTheme') }}</span>
        <select class="c-select">
          <option value="classic">Classic</option>
          <option value="modern">Modern</option>
          <option value="wood">Wood</option>
        </select>
      </label>

      <label class="c-label">
        <span>{{ $t('settings.pieceStyle') }}</span>
        <select class="c-select">
          <option value="standard">Standard</option>
          <option value="minimalist">Minimalist</option>
          <option value="pixel">Pixel</option>
        </select>
      </label>
    </div>

    <template #footer="{ close }">
      <cButton variant="ter" @click="close">{{ $t('common.close') }}</cButton>
    </template>
  </cModal>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;
}
</style>
