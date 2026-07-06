# Roadmap — engine

Point de repère pour suivre la progression de l'engine : les principes sont figés ici, les phases sont des
checklists cochées au fil du développement.

**Portée : le mode `local` seulement.** On développe l'engine frontend en local exprès pour progresser une
étape à la fois, avec un retour visuel immédiat — même machine, même client, pas de réseau. La suite
(backend Laravel : DB, websocket, inter-langue, parties multi-machines) est un autre univers, gardé pour
plus tard ; cet engine servira de référence pour le bâtir.

## Principes directeurs (décidés, non négociables)

- **Un gros DTO par partie** — `Game` (wrappé dans `GameSession`) encapsule tout : board, joueurs, coups,
  statut, temps. Pas de singleton : `useGamesStore` est un registre, N parties observables en parallèle
  (spectateurs, plusieurs boards sur une même page).
- **DTO = plain data sérialisable** — pas de classes ni de méthodes dans le DTO : il doit pouvoir voyager
  (websocket, DB). Toute la logique vit dans l'engine.
- **Engine pur** — `src/engine/` : fonctions `(game, …) → void` qui mutent le DTO en place, zéro import Vue,
  zéro état de module. La réactivité vient du store qui wrap le DTO ; un websocket mutera le même DTO.
- **State pattern fonctionnel** — le statut est une donnée (`waiting → active → finished`) ; chaque commande
  de l'engine est gardée par le statut (ex. `makeMove` refuse si la partie est finie). Pas d'objets-état.
- **Le trait vit dans `activeColor`** — jamais encodé dans le statut, jamais dérivé de `moves.length`.
  Aligné FEN (`w`/`b`). « Trait aux blancs » = `status === 'active' && activeColor === 'white'`.
- **Ressources externes = références** — le DTO n'embarque jamais `Account`/`AI` ; seulement un snapshot
  d'affichage `Player.metas` (nom, avatar) + une référence (`accountId`) quand le backend existera.
- **IDs de partie en ULID** — `GameSession.id: string`. Simulé côté frontend (util maison) tant qu'il n'y a
  pas de backend ; le backend/DB deviendra la source des vrais ULID.
- **Cadran par timestamps** — aucune horloge dans l'engine. `turnStartedAt` (epoch ms) dans le DTO ; le
  temps restant se calcule, il ne se décrémente pas. Un composable ne fait que ticker un `now` réactif.
  Robuste aux onglets inactifs, compatible sync serveur.
- **Données dérivées, jamais dupliquées** — captures et diff matériel dérivés de `game.moves` ;
  l'historique est la source de vérité.
- **Engine miroir backend** — le backend aura son propre engine (source de vérité en remote) ; celui du
  frontend sert le jeu local et les aides locales. Mêmes concepts, mêmes commandes.

## Impact des modes de partie

Les `GameMode` ont des impacts structurels — à garder en tête à chaque phase :

| Mode             | Backend / WS / DB | Cadran                  | Particularités                        |
|------------------|-------------------|-------------------------|---------------------------------------|
| `local`          | ❌ aucun          | optionnel (seul mode)   | 2 joueurs même écran, board auto-flip |
| `vs-bot`         | ✅                | obligatoire             | l'IA joue via le backend              |
| `private-remote` | ✅                | obligatoire             | invitation privée                     |
| `public-remote`  | ✅                | obligatoire             | matchmaking public                    |

- `local` est le **seul** mode sans connexion backend : pas de websocket, pas de DB, ULID simulé localement.
- `local` est le **seul** mode où le cadran peut être retiré (`Game.time` undefined = sans chrono).
- Les policies par mode (orientation, qui peut jouer, offres de nulle) vivent dans `useGameView`, pas
  éparpillées dans l'UI.

## Phases

### ① Fondations — gestion de partie *(en cours)*

