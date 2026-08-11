# Spec — Export PGN (phase ⑤)

## Portée

Export PGN seulement. `buildPgn(game): string` pur + en-têtes + résultat + tests + oracle + bouton de
copie dans le panneau dev. L'import (parsing SAN → coups, semis de scénarios dev) est un cycle distinct
qui suivra.

## Architecture

Nouveau fichier engine pur : `src/engine/pgn.ts`, exportant `buildPgn(game: Game): string`.
Zéro import Vue, zéro état de module — même moule que `san.ts`. Il ne lit que le DTO : les `Move.san`
déjà stockés (complets, avec `+`/`#`/`=Q`/`O-O`), `result`, `players`, `time`, `createdAt`.

`buildPgn` orchestre ; la logique est découpée en petites fonctions nommées par intention (principe des
unités explicites de ce projet) :

- `buildHeaders(game): string`
- `buildMovetext(moves, result): string`
- `resultToken(result): string`
- `terminationText(result): string`
- `timeControlTag(time): string`
- `formatDate(date): string`
- `wrapTokens(tokens): string`
- `escapeHeader(value): string`

Sortie = bloc d'en-têtes + ligne vide + movetext (movetext terminé par un saut de ligne, façon PGN).

## En-têtes — Seven Tag Roster + extras

Ordre fixe : les 7 tags du STR, puis nos extras.

```
[Event "?"]
[Site "?"]
[Date "2026.07.19"]
[Round "-"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]
[TimeControl "600+5"]
[Termination "White won by checkmate"]
```

- `Event` / `Site` = `"?"`, `Round` = `"-"` — conventions PGN pour une valeur inconnue / non applicable.
- `Date` = `game.createdAt` formaté `YYYY.MM.DD` (composantes locales, chiffres zéro-paddés).
- `White` / `Black` = `players.<color>.metas.name`, échappés PGN : `\` → `\\` et `"` → `\"`
  (`escapeHeader`).
- `Result` = jeton de résultat (voir plus bas) — même valeur que le jeton final du movetext.
- `TimeControl` = `${minutes * 60}+${secondsIncrement}` (ex. `600+5`), ou `-` si `time` est `undefined`
  (partie sans chrono).
- `Termination` = **présent seulement si la partie est finie** (omis tant qu'elle est en cours). Valeur
  descriptive dérivée de `GameResult` (voir table).

### Jeton de résultat (`resultToken`)

| état | jeton |
|------|-------|
| finie, gagnant blanc | `1-0` |
| finie, gagnant noir | `0-1` |
| finie, nulle (`winner === null`) | `1/2-1/2` |
| non finie (`result === null`) | `*` |

### Termination descriptif (`terminationText`)

Le gagnant est nommé par sa **couleur** (`White` / `Black`), jamais par le nom du joueur.

| `reason` | valeur |
|----------|--------|
| `checkmate` | `<Winner> won by checkmate` |
| `resignation` | `<Winner> won by resignation` |
| `timeout` (avec gagnant) | `<Winner> won on time` |
| `timeout` (nulle) | `Game drawn on time (insufficient material)` |
| `stalemate` | `Game drawn by stalemate` |
| `fifty-move-rule` | `Game drawn by fifty-move rule` |
| `threefold-repetition` | `Game drawn by threefold repetition` |
| `insufficient-material` | `Game drawn by insufficient material` |
| `draw-agreement` | `Game drawn by agreement` |

`draw-agreement` a toujours `winner === null`. `timeout` est la seule raison qui se décline en victoire
OU nulle (règle du drapeau FIDE 6.9) — départagée par `winner`.

## Movetext

Numéro de coup avant chaque coup blanc (`Math.floor(i / 2) + 1` suivi de `.`), puis le `san` du coup.
Les `san` sont déjà complets — rien à recalculer. Jeton de résultat en dernier jeton.

```
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ... 1-0
```

- **Wrapping au standard PGN** : lignes ≤ 80 colonnes, coupées entre jetons (`wrapTokens` accumule les
  jetons et passe à la ligne quand ajouter le suivant dépasserait 80).
- Partie sans coups → le movetext est le seul jeton de résultat (ex. `*`).

## UI — bouton « Copier PGN » dans DevGamePanel

Le panneau dev (`DevGamePanel.vue`, déjà gaté par `devMode`) gagne un bouton dans sa rangée de boutons :

- Libellé `game.dev.copyPgn` (i18n fr + en), icône `ClipboardCopy` (lucide), variant `ter`.
- Au clic : récupère la partie courante via `gamesStore` + `route.params.id`, appelle `buildPgn(game)`,
  puis `navigator.clipboard.writeText(pgn)`.
- Échec du clipboard = silencieux (outil dev, pas de gestion d'erreur cérémonieuse).

Le game DTO n'apprend jamais l'existence de cet outil — pur affichage gaté par le setting.

## Tests

### `src/engine/pgn.spec.ts` (colocalisé)

- En-têtes : chaque tag présent et dans l'ordre ; placeholders `?` / `-` ; format de `Date` ;
  échappement des noms (`"` et `\`) ; `TimeControl` timed et untimed (`-`).
- `Termination` : la chaîne exacte pour chacune des raisons (les deux variantes de `timeout`) ;
  absent quand la partie est en cours.
- Résultat : les 4 jetons (`1-0`, `0-1`, `1/2-1/2`, `*`).
- Movetext : numérotation, wrapping à 80 colonnes, partie vide.
- Snapshot d'une petite partie complète (en-têtes + movetext).

### Oracle — `src/engine/oracle.spec.ts`

Pour les parties seedées existantes, comparer NOTRE movetext à celui de `chess.js` (`.pgn()`), en-têtes
retirés et espaces normalisés. Attrape toute dérive de numérotation ou de jeton de résultat, par-dessus
les SAN déjà validés caractère pour caractère. Les en-têtes ne sont pas comparés (notre `Termination`
descriptif est volontairement custom).

### `src/components/game/DevGamePanel.spec.ts`

- Le bouton « Copier PGN » est rendu quand `devMode` est actif.
- Le clic appelle `navigator.clipboard.writeText` avec la sortie de `buildPgn` (clipboard mocké).

## Gestion d'erreur

`buildPgn` est total : ne jette jamais. Partie en cours → `Result` `*` et pas de tag `Termination`.
Noms échappés. Côté UI, un échec de clipboard est avalé.

## Doc à mettre à jour

- `docs/engine-roadmap.md` : cocher « Export PGN complet (en-têtes, résultat) », note d'implémentation.
- `docs/architecture.md` : une ligne pour `engine/pgn.ts` (export PGN pur).

## Hors portée (cycle suivant)

Import PGN, parsing SAN → coups, semis de scénarios dev à partir de PGN, scénarios edge cases.
