# Look & Feel — Thèmes

## Fichier de types : `src/types/look-and-feel.ts`

Séparé de `chess.ts` — les thèmes sont une préoccupation UI, pas du domaine échecs pur.

Contient aussi les enums `BoardThemes` et `PieceThemes` — source de vérité des IDs de thèmes valides.
Chaque valeur correspond à une clé de registre et à une clé i18n `settings.{boardThemes|pieceThemes}.{value}`.

Contient aussi (UI pure, hors domaine — l'engine ne les connaît pas) :

- `SquareHighlight` — états visuels d'une case (`drop-target`, `last-move`, `selected`), overlays
  translucides empilables sur `cSquare`. Couleurs dans `_variables.scss` (`$square-highlight-*`).
- `PieceAnimation` — anim d'une pièce qui change de case : `slide`/`none` câblés, `hop`/`snap-back` dormants.

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

Liste **hardcodée** d'avatars **emoji** (`{ id, emoji }`), rendus par `PlayerAvatar` (glyphe dimensionné à sa
boîte via container queries — `cqmin`). Dans le new-game form, l'avatar choisi s'affiche dans un cadre
à gauche du nom (l'identité du joueur) ; cliquer ouvre `AvatarPickerModal`.
Règle Zod : deux joueurs ne peuvent pas partager le même avatar (la modale désactive aussi l'avatar
déjà pris par l'autre). Les ids d'avatar stockés (settings) invalides sont réassignés au défaut au chargement.
Chaque avatar a un **nom i18n** (`avatars.{id}`) affiché en tooltip dans la modale. La modale fonctionne en
**sélection → confirmation** avec deux boutons : « Choisir » (avatar seul) et « Choisir + nom rigolo » (avatar
+ renommage). Le renommage est donc **opt-in**, jamais un side-effect surprise.

## Générateur de noms rigolos — `src/utils/randomName.ts`

Le vocabulaire vit **en i18n** ; le code ne garde que la logique. Format simple : **nom + adjectif**
(ordre par locale — fr « Nom Adjectif », en « Adjective Noun »).

- **Noms** = noms d'avatars (`avatars.{id}`).
- **Adjectifs** = `randomName.adjectives` (lus via `getLocaleMessage`, raw).
- `formatName(noun, adjective)` assemble selon la locale ; `nameForNoun(noun)` = adjectif aléatoire one-shot.
- `randomIdentity(exclude?)` tire un avatar + nom assorti — utilisé pour les **défauts** (localStorage vide
  → chaque joueur a un avatar + nom rigolo aléatoires, avatars distincts).

**Bouton dé (shuffle bag).** Dans le new-game form, chaque joueur a un **sac** d'adjectifs mélangé
(`shuffledAdjectives`, Fisher-Yates) consommé un à un → aucun adjectif ne se répète tant que le sac n'est
pas vide (re-mélange à vide). Le sac se **réinitialise quand l'avatar change** (nouveau noun). Pas de garde
anti-collision : les avatars sont toujours distincts, donc les noms diffèrent forcément.
