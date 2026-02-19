import { useState, useMemo, useEffect, useCallback } from 'react';
import { a1Cards } from './vocabulary/a1';
import { CardView } from './components/CardView';
import { FeedbackButtons } from './components/FeedbackButtons';
import { DeckSummary } from './components/DeckSummary';
import { NothingDue } from './components/NothingDue';
import { useCardStates } from './hooks/useLocalStorage';
import { buildDeck } from './lib/scheduler';
import { getNextDueTimestamp } from './lib/scheduler';
import { applyReview, createInitialState } from './lib/srs';
import type { Card, CardState } from './vocabulary/types';

type SessionPhase = 'playing' | 'deck-summary' | 'nothing-due';

interface DeckStats {
  correct: number;
  incorrect: number;
}

const ALL_CARDS: Card[] = a1Cards['a1-words'] ?? [];
const TOTAL_CARDS = ALL_CARDS.length;

export default function App() {
  const { states, updateState } = useCardStates();
  const [revealed, setRevealed] = useState(false);

  // Session-level new card counter — not persisted, resets each app open
  const [sessionNewCardCount, setSessionNewCardCount] = useState(0);

  // Current deck
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [deckIndex, setDeckIndex] = useState(0);
  const [deckStats, setDeckStats] = useState<DeckStats>({ correct: 0, incorrect: 0 });
  const [phase, setPhase] = useState<SessionPhase>('playing');

  const learnedCount = useMemo(
    () => Object.values(states).filter((s) => s.status === 'learned').length,
    [states]
  );

  const nextDueAt = useMemo(() => getNextDueTimestamp(states), [states]);

  // Build a fresh deck, using the latest states ref to avoid stale closures
  const startDeck = useCallback(
    (latestStates: typeof states, latestSessionNewCount: number) => {
      const { deck, introducedNewCount } = buildDeck(ALL_CARDS, latestStates, latestSessionNewCount);

      if (deck.length === 0) {
        setPhase('nothing-due');
        return { deck, introducedNewCount };
      }

      setCurrentDeck(deck);
      setDeckIndex(0);
      setDeckStats({ correct: 0, incorrect: 0 });
      setRevealed(false);
      setPhase('playing');
      return { deck, introducedNewCount };
    },
    []
  );

  // Build the initial deck on mount. We need to use a ref-stable snapshot of
  // states from the hook since states is initialised synchronously from localStorage.
  const [initialised, setInitialised] = useState(false);
  useEffect(() => {
    if (initialised) return;
    setInitialised(true);
    startDeck(states, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCard = phase === 'playing' ? currentDeck[deckIndex] ?? null : null;

  const handleReveal = useCallback(() => setRevealed(true), []);

  const handleFeedback = useCallback(
    (correct: boolean) => {
      if (!currentCard) return;

      const existingState: CardState = states[currentCard.id] ?? createInitialState();
      const nextState = applyReview(existingState, correct);
      updateState(currentCard.id, nextState);

      setDeckStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));

      setRevealed(false);

      const nextIndex = deckIndex + 1;
      if (nextIndex >= currentDeck.length) {
        setPhase('deck-summary');
      } else {
        setDeckIndex(nextIndex);
      }
    },
    [currentCard, deckIndex, currentDeck.length, states, updateState]
  );

  // When a new card appears for the first time, increment session new-card count
  // (state is persisted only on first review in handleFeedback, not on show)
  useEffect(() => {
    if (phase !== 'playing' || !currentCard) return;
    const s = states[currentCard.id];
    if (!s || s.status === 'new') {
      setSessionNewCardCount((n) => n + 1);
    }
    // Only run when the current card changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard?.id, phase]);

  const handleContinue = useCallback(() => {
    // states may be stale here; we need the latest from localStorage
    // Because React batches updates, we pass sessionNewCardCount as captured
    // but use a functional read for the actual states via the hook's closure.
    startDeck(states, sessionNewCardCount);
  }, [startDeck, states, sessionNewCardCount]);

  const handleStop = useCallback(() => {
    setPhase('nothing-due');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (phase !== 'playing') return;
      if (e.key === ' ') {
        e.preventDefault();
        if (!revealed) handleReveal();
        return;
      }
      if (!revealed || !currentCard) return;
      if (e.key === '1') { handleFeedback(true); return; }
      if (e.key === '2') { handleFeedback(false); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, revealed, currentCard, handleReveal, handleFeedback]);

  if (phase === 'nothing-due') {
    return (
      <NothingDue
        nextDueAt={nextDueAt}
        learnedCount={learnedCount}
        totalCount={TOTAL_CARDS}
      />
    );
  }

  if (phase === 'deck-summary') {
    return (
      <DeckSummary
        stats={{
          total: currentDeck.length,
          correct: deckStats.correct,
          incorrect: deckStats.incorrect,
        }}
        onContinue={handleContinue}
        onStop={handleStop}
      />
    );
  }

  if (!currentCard) {
    return (
      <NothingDue
        nextDueAt={nextDueAt}
        learnedCount={learnedCount}
        totalCount={TOTAL_CARDS}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col">
      <header className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          hilf
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="w-full">
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Card {deckIndex + 1} of {currentDeck.length}
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
                <FeedbackButtons onFeedback={(q) => handleFeedback(q === 5)} />
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="py-4 px-4 flex flex-col items-center gap-2">
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            <span>{learnedCount} of {TOTAL_CARDS} words learned</span>
            <span>{Math.round((learnedCount / TOTAL_CARDS) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(learnedCount / TOTAL_CARDS) * 100}%` }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
