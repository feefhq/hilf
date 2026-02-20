import type { CardState } from "../vocabulary/types"

/** Retained for FeedbackButtons compatibility: 5 = correct, 4 = correct but hard, 2 = incorrect */
export type Quality = 5 | 4 | 2

const DEFAULT_MS_PER_INTERVAL = 4 * 60 * 60 * 1000
const MS_PER_INTERVAL =
  Number(import.meta.env.VITE_MS_PER_INTERVAL) || DEFAULT_MS_PER_INTERVAL

const LEARNED_INTERVAL = 3
const MIN_EASE = 1.3

export function applyReview(state: CardState, correct: boolean): CardState {
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

export function createInitialState(): CardState {
  return {
    status: "practicing",
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lastReviewed: null,
    nextDue: null,
    correctStreak: 0,
    totalCorrect: 0,
    totalSeen: 0,
  }
}
