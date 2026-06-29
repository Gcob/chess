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
│   ├── chess/                     # composants d'échiquier (cBoard, cSquare, cPiece)
│   └── pages/                     # une page par route
├── composables/
│   └── factories/                 # factory functions
├── engine/                        # logique métier pure — sans Vue
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

| Couche             | Connaît Vue ? | Rôle                                                  |
|--------------------|---------------|-------------------------------------------------------|
| `src/types/`       | ❌             | Interfaces et types purs — le *quoi*                  |
| `src/engine/`      | ❌             | Logique métier pure — règles, dérivations (le cerveau)|
| `src/composables/` | ✅             | Adaptateurs réactifs — exposent l'engine aux composants |
| `src/stores/`      | ✅             | État global (Pinia)                                   |
| `src/components/`  | ✅             | Affichage uniquement                                  |

Les composants Vue ne font qu'afficher — ils consomment des composables et des stores,
jamais de logique métier directe.

**Engine vs composables.** La logique métier vit dans `src/engine/` en TypeScript pur :
plain data en entrée, plain data en sortie, zéro import `vue`. N'importe quel code peut l'appeler
(composants, tests, IA, backend futur) sans dépendre de Vue. Les composables sont des **wrappers
réactifs minces** : ils appellent l'engine et exposent le résultat en `ref`/`computed`.
`gameFactory.ts` (construction de partie/board) est déjà de la logique pure — il migrera
éventuellement sous `engine/`.

## Rendu de l'échiquier

Deux couches superposées dans `cBoard` :

- **La grille** — 64 `cSquare` en CSS grid. Source de vérité visuelle des positions, cibles de clic/drop.
  Une case ne contient plus de pièce : c'est un fond seulement.
- **L'overlay de pièces** — couche absolue par-dessus la grille. Chaque `cPiece` est un sprite de la taille
  d'une case, placé en `transform: translate(col·100%, row·100%)`. Liste dérivée du board via
  `engine/getBoardPieces`, keyée par `piece.id` → la même pièce garde son nœud DOM et **glisse** quand
  ses coordonnées changent (`transition` CSS). `animated=false` au montage = téléportation, puis animé ensuite.

`cBoard` possède une prop `orientation` (`PieceColor`, défaut `white` = blancs en bas) qui pilote
à la fois l'ordre de la grille et le mapping `case → {col, row}`. Flip = inversion des index.

> Phase 2 (à venir) : drag-and-drop (case cible par maths pointeur→pixel sur une ref unique du board),
> conditionné au mode de jeu et au tour actif ; bouton de rotation du board.

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

## Garde de sortie de page

`usePageLeaveGuard` (store) déclenche le warning natif `beforeunload` ; `usePreventLeave(condition)`
(composable) l'arme depuis un composant. `GamePage.vue` bloque tant qu'une partie existe.

Ne couvre **pas** la navigation interne vue-router. En attendant, éviter ou conditionner les liens
qui feraient quitter une partie en cours.

## Conventions ID

- IDs toujours des entiers simples (1, 2, 3...) — jamais de UUID
- Le backend sera la source de vérité finale pour les IDs des parties distantes
- L'`id` de session sera la clé dans l'URI de route pour les parties distantes
