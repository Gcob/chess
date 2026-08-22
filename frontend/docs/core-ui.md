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
├── cToast.vue
├── cToast.spec.ts
```

## Conventions

- Préfixe `c` pour tous les composants
- `<style lang="scss">` dans le `.vue` (non scoped pour les composants globaux)
- Chaque composant DOIT avoir un `.spec.ts` colocalisé avec : rendu par défaut, props principales, événements émis
- Composables testés indépendamment des composants

## `cModal`

Props : `modelValue`, `size` (`sm` → `full`), `closeOnOverlay`, `closeOnEsc`, `flush`.
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