- [x] Roadmap (ce fichier)
- [x] Statuts : `waiting | active | finished` (`paused` retiré), guards par commande dans l'engine
- [x] `GameResult` (`winner: PieceColor | null` + `GameEndReason`) dans le DTO
- [x] ULID simulé (`src/utils/ulid.ts`) + `GameSession.id: string` propagé (store, factory, routes)
- [x] `Move` simplifié et sérialisable (`from`/`to: SquareKey`, couleur, san, temps écoulé, capture)
- [x] Respect du trait dans `makeMove` (pièce du joueur au trait seulement)
- [x] Historique : enregistrement des `Move` + SAN naïf
- [x] Captures et diff matériel dérivés de l'historique (fin du hardcode `material.ts`)
- [x] Cadran : `turnStartedAt` + incrément au coup + `useGameClock` + affichage réel + victoire au temps
- [x] Abandon (bouton, confirmation) → `finished` + résultat
- [x] Nulle par accord : offre / acceptation / refus (jouer un coup = refuser)
- [x] Historique branché dans `MoveHistory`, résultat affiché en fin de partie
- [ ] Doc (`domain.md`, `architecture.md`) + tests unitaires + spec Playwright features

### ② Moteur de légalité

- [ ] Patterns de déplacement par pièce via `moveTypes` (graphe de voisins pour les glissantes)
- [ ] Pion : avance simple/double, capture diagonale
- [ ] Détection d'échec + `Player.isInCheck`
- [ ] Clouages (`pinAbsoluteDirection`) — interdit d'exposer son roi
- [ ] `canMove` complet : seuls les coups légaux passent
- [ ] Aides locales : surbrillance des destinations légales, animations `hop` / `snap-back` réveillées

### ③ Fins de partie automatiques

- [ ] Mat (victoire) et pat (nulle)
- [ ] Règle des 50 coups
- [ ] Triple répétition
- [ ] Matériel insuffisant
- [ ] `GameEndReason` : les valeurs sont déjà toutes déclarées — brancher la logique qui les produit

### ④ Coups spéciaux

- [ ] Roque (petit/grand, droits via `hasMoved`, cases traversées non attaquées)
- [ ] En passant (contexte = coup précédent de l'historique)
- [ ] Promotion (choix de pièce dans l'UI ; l'id de la pièce survit — `Pe7` reste `Pe7`)

### ⑤ SAN complet & PGN

- [ ] Désambiguïsation (`Nbd2`, `R1e2`)
- [ ] `+` / `#`, `O-O` / `O-O-O`, `=Q`
- [ ] Export PGN complet (en-têtes, résultat)

### ⑥ Sync backend / websocket *(horizon — aura son propre roadmap côté backend Laravel)*

- [ ] Backend = source de vérité (vrais ULID, arbitrage des coups, horloge serveur)
- [ ] Identité des commandes : qui a le droit de jouer / accepter / refuser (sans objet en local — un
      seul écran, une seule souris)
- [ ] Format wire du DTO (liste de coups ou FEN — le board circulaire ne voyage pas, il se reconstruit)
- [ ] Sync du DTO par websocket — le mode `local` reste 100 % hors ligne
- [ ] Spectateurs : observer une ou plusieurs parties sur une même page
- [ ] Policies par mode finalisées (`vs-bot`, `private-remote`, `public-remote`)

## Dettes connues

- **Board non sérialisable** — `Square.neighbors` forme un graphe circulaire ; le format wire sera la liste
  de coups (ou FEN), board reconstruit localement. À trancher en phase ⑥.
- **SAN naïf** — pas de désambiguïsation ni de `+`/`#` tant que la légalité n'existe pas (phase ⑤).
- **`MoveType` / `moveTypes` inertes** — les types existent, la logique arrive en phase ②.
- **Animations dormantes** — `hop` (cavalier) et `snap-back` (coup refusé) attendent la phase ②.
- **`GameType` recalculé, jamais persisté** — vérifier son rôle quand le backend arrivera.
