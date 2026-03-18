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

## Composables associés

| Composable | Rôle |
|---|---|
| `useTheme.ts` | Logique light/dark theme |

## Tests

```bash
npm run test:unit -- src/components/core-ui/   # composants
npm run test:unit -- src/composables/           # composables
```
