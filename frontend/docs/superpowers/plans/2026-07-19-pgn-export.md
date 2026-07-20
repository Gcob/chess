# PGN Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export a finished-or-ongoing `Game` to a standard PGN string, surfaced via a "Copy PGN" button in the dev
panel.

**Architecture:** A new pure engine module `src/engine/pgn.ts` (`buildPgn`, `buildMovetext`) reads only the DTO — the
SANs already stored on each `Move`, the result, players, time and creation date. Same mould as `san.ts`: zero Vue, zero
module state, total (never throws). The oracle gains a movetext comparison; the dev panel gains a copy button.

**Tech Stack:** TypeScript, Vue 3 `<script setup>`, Vitest, chess.js (devDependency oracle).

## Global Constraints

- TypeScript strict — explicit types, never `any`.
- Comments in English, only for complex things, placed ABOVE the code.
- `if` always uses braces, never on a single line.
- Engine files are pure: zero Vue import, zero mutable module state.
- Exhaustive `switch` over a union carries NO `default` (deliberate — TS enforces exhaustiveness).
- Unit specs are colocated (`*.spec.ts` beside the file).
- Verification commands: `npm run type-check`, `npx vitest run <file>`, `npm run test:unit -- --run`, `npm run build`.
- **Jacob commits himself.** Never run `git commit`/`git push`. Each "Checkpoint" step runs the verification commands
  and hands off to Jacob with a suggested message; he commits.
- Doc files wrap at ~120 columns.

---

### Task 1: Movetext (`buildMovetext`, `wrapTokens`, `resultToken`)

**Files:**

- Create: `src/engine/pgn.ts`
- Test: `src/engine/pgn.spec.ts`

**Interfaces:**

- Consumes: `Move` (`.san` only), `GameResult`, `createGameSession` + `replayMoves` (test setup).
- Produces:
    - `export function buildMovetext(moves: Move[], result: GameResult | null): string`
    - `export function resultToken(result: GameResult | null): string` — `'1-0' | '0-1' | '1/2-1/2' | '*'`

- [ ] **Step 1: Write the failing test**

Create `src/engine/pgn.spec.ts`:

```ts
import {describe, it, expect} from 'vitest'
import {buildMovetext} from './pgn'
import {replayMoves} from './game'
import {createGameSession} from '@/composables/factories/gameFactory'
import type {CreateGamePayload, Move} from '@/types/chess'

const T0 = 1_700_000_000_000

const payload: CreateGamePayload = {
    mode: 'local',
    players: {white: {name: 'Alice', avatar: 'circle'}, black: {name: 'Bob', avatar: 'square'}},
}

function newGame() {
    return createGameSession(payload, 'test').game
}

// buildMovetext reads only `.san` — a cast keeps the wrapping tests focused on formatting.
function sanMoves(sans: string[]): Move[] {
    return sans.map(san => ({san} as Move))
}

describe('buildMovetext', () => {
    it('numbers each white move and appends the result token', () => {
        const game = newGame()
        replayMoves(game, [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3']], T0)
        expect(buildMovetext(game.moves, game.result)).toBe('1. e4 e5 2. Nf3 *')
    })

    it('emits just the result token for a game with no moves', () => {
        expect(buildMovetext([], null)).toBe('*')
    })

    it('uses the result token of a finished game', () => {
        const game = newGame()
        replayMoves(game, [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']], T0)
        expect(game.result?.reason).toBe('checkmate')
        expect(buildMovetext(game.moves, game.result)).toBe('1. f3 e5 2. g4 Qh4# 0-1')
    })

    it('wraps lines at 80 columns, breaking only between tokens', () => {
        const text = buildMovetext(sanMoves(Array(40).fill('Nf3')), null)
        const lines = text.split('\n')
        expect(lines.length).toBeGreaterThan(1)
        expect(lines.every(line => line.length <= 80)).toBe(true)
        // Collapsing the wraps must recover the exact single-line token stream.
        expect(text.split(/\s+/)).toEqual([...text.replace(/\n/g, ' ').split(' ')])
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/pgn.spec.ts`
Expected: FAIL — `buildMovetext` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/engine/pgn.ts`:

```ts
import type {GameResult, Move} from '@/types/chess'

