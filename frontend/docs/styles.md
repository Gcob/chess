# Styles

## Règles fondamentales

- SCSS (Sass) partout — pas de CSS-in-JS, pas de Tailwind
- Jamais hardcoder de valeurs — toujours les tokens de `_variables.scss`
- Jamais de couleurs SCSS hardcodées dans les composants — toujours `var(--custom-property)`
- `_commons.scss` offre des classes utilitaires — jamais de styles sur les éléments HTML directement
- Composants : `<style lang="scss" scoped>` dans le `.vue` — pas de fichier SCSS séparé
- Variables et mixins injectés globalement via `additionalData` dans `vite.config.ts` — pas de `@use` dans chaque composant

## Fichiers globaux (`src/assets/styles/`)

| Fichier           | Rôle |
|-------------------|------|
| `main.scss`       | Point d'entrée, importé dans `main.ts` |
| `_variables.scss` | Tokens statiques (spacing, typo, shadows, z-index, breakpoints, palette complète) |
| `_themes.scss`    | CSS custom properties pour couleurs, backgrounds, borders — thèmes light et dark |
| `_mixins.scss`    | Mixins réutilisables (responsive, layout, interactive) |
| `_reset.scss`     | Reset CSS minimal |
| `_animations.scss`| Keyframes partagés |
| `_layouts.scss`   | Layouts structurels (`#app-main`, `.c-page`) |
| `_commons.scss`   | Classes utilitaires globales |

## Thème

- Appliqué via `data-theme` sur `<html>`
- Géré par le composable `useTheme` (`src/composables/useTheme.ts`)
- Persisté dans localStorage sous la clé `theme`
- Fallback : `prefers-color-scheme` du navigateur
- Variables disponibles documentées dans `_themes.scss`

## Typographie

- `$font-family-base` : `'Inter Variable'` — body, labels
- `$font-family-display` : `'Inter Variable'` — headings, boutons (séparé pour pouvoir évoluer)
- `$font-family-mono` : `'JetBrains Mono Variable'` — inputs, selects, modals, blocs code
- Chargées via Fontsource : `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`
- Headings : `letter-spacing: -0.02em`

## Palette

- Identité : knight low-poly bleu cyan sur fond sombre — Neutral Slate + accent bleu unique
- `$color-accent: #4a9edd` — couleur interactive principale
- Palette complète `$color-slate-50` → `$color-slate-950` dans `_variables.scss`
