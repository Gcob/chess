# Modèle du domaine

## Fichier unique : `src/types/chess.ts`

Toutes les interfaces et types du domaine échecs dans un seul fichier.
Types purs — pas de classes, pas de méthodes. La logique métier vit dans `src/engine/`.

## Philosophie

- Types = le *quoi*. Engine = le *comment*. Composables = wrappers réactifs minces.
- Le DTO `Game` reste du plain data sérialisable — il voyagera un jour (websocket, DB).
- Modèle de départ réfléchi, pas une spec rigide — on ajoute de la complexité au fil du temps.
- Les move types d'une pièce sont dérivés de `piece.type` par l'engine (`getPieceMoveTypes`),
  jamais stockés sur la pièce — donnée dérivable, et `type` change à la promotion.
  `MoveTypeId` reste le vocabulaire partagé du domaine.

## Hiérarchie des acteurs

- `Account` possède un `User`. `User` devient `Player` en jeu.
- `AI` est aussi un `Player` en jeu.
- `Player` = participant actif (couleur, isInCheck, timer?). Les metas (nom, elo, image) viennent de `PlayerMetas`.
- La connexion `Account`/`AI` → `Player` se fait au moment de la création de partie (store/composable),
  pas dans les types.

## Entités principales

| Interface     | Rôle                                                                                                        |
|---------------|-------------------------------------------------------------------------------------------------------------|
| `Account`     | Compte humain (email, statut) — étend `PlayerMetas`                                                         |
| `AI`          | Profil IA (stratégie, description) — étend `PlayerMetas`                                                    |
| `PlayerMetas` | Identité partagée (nom, elo?, image?)                                                                       |
| `Player`      | Participant en jeu (couleur, isInCheck, timer?)                                                             |
| `GameTime`    | Temps de partie structuré (minutes, incrément en secondes)                                                  |
| `GameType`    | Catégorie de partie (nom, minTime, maxTime en secondes)                                                     |
| `Timer`       | Horloge (secondsRemaining, secondsIncrement) — « qui tourne » est dérivé, jamais stocké                     |
| `Piece`       | Pièce (id, couleur, type, valeur, textRepresentation, hasMoved)                                             |
| `Square`      | Case (couleur, file, rank, piece, neighbors)                                                                |
| `Board`       | Échiquier — `Record<SquareKey, Square>`                                                                     |
| `BoardPiece`  | Projection plate `{ piece, square }` — pièce + sa case, dérivée du board pour le rendu                      |
| `Capture`     | Capture (pièce capturée)                                                                                    |
| `Move`        | Déplacement plain data (san, color, pieceType, from/to en SquareKey, elapsedSeconds, capture?, castling?)   |
| `GameResult`  | Fin de partie (winner — `null` = nulle —, reason)                                                           |
| `Game`        | Partie (createdAt, startedAt, status, result, mode, activeColor, drawOffer, turnStartedAt, time?, type,     |
|               | players{white,black}, board, moves)                                                                         |
| `GameSession` | Composition `{ id: string, game: Game }` — id ULID, pas d'héritage de `Game`                                |

## Types primitifs

