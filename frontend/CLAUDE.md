# Projet : Jeu d'échecs

Petit projet pour un seul développeur, moi, Jacob.

## Mes attentes

- Ne jamais aller trop vite.
- Un pas à la fois. Valider tes idées et plan avant de les implémenter.
- Je suis un développeur senior, donc traite moi ainsi : explique-moi si je le demande.
- Je parle français (canadien) et anglais, mais mon code doit être 100 % en anglais, ainsi que les commentaires dans le code.
- Je préfère ne pas mettre trop de commentaires dans le code, alors on le garde pour clarifier les choses plus complexes.

## Stack

- Vue 3 + TypeScript + Vite
- Pinia pour la gestion d'état
- Vitest pour les tests unitaires
- Playwright pour les tests E2E
- i18n pour les traductions
- Lucide pour les icônes (import individuel depuis `lucide-vue-next`, pas d'enregistrement global)

## Architecture

- On utilise les stores Pinia directement
- Les stores sont dans `src/stores/`
- Les composants sont dans `src/components/`
- Les composants réutilisables de base (core-ui) sont dans `src/components/core-ui/`
- Les pages sont dans `src/components/pages/`. On utilise une page par route dans `src/router/index.ts` importée avec le dynamic import.
  - une page doit toujours avoir un id suffixé par `-page`, et la classe "page". Ex.: `<div id="home-page" class="page">` 
- Les types sont dans `src/types/`
- Les composables sont dans `src/composables/`
- Les textes sont dans `src/assets/i18n/locales/`
  - `src/assets/i18n/index.ts` est importé dans main.ts
  - `src/assets/i18n/locales/en.json` sont les traductions anglaises
  - `src/assets/i18n/locales/fr.json` sont les traductions françaises

## Styles

- On utilise du Sass (SCSS) pour le projet.
- Les styles globaux sont dans `src/assets/styles/` :
  - `main.scss` — point d'entrée importé dans `main.ts`
  - `_variables.scss` — tokens de design (couleurs, spacing, typo, shadows, z-index). Ne jamais hardcoder de valeurs.
  - `_mixins.scss` — mixins réutilisables (responsive, layout, interactive)
  - `_reset.scss` — reset CSS minimal (box-sizing, margin, etc.)
  - `_animations.scss` — keyframes partagés
  - `_commons.scss` — classes utilitaires globales (.c-h1, .c-text-lg, .c-flex-center, .c-mt-4, etc.)
- `_commons.scss` offre des CLASSES à appliquer, jamais des styles sur les éléments HTML directement. Un `<h1>` n'a pas de style par défaut — on lui ajoute `class="h1"` si on veut le style heading.
- Les composants utilisent `<style lang="scss" >` dans le .vue — pas de fichier SCSS séparé par composant. 
- Pour les pages, on englobe toujours avec le id principale, ex.: `#home-page{/** all the style for home-page here */}`.
- Pour tous les autres composants, on englobe toujours avec la classe principale, ex.: `.c-super-top-bar{/** all the style for super-top-bar here */}`.
- Variables et mixins sont injectés globalement via `additionalData` dans `vite.config.ts` — pas besoin de `@use` dans chaque composant.
- Pas de CSS-in-JS, pas de Tailwind.

## Librairie UI — core-ui (`src/components/core-ui/`)

Composants génériques réutilisables, préfixés `c` (pour chess).

### Structure
```
src/components/core-ui/
├── core-ui.ts        # enregistrement global des composants
├── cButton.vue
├── cButton.spec.ts
├── cModal.vue
├── cModal.spec.ts
├── cToast.vue
├── cToast.spec.ts
```

### Enregistrement
Les composants core-ui sont enregistrés globalement via `core-ui.ts`, importé dans `main.ts`.
Ils sont utilisables partout sans import : `<cButton>`, `<cModal>`, `<cToast>`.

### Composables associés
Dans `src/composables/` :
- `useModal.ts` — logique open/close/confirm
- `useToast.ts` — logique push/dismiss/auto-close

### Conventions core-ui
- Préfixe `c` pour tous les composants (cButton, cModal, cToast)
- Styles en `<style lang="scss">` dans le .vue
- Chaque composant DOIT avoir un .spec.ts colocalisé avec au minimum : rendu par défaut, props principales, événements émis
- Les composables sont testés indépendamment des composants

### Tester core-ui
- `npm run test:unit -- src/components/core-ui/` pour les composants
- `npm run test:unit -- src/composables/` pour les composables

## Conventions

- Composition API avec `<script setup>` uniquement
- Nommer les composants en PascalCase dans les fichiers, préfixe `c` pour chess
- Nommer les stores avec le préfixe `use` (ex: `useGameStore`)
- Typer explicitement, pas de `any`
- Écrire les tests unitaires pour toute logique métier (mouvements, validation, échec/mat)
- anglais pour le code et les commentaires.
- l'ordre dans un `.vue` est `<template>`, `<script lang="ts" setup>`, `<style lang="scss">`

## Commandes

- `npm run dev` — serveur de dev
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests E2E
- `npm run lint` — linter
