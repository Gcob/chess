# Modèle du domaine

## Fichier unique : `src/types/chess.ts`

Toutes les interfaces et types du domaine échecs dans un seul fichier. Types purs — pas de classes, pas de méthodes. La logique métier vit dans les composables.

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

| Interface  | Rôle                                                                                         |
|------------|----------------------------------------------------------------------------------------------|
| `User`     | Profil humain (nom, image)                                                                   |
| `Account`  | Compte lié à un User (email, date, statut)                                                   |
| `AI`       | Profil IA (nom, elo, image, stratégie, description)                                          |
| `Player`   | Participant en jeu (couleur, isInCheck)                                                      |
| `GameTime` | Temps de partie structuré (minutes, incrément en secondes)                                   |
| `GameType` | Catégorie de partie (nom, minTime, maxTime en secondes)                                      |
| `Timer`    | Horloge active (isActive, currentTime, increment)                                            |
| `MoveType` | Type de déplacement (id, conditions[], effects[])                                            |
| `Piece`    | Pièce (couleur, type, valeur, images, textRepresentation, pinDirection, moveTypes)           |
| `Square`   | Case (couleur, file a-h, rank 1-8, pièce nullable)                                           |
| `Board`    | Échiquier (64 cases)                                                                         |
| `Capture`  | Capture (pièce capturée)                                                                     |
| `Move`     | Déplacement (pgn, elapsedTime, from, to, affectedPieces, moveTypes, capture?, previousMove?) |
| `Game`     | Partie (startedAt, status, mode, time, type, players[2], timers[2], board, moves)            |
| `GameSession` | Composition `{ id: number, game: Game }` — pas d'héritage de `Game`                      |

## Types primitifs

```ts
type PieceColor     = 'white' | 'black'
type PieceType      = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type GameStatus     = 'waiting' | 'active' | 'paused' | 'finished'
type GameMode       = 'local' | 'private-remote' | 'public-remote' | 'vs-bot'
type PinDirection   = 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
type MoveTypeId     = 'simple' | 'castling' | 'linear-forward' | 'linear-forward-double'
                    | 'diagonal-forward-capture' | 'en-passant' | 'promotion'
                    | 'diagonal' | 'linear' | 'l-shape'
```

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

## Concepts à intégrer éventuellement

- **Theme** (Strategy pattern) pour les images — `Piece.images.board` est déjà un `string`, le thème se branchera sans casser les types
- **State pattern** pour `GameStatus` — l'union de types suffit pour l'instant
- **GameMode** — les valeurs sont là, le comportement viendra plus tard
