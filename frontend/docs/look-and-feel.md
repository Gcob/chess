# Look & Feel — Thèmes

## Fichier de types : `src/types/look-and-feel.ts`

Séparé de `chess.ts` — les thèmes sont une préoccupation UI, pas du domaine échecs pur.

Contient aussi les enums `BoardThemes` et `PieceThemes` — source de vérité des IDs de thèmes valides.
Chaque valeur correspond à une clé de registre et à une clé i18n `settings.{boardThemes|pieceThemes}.{value}`.

Contient aussi (UI pure, hors domaine — l'engine ne les connaît pas) :

- `SquareHighlight` — états visuels d'une case (`drop-target`, `last-move`, `selected`, `check`,
  `legal-move`, `legal-capture`), overlays translucides empilables sur `cSquare`. Couleurs dans
  `_variables.scss` (`$square-highlight-*`).
  `check` (case du roi en échec, dérivée dans `useGameView.checkSquares`) est un indicateur de règle :
  toujours affiché, jamais gated par un setting — contrairement à `last-move` (`highlightLastMove`).
  `legal-move` / `legal-capture` (destinations légales) sont des formes (point / anneau,
  `radial-gradient` closest-side, jamais des voiles), gated par `showLegalMoves` ; apparition
  animée (fade + scale ~150 ms, `@keyframes c-square-hint-in`), rejouée quand on change de pièce
  (overlays keyés par l'origine via la prop `hintsKey`).
- `PieceAnimation` — anim d'une pièce qui change de case : `slide`, `none`, `hop` (arc du sprite du
  cavalier pendant la glisse) et `snap-back` (retour d'un drop refusé) — tous câblés.

## Deux thèmes indépendants

`PieceTheme` et `BoardTheme` sont **toujours indépendants** —
on peut mélanger n'importe quel thème de pièces avec n'importe quel thème de board.

Settings (dans `useSettingsStore`) :

```ts
pieceThemeId: PieceThemes  // enum — clé dans le registre pieceThemes
boardThemeId: BoardThemes  // enum — clé dans le registre boardThemes
```

## PieceTheme

```ts
interface PieceTheme {
    id: string
    name: string
    format: 'svg' | 'png'  // toutes les images du thème sont dans le même format
    images: {
        board: PieceImageSet   // taille standard — affiché sur le plateau
        small?: PieceImageSet  // taille compacte — captures & notation de coups
    }
}
```

- `PieceImageSet = Record<PieceColor, Record<PieceType, string>>`
- 12 images par set (2 couleurs × 6 types)
- `small` est optionnel — fallback vers `board` géré par `useChessTheme`

## BoardTheme

```ts
interface BoardTheme {
    id: string
    name: string
    lightSquare: string  // valeur CSS background — color, url(), gradient...
    darkSquare: string
}
```

Le composant applique directement comme `style="{ background: theme.lightSquare }"`.
CSS gère tout : couleurs solides, textures (`url()`), dégradés.

## Convention de nommage des assets pièces

`{w|b}{K|Q|R|B|N|P}.{svg|png}` — ex. `wK.svg`, `bP.svg`

Alignée sur Lichess. Cohérente avec `Piece.textRepresentation.short`.

## Structure des assets

```
src/assets/themes/
├── pieces/
│   ├── index.ts              # registre : Record<string, PieceTheme>
│   └── classic/
│       ├── index.ts          # export classicPieceTheme
│       ├── board/            # 12 fichiers wK.svg … bP.svg
│       └── small/            # optionnel — même convention
└── boards/
    ├── index.ts              # registre : Record<string, BoardTheme>
    └── wood.ts               # export woodBoardTheme
```

## useChessTheme — `src/composables/useChessTheme.ts`

Expose :

- `pieceTheme` — computed, thème de pièces actif
- `boardTheme` — computed, thème de board actif
- `getPieceImage(color, type, size?)` — URL de l'image, fallback `small → board` géré en interne

```ts
const {getPieceImage, boardTheme} = useChessTheme()
getPieceImage(piece.color, piece.type, 'small') // → URL, fallback vers 'board' si small absent
```

Si un `themeId` stocké en localStorage n'existe plus dans le registre,
fallback automatique vers `PieceThemes.Classic` / `BoardThemes.Wood`.

**Règle absolue : aucun composant ne réimplémente le fallback `small → board`.**
Ce fallback vit uniquement dans `useChessTheme`, nulle part ailleurs.

## Piece.images retiré du domaine

`Piece` dans `chess.ts` n'a plus de champ `images`.
Les images viennent exclusivement du thème actif via `useChessTheme().getPieceImage()`.
Un composant identifie la bonne image avec `piece.color` + `piece.type`.

## Avatars de joueur — `src/themes/avatars.ts`

Liste **hardcodée** d'avatars **emoji** (`{ id, emoji, gender? }`), rendus par `PlayerAvatar` (glyphe dimensionné
à sa boîte via container queries — `cqmin`). Dans le new-game form, l'avatar choisi s'affiche dans un cadre
à gauche du nom (l'identité du joueur) ; cliquer ouvre `AvatarPickerModal`.
Règle Zod : deux joueurs ne peuvent pas partager le même avatar (la modale désactive aussi l'avatar
déjà pris par l'autre). Les ids d'avatar stockés (settings) invalides sont réassignés au défaut au chargement.
Chaque avatar a un **nom i18n** (`avatars.{id}`) affiché en tooltip dans la modale. La modale fonctionne en
**sélection → confirmation** avec deux boutons : « Choisir » (avatar seul) et « Choisir + nom rigolo » (avatar
+ renommage). Le renommage est donc **opt-in**, jamais un side-effect surprise.
`gender` (`Partial<Record<SupportedLocale, 'm' | 'f'>>`) est le genre grammatical du nom, **qualifié par
langue** — pas une propriété universelle de l'avatar (une locale future, ex. espagnol, pourrait diverger du
français). Utilisé par le générateur de noms rigolos pour accorder les adjectifs ; absent = pas d'accord requis
pour cette langue (ex. l'anglais n'en a jamais besoin).

## Générateur de noms rigolos — `src/utils/randomName.ts`

Le vocabulaire vit **en i18n** ; le code ne garde que la logique. Format simple : **nom + adjectif**, mais
l'ordre des mots est lui-même une donnée i18n (`randomName.format`, ex. fr `'{noun} {adjective}'` / en
`'{adjective} {noun}'`) — pas une branche de code par locale.

