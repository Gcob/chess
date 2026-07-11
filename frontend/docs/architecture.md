# Architecture

## Stack

- Vue 3 + TypeScript + Vite
- Pinia pour la gestion d'état
- Vitest pour les tests unitaires
- Playwright pour les tests E2E
- i18n pour les traductions
- Lucide pour les icônes (import individuel depuis `lucide-vue-next`, pas d'enregistrement global)
- vue-tippy pour les tooltips (plugin global dans `main.ts`, directive `v-tippy`)
- Zod pour la validation (schémas purs dans `src/validation/`, agnostiques de Vue)

## Structure des dossiers

```
src/
├── assets/
│   ├── i18n/
│   │   ├── index.ts               # importé dans main.ts
│   │   └── locales/
│   │       ├── en.ts
│   │       └── fr.ts
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
├── utils/                         # helpers purs (ex. boardCoords — case ↔ coords de grille)
└── validation/                    # schémas Zod purs (messages = codes, mappés en i18n par l'UI)
```

## Conventions générales

- Composition API avec `<script setup>` uniquement
- Composants en PascalCase, préfixe `c` pour chess (ex. `cButton`)
- Stores avec préfixe `use` (ex. `useGameStore`)
- Typer explicitement — jamais de `any`
- Ordre dans un `.vue` : `<template>`, `<script lang="ts" setup>`, `<style lang="scss">`
- Pages : id suffixé `-page`, classe `page` — ex. `<div id="home-page" class="page">`
- Routes avec dynamic import dans `src/router/index.ts`

## Textes genrés (i18n)

`vue-i18n` n'a pas d'équivalent à la feature `context` d'i18next (clés `_male`/`_female` + option
`context` sur `t()`). Convention maison à la place : `tGender(i18n, key, gender, params?)`
(`src/utils/tGender.ts`) essaie `` `${key}_${gender}` `` (`te()`), retombe sur `key` si absent ou si
`gender` est `undefined`. Une locale ne définit une clé `_f` (ou `_m`) que pour les mots qui varient
réellement — pas besoin de dupliquer les invariables. Généralisable à tout texte genré, pas
spécifique à un feature en particulier. Voir `docs/look-and-feel.md` pour l'usage dans le
générateur de noms rigolos.

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

**Frontière hybride objets/fonctions (engine).** La donnée qui voyage est plate ; les objets naissent
et meurent dans l'engine. Classes permises dans `src/engine/` si : (1) état 100 % dérivé du board,
(2) durée de vie ≤ une position, (3) jamais dans le DTO ni un store, (4) zéro singleton de module.
L'API publique de l'engine reste des fonctions sur le DTO. Vigilance : `PositionAnalysis` reste
strictement interrogative — les règles vivent dans les fonctions, jamais dans la façade (anti God-object).

## Rendu de l'échiquier

`cBoard` consomme le **DTO de vue en prop unique** (`view: GameView` — board, orientation, policies,
commande `move` ; seule `size` reste à part, mesurée par le parent). Deux couches dans une zone `__area`
(ref qui ancre les calculs pointeur→pixel) :

