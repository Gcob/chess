# Core UI

## Principe

Composants génériques réutilisables dans `src/components/core-ui/`, préfixés `c`.
Enregistrés globalement via `core-ui.ts` (importé dans `main.ts`) — utilisables partout sans import.

## Structure

```
src/components/core-ui/
├── core-ui.ts        # enregistrement global
├── cButton.vue
├── cButton.spec.ts
├── cModal.vue
├── cModal.spec.ts
├── cAccordion.vue
├── cAccordion.spec.ts
├── cToast.vue
├── cToast.spec.ts
```

## Conventions

- Préfixe `c` pour tous les composants
- `<style lang="scss">` dans le `.vue` (non scoped pour les composants globaux)
- Chaque composant DOIT avoir un `.spec.ts` colocalisé avec : rendu par défaut, props principales, événements émis
- Composables testés indépendamment des composants

## `cAccordion`

Section repliable générique. Props : `title`, `open` (état initial), `scrollOnOpen` (défaut `true` :
ramène la section en haut de son conteneur scrollable à l'ouverture), slot `icon` optionnel, événement `toggle`.
L'en-tête porte **sa propre surface** (`--accordion-heading-bg`, défaut `--bg-secondary`) : c'est ce qui
sépare les sections, bien mieux qu'un filet. Il est aussi **sticky** — il colle en haut du conteneur
scrollable tant que sa section défile. Deux conditions non négociables : l'en-tête doit rester **hors**
du panneau (clippé en `overflow: hidden`, ce qui tuerait le sticky — une spec le verrouille), et son fond
doit être **opaque**, puisque le contenu défile derrière. La couleur est un point d'extension : un
consommateur posé sur une autre surface la redéfinit, comme `ChessRules` qui mixe `--text-primary` dans
`--modal-bg` pour contraster dans les deux thèmes à la fois.
Le contenu reste **monté** en permanence : l'ouverture s'anime en `grid-template-rows: 0fr → 1fr`,
ce qui évite toute mesure JS et fonctionne quelle que soit la hauteur du contenu — mais exige que le
wrapper interne garde `overflow: hidden`. `aria-expanded` + `aria-controls` câblés sur un `id` généré.

## `cModal`

Props : `modelValue`, `size` (`sm` → `full`), `closeOnOverlay`, `closeOnEsc`, `flush`, `stableScrollbar`.
`stableScrollbar` réserve la gouttière de la barre de défilement : sans ça, un contenu qui grandit et
rétrécit (des sections repliables) fait apparaître puis disparaître la barre, et toute la mise en page
sursaute à chaque ouverture. `scrollbar-gutter: stable` quand le navigateur le connaît, `overflow-y: scroll`
en repli (Safari avant 18.2) — moins joli, aussi stable.
`flush` retire le padding du contenu pour les modales immersives qui peignent jusqu'au bord —
le slot prend alors en charge son propre espacement **et son propre arrondi** (le wrapper arrondit
ses coins mais ne clippe pas). Utilisé par `GameOverModal`, dont l'aura doit atteindre les bords.

## Composables associés

| Composable    | Rôle                     |
|---------------|--------------------------|
| `useTheme.ts` | Logique light/dark theme |

## Tests

```bash
npm run test:unit -- src/components/core-ui/   # composants
npm run test:unit -- src/composables/           # composables
```
