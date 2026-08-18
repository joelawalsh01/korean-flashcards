# Korean Flashcards

Self-contained flashcard apps for Korean vocabulary study. No build system, no dependencies — each page is a single HTML file.

**Live site:** https://joelawalsh01.github.io/korean-flashcards/

## Decks

| Page | Contents |
| --- | --- |
| `index.html` | Vocabulary from Conversations 1–3 + TTMIK Lessons 7, 9, 10 |
| `numbers.html` | Sino-Korean vs Native-Korean number systems, filtered by usage (age, hour, minute, …) |
| `verbs.html` | Verb recall + conjugation drill (TTMIK Lessons 17–18) with Recall and Conjugate modes |
| `particles.html` | Particle drill — pick 에 / 에서 / 을 / 를 / 이 / 가 / 은 / 는 for each blank in a sentence, including compound sentences with two or three blanks, plus a 누구 vs 누가 set (TTMIK Lesson 23) |

Use the pill switcher at the top of any page to move between decks.

## Controls

- **←** / **→** — previous / next card
- **Space** — flip the card
- **Enter** — check your answer (Conjugate mode on the verbs page)
- **1**–**8** — pick a particle, **Backspace** — undo a blank (particles page)
- **S** — hear the Korean, or click the 🔊 button on the back of any card
- Hover (or tap on mobile) the hangul on the back of a card to reveal its romanization
- Hover a particle choice for an explanation of what it does; the **Particle guide** button shows the same notes on touch devices

## Audio

Every card has a recording of the Korean, generated with the macOS voice Yuna
and committed under `audio/` (576 clips, ~4MB). Pages look up a clip by a hash
of the text, so there is no manifest to keep in sync — and if a clip is missing
they fall back to the browser's own Korean voice.

After adding or editing cards, regenerate:

```
node tools/build-audio.mjs
```

Existing clips are skipped, so a re-run after a handful of new cards takes
seconds. Needs macOS with the Korean voice Yuna installed (System Settings →
Accessibility → Spoken Content → System Voice → Manage Voices) and `ffmpeg`.

## Running locally

Open any file directly in a browser — no server needed:

```
open index.html
```
