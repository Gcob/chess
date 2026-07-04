# Architecture

## Stack

- Vue 3 + TypeScript + Vite
- Pinia pour la gestion d'état
- Vitest pour les tests unitaires
- Playwright pour les tests E2E
- i18n pour les traductions
- Lucide pour les icônes (import individuel depuis `lucide-vue-next`, pas d'enregistrement global)
- vue-tippy pour les tooltips (plugin global dans `main.ts`, directive `v-tippy`)

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
└── utils/                         # helpers purs (ex. boardCoords — case ↔ coords de grille)
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

`cBoard` = deux couches dans une zone `__area` (ref qui ancre les calculs pointeur→pixel) :

- **Grille** (`__grid`) — 64 `cSquare` (CSS grid) : fond + highlights, cibles de clic/drop.
- **Overlay pièces** (`__pieces`, non clippé) — `cPiece` en `transform: translate(col·100%, row·100%)`,
  dérivé de `getBoardPieces`, keyé par `piece.id`.

Deux pièges non-évidents :

- **Ordre DOM stable** — overlay trié par `id`, jamais par position. Un réordonnancement réinitialiserait
  la transition en cours → téléportation.
- **`z-index`** monté pendant le glissement (`--moving`) pour passer au-dessus des autres pièces.

**Orientation** — prop `orientation` en `v-model` (état chez `GamePage`, config *par observateur*, sœur des
thèmes ; bouton dans `cBoard`). Pilote l'ordre de la grille et le mapping `case ↔ {col,row}`
(`utils/boardCoords.ts`, paire inverse pure). Rotation instantanée : frame du flip en `none`, puis `slide`
restauré via **double `requestAnimationFrame`** (la frame sans transition doit être peinte avant de réarmer).
`cBoardFrame` (composant à slot) entoure le board avec les coordonnées sur les **quatre côtés** (fichiers
en haut/bas, rangées à gauche/droite), ordonnées selon l'orientation. Le label du fichier/rangée survolé
s'illumine (`cBoard` traque la case sous la souris et passe `highlightFile`/`highlightRank`).

**Animations** — `PieceAnimation` (look-and-feel, jamais dans l'engine) : `slide` (couvre linéaire ET diagonale)
et `none` câblés ; `hop` (cavalier) et `snap-back` **dormants** jusqu'au moteur de règles. `cPiece` → classe
`c-piece--anim-{name}` ; un drag n'anime jamais.

**Interaction** — `usePieceDrag` distingue **tap** (presse sans bouger, sous un seuil) et **drag** (au-delà) :

- **Drag** → la pièce suit le curseur ; drop → `cBoard` émet `move` → `makeMove` → engine. Relâchement =
  snap instantané (anim `none`, la pièce est déjà sous le curseur). Bouton droit enfoncé pendant le drag =
  annulation immédiate (retour à l'origine, aucun coup). Menu contextuel supprimé (`@contextmenu.prevent`).
  Case cible par maths sur le rect (pas de hit-testing DOM).
- **Tap** (clic-pour-jouer) → `cBoard.activateSquare` : tap une pièce = sélection (highlight `selected`) ;
  tap une destination = coup (slide) ; re-tap = désélection ; tap une pièce alliée = re-sélection.
  Toute action « pas rapport » annule la sélection (début de drag, rotation, coup).

**Highlights** — `SquareHighlight` (look-and-feel, hors domaine) : sources par état → `highlightsFor` →
overlays translucides sur `cSquare`. Câblé : `drop-target`.

> Engine (règles incrémentales) : `canMove` refuse origine vide, non-coup et capture d'une pièce alliée ;
> le reste (patterns de déplacement, tour, échec) est encore permis. `applyMove` = capture par écrasement.
> Pas encore de tour / `Move` / pgn.

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

La **navigation interne** vue-router est couverte par un `beforeEach` global (`router/index.ts`) :
si `shouldWarn`, un `window.confirm` s'affiche et annule la nav si refusée (top-bar, footer, etc.).

## Conventions ID

- IDs toujours des entiers simples (1, 2, 3...) — jamais de UUID
- Le backend sera la source de vérité finale pour les IDs des parties distantes
- L'`id` de session sera la clé dans l'URI de route pour les parties distantes