- **Grille** (`__grid`) — 64 `cSquare` (CSS grid) : fond + highlights, cibles de clic/drop.
- **Overlay pièces** (`__pieces`, non clippé) — chaque `cPiece` reçoit un DTO `PlacedPiece`
  (id, sprite, `col`/`row` résolus pour l'orientation, `movable`) et se place en
  `transform: translate(col·100%, row·100%)` ; dérivé de `getBoardPieces`, keyé par `piece.id`.

Deux pièges non-évidents :

- **Ordre DOM stable** — overlay trié par `id`, jamais par position. Un réordonnancement réinitialiserait
  la transition en cours → téléportation.
- **`z-index`** monté pendant le glissement (`--moving`) pour passer au-dessus des autres pièces.

**Orientation** — `view.orientation` (policy par mode dans `useGameView`, config *par observateur*).
Pilote l'ordre de la grille et le mapping `case ↔ {col,row}`
(`utils/boardCoords.ts`, paire inverse pure). Rotation instantanée : frame du flip en `none`, puis `slide`
restauré via **double `requestAnimationFrame`** (la frame sans transition doit être peinte avant de réarmer).
`cBoardFrame` (composant à slot) entoure le board avec les coordonnées sur les **quatre côtés** (fichiers
en haut/bas, rangées à gauche/droite), ordonnées selon l'orientation. Le label du fichier/rangée survolé
s'illumine (`cBoard` traque la case sous la souris et passe `highlightFile`/`highlightRank`).

**Animations** — `PieceAnimation` (look-and-feel, jamais dans l'engine) : `slide` (couvre linéaire ET diagonale)
et `none` câblés ; `hop` (cavalier) et `snap-back` **dormants** jusqu'au moteur de règles. `cPiece` → classe
`c-piece--anim-{name}` ; un drag n'anime jamais.

**Interaction** — gatée par `view.movableColor` (policy : en local, le joueur au trait ; personne si la
partie est finie). Les pièces adverses ignorent le pointeur via `pointer-events: none` (`cPiece --static`) —
le tap traverse jusqu'au `cSquare`, ce qui garde la capture par clic. `usePieceDrag` distingue **tap**
(presse sans bouger, sous un seuil) et **drag** (au-delà) :

- **Drag** → la pièce suit le curseur ; drop → `cBoard` appelle `view.move` → engine. Relâchement =
  snap instantané (anim `none`, la pièce est déjà sous le curseur). Bouton droit enfoncé pendant le drag =
  annulation immédiate (retour à l'origine, aucun coup). Menu contextuel supprimé (`@contextmenu.prevent`).
  Case cible par maths sur le rect (pas de hit-testing DOM).
- **Tap** (clic-pour-jouer) → `cBoard.activateSquare` : tap une pièce = sélection (highlight `selected`) ;
  tap une destination = coup (slide) ; re-tap = désélection ; tap une pièce alliée = re-sélection.
  Toute action « pas rapport » annule la sélection (début de drag, rotation, coup).

**Highlights** — `SquareHighlight` (look-and-feel, hors domaine) : sources par état → `highlightsFor` →
overlays translucides sur `cSquare`. Câblés : `drop-target`, `selected`, `last-move` (from/to du dernier
coup, fourni par `useGameView.lastMove`, gaté par le setting `highlightLastMove` — défaut activé).

> Engine : `engine/game.ts` = commandes gardées par statut (`startGame`, `makeMove`, `resign`,
> `offerDraw`/`acceptDraw`/`declineDraw`, `flagTimeout`, helper `remainingSeconds`) — voir
> `docs/engine-roadmap.md` pour les principes et la progression. `makeMove` exige le trait, enregistre le
> `Move` (SAN naïf) avec temps débité + incrément, et le premier coup démarre une partie `waiting` (jamais
> sur tentative invalide). Couche board : `engine/move.ts` (`canMove` complet — pipeline de restrictions,
> patterns par move type ; `applyMove`), `engine/positionAnalysis.ts` (façade `PositionAnalysis` +
> `getAttackers`/`findCheckers`), `engine/ray.ts` (classe `Ray`, directions, walkers),
> `engine/moveTypes.ts` (capacités par type de pièce — l'unique maison), `engine/board.ts`
> (`getBoardPieces`, `findKingSquare`, `toSquareKey`), `engine/material.ts` (captures dérivées).

## Vue de partie (game view)

`GamePage` est un orchestrateur : il crée le **DTO de vue** via `useGameView(id)` (objet réactif — `game`,
`orientation`, `boardSize`, `activeColor`, commandes `move`/`resign`/`offerDraw`/`acceptDraw`/`declineDraw` —
même vocabulaire que l'engine) et choisit un **layout selon
la largeur** (`useMediaQuery`/`useIsMobile`, seuil `$breakpoint-lg`) : `GameLayoutMobile` vs `GameLayoutDesktop`.

- Les **sections sont partagées** ; seuls les layouts les arrangent (desktop = board + sidebar 3 zones ;
  mobile = empilé). Le DTO passe en **une prop `:view`** partout (pas de drilling).
- Les **différences de mode** vivent dans `useGameView` (policy-données). Seul `local` est câblé :
  le board auto-flip pour suivre le joueur au trait (`orientation = activeColor`). D'où le retrait du
  bouton « tourner » de `cBoard` (l'orientation est pilotée par la policy).
- `components/game/` : `GameLayout{Desktop,Mobile}`, `GameBoardArea`, `PlayersPanel` → `PlayerCard`,
  `GameInfo` (contrôle de temps, mode, **état de partie** sur sa propre ligne : attente / trait / résultat),
  `MoveHistory` (SAN par tour depuis `view.moves`, **desktop-only**), `GameActions` (masqué si partie finie ;
  proposer nulle / abandonner confirmé ; offre pendante → « Les blancs proposent la nulle » + Accepter /
  Refuser — policy locale : l'offre vient du joueur au trait, jouer un coup la refuse).
- **Identités** : `PlayersPanel` groupe les deux `PlayerCard` **en haut** (ordre par orientation → suit la
  rotation). Chaque carte : avatar (propagé du form via `PlayerMetas.image`), nom + **suffixe couleur**
  « (Blanc)/(Noir) », `CapturedPieces` + **diff matériel (±)** — dérivés de l'historique des coups
  (`engine/material.ts`) —, horloge **live** (`view.clocks`, via `useGameClock` : tick ~100 ms quand la
  partie chronométrée est active, arrondi à la seconde supérieure comme une vraie horloge d'échecs, chiffres
  tabulaires, flag automatique à zéro ; `game.time` optionnel = sans chrono, aucune horloge affichée).
  Sous un seuil adapté au contrôle de temps (≤ 2 min → 10 s, ≤ 5 min → 20 s, sinon 60 s) : rouge + dixièmes
  (`0:09.4`).
  Le trait est indiqué par le highlight `is-active` de la carte et la ligne d'état de `GameInfo`.
- **`GameInfo`** : récap compact (contrôle de temps « 5 min + 2 s » + mode). Ordre sidebar desktop :
  joueurs → infos → historique → actions ; mobile : infos → joueurs → board → actions.
- **Pas de scroll en desktop** : topbar et footer ont des **hauteurs fixes** (`$topbar-height`,
  `$footer-height`), donc `#game-page` prend `height: calc(100svh - topbar - footer)` (≥ `lg`) — le board
  se dimensionne à sa zone bornée (`ResizeObserver`), l'historique scrolle en interne. Mobile : hauteur
  naturelle, la page peut scroller.

## Settings

- Gérés par `useSettingsStore` (`src/stores/useSettingsStore.ts`)
- Persistés dans localStorage (clé `settings`) via watcher deep
- Defaults définis dans le store — tout nouveau setting doit avoir un default
- Composants utilisent `storeToRefs` pour le v-model

## Factory pattern

- Factories dans `src/composables/factories/`
- `gameFactory.ts` expose :
    - `toBackendPayload(settings: NewGameSettings): CreateGamePayload`
    - `createGameSession(payload: CreateGamePayload, id: string): GameSession`
- `CreateGamePayload` est la source de vérité pour la création de partie — c'est lui qu'on enverra au backend
- `useGamesStore` orchestre : `open(payload)` → ULID + factory → `reactive()` → enregistre la session.
  Le DTO est wrappé en `reactive()` dès sa naissance : toute référence à la session (retour de `open`,
  `store.get`) est LE proxy réactif — muter le DTO de n'importe où (engine, tests, futur websocket)
  déclenche la réactivité, toujours, implicitement

## Flux de création de partie

`NewGameForm` est un orchestrateur découpé en sections (`NewGameModeSection`, `NewGamePlayersSection`,
`NewGameTimerSection`). Chacune reçoit **une seule prop DTO** : l'objet réactif `settings` du store, qu'elle
lit/mute directement (pas de props/events à l'infini). La validation vit dans la section Joueurs et est
appelée par le parent via `validate()` exposé (`defineExpose`).

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
(composable) l'arme depuis un composant. `GamePage.vue` bloque tant qu'une partie **non terminée** existe.

La **navigation interne** vue-router est couverte par un `beforeEach` global (`router/index.ts`) :
si `shouldWarn`, un `window.confirm` s'affiche et annule la nav si refusée (top-bar, footer, etc.).

## Conventions ID

- IDs de partie : **ULID** (string, 26 chars) — `GameSession.id`, clé de la route `/game/:id`.
- Simulé côté frontend (`src/utils/ulid.ts`, fallback non-crypto documenté) tant qu'il n'y a pas de
  backend ; le backend/DB deviendra la source des vrais ULID.
- Triable par date de création, générable partout — exactement le cas d'usage du ULID.
