/**
 * Main app component: SRS study session flow and UI.
 *
 * **Session phases**
 * - **playing** – Showing one card at a time from the current deck; user reveals, then rates (correct/incorrect). Transitions to "deck-summary" when the last card is rated, or to "nothing-due" if the initial deck build returns empty.
 * - **deck-summary** – Showing stats for the deck just completed (correct/incorrect). User can "Continue" (build next deck) or "Stop" (go to nothing-due).
 * - **nothing-due** – No cards due; shows next due time and progress. Reached when buildDeck returns an empty deck (e.g. on mount or after "Continue") or when user clicks "Stop" from deck-summary.
 *
 * **State overview**
 * - Card states (persisted): from useCardStates(); updated on each feedback via applyReview.
 * - currentDeck / deckIndex / deckStats / revealed: current deck and position; reset when a new deck is started.
 * - phase: drives which screen is shown (playing vs deck-summary vs nothing-due).
 *
 * **Effects**
 * - On mount: one-time effect builds the initial deck from persisted states (startDeck(states, 0)) and sets phase to "playing" or "nothing-due".
 * - Keyboard listener: when phase === "playing", Space reveals, 1 = correct, 2 = incorrect; listener is re-attached when phase/revealed/currentCard/handlers change.
 *
 * **Session new-card cap**
 * startDeck is called with session new count 0 on mount and on "Continue", so each new deck gets a full MAX_NEW_PER_SESSION allowance. The app does not track "new cards introduced this session" across multiple decks; every deck build is effectively a fresh allowance.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { CardView } from "./components/CardView"
import { DeckSummary } from "./components/DeckSummary"
import { FeedbackButtons } from "./components/FeedbackButtons"
import { NothingDue } from "./components/NothingDue"
import { useCardStates } from "./hooks/useLocalStorage"
import { buildDeck, getNextDueTimestamp } from "./lib/scheduler"
import { applyReview, createInitialState } from "./lib/srs"
import { a1Cards } from "./vocabulary/a1"
import type { Card, CardState } from "./vocabulary/types"

/** Current high-level UI/session state; determines which screen is rendered. */
type SessionPhase = "playing" | "deck-summary" | "nothing-due"

/** Aggregated correct/incorrect counts for the current deck (shown on deck-summary). */
interface DeckStats {
  correct: number
  incorrect: number
}

const ALL_CARDS: Card[] = a1Cards["a1-words"] ?? []
const TOTAL_CARDS = ALL_CARDS.length

const App = () => {
  const { states, updateState } = useCardStates()
  /** Whether the current card's answer is revealed (user can then give feedback). */
  const [revealed, setRevealed] = useState(false)

  /** Cards in the current session deck; built by startDeck and consumed in order. */
  const [currentDeck, setCurrentDeck] = useState<Card[]>([])
  /** Index into currentDeck; when phase is "playing", currentCard = currentDeck[deckIndex]. */
  const [deckIndex, setDeckIndex] = useState(0)
  /** Correct/incorrect counts for the current deck; reset when startDeck runs, updated on each handleFeedback. */
  const [deckStats, setDeckStats] = useState<DeckStats>({
    correct: 0,
    incorrect: 0,
  })
  /** Current session phase; controls which screen is shown (playing | deck-summary | nothing-due). */
  const [phase, setPhase] = useState<SessionPhase>("playing")

  const learnedCount = useMemo(
    () => Object.values(states).filter((s) => s.status === "learned").length,
    [states],
  )

  const nextDueAt = useMemo(() => getNextDueTimestamp(states), [states])

  /**
   * Builds a new deck from ALL_CARDS and current states, then sets it as the current deck and switches to "playing" (or "nothing-due" if the deck is empty).
   * Resets deckIndex to 0, deckStats to zero, and revealed to false. Caller must pass latest states and session new count to avoid stale closures.
   */
  const startDeck = useCallback(
    (latestStates: typeof states, latestSessionNewCount: number) => {
      const { deck, introducedNewCount } = buildDeck(
        ALL_CARDS,
        latestStates,
        latestSessionNewCount,
      )

      if (deck.length === 0) {
        setPhase("nothing-due")
        return { deck, introducedNewCount }
      }

      setCurrentDeck(deck)
      setDeckIndex(0)
      setDeckStats({ correct: 0, incorrect: 0 })
      setRevealed(false)
      setPhase("playing")
      return { deck, introducedNewCount }
    },
    [],
  )

  /**
   * Effect: run once on mount. Builds the initial deck from persisted states (startDeck(states, 0)).
   * If the deck is empty, phase becomes "nothing-due"; otherwise "playing". Uses initialised flag so it only runs once; dependencies omitted intentionally.
   */
  const [initialised, setInitialised] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount to build initial deck from localStorage
  useEffect(() => {
    if (initialised) return
    setInitialised(true)
    startDeck(states, 0)
  }, [])

  const currentCard =
    phase === "playing" ? (currentDeck[deckIndex] ?? null) : null

  const handleReveal = useCallback(() => setRevealed(true), [])

  /**
   * Applies the user's correct/incorrect rating to the current card: updates persisted state via applyReview, increments deckStats, resets revealed, then advances to next card or to "deck-summary" if this was the last card.
   */
  const handleFeedback = useCallback(
    (correct: boolean) => {
      if (!currentCard) return

      const existingState: CardState =
        states[currentCard.id] ?? createInitialState()
      const nextState = applyReview(existingState, correct)
      updateState(currentCard.id, nextState)

      setDeckStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }))

      setRevealed(false)

      const nextIndex = deckIndex + 1
      if (nextIndex >= currentDeck.length) {
        setPhase("deck-summary")
      } else {
        setDeckIndex(nextIndex)
      }
    },
    [currentCard, deckIndex, currentDeck.length, states, updateState],
  )

  /**
   * Called from deck-summary "Continue". Builds the next deck with session new count 0 (full allowance per deck); then phase becomes "playing" or "nothing-due" depending on whether the deck is empty.
   */
  const handleContinue = useCallback(() => {
    startDeck(states, 0)
  }, [startDeck, states])

  /**
   * Called from deck-summary "Stop". Leaves deck-summary and shows nothing-due screen (next due time, progress).
   */
  const handleStop = useCallback(() => {
    setPhase("nothing-due")
  }, [])

  /**
   * Effect: keyboard shortcuts only when phase === "playing". Space = reveal; 1 = correct, 2 = incorrect (only when revealed). Prevents default for Space. Cleanup removes listener.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (phase !== "playing") return
      if (e.key === " ") {
        e.preventDefault()
        if (!revealed) handleReveal()
        return
      }
      if (!revealed || !currentCard) return
      if (e.key === "1") {
        handleFeedback(true)
        return
      }
      if (e.key === "2") {
        handleFeedback(false)
        return
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [phase, revealed, currentCard, handleReveal, handleFeedback])

  // Phase-based render: nothing-due → deck-summary → playing (with currentCard guard)
  if (phase === "nothing-due") {
    return (
      <NothingDue
        nextDueAt={nextDueAt}
        learnedCount={learnedCount}
        totalCount={TOTAL_CARDS}
      />
    )
  }

  if (phase === "deck-summary") {
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
    )
  }

  if (!currentCard) {
    return (
      <NothingDue
        nextDueAt={nextDueAt}
        learnedCount={learnedCount}
        totalCount={TOTAL_CARDS}
      />
    )
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
            <span>
              {learnedCount} of {TOTAL_CARDS} words learned
            </span>
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
  )
}

export default App
