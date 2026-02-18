# hilf

A German A1/A2 flashcard learning app for speaking practice. See the English prompt, attempt the German translation aloud, reveal the answer, and mark correct or incorrect. Uses spaced repetition (SM-2) so stronger cards appear less often.

## Features

- **Spaced Repetition**: SM-2 algorithm schedules reviews so you focus on words you find difficult
- **Speaking Practice**: Say the German translation aloud before revealing the answer
- **Progress Tracking**: Cards are categorized as New, Weak, Learning, or Strong
- **Session-Based Learning**: Review up to 20 cards per session
- **Dark Mode**: Automatic support for light and dark themes
- **Keyboard Shortcuts**: Press `Space` to reveal, `1` for correct, `2` for incorrect
- **Offline Ready**: All vocabulary stored locally in-browser

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- npm (comes with Node.js)

### Installation

```bash
git clone <repository-url>
cd hilf
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for fast development and builds
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [supermemo](https://www.npmjs.com/package/supermemo) for SM-2 spaced repetition

## Vocabulary

- **A1 Base Words**: ~583 cards from the [Goethe-Institut A1 wordlist](https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf)
- Source: [patsytau/anki_german_a1_vocab](https://github.com/patsytau/anki_german_a1_vocab)
- Future: A2, grammar decks (dative, Perfekt, etc.)

To regenerate A1 vocabulary from source:

```bash
node scripts/parse-a1-vocab.mjs
```

## Project Structure

```
src/
├── components/     # React UI components
├── hooks/          # Custom React hooks
├── lib/            # Core logic (SRS, scheduler)
└── vocabulary/     # Vocabulary data and types
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Deployment

The app automatically deploys to GitHub Pages on push to `main` via GitHub Actions.
