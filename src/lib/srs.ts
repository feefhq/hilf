/**
 * Spaced Repetition System (SRS) logic for card reviews.
 *
 * Handles:
 * - Applying a correct/incorrect answer to a card's state (intervals, ease, promotions).
 * - Creating the initial state for a card when it is first introduced.
 *
 * Intervals are expressed in "interval units"; the actual delay in ms is
 * `interval * MS_PER_INTERVAL` (configurable via VITE_MS_PER_INTERVAL).
 */
import type { CardState } from "../vocabulary/types"

/**
 * Legacy rating scale for UI feedback. Retained for FeedbackButtons compatibility.
 * - 5 = correct (easy/good)
 * - 4 = correct but hard
 * - 2 = incorrect
 */
export type Quality = 5 | 4 | 2

/** Default length of one interval in ms (4 hours). Used when VITE_MS_PER_INTERVAL is not set. */
const DEFAULT_MS_PER_INTERVAL = 4 * 60 * 60 * 1000
/** Length of one interval in ms. Overridable via env for testing or tuning. */
const MS_PER_INTERVAL =
  Number(import.meta.env.VITE_MS_PER_INTERVAL) || DEFAULT_MS_PER_INTERVAL

/**
 * Minimum interval (in interval units) required to promote a card from "practicing" to "learned".
 * A card becomes "learned" when it has been answered correctly and its next interval is >= 3.
 */
const LEARNED_INTERVAL = 3
/** Lower bound for ease factor; prevents intervals from shrinking too much after incorrect answers. */
const MIN_EASE = 1.3

/**
 * Applies a single review outcome (correct or incorrect) to a card's state.
 *
 * **Correct answer:**
 * - Increments repetitions, totalCorrect, totalSeen, correctStreak.
 * - Interval: 1st rep → 1, 2nd rep → 3, then interval = round(interval * easeFactor).
 * - Ease factor increases by 0.1 (capped implicitly by usage).
 * - If status is "practicing" and the new interval >= LEARNED_INTERVAL (3), status becomes "learned".
 *
 * **Incorrect answer:**
 * - Resets correctStreak to 0.
 * - repetitions = max(1, repetitions - 1); interval = 1; ease factor decreases by 0.2 (floor at MIN_EASE).
 * - If status was "learned", demotes to "practicing" and resets repetitions to 1, correctStreak to 0.
 *
 * nextDue is always set to now + (interval * MS_PER_INTERVAL); lastReviewed is set to now.
 *
 * @param state - Current card state (practicing or learned; for "new" cards use createInitialState first).
 * @param correct - Whether the user answered correctly.
 * @returns New immutable CardState with updated fields.
 */
export const applyReview = (state: CardState, correct: boolean): CardState => {
  const now = Date.now()
  let {
    repetitions,
    interval,
    easeFactor,
    correctStreak,
    totalCorrect,
    totalSeen,
    status,
  } = state

  totalSeen += 1

  if (correct) {
    totalCorrect += 1
    correctStreak += 1
    repetitions += 1

    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }

    easeFactor = Math.max(MIN_EASE, easeFactor + 0.1)
  } else {
    correctStreak = 0
    repetitions = Math.max(1, repetitions - 1)
    interval = 1
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2)

    // Demote learned card back to practicing
    if (status === "learned") {
      status = "practicing"
      repetitions = 1
      correctStreak = 0
    }
  }

  // Promote practicing card to learned
  if (status === "practicing" && correct && interval >= LEARNED_INTERVAL) {
    status = "learned"
  }

  const nextDue = now + interval * MS_PER_INTERVAL

  return {
    ...state,
    status,
    interval,
    easeFactor,
    repetitions,
    correctStreak,
    totalCorrect,
    totalSeen,
    lastReviewed: now,
    nextDue,
  }
}

/**
 * Creates the initial CardState for a card that has never been reviewed.
 *
 * New cards are created with status "practicing", interval 0, repetitions 0,
 * and nextDue/lastReviewed null. When the card is first reviewed, applyReview
 * will use this state; the first correct answer will set interval to 1 and nextDue
 * accordingly.
 *
 * @returns Initial state suitable for a card just introduced into the deck.
 */
export const createInitialState = (): CardState => ({
  status: "practicing",
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
  lastReviewed: null,
  nextDue: null,
  correctStreak: 0,
  totalCorrect: 0,
  totalSeen: 0,
})
