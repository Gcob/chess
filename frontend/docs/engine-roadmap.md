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

| Mode             | Backend / WS / DB | Cadran                | Particularités                        |
|------------------|-------------------|-----------------------|---------------------------------------|
| `local`          | ❌ aucun           | optionnel (seul mode) | 2 joueurs même écran, board auto-flip |
| `vs-bot`         | ✅                 | obligatoire           | l'IA joue via le backend              |
| `private-remote` | ✅                 | obligatoire           | invitation privée                     |
| `public-remote`  | ✅                 | obligatoire           | matchmaking public                    |

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

- [x] Mat (victoire) et pat (nulle) — `hasAnyLegalMove(board, color)` dans `makeMove` : le nouveau
  trait sans aucun coup légal termine la partie (`checkmate` s'il est en échec, sinon
  `stalemate`) ; l'affichage du résultat et le gel des commandes existaient depuis la phase ①
- [x] Règle des 50 coups — `halfmovesSinceProgress(game)` : compteur dérivé de l'historique
  (remonté depuis la fin jusqu'au premier coup de pion ou capture, jamais tracké à part) ;
  100 demi-coups sans progrès = nulle automatique dans `makeMove`. `Move.pieceType` ajouté
  au DTO (le SAN complet de la phase ⑤ le lira aussi)
- [x] Triple répétition — l'identité d'une position vit dans `board.ts` (un board EST une
  position : `getPlacement` + `placementSignature` — placement type+couleur par case +
  trait, string complète, jamais un hash numérique) ; `isThreefoldRepetition(game)` remonte
  l'historique à rebours dans une map détachée (jamais le board réactif), arrêt au premier
  coup irréversible (pion/capture) ; 3ᵉ occurrence = nulle automatique. Les droits
  roque/en passant rejoindront la signature en phase ④
- [x] Matériel insuffisant — `hasInsufficientMaterial(board)` dans `makeMove` (après mat/pat) :
  position morte = nulle automatique. Aligné chess.js : roi vs roi, une mineure seule, ou
  fous seuls tous sur la même couleur de cases (la paire classique couvre les deux couleurs,
  donc jamais morte)
- [x] Timeout vs matériel insuffisant = nulle (règle du drapeau, FIDE 6.9) —
  `hasMatingMaterial(board, color)` dans `flagTimeout` : le drapeau tombé ne perd que si
  l'adversaire peut encore mater, jugé sur son seul matériel (convention standard en ligne :
  roi seul, roi + 1 mineure, fous mono-couleur = pas de matériel de mat), sinon nulle au temps
- [x] `GameEndReason` : les valeurs sont déjà toutes déclarées — brancher la logique qui les produit
  *(fait — les 8 raisons ont toutes leur chemin : abandon, temps — victoire ou nulle du drapeau —,
  accord, mat, pat, 50 coups, répétition, matériel)*