// ─── PGN export ──────────────────────────────────────────────────────────────
// Pure serialization of a Game to Portable Game Notation. Zero Vue, zero module state —
// same mould as san.ts. Reads only the DTO: the SANs already stored on each Move, the
// result, players, time and creation date. Total: never throws (an ongoing game exports a
// '*' result and no Termination tag).

// PGN lines wrap at ≤ 80 columns, broken between tokens (PGN spec 8.2.2).
const MAX_LINE = 80

export function resultToken(result: GameResult | null): string {
    if (!result) {
        return '*'
    }

    if (result.winner === 'white') {
        return '1-0'
    }

    if (result.winner === 'black') {
        return '0-1'
    }

    return '1/2-1/2'
}

export function buildMovetext(moves: Move[], result: GameResult | null): string {
    const tokens: string[] = []
    moves.forEach((move, index) => {
        if (index % 2 === 0) {
            tokens.push(`${index / 2 + 1}.`)
        }

        tokens.push(move.san)
    })
    tokens.push(resultToken(result))

    return wrapTokens(tokens)
}

// Joins tokens into lines of at most MAX_LINE columns, breaking only between tokens.
function wrapTokens(tokens: string[]): string {
    const lines: string[] = []
    let line = ''
    for (const token of tokens) {
        if (line === '') {
            line = token
        } else if (line.length + 1 + token.length > MAX_LINE) {
            lines.push(line)
            line = token
        } else {
            line += ` ${token}`
        }
    }

    if (line !== '') {
        lines.push(line)
    }

    return lines.join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/pgn.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Checkpoint (Jacob commits)**

Run: `npm run type-check`
Expected: no errors.
Hand off to Jacob — suggested message: `feat(engine): PGN movetext with move numbering and 80-col wrapping`.

---

### Task 2: Headers + `buildPgn` assembly

**Files:**

- Modify: `src/engine/pgn.ts`
- Test: `src/engine/pgn.spec.ts`

**Interfaces:**

- Consumes: `resultToken` (Task 1), `Game`, `GameResult`, `GameTime`, `GameEndReason`.
- Produces: `export function buildPgn(game: Game): string` — full PGN (headers, blank line, movetext, trailing newline).

- [ ] **Step 1: Write the failing test**

Append to `src/engine/pgn.spec.ts` (add `buildPgn` to the import from `./pgn`, and
`import type {GameResult} from '@/types/chess'`):

```ts
import {buildMovetext, buildPgn} from './pgn'
// ...existing imports...
import type {CreateGamePayload, GameResult, Move} from '@/types/chess'

describe('buildPgn headers', () => {
    it('emits the seven-tag roster with placeholders and our extras', () => {
        const game = newGame()
        game.createdAt = new Date(2026, 6, 19) // local July 19 2026
        game.time = {minutes: 10, secondsIncrement: 5}
        const pgn = buildPgn(game)
        expect(pgn).toContain('[Event "?"]')
        expect(pgn).toContain('[Site "?"]')
        expect(pgn).toContain('[Date "2026.07.19"]')
        expect(pgn).toContain('[Round "-"]')
        expect(pgn).toContain('[White "Alice"]')
        expect(pgn).toContain('[Black "Bob"]')
        expect(pgn).toContain('[Result "*"]')
        expect(pgn).toContain('[TimeControl "600+5"]')
        expect(pgn).not.toContain('Termination') // ongoing game omits it
    })

    it('marks an untimed game with a dash', () => {
        expect(buildPgn(newGame())).toContain('[TimeControl "-"]')
    })

    it('escapes quotes and backslashes in player names', () => {
        const game = newGame()
        game.players.white.metas.name = 'a"b\\c'
        expect(buildPgn(game)).toContain('[White "a\\"b\\\\c"]')
    })
})

describe('buildPgn result token', () => {
    const cases: Array<[GameResult | null, string]> = [
        [{winner: 'white', reason: 'checkmate'}, '1-0'],
        [{winner: 'black', reason: 'checkmate'}, '0-1'],
        [{winner: null, reason: 'stalemate'}, '1/2-1/2'],
        [null, '*'],
    ]
    it.each(cases)('renders %o as [Result "%s"]', (result, token) => {
        const game = newGame()
        game.result = result
        expect(buildPgn(game)).toContain(`[Result "${token}"]`)
    })
})

describe('buildPgn termination', () => {
    const cases: Array<[GameResult, string]> = [
        [{winner: 'white', reason: 'checkmate'}, 'White won by checkmate'],
        [{winner: 'black', reason: 'resignation'}, 'Black won by resignation'],
        [{winner: 'white', reason: 'timeout'}, 'White won on time'],
        [{winner: null, reason: 'timeout'}, 'Game drawn on time (insufficient material)'],
        [{winner: null, reason: 'stalemate'}, 'Game drawn by stalemate'],
        [{winner: null, reason: 'fifty-move-rule'}, 'Game drawn by fifty-move rule'],
        [{winner: null, reason: 'threefold-repetition'}, 'Game drawn by threefold repetition'],
        [{winner: null, reason: 'insufficient-material'}, 'Game drawn by insufficient material'],
        [{winner: null, reason: 'draw-agreement'}, 'Game drawn by agreement'],
    ]
    it.each(cases)('describes %o as [Termination "%s"]', (result, expected) => {
        const game = newGame()
        game.result = result
        expect(buildPgn(game)).toContain(`[Termination "${expected}"]`)
    })
})

describe('buildPgn full', () => {
    it('renders a full small game', () => {
        const game = newGame()
        game.createdAt = new Date(2026, 6, 19)
        replayMoves(game, [['e2', 'e4'], ['e7', 'e5'], ['g1', 'f3'], ['b8', 'c6']], T0)
        expect(buildPgn(game)).toBe(
            `[Event "?"]
[Site "?"]
[Date "2026.07.19"]
[Round "-"]
[White "Alice"]
[Black "Bob"]
[Result "*"]
[TimeControl "-"]

1. e4 e5 2. Nf3 Nc6 *
`)
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/pgn.spec.ts`
Expected: FAIL — `buildPgn` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add to `src/engine/pgn.ts` (extend the type import, add the assembly + helpers):

```ts
import type {Game, GameResult, GameTime, Move} from '@/types/chess'
```

```ts
export function buildPgn(game: Game): string {
    return `${buildHeaders(game)}\n\n${buildMovetext(game.moves, game.result)}\n`
}

function buildHeaders(game: Game): string {
    const tags: Array<[string, string]> = [
        ['Event', '?'],
        ['Site', '?'],
        ['Date', formatDate(game.createdAt)],
        ['Round', '-'],
        ['White', escapeHeader(game.players.white.metas.name)],
        ['Black', escapeHeader(game.players.black.metas.name)],
        ['Result', resultToken(game.result)],
        ['TimeControl', timeControlTag(game.time)],
    ]

    // Termination only describes a game that actually ended.
    if (game.result) {
        tags.push(['Termination', terminationText(game.result)])
    }

    return tags.map(([name, value]) => `[${name} "${value}"]`).join('\n')
}

// The winner is named by color, per PGN convention — never the player's name.
function terminationText(result: GameResult): string {
    const winner = result.winner === 'white' ? 'White' : 'Black'
    switch (result.reason) {
        case 'checkmate':
            return `${winner} won by checkmate`
        case 'resignation':
            return `${winner} won by resignation`
        // The flag rule (FIDE 6.9): a timeout is a win only when the opponent could still mate.
        case 'timeout':
            return result.winner ? `${winner} won on time` : 'Game drawn on time (insufficient material)'
        case 'stalemate':
            return 'Game drawn by stalemate'
        case 'fifty-move-rule':
            return 'Game drawn by fifty-move rule'
        case 'threefold-repetition':
            return 'Game drawn by threefold repetition'
        case 'insufficient-material':
            return 'Game drawn by insufficient material'
        case 'draw-agreement':
            return 'Game drawn by agreement'
    }
}

function timeControlTag(time: GameTime | undefined): string {
    if (!time) {
        return '-'
    }

    return `${time.minutes * 60}+${time.secondsIncrement}`
}

// PGN dates are YYYY.MM.DD from local components, zero-padded.
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
}

// PGN string tag values escape backslash and quote (PGN spec 8.1.1).
function escapeHeader(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/pgn.spec.ts`
Expected: PASS (all buildPgn + buildMovetext tests).

- [ ] **Step 5: Checkpoint (Jacob commits)**

Run: `npm run type-check`
Expected: no errors (the exhaustive `switch` compiles with no `default`).
Hand off — suggested message: `feat(engine): buildPgn headers, result token and descriptive termination`.

---

### Task 3: Oracle movetext comparison

**Files:**

- Modify: `src/engine/oracle.spec.ts`

**Interfaces:**

- Consumes: `buildMovetext` (Task 1), existing `playRandomGame` structure.
- Produces: nothing new — extends the differential oracle to movetext.

- [ ] **Step 1: Write the failing test (add the comparison, then run the suite)**

In `src/engine/oracle.spec.ts`, add the import:

```ts
import {buildMovetext} from './pgn'
```

Add a comparison helper next to `compareEnding`:

```ts
// Our movetext must match chess.js token for token — move numbering included. The trailing
// result token is dropped from both: chess.js keeps '*' even after mate, ours is the real
// result (unit-tested separately). Whitespace is collapsed, so wrapping never matters.
function compareMovetext(game: Game, oracle: Chess, context: string): void {
    const ours = movetextBody(buildMovetext(game.moves, game.result))
    const theirs = movetextBody(oracle.pgn().split('\n\n')[1] ?? '')
    expect(ours, `movetext diverges — ${context}`).toBe(theirs)
}

function movetextBody(movetext: string): string {
    const tokens = movetext.trim().split(/\s+/).filter(Boolean)
    tokens.pop() // drop the trailing result token
    return tokens.join(' ')
}
```

In `playRandomGame`, call it at both exit points. At the finish branch:

```ts
    if (game.status === 'finished') {
    compareEnding(game, oracle, context)
    compareMovetext(game, oracle, context)
    return
}
```

And after the `for` loop (the MAX_PLIES-exhausted, still-ongoing case), before the function ends:

```ts
  compareMovetext(game, oracle, `seed ${seed}, after [${played.join(' ')}]`)
}
```

- [ ] **Step 2: Run to verify the oracle still agrees**

Run: `npx vitest run src/engine/oracle.spec.ts`
Expected: PASS (20 games). A movetext divergence would fail with the seed + move list to replay.

- [ ] **Step 3: Checkpoint (Jacob commits)**

Run: `npm run type-check`
Expected: no errors.
Hand off — suggested message: `test(engine): oracle compares PGN movetext token for token`.

---

### Task 4: "Copy PGN" button in DevGamePanel + i18n

**Files:**

- Modify: `src/components/game/DevGamePanel.vue`
- Modify: `src/assets/i18n/locales/en.ts`
- Modify: `src/assets/i18n/locales/fr.ts`
- Test: `src/components/game/DevGamePanel.spec.ts`

**Interfaces:**

- Consumes: `buildPgn` (Task 2), `gamesStore.get`, `route.params.id`, `navigator.clipboard`.
- Produces: a `copyPgn` handler + `game.dev.copyPgn` i18n key.

- [ ] **Step 1: Add the i18n keys**

In `src/assets/i18n/locales/en.ts`, in the `dev:` block:

```ts
    dev: {
    title: 'Dev',
        restart
:
    'Restart scenario',
        editSetup
:
    'Edit setup',
        copyPgn
:
    'Copy PGN',
}
,
```

In `src/assets/i18n/locales/fr.ts`, in the `dev:` block:

```ts
    dev: {
    title: 'Dev',
        restart
:
    'Relancer le scénario',
        editSetup
:
    'Modifier la partie',
        copyPgn
:
    'Copier le PGN',
}
,
```

- [ ] **Step 2: Write the failing test**

Append to `src/components/game/DevGamePanel.spec.ts` (add `vi` to the vitest import and
`import {buildPgn} from '@/engine/pgn'`):

```ts
import {describe, it, expect, beforeEach, vi} from 'vitest'
import {buildPgn} from '@/engine/pgn'

it('copies the current game PGN to the clipboard', async () => {
    useSettingsStore().settings.devMode = true
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true})
    const {wrapper, session} = await mountPanel()
    await wrapper.findAll('button').find(b => b.text().includes('copyPgn'))!.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(buildPgn(session.game))
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/game/DevGamePanel.spec.ts`
Expected: FAIL — no button whose text includes `copyPgn`.

- [ ] **Step 4: Write minimal implementation**

In `src/components/game/DevGamePanel.vue`, add the button to the `dev-panel__buttons` div (after the restart button):

```html

<cButton variant="ter" @click="copyPgn">
    <ClipboardCopy :size="16"/>
    {{ $t('game.dev.copyPgn') }}
</cButton>
```

Update the lucide import and add the handler in `<script setup>`:

```ts
import {ClipboardCopy, FlaskConical, RotateCcw} from 'lucide-vue-next'
import {buildPgn} from '@/engine/pgn'
```

```ts
// Dev QA affordance: the current game as PGN, ready to paste into Lichess/chess.com to
// verify the round-trip. Clipboard failure is swallowed — this is dev tooling.
async function copyPgn() {
    const session = gamesStore.get(String(route.params.id ?? ''))
    if (!session) {
        return
    }

    await navigator.clipboard.writeText(buildPgn(session.game))
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/game/DevGamePanel.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Checkpoint (Jacob commits)**

Run: `npm run type-check && npm run test:unit -- --run`
Expected: whole unit suite green.
Hand off — suggested message: `feat(game): copy PGN button in the dev panel`.

---

### Task 5: Docs

**Files:**

- Modify: `docs/engine-roadmap.md`
- Modify: `docs/architecture.md`

**Interfaces:** none — documentation only.

- [ ] **Step 1: Check the roadmap box**

In `docs/engine-roadmap.md`, phase ⑤, replace the unchecked export line:

```markdown
- [x] Export PGN complet (en-têtes, résultat) — `engine/pgn.ts` pur (`buildPgn`/`buildMovetext`) lit les
  `san` déjà stockés ; Seven Tag Roster (placeholders `?`/`-`) + `TimeControl` + `Termination` descriptif
  dérivé de `GameResult` ; wrapping 80 colonnes ; l'oracle compare le movetext token par token ; bouton
  « Copier PGN » dans `DevGamePanel`
```

- [ ] **Step 2: Add the engine file to architecture.md**

In `docs/architecture.md`, extend the engine narrative — after `engine/material.ts` (captures dérivées), append:

```markdown
> `engine/pgn.ts` (export PGN pur — `buildPgn`/`buildMovetext` sur le DTO, en-têtes STR + extras,
> movetext numéroté et wrappé à 80 colonnes).
```

- [ ] **Step 3: Verify wrapping and hand off**

Confirm both edits stay within ~120 columns.
Hand off — suggested message: `docs: mark PGN export done, describe engine/pgn.ts`.

---

## Self-Review

**Spec coverage:**

- `buildPgn` pur, engine, zéro Vue → Tasks 1–2. ✓
- Seven Tag Roster + placeholders `?`/`-` → Task 2 headers test. ✓
- Date `YYYY.MM.DD` local → Task 2. ✓
- Échappement des noms → Task 2. ✓
- `Result` (4 jetons, `*` ongoing) → Tasks 1 (movetext) + 2 (header). ✓
- `TimeControl` timed/untimed → Task 2. ✓
- `Termination` descriptif, 8 raisons + 2 variantes timeout, omis si en cours → Task 2. ✓
- Movetext numéroté + wrapping 80 + partie vide → Task 1. ✓
- Oracle movetext token par token, en-têtes non comparés → Task 3. ✓
- Bouton « Copier PGN » gaté devMode, clipboard, i18n fr+en → Task 4. ✓
- Doc roadmap + architecture → Task 5. ✓

**Placeholder scan:** no TBD/TODO; every code step shows full code. ✓

**Type consistency:** `buildPgn(game: Game): string`, `buildMovetext(moves: Move[], result: GameResult | null): string`,
`resultToken(result: GameResult | null): string` — names and signatures identical across Tasks 1–4. ✓
