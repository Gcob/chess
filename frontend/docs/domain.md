# Modèle du domaine

## Fichier unique : `src/types/chess.ts`

Toutes les interfaces et types du domaine échecs dans un seul fichier. Types purs — pas de classes, pas de méthodes. La
logique métier vit dans les composables.

## Philosophie

- Types = le *quoi*. Composables = le *comment*.
- Modèle de départ réfléchi, pas une spec rigide — on ajoute de la complexité au fil du temps.
- Les `conditions` et `effects` dans `MoveType` sont des string identifiants interprétés par les composables.

## Hiérarchie des acteurs

- `Account` possède un `User`. `User` devient `Player` en jeu.
- `AI` est aussi un `Player` en jeu.
- `Player` = participant actif (nom, elo, image, couleur, isInCheck).
- La connexion `User`/`AI` → `Player` se fait au moment de la création de partie (store/composable), pas dans les types.

## Entités principales

| Interface     | Rôle                                                                                         |
|---------------|----------------------------------------------------------------------------------------------|
| `User`        | Profil humain (nom, image)                                                                   |
| `Account`     | Compte lié à un User (email, date, statut)                                                   |
| `AI`          | Profil IA (nom, elo, image, stratégie, description)                                          |
| `Player`      | Participant en jeu (couleur, isInCheck)                                                      |
| `GameTime`    | Temps de partie structuré (minutes, incrément en secondes)                                   |
| `GameType`    | Catégorie de partie (nom, minTime, maxTime en secondes)                                      |
| `Timer`       | Horloge active (isActive, currentTime, increment)                                            |
| `MoveType`    | Type de déplacement (id, conditions[], effects[])                                            |
| `Piece`       | Pièce (couleur, type, valeur, images, textRepresentation, pinDirection, hasMoved, moveTypes) |
| `Square`      | Case (couleur, file, rank, piece, neighbors)                                                 |
| `Board`       | Échiquier — `Record<SquareKey, Square>`                                                      |
| `Capture`     | Capture (pièce capturée)                                                                     |
| `Move`        | Déplacement (pgn, elapsedTime, from, to, affectedPieces, moveTypes, capture?, previousMove?) |
| `Game`        | Partie (startedAt, status, mode, time?, type, players[2], timers?, board, moves)             |
| `GameSession` | Composition `{ id: number, game: Game }` — pas d'héritage de `Game`                          |

## Types primitifs

```ts
type PieceColor = 'white' | 'black'
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type GameStatus = 'waiting' | 'active' | 'paused' | 'finished'
type GameMode = 'local' | 'private-remote' | 'public-remote' | 'vs-bot'
type Direction = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
type SquareKey = `${SquareFile}${SquareRank}` // 'a1' … 'h8' — 64 clés exactes
type MoveTypeId = 'simple' | 'castling' | 'linear-forward' | 'linear-forward-double'
    | 'diagonal-forward-capture' | 'en-passant' | 'promotion'
    | 'diagonal' | 'linear' | 'l-shape'
```

## Board — graphe de cases chaînées

`Board.squares` est un `Record<SquareKey, Square>` — accès O(1) par notation échecs : `board.squares['e4']`.

Chaque `Square` est un nœud du graphe avec 8 voisins :

```ts
neighbors: Record<Direction, Square | null>
// null = bord de l'échiquier dans cette direction
```

Traversée naturelle pour une pièce glissante :

```ts
let current: Square | null = square.neighbors['top']
while (current) {
    // logique de déplacement
    current = current.neighbors['top']
}
```

### Initialisation (`createInitialBoard`)

Trois passes :

1. Créer les 64 `Square` (file, rank, color, `piece: null`, `neighbors` vides)
2. Lier les voisins (remplir `neighbors` avec les références réelles)
3. Placer les 32 pièces via `INITIAL_SETUP` (map `SquareKey → [PieceColor, PieceType]`)

La couleur d'une case : `(fileIndex + rank) % 2 === 1 → dark` — a1 est dark, h1 est light.

`PIECE_DATA` centralise valeur, short et long text par type. `King.value = 0` est un sentinel — le roi ne peut pas être capturé. `moveTypes: []` pour l'instant — populé quand on implémente la logique de déplacement.

## Sessions de partie

- `GameSession = { id: number, game: Game }` — composition, pas d'héritage
- `id` : entier simple assigné par le store (1, 2, 3...). Sera l'id backend éventuellement.
- Une session est autonome — elle contient tout ce dont une partie a besoin.
- `useGamesStore` est un registre de sessions actives. Max 1 actuellement, prévu pour N (tournois).

## Conventions

- `Square.file` = colonne (a–h), `Square.rank` = rangée (1–8) — notation standard
- `Piece.images.capture` est optionnel — fallback vers `images.board` si absent
- `Piece.textRepresentation` : `short` (ex. `'K'`) et `long` (ex. `'King'`)
- `Move.previousMove` fournit le contexte pour la validation en passant
- `GameTime` utilise des props explicites (`minutes`, `increment`) — jamais la notation `"2|1"`
- `Game.time` et `Game.timers` sont optionnels — `undefined` = partie sans chrono
- `Direction` est le type partagé pour les 8 directions (voisins de case ET clouage de pièce)
- Les directions sont **absolues du point de vue des blancs** : `'top'` = rank croissant (vers rank 8). La logique de déplacement traduit selon la couleur du joueur.
- `Piece.hasMoved` — initialisé à `false`, passé à `true` au premier déplacement. Requis pour : droits de roque (roi + tours), double avance initiale du pion.
- `Move.pgn` contient la notation **SAN** (Standard Algebraic Notation) — ex. `'e4'`, `'Nf3'`, `'O-O'`, `'exd5'`, `'Qxh7#'`

## Concepts à intégrer éventuellement

- **Theme** (Strategy pattern) pour les images — `Piece.images.board` est déjà un `string`, le thème se branchera sans
  casser les types
- **State pattern** pour `GameStatus` — l'union de types suffit pour l'instant
- **GameMode** — les valeurs sont là, le comportement viendra plus tard
