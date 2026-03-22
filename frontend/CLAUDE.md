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

### Tests unitaires (`src/**/*.spec.ts` — Vitest)

À chaque tâche complétée, mettre à jour les tests unitaires concernés.

- Nouveau composant core-ui → `.spec.ts` colocalisé obligatoire
- Nouveau composable ou factory → `.spec.ts` colocalisé
- Modification d'une interface ou d'un comportement → mettre à jour les specs existantes

### Tests Playwright (`e2e/` — 3 catégories)

| Catégorie | Dossier         | Navigateurs                 | But                                          |
|-----------|-----------------|-----------------------------|----------------------------------------------|
| UI        | `e2e/ui/`       | Chrome + Mobile + Tablette  | Pages et composantes majeures pas brisées    |
| Features  | `e2e/features/` | Chrome seulement            | Comportements attendus (locale, thème, etc.) |
| E2E flows | `e2e/flows/`    | Chromium + Firefox + WebKit | Scénarios complets end-to-end                |

- Tests UI : légers, vérifient dans les grandes lignes (visibility, texte, éléments clés)
- Tests features : une feature = un fichier (ex. `locale.spec.ts`, `theme.spec.ts`)
- Tests E2E : scénarios réalistes, réservés aux flux critiques

Ne jamais laisser un test échouer silencieusement.

## Commandes

- `npm run dev` — serveur de dev
- `npm run test:unit` — tests unitaires (Vitest)
- `npm run test:ui` — tests UI Playwright (Chrome + mobile + tablette)
- `npm run test:features` — tests features Playwright (Chrome)
- `npm run test:e2e` — tests E2E flows Playwright (3 navigateurs)
- `npm run test:e2e:ui` — Playwright en mode UI interactif
- `npm run test:e2e:debug` — Playwright en mode debug
- `npm run test:e2e:prod` — build + tous les tests Playwright contre preview
- `npm run lint` — linter