- **Noms** = noms d'avatars (`avatars.{id}`).
- **Adjectifs** = `randomName.adjectives` — un dictionnaire `{id: texte}` par locale. `ADJECTIVE_IDS`
  (dans `randomName.ts`) liste les ids partagés ; chaque locale doit fournir une traduction de base pour
  chacun. Le français ajoute des clés `{id}_f` pour les ~20 mots qui varient en genre (ex. `affame` /
  `affame_f` → Affamé / Affamée) ; l'anglais n'a jamais de suffixe. Voir accord de genre ci-dessous.
- `adjectiveTextFor(id, avatarId)` résout le texte (accordé si besoin) ; `formatName(noun, adjective)`
  assemble via `randomName.format` ; `nameForAvatar(avatarId)` = adjectif aléatoire one-shot pour un avatar.
- `randomIdentity(exclude?)` tire un avatar + nom assorti — utilisé pour les **défauts** (localStorage vide
  → chaque joueur a un avatar + nom rigolo aléatoires, avatars distincts).

**Accord de genre — `src/utils/tGender.ts`.** `vue-i18n` n'a pas d'équivalent à la feature `context`
d'i18next (clés `_male`/`_female` + option `context` sur `t()`) ; `tGender(i18n, key, gender, params?)`
réimplémente la même idée à la main avec la convention `_m`/`_f` : si `gender` est fourni et que
`` `${key}_${gender}` `` existe (`te()`), on l'utilise, sinon on retombe sur `key`. `gender` peut être
`undefined` (anglais, ou avatar sans genre déclaré pour la locale active) → utilise directement `key`.
Générique, réutilisable pour tout futur texte genré, pas seulement les noms.

**Compromis de typage.** `randomName.adjectives` est assoupli à `Record<string, string>` dans
`MessageSchema` (`src/assets/i18n/index.ts`) plutôt que d'exiger la forme exacte de `fr.ts` — le français a
des clés `_f` que l'anglais n'a jamais, donc les deux locales ne partagent plus une forme identique sur
cette branche. Compensé par un test de parité (`randomName.spec.ts`) qui vérifie que chaque id de
`ADJECTIVE_IDS` a une traduction de base dans les deux locales.

**Bouton dé (shuffle bag).** Dans le new-game form, chaque joueur a un **sac** d'ids d'adjectifs mélangé
(`shuffledAdjectiveIds`, Fisher-Yates) consommé un à un → aucun adjectif ne se répète tant que le sac n'est
pas vide (re-mélange à vide). Le sac se **réinitialise quand l'avatar change** (nouveau noun). Pas de garde
anti-collision : les avatars sont toujours distincts, donc les noms diffèrent forcément.
