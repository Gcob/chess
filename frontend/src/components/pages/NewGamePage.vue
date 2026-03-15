<template>
  <main class="page" id="new-game-page">
    <h1 class="h1">{{ $t('newGame.title') }}</h1>
    <p class="text-lg text-muted">{{ $t('newGame.subtitle') }}</p>

    <form class="new-game__form" @submit.prevent>
      <!-- Game settings will go here -->

      <div class="new-game__actions">
        <cButton variant="ter" :to="{ name: 'home' }">
          {{ $t('common.back') }}
        </cButton>
        <cButton @click="onStartButtonClick">
          {{ $t('newGame.startButton') }}
        </cButton>
      </div>
    </form>
  </main>
</template>

<script setup lang="ts">
import CButton from "@/components/core-ui/cButton.vue";

function onStartButtonClick() {
  alert('To do');
}

</script>

<style lang="scss" >
#new-game-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: $spacing-4;

  &__form {
    margin-top: $spacing-8;
    width: 100%;
    max-width: 24rem;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: $spacing-4;
    margin-top: $spacing-8;
  }
}
</style>
