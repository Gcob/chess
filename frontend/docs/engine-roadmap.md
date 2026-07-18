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
- **Engine pur, hybride objets/fonctions** — `src/engine/` : l'API publique est des fonctions
  `(game, …) → void` qui mutent le DTO en place, zéro import Vue, zéro état de module. La réactivité vient
  du store qui wrap le DTO ; un websocket mutera le même DTO. À l'interne, classes permises (`Board`,
  `Piece`/`Square` wrappers, `Ray`, hiérarchie `MoveType`) si : état 100 % dérivé du board, durée de vie
  ≤ une position, jamais dans le DTO ni un store, zéro état de module mutable (flyweights constants OK).
  L'état vit dans le DTO, le comportement vit dans les classes — wrappers, jamais de modèle parallèle ;
  la donnée qui voyage est plate.
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
- [x] Doc (`domain.md`, `architecture.md`) à jour + tests unitaires

### ② Moteur de légalité

- [x] Patterns de déplacement par pièce via `MoveTypeId` — mapping `piece.type → move types` dans l'engine,
      une fonction de pattern par move type; les coups spéciaux à venir sont des stubs vides
- [x] Pion : avance simple/double (case traversée libre, `hasMoved`), capture diagonale
- [x] Glissantes : `linear` + `diagonal` (tour, fou, dame) via un walker commun par direction —
      capture le premier ennemi rencontré, jamais de saut
- [x] Cavalier : `l-shape` — 8 chemins de voisins (2 pas + 1 perpendiculaire), saute par-dessus tout,
      seule la case d'arrivée compte
- [x] Roi : `simple` — un pas dans les 8 directions ; `castling` = stub vide jusqu'à la phase ④,
      donc pas de roque possible d'ici là
- [x] Détection d'échec + `Player.isInCheck` — `getAttackers` (super-pièce : patterns inversés depuis la
      case, signatures d'attaque par move type — les types de pièces ne vivent que dans
      `getPieceMoveTypes`) + `findCheckers` (0, 1 ou 2 checkers) ; `isInCheck` = snapshot d'affichage
      mis à jour par `makeMove`, les checkers se recalculent à la demande
- [x] Clouages — `getPinDirection` calculé à la demande (champ `pinAbsoluteDirection` retiré du DTO,
      donnée dérivée) ; pièce clouée restreinte au rayon du clouage, capture du cloueur incluse ;
      seuls `linear`/`diagonal` clouent (`slidesAlong`)
- [x] Highlight du roi en échec (`isInCheck` = true) dans la vue — overlay `check` (rouge translucide)
      via `useGameView.checkSquares`, toujours affiché (pas de setting)
- [x] `canMove` complet : seuls les coups légaux passent — roi : destination sans attaquant
      (`getAttackers`) + garde x-ray « à travers le roi » (fuite le long du rayon d'une glissante) ;
      non-roi : 0 checker = géométrie + clouage, 1 = capture du checker ou interposition sur son rayon
      (∩ clouage), 2 = seul le roi bouge. Queries pures, jamais de move/undo simulé ; l'en passant qui
      découvre un échec arrivera avec la phase ④
- [x] `legalDestinations(board, from)` : toutes les destinations légales d'une pièce via UN `Board`
      partagé (~64 canMove) — l'API que consommeront les aides locales (Backlog UX/board) ; la
      phase ③ réutilise la même query (mat/pat = aucune destination légale pour aucune pièce)

### ③ Fins de partie automatiques

- [ ] Mat (victoire) et pat (nulle)
- [ ] Règle des 50 coups
- [ ] Triple répétition
- [ ] Matériel insuffisant
- [ ] `GameEndReason` : les valeurs sont déjà toutes déclarées — brancher la logique qui les produit
- [ ] Oracle chess.js (devDependency seulement) : spec de tests différentiels qui valide l'engine
      contre chess.js (coups légaux, mats, pats) — nos specs restent le contrat de NOTRE design ;
      s'étendra aux coups spéciaux en phase ④

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

## Backlog UX / board

Features UI en marge des phases engine — elles ne les bloquent jamais.

- [x] **Surbrillance des destinations légales** : point (case vide) / anneau (capture) via
      `view.legalTargets` → `legalDestinations` (phase ②), depuis la pièce saisie (dès la presse)
      ou sélectionnée ; setting `showLegalMoves` par observateur, défaut activé
- [x] **Animations réveillées** : `hop` (arc du sprite du cavalier pendant la glisse, gatée par
      `--moving`) et `snap-back` (tout relâchement sans coup joué — détecté sur `moves.length`,
      jamais via `legalTargets` qui est gaté par le setting)
- [x] **Drag mobile** : drag centré — la cible de drop est la case sous le doigt ; le sprite double
      depuis son coin bas-gauche avec une légère inclinaison (transition) et grossit vers le
      haut-droite, hors de l'ombre du pouce, où il flotte en boucle — case agrandie ombrée (`drop-target-touch`, façon
      key-preview) + code de destination au-dessus de la case, seulement sur une destination
      légale (`view.dropTargets`, jamais gaté par le setting des hints)
