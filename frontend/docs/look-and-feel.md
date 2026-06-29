# Look & Feel — Thèmes

## Fichier de types : `src/types/look-and-feel.ts`

Séparé de `chess.ts` — les thèmes sont une préoccupation UI, pas du domaine échecs pur.

Contient aussi les enums `BoardThemes` et `PieceThemes` — source de vérité des IDs de thèmes valides.
Chaque valeur correspond à une clé de registre et à une clé i18n `settings.{boardThemes|pieceThemes}.{value}`.

Contient aussi `SquareHighlight` — états visuels transitoires d'une case (`drop-target`, `last-move`,
`selected`), rendus en overlays translucides empilables sur `cSquare`. C'est de l'UI pure : le `Square`
du domaine reste un nœud d'état de jeu pur. Couleurs dans `_variables.scss` (`$square-highlight-*`).
Nouvel état = une valeur ici + une couleur + une source dans `cBoard.highlightsFor`.

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
