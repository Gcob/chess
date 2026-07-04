<template>
  <footer class="app-footer">
    <nav class="app-footer__links">
      <button class="app-footer__link" @click="showRules = true">
        {{ $t('footer.howToPlay') }}
      </button>
      <span class="app-footer__sep" aria-hidden="true">·</span>
      <button class="app-footer__link" @click="showAbout = true">
        {{ $t('footer.about') }}
      </button>
      <span class="app-footer__sep" aria-hidden="true">·</span>
      <button class="app-footer__link" @click="showTerms = true">
        {{ $t('footer.terms') }}
      </button>
      <span class="app-footer__sep" aria-hidden="true">·</span>
      <a
        class="app-footer__link app-footer__link--icon"
        href="https://github.com/gcob"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="$t('footer.github')"
      >
        <Github :size="14" />
      </a>
    </nav>

    <p class="app-footer__copy c-text-sm c-text-muted">
      {{ $t('footer.copyright', { year }) }}
    </p>

    <cModal v-model="showRules" size="lg">
      <template #header>{{ $t('chessRules.title') }}</template>
      <ChessRules />
      <template #footer="{ close }">
        <cButton @click="close" variant="ter">{{ $t('common.close') }}</cButton>
      </template>
    </cModal>

    <cModal v-model="showAbout" size="lg">
      <template #header>{{ $t('about.title') }}</template>
      <AboutContent />
      <template #footer="{ close }">
        <cButton @click="close" variant="ter">{{ $t('common.close') }}</cButton>
      </template>
    </cModal>

    <cModal v-model="showTerms" size="lg">
      <template #header>{{ $t('terms.title') }}</template>
      <TermsContent />
      <template #footer="{ close }">
        <cButton @click="close" variant="ter">{{ $t('common.close') }}</cButton>
      </template>
    </cModal>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Github } from 'lucide-vue-next'
import ChessRules from '@/components/parts/ChessRules.vue'
import AboutContent from '@/components/parts/AboutContent.vue'
import TermsContent from '@/components/parts/TermsContent.vue'

const showRules = ref(false)
const showAbout = ref(false)
const showTerms = ref(false)
const year = new Date().getFullYear()
</script>

<style lang="scss" scoped>
.app-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  // fixed height (see $footer-height) so layouts can compute available space; never shrinks
  min-height: $footer-height;
  flex-shrink: 0;
  padding: $spacing-2 $spacing-4;
  border-top: 1px solid var(--border-color);

  &__links {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__sep {
    color: var(--border-color-strong);
    font-size: $font-size-xs;
  }

  &__link {
    font-size: $font-size-sm;
    color: var(--text-muted);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color $transition-fast;

    &:hover {
      color: var(--text-primary);
    }

    &--icon {
      display: flex;
      align-items: center;
    }
  }

  &__copy {
    margin: 0;
  }
}
</style>