- [ ] Refactor du form nouvelle partie : le mode choisi (étape 1) pilote le reste du form —
      une composante de form par mode, pattern strategy (seul `local` existe, la structure doit
      être prête pour les autres) ; sélection de mode compacte sur mobile — les cartes actuelles
      prennent trop de place verticalement
- [ ] Politiques d'orientation en mode local, changeables en cours de partie : ① board auto-flip
      (actuel), ② board fixe + pièces pivotées sur elles-mêmes de 180° (jeu face à face autour
      d'un téléphone à plat), ③ board fixe côté blancs. Jamais de board renversé (noirs en bas)
      pour des joueurs locaux — la rotation 180° du board appartient aux modes distants et aux
      spectateurs (voir Backlog parties distantes). Réglage par observateur ; `orientation` est
      déjà un computed de policy (`useGameView`) — un changement à chaud se réoriente par
      réactivité, aucun cas spécial
- [ ] Identité visuelle des hints de coups légaux : remplacer points/anneaux (vocabulaire
      chess.com/Lichess) par de petites flèches discrètes orientées selon la direction du coup
      (verticale/horizontale/diagonale), animées en se dessinant depuis la pièce (stagger le long
      du rayon — la « ligne de vue » qui se déploie, écho de l'épic pédagogie) ; capture = look
      distinct à trancher (pointe de flèche « mordant » le bord de la case côté attaque, ou
      chevrons de coin façon target lock) ; cavalier = mini-flèche coudée en L (8 orientations) ;
      respecter `prefers-reduced-motion`
- [ ] Parties en cours listées sur l'accueil + les rejoindre (plus tard : filtrées par compte).
      Survivre au refresh = persister la liste de coups et la rejouer — réutilise la sérialisation
      des positions de départ hardcodées
- [ ] Assets de pièces inlinés dans le bundle (SVG via Vite) : élimine le flash de chargement async
      et honore « local = 100 % hors ligne ». Préchargement + loading seulement si le bundle grossit
- [ ] Spot discret des coordonnées de la case survolée — compléter l'illumination file/rangée de
      `cBoardFrame`, pas la doubler
- [ ] Dessiner des flèches (clic droit glissé, à la Lichess) — calque SVG au-dessus du board,
      mapping via `boardCoords`

## Backlog parties distantes

Features propres aux modes `vs-bot` / `private-remote` / `public-remote` — rien avant la phase ⑥.

- [ ] Pre-moves : préparer son coup pendant le tour adverse, exécuté dès le retour du trait.
      Sans objet en local — une seule souris joue les deux camps
- [ ] Politiques d'orientation des modes distants : board fixé du côté du joueur local —
      c'est ici que la rotation 180° du board existe (un joueur noir voit le board renversé) ;
      un spectateur choisit librement son côté et peut tourner le board à volonté.
      Même mécanique de policy (`useGameView.orientation`)

## Épic pédagogie *(horizon)*

Zone d'apprentissage des échecs — les idées s'accumulent ici, rien à faire pour le moment.

- [ ] Textes des règles enrichis, avec analogies et exemples concrets : on ne se pose jamais sur une
      pièce amie ; une glissante avance en « ligne de vue » — arrêtée par la première pièce rencontrée
      ou par le bord de l'échiquier

## Épic effets board *(horizon)*

Effets de jeu à la chess.com — hors scope pour le moment, les idées s'accumulent ici.

- [ ] Bulle éphémère du coup joué (SAN) près de la case d'arrivée, façon jeu vidéo — gated par un
      setting, profitera du SAN complet de la phase ⑤
- [ ] Feedback quand on tente de bouger une pièce pendant que son roi est en échec
- [ ] Effet de « flag » au timeout

## Nice-to-haves

Non bloquants, à faire si le cœur nous en dit.

- [ ] Spec Playwright features (`e2e/features/game.spec.ts`) : partie locale → 2 coups + historique,
      abandon → résultat affiché, nulle offerte / refusée / acceptée
- [ ] Revalider `e2e/ui/pages.spec.ts` contre la page game enrichie (ligne d'état, actions conditionnelles)
- [ ] `npm run lint` est documenté dans CLAUDE.md mais le script n'existe pas dans `package.json` —
      configurer ESLint et l'ajouter, ou retirer la mention

## Dettes connues

- **Board non sérialisable** — `Square.neighbors` forme un graphe circulaire ; le format wire sera la liste
  de coups (ou FEN), board reconstruit localement. À trancher en phase ⑥.
- **SAN naïf** — pas de désambiguïsation ni de `+`/`#` tant que la légalité n'existe pas (phase ⑤).
- **En passant découvrant un échec (phase ④)** — deux pions quittent le même rayon d'un coup ; le modèle
  clouage (1 bloqueur) ne le couvre pas, mais `Ray.blockers` est prêt (2 bloqueurs qui partent ensemble).
- **`getRaysFrom(square)`** — si un besoin futur veut les rayons hors du roi (éval d'IA, heatmap de
  contrôle), `PositionAnalysis.rays()` se généralise sans casser le vocabulaire.
- **`GameType` recalculé, jamais persisté** — vérifier son rôle quand le backend arrivera.
