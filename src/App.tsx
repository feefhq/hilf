import { useState, useMemo, useEffect, useRef } from 'react';
import { decks } from './vocabulary/registry';
import { a1Cards } from './vocabulary/a1';
import { CardView } from './components/CardView';
import { FeedbackButtons } from './components/FeedbackButtons';
import { DeckSelector } from './components/DeckSelector';
import { useCardStates } from './hooks/useLocalStorage';
import { getNextCards } from './lib/scheduler';
import { applySm2, type Quality } from './lib/srs';
import type { Card } from './vocabulary/types';

const SESSION_LIMIT = 20;
/** Interval in days above which a card is considered "strong". */
const STRONG_INTERVAL_DAYS = 21;

function getCardsForDeck(deckId: string): Card[] {
  return a1Cards[deckId] ?? [];
}

interface StrengthCounts {
  new: number;
  learning: number;
  strong: number;
}

function getStrengthCounts(
  cards: Card[],
  states: Record<string, { repetitions: number; interval: number }>
): StrengthCounts {
  let newCount = 0;
  let learningCount = 0;
  let strongCount = 0;
  for (const card of cards) {
    const state = states[card.id];
    if (!state || state.repetitions === 0) {
      newCount += 1;
    } else if (state.interval <= STRONG_INTERVAL_DAYS) {
      learningCount += 1;
    } else {
      strongCount += 1;
    }
  }
  return { new: newCount, learning: learningCount, strong: strongCount };
}

export default function App() {
  const [deckId, setDeckId] = useState(decks[0].id);
  const [revealed, setRevealed] = useState(false);
  const { states, updateState, getState } = useCardStates();

  const cards = useMemo(() => getCardsForDeck(deckId), [deckId]);

  const strengthCounts = useMemo(
    () => getStrengthCounts(cards, states),
    [cards, states]
  );

  const statesMap = useMemo(() => {
    const m = new Map<string, { cardId: string; repetitions: number; easeFactor: number; interval: number; nextReview: number }>();
    for (const [id, s] of Object.entries(states)) {
      m.set(id, { ...s, cardId: id });
    }
    return m;
  }, [states]);

  const [sessionQueue, setSessionQueue] = useState<Card[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [reshuffleKey, setReshuffleKey] = useState(0);
  const statesMapRef = useRef(statesMap);
  statesMapRef.current = statesMap;

  useEffect(() => {
    setSessionQueue(getNextCards(cards, statesMapRef.current, SESSION_LIMIT));
    setQueueIndex(0);
  }, [deckId, reshuffleKey, cards]);
  const currentCard = sessionQueue[queueIndex];

  const handleReveal = () => setRevealed(true);

  const handleFeedback = (quality: Quality) => {
    if (!currentCard) return;
    const s = getState(currentCard.id);
    const state = s ?? { repetitions: 0, easeFactor: 2.5, interval: 0, nextReview: 0 };
    const fullState = { ...state, cardId: currentCard.id };
    const next = applySm2(fullState, quality);
    updateState(currentCard.id, {
      repetitions: next.repetitions,
      easeFactor: next.easeFactor,
      interval: next.interval,
      nextReview: next.nextReview,
    });
    setRevealed(false);
    setQueueIndex((i) => i + 1);
  };

  const handleDeckChange = (id: string) => {
    setDeckId(id);
    setRevealed(false);
  };

  const handleStartAgain = () => {
    setReshuffleKey((k) => k + 1);
    setRevealed(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === ' ') {
        e.preventDefault();
        if (!revealed) handleReveal();
        return;
      }
      if (!revealed || !currentCard) return;
      if (e.key === '1') {
        handleFeedback(5);
        return;
      }
      if (e.key === '2') {
        handleFeedback(2);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [revealed, currentCard, handleReveal, handleFeedback]);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <p className="text-neutral-600 dark:text-neutral-400">No cards in this deck.</p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
            All done for now
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-center">
            No more cards due today. Come back later for your next review.
          </p>
          <button
            onClick={handleStartAgain}
            className="px-6 py-3 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-medium hover:opacity-90"
          >
            Start again
          </button>
        </div>
        <footer className="py-3 text-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            New {strengthCounts.new} · Learning {strengthCounts.learning} · Strong {strengthCounts.strong}
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col">
      <header className="p-4 flex items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          hilf
        </h1>
        <DeckSelector
          decks={decks}
          selectedId={deckId}
          onSelect={handleDeckChange}
        />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="w-full">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Card {queueIndex + 1} of {sessionQueue.length}
          </p>
          <CardView
            card={currentCard}
            revealed={revealed}
            onReveal={handleReveal}
          />
          <div className="mt-8 min-h-[7rem] flex flex-col justify-center items-center">
            {revealed && (
              <>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                  How did you do?
                </p>
                <FeedbackButtons onFeedback={handleFeedback} />
              </>
            )}
          </div>
        </div>
      </main>
      <footer className="py-3 text-center">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          New {strengthCounts.new} · Learning {strengthCounts.learning} · Strong {strengthCounts.strong}
        </p>
      </footer>
    </div>
  );
}
