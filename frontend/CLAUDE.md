# Projet : Jeu d'échecs

Petit projet pour un seul développeur, moi, Jacob. 

## Mes attentes 

- Ne jamais aller trop vite.
- Un pas à la fois. Valider tes idées et plan avant de les implémenter.
- Je suis un développeur senior, donc traite moi ainsi : explique-moi si je le demande.
- Je parle français  (canadien) et anglais, mais mon code doit être 100 % en anglais, ainsi que les commentaires dans le code.
- Je préfère ne pas mettre trop de commentaires dans le code, alors on le garde pour clarifier les choses plus complexes.

## Stack
- Vue 3 + TypeScript + Vite
- Pinia pour la gestion d'état
- Vitest pour les tests unitaires
- Playwright pour les tests E2E

## Architecture
- On utilise les stores Pinia directement 
- Les stores sont dans `src/stores/`
- Les composants sont dans `src/components/`
- Les pages sont dans `src/components/pages/`. On utilise une page par route dans `src/router/index.ts` importer avec le dynamic import.
- Les types sont dans `src/types/`

## Conventions
- Composition API avec `<script setup>` uniquement
- Nommer les composants en PascalCase
- Nommer les stores avec le préfixe `use` (ex: `useGameStore`)
- Typer explicitement, pas de `any`
- Écrire les tests unitaires pour toute logique métier (mouvements, validation, échec/mat)
- Français pour les commentaires, anglais pour le code

## Commandes
- `npm run dev` — serveur de dev
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests E2E
- `npm run lint` — linter
