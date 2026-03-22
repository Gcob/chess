# Projet : Jeu d'échecs

Petit projet solo — développeur : Jacob.

## Mes attentes

- Ne jamais aller trop vite. Un pas à la fois.
- Toujours valider le plan avant d'implémenter.
- Je suis développeur senior — traite-moi ainsi. Explique seulement si je le demande.
- Code et commentaires 100 % en anglais. Commentaires uniquement pour les choses complexes.
- Je parle français canadien — nos échanges sont en français.
- Valider le typescript autant que possible et le build pour s'assurer que tout fonctionne correctement à chaque
  changement.

## Documentation

La doc est séparée en fichiers thématiques dans `docs/`. Lis le fichier pertinent avant chaque tâche.

| Fichier                 | Contenu                                              |
|-------------------------|------------------------------------------------------|
| `docs/architecture.md`  | Stack, structure des dossiers, conventions générales |
| `docs/domain.md`        | Modèle du domaine, types, interfaces                 |
| `docs/styles.md`        | SCSS, thèmes, typographie, palette                   |
| `docs/core-ui.md`       | Composants core-ui, composables associés             |
| `docs/look-and-feel.md` | Thèmes de pièces et de board, assets, useChessTheme  |

## Style de la doc

Les fichiers `docs/` doivent respecter une largeur maximale d'environ 120 caractères par ligne.
Pour les longues phrases, préférer les sauts de ligne après une ponctuation (`.`, `,`, `—`, `:`)
plutôt qu'en plein milieu d'une proposition. J'utilise l'auto-formatage de PHPStorm 
et j'aimerais que tu utilises le même style de formatage pour la doc.

## Mise à jour de la doc

À chaque tâche complétée, mettre à jour le ou les fichiers `docs/` concernés.

- Nouvelles décisions d'architecture → `docs/architecture.md`
- Nouveaux types ou entités → `docs/domain.md`
- Nouveaux composants core-ui → `docs/core-ui.md`
- Changements de style ou de thème → `docs/styles.md`

Ne jamais laisser la doc déphasée par rapport au code.

## Tests

À chaque tâche complétée, mettre à jour les tests unitaires concernés.
Les tests E2E sont mis à jour séparément, selon leur propre rythme.

- Nouveau composant core-ui → `.spec.ts` colocalisé obligatoire
- Nouveau composable ou factory → `.spec.ts` colocalisé
- Modification d'une interface ou d'un comportement → mettre à jour les specs existantes

Ne jamais laisser un test échouer silencieusement.

## Commandes

- `npm run dev` — serveur de dev
- `npm run test:unit` — tests unitaires
- `npm run test:e2e` — tests E2E
- `npm run test:e2e:ui` — tests E2E avec UI Playwright
- `npm run test:e2e:debug` — tests E2E en mode debug
- `npm run test:e2e:prod` — build + tests E2E contre preview
- `npm run lint` — linter
