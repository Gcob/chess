# Linting & style de code

Conventions de formatage du code TS/Vue. Le reste suit le style par défaut du projet.

## Blocs `if`

- **Toujours des accolades**, même pour un corps d'une seule instruction — jamais de `if (x) return`.
- L'accolade ouvrante `{` reste **sur la ligne du `if`**.
- **Une ligne vide après l'accolade fermante `}`**, sauf si elle est suivie immédiatement d'une
  autre accolade fermante (fin de bloc parent).

```ts
if (!piece) {
  return false
}

const target = board.squares[to].piece
```

Rationale : lisibilité — le bloc respire et se détache du code qui suit.

## Commentaires

- **Au-dessus du code**, jamais en fin de ligne (`commentaire → code`, pas `code → commentaire`).
- **Ne pas commenter l'évident** : si le code se lit seul, pas de commentaire. On commente le *pourquoi*,
  rarement le *quoi*.

```ts
// Can't capture your own piece.
if (target && target.color === piece.color) {
  return false
}
```

## Appels multi-paramètres

- Quand un appel a trop de paramètres pour tenir confortablement sur une ligne : **un paramètre
  par ligne**, indentés, et le `)` fermant seul sur sa propre ligne — un bloc qui se lit d'un coup d'œil.

```ts
const signature = placementSignature(
  placement,
  color,
  history.castlingRightsAt(i),
  enPassantSignature(placement, color, game.moves[i - 1])
)
```

## Cast `as SquareKey`

- Toute valeur `SquareKey` construite par concaténation (template literal, `String.fromCharCode`…)
  se termine par **`as SquareKey`** — `tsc` infère le template mais pas PhpStorm ; le cast reste
  vérifié par le compilateur (il refuse un type sans chevauchement), ce n'est jamais un `ts-ignore`.

```ts
return `${move.from[0]}${(fromRank + toRank) / 2}` as SquareKey
```
