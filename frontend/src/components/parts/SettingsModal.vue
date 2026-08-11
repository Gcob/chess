<template>
  <cModal :model-value="modelValue" size="md"
          @update:model-value="$emit('update:modelValue', $event)">
    <template #header>{{ $t('settings.title') }}</template>

    <div class="settings-modal">
      <div class="c-label">
        <span>{{ $t('settings.language') }}</span>
        <div class="settings-modal__langs">
          <button
            v-for="lang in languages"
            :key="lang.code"
            type="button"
            class="settings-modal__lang"
            :class="{ 'is-active': locale === lang.code }"
            @click="setLocale(lang.code)"
          >
            <LocaleFlag :locale="lang.code" class="settings-modal__flag" />
            <span>{{ lang.name }}</span>
          </button>
        </div>
      </div>

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

      <label class="c-label">
        <span>{{ $t('settings.highlightLastMove') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="store.settings.highlightLastMove" />
      </label>

      <label class="c-label">
        <span>{{ $t('settings.showLegalMoves') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="store.settings.showLegalMoves" />
      </label>

      <label class="c-label">
        <span>{{ $t('settings.autoPromoteToQueen') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="store.settings.autoPromoteToQueen" />
      </label>

      <label class="c-label">
        <span>{{ $t('settings.devMode') }}</span>
        <input type="checkbox" class="c-checkbox" v-model="store.settings.devMode" />
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
import LocaleFlag from '@/components/parts/LocaleFlag.vue'

defineProps<{ modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useSettingsStore()
const {t, locale} = useI18n()

// Endonyms — a language names itself the same way regardless of the current UI locale.
const languages = [
  {code: 'fr', name: 'Français'},
  {code: 'en', name: 'English'},
] as const

function setLocale(code: 'fr' | 'en') {
  locale.value = code
  localStorage.setItem('locale', code)
}

const boardThemeOptions = computed(() => enumToOptions(BoardThemes, 'settings.boardThemes', t as (key: string) => string))
const pieceThemeOptions = computed(() => enumToOptions(PieceThemes, 'settings.pieceThemes', t as (key: string) => string))
</script>

<style lang="scss" scoped>
.settings-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__langs {
    display: flex;
    gap: $spacing-2;
  }

  &__lang {
    display: flex;
    flex: 1;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-3;
    color: var(--text-secondary);
    background: transparent;
    border: $border-width-base solid var(--border-color);
    border-radius: $border-radius-base;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    &.is-active {
      color: var(--text-primary);
      border-color: var(--accent);
    }
  }

  &__flag {
    width: 22px;
    height: auto;
    border: 1px solid var(--border-color);
    border-radius: 2px;
    flex-shrink: 0;
  }
}
</style>
