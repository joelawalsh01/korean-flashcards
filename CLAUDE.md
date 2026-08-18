# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Korean language flashcard apps for vocabulary study. Each page is a self-contained HTML file (HTML + CSS + inline JS) with no build system, dependencies, or tooling.

- `index.html` — vocabulary from Conversations 1–3 (categories: Noun, Verb, Adjective, Particle, etc.)
- `numbers.html` — Sino-Korean vs Native-Korean number system drill (categories: Age, Hour, Minute, People, …; cards additionally carry a `system` field of `"Sino"` or `"Native"`)
- `verbs.html` — verb recall + conjugation drill (TTMIK Lesson 18). Cards are verbs with a `conjugations` map keyed by tense (`present`, `past`, `want`), each value `{korean, romanization}` or `null`. Two modes selected by a toggle: **Recall** (English → base + full conjugation table) and **Conjugate** (base + tense chip → type the conjugated form). The tense filter (`tense-filters`) is only visible in Conjugate mode via `body.mode-conjugate` and controls which form is drilled

- `particles.html` — particle-choice drill. Cards are sentences built from the vocabulary/verb decks with one or more blanks; the learner picks from a fixed 8-button set (에, 에서, 을, 를, 이, 가, 은, 는). Two authoring shapes normalize to one internal model at load (`cards`): the compact `{before, after, answer, explanation}` for single-blank cards, and `{parts, answers, explanations}` (parts has one more entry than answers) for compound sentences. Blanks fill left to right and the card is graded as a unit only once every blank has a pick. Each particle button carries its hover explanation in `data-tip` (rendered by `.particle-btn::after`); the same text feeds the tap-friendly "Particle guide" panel

The pages share the same UI shell and JS shape but have **independent, copy-pasted code** — there is no shared module. Changes to behavior usually need to be made in all files.

## Development

Open the file directly in a browser — no server required:
```
open index.html
open numbers.html
```

The deck switcher (`nav.deck-switch`) is duplicated in every page — adding a page means adding a link to all of them.

## Architecture

- **Single file per page**: styles in `<style>`, markup in `<body>`, logic in `<script>`
- **Card data**: hardcoded `allCards` array. Common fields: `english`, `korean`, `romanization`, `pronunciation` (nullable), `category`. `numbers.html` adds `system`
- **Categories**: derived dynamically from the data via `Set`; filter buttons are generated at runtime, with an injected "All" option
- **Card flip**: CSS 3D transform (`rotateY(180deg)`) toggled by adding/removing `.flipped` on `#card`; `backface-visibility: hidden` hides the unseen face
- **Romanization reveal**: hidden by default on the back face; `mouseenter`/`mouseleave` on the hangul shows it on desktop, `touchstart` toggles it on mobile (with `stopPropagation` so the tap doesn't also flip the card)
- **Navigation**: `idx` into the `deck` array; `prev`/`next` wrap with modular arithmetic
- **Shuffle**: in-place Fisher-Yates on `deck`, then resets `idx` to 0
- **Filtering**: rebuilds `deck` from `allCards` filtered by `activeCategory` and resets `idx`
- **Keyboard**: ←/→ navigate, Space flips (all `preventDefault`'d)

## Conventions

- When adding vocabulary, keep entries grouped by lesson with a `// ===== ... =====` section comment, and sub-grouped by part of speech with a `// Nouns` style comment — this is how both files are organized
- `pronunciation` is used for two different things in `index.html`: actual pronunciation hints in brackets (e.g. `"[학쌩]"`) for sound-change words, and conjugation/usage examples (e.g. `"안녕하세요."`, `"이에요/예요"`) for verbs/copula. Keep nullable when neither applies
- In `particles.html`, keep each sentence unambiguous — the drill only works if exactly one particle is natural. Write the `explanation` to say *why* that particle wins (verb type, 있다/없다, batchim), not just what it means. Compound cards get one explanation per blank
- In `verbs.html`, conjugation answer checking normalizes both sides (lowercase, strip whitespace/hyphens/punctuation) then compares against the normalized hangul OR romanization — either accepted. Add new tenses by extending the `TENSES` array and adding a matching key to every verb's `conjugations` (or `null` if the form doesn't apply)
