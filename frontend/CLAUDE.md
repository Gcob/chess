# Projet : Jeu d'échecs

Petit projet solo — développeur : Jacob.

## Mes attentes

- Ne jamais aller trop vite. Un pas à la fois.
- Toujours valider le plan avant d'implémenter.
- Je suis développeur senior — traite-moi ainsi. Explique seulement si je le demande.
- Code et commentaires 100 % en anglais. Commentaires uniquement pour les choses complexes.
- Je parle français canadien — nos échanges sont en français.
- Valider le typescript autant que possible et le build pour s'assurer que tout fonctionne correctement à chaque changement.

## Documentation

La doc est séparée en fichiers thématiques dans `docs/`. Lis le fichier pertinent avant chaque tâche.

| Fichier                 | Contenu                                              |
|-------------------------|------------------------------------------------------|
| `docs/architecture.md`  | Stack, structure des dossiers, conventions générales |
| `docs/domain.md`        | Modèle du domaine, types, interfaces                 |
| `docs/styles.md`        | SCSS, thèmes, typographie, palette                   |
| `docs/core-ui.md`       | Composants core-ui, composables associés             |
| `docs/look-and-feel.md` | Thèmes de pièces et de board, assets, useChessTheme  |

## Mise à jour de la doc

À chaque tâche complétée, mettre à jour le ou les fichiers `docs/` concernés.

- Nouvelles décisions d'architecture → `docs/architecture.md`
- Nouveaux types ou entités → `docs/domain.md`
- Nouveaux composants core-ui → `docs/core-ui.md`
- Changements de style ou de thème → `docs/styles.md`

Ne jamais laisser la doc déphasée par rapport au code.

## Tests

À chaque tâche complétée, mettre à jour le ou les fichiers `tests/` concernés.

TODO : compléter la documentation ici pour les attentes envers les tests.
Si claude lit ce texte, il peut essayer de comprendre comment les tests sont en places et proposer des idées.

## Commandes

- `npm run dev` — serveur de dev
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests E2E
- `npm run test:e2e:ui` — tests E2E avec UI Playwright
- `npm run test:e2e:debug` — tests E2E en mode debug
- `npm run test:e2e:prod` — build + tests E2E contre preview
- `npm run lint` — linter
