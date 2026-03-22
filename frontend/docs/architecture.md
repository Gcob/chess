# Architecture

## Stack

- Vue 3 + TypeScript + Vite
- Pinia pour la gestion d'état
- Vitest pour les tests unitaires
- Playwright pour les tests E2E
- i18n pour les traductions
- Lucide pour les icônes (import individuel depuis `lucide-vue-next`, pas d'enregistrement global)

## Structure des dossiers

```
src/
├── assets/
│   ├── i18n/
│   │   ├── index.ts               # importé dans main.ts
│   │   └── locales/
│   │       ├── en.json
│   │       └── fr.json
│   └── styles/
│       ├── main.scss              # point d'entrée importé dans main.ts
│       ├── _variables.scss
│       ├── _themes.scss
│       ├── _mixins.scss
│       ├── _reset.scss
│       ├── _animations.scss
│       ├── _layouts.scss
│       └── _commons.scss
├── components/
│   ├── core-ui/                   # composants génériques réutilisables
│   └── pages/                     # une page par route
├── composables/
│   └── factories/                 # factory functions
├── router/
│   └── index.ts
├── stores/
├── types/
│   └── chess.ts                   # tout le domaine échecs
```

## Conventions générales

- Composition API avec `<script setup>` uniquement
- Composants en PascalCase, préfixe `c` pour chess (ex. `cButton`)
- Stores avec préfixe `use` (ex. `useGameStore`)
- Typer explicitement — jamais de `any`
- Ordre dans un `.vue` : `<template>`, `<script lang="ts" setup>`, `<style lang="scss">`
- Pages : id suffixé `-page`, classe `page` — ex. `<div id="home-page" class="page">`
- Routes avec dynamic import dans `src/router/index.ts`

## Couches

| Couche             | Rôle                                       |
|--------------------|--------------------------------------------|
| `src/types/`       | Interfaces et types purs — le *quoi*       |
| `src/composables/` | Logique métier réutilisable — le *comment* |
| `src/stores/`      | État global (Pinia)                        |
| `src/components/`  | Affichage uniquement                       |

Les composants Vue ne font qu'afficher — ils consomment des composables et des stores,
jamais de logique métier directe.

## Settings

- Gérés par `useSettingsStore` (`src/stores/useSettingsStore.ts`)
- Persistés dans localStorage (clé `settings`) via watcher deep
- Defaults définis dans le store — tout nouveau setting doit avoir un default
- Composants utilisent `storeToRefs` pour le v-model

## Factory pattern

- Factories dans `src/composables/factories/`
- `gameFactory.ts` expose :
    - `toBackendPayload(settings: NewGameSettings): CreateGamePayload`
    - `createGameSession(payload: CreateGamePayload, id: number): GameSession`
- `CreateGamePayload` est la source de vérité pour la création de partie — c'est lui qu'on enverra au backend
- `useGamesStore` orchestre : `open(payload)` → factory → enregistre la session

## Flux de création de partie

```
NewGameSettings (useNewGameStore)
  → toBackendPayload()
  → CreateGamePayload
  → useGamesStore.open(payload)
  → createGameSession(payload, id)
  → GameSession (enregistrée dans le store)
```

## Conventions ID

- IDs toujours des entiers simples (1, 2, 3...) — jamais de UUID
- Le backend sera la source de vérité finale pour les IDs des parties distantes
- L'`id` de session sera la clé dans l'URI de route pour les parties distantes
