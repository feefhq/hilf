# hilf

A German A1/A2 flashcard learning app for speaking practice. See the English prompt, attempt the German translation aloud, reveal the answer, and mark correct or incorrect. Uses spaced repetition (SM-2) so stronger cards appear less often.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Vocabulary from [Goethe-Institut A1](https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf) via [patsytau/anki_german_a1_vocab](https://github.com/patsytau/anki_german_a1_vocab)

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Vocabulary

- **A1 Base Words**: ~583 cards from the Goethe-Institut A1 wordlist
- Future: A2, grammar decks (dative, Perfekt, etc.)

To regenerate A1 vocabulary from source:

```bash
node scripts/parse-a1-vocab.mjs
```
