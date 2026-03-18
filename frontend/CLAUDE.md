# Projet : Jeu d'échecs

Petit projet pour un seul développeur, moi, Jacob.

## Mes attentes

- Ne jamais aller trop vite.
- Un pas à la fois. Valider tes idées et plan avant de les implémenter.
- Je suis un développeur senior, donc traite moi ainsi : explique-moi si je le demande.
- Je parle français (canadien) et anglais, mais mon code doit être 100 % en anglais, ainsi que les commentaires dans le
  code.
- Je préfère ne pas mettre trop de commentaires dans le code, alors on le garde pour clarifier les choses plus
  complexes.

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
- Les pages sont dans `src/components/pages/`. On utilise une page par route dans `src/router/index.ts` importée avec le
  dynamic import.
    - une page doit toujours avoir un id suffixé par `-page`, et la classe "page". Ex.:
      `<div id="home-page" class="page">`
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
    - `_variables.scss` — tokens de design statiques (spacing, typo, shadows, z-index, breakpoints). Ne jamais hardcoder
      de valeurs.
    - `_themes.scss` — CSS custom properties pour les couleurs, backgrounds, borders, etc. Définit les thèmes light et
      dark.
    - `_mixins.scss` — mixins réutilisables (responsive, layout, interactive)
    - `_reset.scss` — reset CSS minimal (box-sizing, margin, etc.)
    - `_animations.scss` — keyframes partagés
    - `_layouts.scss` — layouts structurels (#app-main, .c-page)
    - `_commons.scss` — classes utilitaires globales (.c-h1, .c-text-lg, .c-flex-center, .c-mt-4, .c-input, .c-select,
      .c-checkbox, .c-label, etc.)
- `_commons.scss` offre des CLASSES à appliquer, jamais des styles sur les éléments HTML directement.
- Les composants utilisent `<style lang="scss" scoped>` dans le .vue — pas de fichier SCSS séparé par composant.
- Variables SCSS et mixins sont injectés globalement via `additionalData` dans `vite.config.ts` — pas besoin de `@use`
  dans chaque composant.
- Pas de CSS-in-JS, pas de Tailwind.

### Typographie

- `$font-family-base` : `'Inter Variable'` — body, paragraphes, labels courants
- `$font-family-display` : `'Inter Variable'` — headings (.c-h1 à .c-h6), boutons (cButton). Même font que base, séparée
  pour pouvoir évoluer indépendamment.
- `$font-family-mono` : `'JetBrains Mono Variable'` — inputs, selects, body text dans les modals (`.c-modal__content`),
  blocs code, composants au style terminal
- Fonts chargées via Fontsource : `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`
- Headings : `letter-spacing: -0.02em` pour resserrer la graisse

### Palette

- Identité visuelle : knight low-poly bleu cyan sur fond sombre — Neutral Slate + accent bleu unique.
- `$color-accent: #4a9edd` — bleu du knight, couleur interactive principale
- `$color-slate-900: #0f172a`, `$color-slate-600: #475569` — neutres de base
- Palette complète `$color-slate-50` → `$color-slate-950` dans `_variables.scss`
- Plus de `$color1 / $color2 / $color3` ni `$color-gray-*`

### Thème (light/dark)

- Les couleurs utilisent des CSS custom properties (var(--text-primary), var(--bg-primary), etc.) — jamais de couleurs
  SCSS hardcodées dans les composants.
- Le thème est géré par le composable `useTheme` (`src/composables/useTheme.ts`).
- Le thème est appliqué via l'attribut `data-theme` sur `<html>`.
- Le thème est persisté dans localStorage sous la clé `theme`.
- Si aucun thème n'est sauvegardé, on respecte `prefers-color-scheme` du navigateur.
- Les variables CSS disponibles sont documentées dans `_themes.scss`.

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

- `useTheme.ts` — logique light/dark theme

### Conventions core-ui

- Préfixe `c` pour tous les composants (cButton, cModal, cToast)
- Styles en `<style lang="scss">` dans le .vue
- Chaque composant DOIT avoir un .spec.ts colocalisé avec au minimum : rendu par défaut, props principales, événements
  émis
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

### Settings

- Les settings du jeu sont gérés par le store `useSettingsStore` (`src/stores/useSettingsStore.ts`).
- Le store persiste automatiquement dans localStorage (clé `settings`) via un watcher deep.
- Les defaults sont définis dans le store — tout nouveau setting doit y être ajouté avec un default.
- Les composants utilisent `storeToRefs` pour le v-model sur les settings.

## Modèle du domaine

### Fichier unique : `src/types/chess.ts`

Toutes les interfaces et types du domaine échecs dans un seul fichier. Types purs, pas de classes, pas de méthodes.

### Philosophie

- Le modèle de domaine est un point de départ réfléchi, pas une spec rigide. On peut ajouter de la complexité au fil du
  temps.
- La logique métier (conditions de déplacement, effets, etc.) vit dans les **composables**, pas dans les types.
- Les `conditions` et `effects` dans `MoveType` sont des **string identifiants** que les composables interprètent.

### Hiérarchie des acteurs

- `Account` possède un `User`. `User` est un `Player` en jeu.
- `AI` est aussi un `Player` en jeu.
- `Player` = participant en jeu (nom, elo, image, couleur, estEnÉchec). La connexion avec `User`/`AI` se fait au moment
  de la création de partie (store/composable), pas dans les types.

### Entités principales

| Interface  | Rôle                                                                                         |
|------------|----------------------------------------------------------------------------------------------|
| `User`     | Profil humain (nom, image)                                                                   |
| `Account`  | Compte lié à un User (email, date, statut)                                                   |
| `AI`       | Profil IA (nom, elo, image, stratégie, description)                                          |
| `Player`   | Participant en jeu (couleur, estEnÉchec)                                                     |
| `GameTime` | Temps de partie structuré (minutes, incrément en secondes)                                   |
| `GameType` | Catégorie de partie (nom, minTime, maxTime en secondes)                                      |
| `Timer`    | Horloge active (isActive, currentTime, increment)                                            |
| `MoveType` | Type de déplacement (id, conditions[], effects[])                                            |
| `Piece`    | Pièce (couleur, type, valeur, images, textRepresentation, pinDirection, moveTypes)           |
| `Square`   | Case (couleur, file a-h, rank 1-8, pièce nullable)                                           |
| `Board`    | Échiquier (64 cases)                                                                         |
| `Capture`  | Capture (pièce capturée)                                                                     |
| `Move`     | Déplacement (pgn, elapsedTime, from, to, affectedPieces, moveTypes, capture?, previousMove?) |
| `Game`     | Partie (startedAt, status, mode, time, type, players[2], timers[2], board, moves)            |

### Types primitifs clés

- `PieceColor`: `'white' | 'black'`
- `PieceType`: `'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'`
- `GameStatus`: `'waiting' | 'active' | 'paused' | 'finished'`
- `GameMode`: `'local' | 'private-remote' | 'public-remote' | 'vs-bot'`
- `PinDirection`: `'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'`
- `MoveTypeId`:
  `'simple' | 'castling' | 'linear-forward' | 'linear-forward-double' | 'diagonal-forward-capture' | 'en-passant' | 'promotion' | 'diagonal' | 'linear' | 'l-shape'`

### Conventions spécifiques au domaine

- `Square.file` = colonne (a–h), `Square.rank` = rangée (1–8) — notation standard des échecs
- `Piece.images.capture` est optionnel — fallback vers `images.board` si absent (utile pour les thèmes)
- `Piece.textRepresentation` a deux formes : `short` (ex. `'K'`) et `long` (ex. `'King'`)
- `Move.previousMove` fournit le contexte pour la validation en passant
- `GameTime` utilise des props explicites (`minutes`, `increment`) — jamais la notation `"2|1"`

### Concepts à intégrer éventuellement (pas encore forcés)

- **Theme** (pattern Strategy) pour les images de pièces et de board — `Piece.images.board` est déjà un `string`, le
  thème se branchera là sans casser les types
- **State pattern** pour `GameStatus` — le type union suffit pour l'instant
- **Mode de partie** (`GameMode`) — les valeurs sont là, le comportement viendra plus tard

## Commandes

- `npm run dev` — serveur de dev
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests E2E
- `npm run test:e2e:ui` — tests E2E avec UI Playwright
- `npm run test:e2e:debug` — tests E2E en mode debug
- `npm run test:e2e:prod` — build + tests E2E contre preview
- `npm run lint` — linter