```ts
type PieceColor = 'white' | 'black'
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type GameStatus = 'waiting' | 'active' | 'finished'
type GameEndReason = 'resignation' | 'timeout' | 'draw-agreement' | 'checkmate' | 'stalemate'
    | 'fifty-move-rule' | 'threefold-repetition' | 'insufficient-material'
    // domaine complet déclaré d'emblée — l'engine ne produit que les 3 premières pour l'instant
type GameMode = 'local' | 'private-remote' | 'public-remote' | 'vs-bot'
type Direction = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
type SquareKey = `${SquareFile}${SquareRank}` // 'a1' … 'h8' — 64 clés exactes
type CastlingSide = 'king-side' | 'queen-side'
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

`PIECE_DATA` centralise valeur, short et long text par type.
`King.value = 0` est un sentinel — le roi ne peut pas être capturé.

## Sessions de partie

- `GameSession = { id: string, game: Game }` — composition, pas d'héritage
- `id` : ULID, simulé côté frontend (`utils/ulid.ts`) tant qu'il n'y a pas de backend ;
  le backend/DB deviendra la source des vrais ULID. C'est la clé de la route `/game/:id`.
- Une session est autonome — elle contient tout ce dont une partie a besoin.
- `useGamesStore` est un registre de sessions actives. Max 1 actuellement, prévu pour N (tournois).

## Conventions

- `Square.file` = colonne (a–h), `Square.rank` = rangée (1–8) — notation standard
- `Piece.textRepresentation` : `short` (ex. `'K'`) et `long` (ex. `'King'`)
- `Move` est du plain data sérialisable — `from`/`to` en `SquareKey`, jamais des références `Square`
  (le graphe du board est circulaire). Le contexte en passant = l'entrée précédente de `Game.moves` :
  `enPassantTarget(moves)` dérive la cible (style FEN), passée en param optionnel aux queries de
  légalité — jamais stockée, elle expire par construction. `Move.enPassant` marque la capture
  (la case vidée est à côté de l'arrivée, pas l'arrivée).
  `pieceType` = la pièce déplacée — le compteur des 50 coups (`halfmovesSinceProgress`), la
  triple répétition (`isThreefoldRepetition`, signatures remontées à rebours de l'historique)
  et le SAN complet (phase ⑤) le lisent ; les deux queries de nulle sont dérivées de
  l'historique, jamais trackées à part.
- `Move.castling?` (`CastlingSide`) marque un roque — le saut de la tour se dérive du côté
  dans `applyMove`, jamais stocké. Les droits de roque de la signature de répétition se
  dérivent aussi de l'historique (premier contact des cases roi/tour) ; un roque est
  irréversible et borne la marche arrière comme un coup de pion ou une capture.
- `GameTime` utilise des props explicites (`minutes`, `secondsIncrement`) — jamais la notation `"2|1"`
- `Game.time` est optionnel — `undefined` = partie sans chrono
- `Direction` est le type partagé pour les 8 directions (voisins de case, rayons d'attaque et de clouage).
  Le clouage n'est jamais stocké sur la pièce — l'engine le calcule à la demande (`getPinDirection`)
- Légalité : un seul pipeline de restrictions successives, chacune auto-gardée (géométrie → sécurité
  du roi → sécurité du roque → clouage → sécurité en passant → réponse à l'échec), encapsulé dans la
  classe `MoveLegality` (`engine/moveLegality.ts`) et exposé en trois queries : `canMove` (un coup),
  `legalDestinations` (toutes les destinations d'une pièce — aides locales) et `hasAnyLegalMove`
  (une couleur a-t-elle encore un coup — la question mat/pat, court-circuite à la première
  destination trouvée), un seul `Board` partagé par query. Queries pures sur le board non muté —
  jamais de move/undo simulé. Les questions passent par la classe `Board` de l'engine (façade d'une
  position, durée de vie ≤ un coup, wrappers `Piece`/`Square` cachés), `MoveHistory` (même frontière
  pour `Game.moves` — droits et compteurs dérivés de l'historique) et `Ray` (ligne de vue d'une
  glissante, marchée À TRAVERS les pièces : 0 bloqueur = échec + prolongement x-ray derrière le roi,
  1 bloqueur ami = clouage)
- Patterns de déplacement et signatures d'attaque : dans les sous-classes de `MoveType` (une classe par
  move type, alignée sur le MDD). `getPieceMoveTypes` reste l'unique mapping pièce → move types
- Les directions sont **absolues du point de vue des blancs** : `'top'` = rank croissant (vers rank 8).
  La logique de déplacement traduit selon la couleur du joueur.
- `Game.activeColor` — source de vérité pour "à qui le tour". Initialisé à `'white'`,
  mis à jour à chaque `makeMove()`. Robuste contre les coups annulés, la reprise FEN, et le mode spectateur.
  Aligné avec FEN (`w`/`b`). Ne jamais dériver le tour courant de `moves.length`.
- `Game.players` — objet `{ white: Player; black: Player }`, pas un tableau.
  Accès par couleur : `game.players[game.activeColor]`.
- `Player.timer?` — le timer vit dans le joueur, pas dans `Game`. `Game.time` reste la config (GameTime),
  le timer runtime est dans `player.timer`. Partie non chronométrée = `timer: undefined`.
- **Horloge par timestamps** — `Game.turnStartedAt` (epoch ms) est la base : le temps restant se
  **calcule** (`remainingSeconds`), il ne se décrémente jamais. `timer.secondsRemaining` n'est réglé
  qu'au moment du coup (débit + incrément). Secondes volontairement fractionnaires — l'affichage arrondit.
- `Game.result` — réglé exactement quand `status` passe à `'finished'`, toujours via le `endGame()`
  interne de l'engine (avec `drawOffer` et `turnStartedAt` remis à `null` ensemble).
- `Game.drawOffer` — offre de nulle pendante (couleur de l'offreur). Jouer un coup la refuse.
- `Piece.id` — identité stable `{short}{caseDeDépart}` (ex. `Pe2`, `Ra1`, `Ke1`), assignée à la création du board.
  Survit aux déplacements et à la promotion (`Pe7` reste `Pe7` même devenue dame).
  Sert de `key` Vue pour la couche d'animation des pièces — la même pièce = le même nœud DOM qui glisse.
- `Piece.hasMoved` — initialisé à `false`, passé à `true` au premier déplacement.
  Requis pour : droits de roque (roi + tours), double avance initiale du pion.
- `Player.isInCheck` — snapshot d'affichage mis à jour à chaque `makeMove`.
  L'engine ne le lit jamais : les checkers se recalculent à la demande (`findCheckers`).
- `Move.san` contient la notation **SAN** (Standard Algebraic Notation) —
  ex. `'e4'`, `'Nf3'`, `'O-O'`, `'exd5'`, `'Qxh7#'`. Le PGN (format de partie complète) viendra plus tard.

## Concepts à intégrer éventuellement

- **State pattern** — réalisé en version *fonctionnelle* : le statut est une donnée du DTO, les
  comportements par statut sont des guards dans les commandes de `engine/game.ts` (pas de classes,
  le DTO reste sérialisable).
- **GameMode** — les valeurs sont là ; `local` est câblé, les autres viendront avec le backend.