- [x] Oracle chess.js (devDependency seulement) — `src/engine/oracle.spec.ts` : parties
  aléatoires seedées (PRNG déterministe, rejouables) jouées par NOTRE engine et miroir
  dans chess.js, chaque position comparée pièce par pièce (destinations légales, état
  d'échec) + accord sur les fins automatiques. Les trous de la phase ④ sont exclus exprès
  (flags roque/en passant filtrés, poussées de promotion jamais jouées) — les réactiver
  fera partie de la phase ④. Nos specs restent le contrat de NOTRE design

### ④ Coups spéciaux *(complète — l'engine couvre toutes les règles FIDE du jeu)*

- [x] Roque (petit/grand, droits via `hasMoved`, cases traversées non attaquées) — géométrie dans
  `CastlingMoveType` (marche vers une tour jamais bougée, cases libres), sécurité dans le
  pipeline (`restrictToSafeCastling` : jamais depuis un échec ni à travers une case attaquée ;
  b1/b8 peut être attaquée), tour déplacée par `applyMove` (saut dérivé de `Move.castling`),
  SAN `O-O`/`O-O-O` immédiat, droits de roque dans la signature de répétition (dérivés de
  l'historique, roque = borne irréversible de la marche), flags `k`/`q` réactivés dans l'oracle
- [x] En passant (contexte = coup précédent de l'historique) — `enPassantTarget(moves)` dérivé,
  jamais stocké ; la cible voyage en param optionnel des queries (`canMove`,
  `legalDestinations`, `hasAnyLegalMove` — l'ep peut être la seule parade au mat/pat) et
  roule sur le `Board` engine ; géométrie dans `EnPassantMoveType` (victime = pion ennemi
  derrière la cible) ; échecs découverts couverts par `restrictToSafeEnPassant` (les 2
  cases vidées d'un coup, rayon re-bloqué par l'atterrissage permis — la dette « 2
  bloqueurs » est réglée) ; capture du checker par ep dans `restrictToCheckResponses` ;
  victime retirée par `applyMove` ; `Move.enPassant` + SAN `exd6` ; droit ep dans la
  signature de répétition (seulement si pseudo-capturable, aligné chess.js/FIDE 9.2) ;
  oracle sans filtre `e`
- [x] Promotion — ferme la phase ④, règles FIDE complètes. Engine : `makeMove` gagne le choix
  (`promotion`, 5ᵉ param) ; poussée de promotion sans choix valide = no-op, commande
  incomplète — jamais de dame silencieuse (`isPromotionMove`/`isPromotionChoice`) ;
  `transformPiece` change type/valeur/texte, l'id
  survit (`Pe7` reste `Pe7`) ; le `Move` est construit avant la mutation (son `pieceType`
  reste `pawn` — les 50 coups en dépendent) ; SAN `a8=Q`/`axb8=Q` ; **oracle chess.js sans
  plus aucun filtre** (choix tiré du PRNG, donné aux deux engines). UI : le choix passe par
  le picker, toujours et sans exception — aucun réglage ne le court-circuite, puisqu'il ne
  coûte rien pour une dame. Picker radial (`cPromotionPicker` + géométrie pure
  `promotionSlotCenters` : dame SUR la case d'ancrage, satellites en arc serré vers
  l'intérieur du board sur les deux axes — colonnes a/h = quadrant, ordre stable, léger
  chevauchement assumé). Drag desktop = release-pick : se poser
  sur une case de promotion EN DRAG ouvre l'anneau après un délai d'intention
  (`RING_OPEN_DELAY` — une case seulement traversée en diagonale n'ouvre rien) ; la dame est
  pré-armée sous le curseur, et un release sur la case de promotion la joue même si l'anneau
  n'a pas eu le temps de s'ouvrir (un seul geste, jamais de clic de plus) ; release sur un slot =
  sous-promotion, ailleurs = drop illégal donc snap-back existant (l'annulation tombe de la
  légalité) ; **safe selection zone** = ce que le joueur VOIT (halo `RING_HALO` dessiné ∪
  slots, zone continue puisque le halo atteint le centre des satellites) : à l'intérieur
  l'anneau possède le geste — aucune autre case de promotion ne peut le voler — et en sortir
  ferme le picker aussitôt, la case suivante pouvant alors le reprendre. Suivi par le
  curseur lui-même, pas seulement au changement de case. Slots qui se chevauchent : le
  survolé garde le curseur tant qu'il le contient, sinon c'est le slot du DESSUS qui gagne ;
  en drag, les slots sortent du hit-testing DOM (`pointer-events: none` sur `:disabled`)
  pour que la bordure et le zoom n'induisent pas un survol différent de la géométrie.
  Click-to-move
  et drag touch = coup pending + picker interactif (backdrop annule ; centré fixe grosses
  cibles en mobile) ; `prefers-reduced-motion` respecté (l'intention pré-établie reste au
  Backlog parties distantes)

### ⑤ SAN complet & PGN

- [x] Désambiguïsation (`Nbd2`, `R1e2`, `Qh4e1`) — le SAN quitte `game.ts` pour `engine/san.ts`,
  et le coup joué devient un organe : `MoveRecord` (`engine/moveRecord.ts`) lit le coup contre
  la position d'AVANT — capture (en passant inclus), roque, notation — et produit le `Move`
  plat (`toDto`). `buildSan(record)` en dépend en *import type* seulement, donc aucun cycle.
  Colonne si elle suffit, sinon rangée, sinon la case entière ; pion et roi
  exempts. **Légalité, pas géométrie** : un jumeau cloué ne crée aucune ambiguïté, donc le
  filtre passe par `canMove`. L'oracle compare désormais NOTRE SAN à celui de chess.js coup
  par coup (leurs `+`/`#` filtrés jusqu'à l'étape suivante)
- [x] `+` / `#` (`O-O`/`O-O-O` et `=Q` déjà livrés en phase ④) — `checkMark(inCheck, hasReply)`
  dans `san.ts`, lu sur la position d'APRÈS le coup : les deux réponses existaient déjà
  (`isInCheck` + `hasAnyLegalMove`, ce dernier n'est donc pas appelé une fois de plus).
  Un pat reste sans marque. La marque est apposée AVANT le `push` dans `game.moves` :
  une fois dans le tableau réactif, muter la référence brute passerait à côté du proxy.
  **L'oracle compare désormais le SAN complet, caractère pour caractère** — plus aucun filtre
- [ ] Export PGN complet (en-têtes, résultat)
- [ ] Import / utilisation de PGN pour les scénarios de devs. Ajouter des scénarios de devs pour des tests de edges
  cases. Penser à une manière de garder les scénarios à tester simples accessible, et éventuellement une liste plus
  poussée pour des cas comme en passant qui fait un check-mat.

### ⑥ Sync backend / websocket *(horizon — aura son propre roadmap côté backend Laravel)*

- [ ] Backend = source de vérité (vrais ULID, arbitrage des coups, horloge serveur)
- [ ] Identité des commandes : qui a le droit de jouer / accepter / refuser (sans objet en local — un
  seul écran, une seule souris)
- [ ] Format wire du DTO (liste de coups ou FEN — le board circulaire ne voyage pas, il se reconstruit)
- [ ] Sync du DTO par websocket — le mode `local` reste 100 % hors ligne
- [ ] Disponibilité d'une partie = un état, pas un accident : `loading → ready | missing` exposé
  par la vue + board skeleton (cadre 8×8 sans pièces, voile discret, `prefers-reduced-motion`)
  pendant `loading` — refresh de page, spectateur qui rejoint, fetch de session ; la relance
  du mode dev profitera du même visuel
- [ ] Spectateurs : observer une ou plusieurs parties sur une même page
- [ ] Policies par mode finalisées (`vs-bot`, `private-remote`, `public-remote`)

## Outillage dev / QA

- [x] **Mode dev** : mode de *form* (le DTO reste `mode: 'local'` — le domaine ne connaît jamais
  l'outillage), gaté par le setting global `devMode` (off par défaut — le setting EST le gate,
  l'outil marche aussi contre le build preview) ; tuile + `NewGameDevForm` (pattern strategy),
  scénario persisté comme le reste du form. Un scénario = une liste de coups rejouée par
  `replayMoves` (engine, jette sur coup refusé — un scénario cassé échoue dans la suite, pas
  en pleine session de QA), jamais un dump de pièces : toute position semée est légale par
  construction. Registre `src/dev/scenarios.ts` (promotion, en passant, roques). Vision long
  terme : sandbox pour développer pre-moves et mimer un backend.
- [x] **Panneau dev in-game** (`DevGamePanel`, sidebar desktop + layout mobile, gaté par le même
  setting) : choix du scénario + relance en place (nouvelle session semée via
  `useGameLauncher` — le chemin de lancement partagé avec le form —, navigation, ancienne
  session fermée) + lien vers le form. Le devMode désarme aussi le prevent-leave — le QA
  saute de partie en partie sans confirm. `RouterView` keyé sur le path (game/:a → game/:b
  remonte la page).

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
  haut-droite, hors de l'ombre du pouce, où il flotte en boucle — case agrandie ombrée
  (`drop-target-touch`, façon key-preview), seulement sur une destination légale
  (`view.dropTargets`, jamais gaté par le setting des hints)
- [x] Refactor du form nouvelle partie : le mode choisi (étape 1) pilote le reste du form —
  une composante de form par mode, pattern strategy (`NewGameLocalForm`, contrat : prop
  `settings` + `validate()` exposé) ; sélection de mode compacte sur mobile — rangée de
  tuiles icône + titre court, description du mode sélectionné une seule fois sous la rangée ;
  seuls les modes jouables sont offerts — pas de choix impossible dans l'UI
- [x] Face-à-face en mode local : le board ne se réoriente jamais (blancs en bas, comme un
  plateau physique) ; sur mobile, TOUTES les pièces pivotent de 180° sur elles-mêmes vers le
  joueur au trait (`view.piecesFlipped` → wrapper `c-piece__flip`, `rotate` en propriété
  individuelle qui compose avec les états du sprite, demi-tour animé) — gaté par le setting
  par observateur `autoFlipPieces`, un toggle dans le form local, mobile seulement (même
  signal `useIsMobile` que le switch de layout) ; desktop ne pivote rien. Jamais de board
  renversé (noirs en bas) en local — la rotation 180° du board appartient aux modes distants
  et aux spectateurs (voir Backlog parties distantes)
- [ ] Identité visuelle des hints de coups légaux : remplacer points/anneaux (vocabulaire
  chess.com/Lichess) par de petites flèches discrètes orientées selon la direction du coup
  (verticale/horizontale/diagonale), animées en se dessinant depuis la pièce (stagger le long
  du rayon — la « ligne de vue » qui se déploie, écho de l'épic pédagogie) ; capture = look
  distinct à trancher (pointe de flèche « mordant » le bord de la case côté attaque, ou
  chevrons de coin façon target lock) ; cavalier = mini-flèche coudée en L (8 orientations) ;
  respecter `prefers-reduced-motion`
- [ ] Ajout d'une fenêtre d'état quand une partie est terminée. Il faut montrer clairement le gagnant (si non nulle), la
  raison, et ce qui est pertinent.
- [ ] Parties en cours listées sur l'accueil + les rejoindre (plus tard : filtrées par compte).
  Survivre au refresh = persister la liste de coups et la rejouer — `replayMoves` (mode dev)
  est déjà cette mécanique
- [ ] Assets de pièces inlinés dans le bundle (SVG via Vite) : élimine le flash de chargement async
  et honore « local = 100 % hors ligne ». Préchargement + loading seulement si le bundle grossit
- [ ] Spot discret des coordonnées de la case survolée — compléter l'illumination file/rangée de
  `cBoardFrame`, pas la doubler
- [ ] Dessiner des flèches (clic droit glissé, à la Lichess) — calque SVG au-dessus du board,
  mapping via `boardCoords`

## Backlog parties distantes

Features propres aux modes `vs-bot` / `private-remote` / `public-remote` — rien avant la phase ⑥.

- [ ] Pre-moves : préparer son coup pendant le tour adverse, exécuté dès le retour du trait.
  Sans objet en local — une seule souris joue les deux camps. Une promotion en pre-move passe
  par le picker au moment du geste : le choix est donc déjà capturé quand le trait revient,
  rien à préparer d'avance (l'intention pré-établie et le réglage auto-dame de chess.com
  corrigeaient un popup qui arrive trop tard — notre picker n'a pas ce défaut)
- [ ] Réactiver chaque mode dans le sélecteur du form quand il devient jouable : flag `available`
  dans `NewGameModeSection` + sa composante de form (pattern strategy) — les entrées, icônes
  et clés i18n sont déjà en place
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
- **`getRaysFrom(square)`** — si un besoin futur veut les rayons hors du roi (éval d'IA, heatmap de
  contrôle), `PositionAnalysis.rays()` se généralise sans casser le vocabulaire.
- **`GameType` recalculé, jamais persisté** — vérifier son rôle quand le backend arrivera.
- **Scénarios dev = replay de coups, pas de PGN** *(semi-dette)* — le semis rejoue chaque coup dans
  le vrai engine (délai ∝ nombre de coups : légalité + fins automatiques payées à chaque demi-coup).
  Charger un PGN serait le vrai format de test — viendra avec l'export PGN (phase ⑤) et le format
  wire (phase ⑥) ; d'ici là, le replay garantit au moins des positions légales par construction.

