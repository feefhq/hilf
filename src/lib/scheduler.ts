/**
 * Deck-building and scheduling utilities for the SRS session.
 *
 * Responsibilities:
 * - **buildDeck**: Assembles the next batch of cards to study (up to DECK_SIZE), ordered by
 *   priority: (1) due practicing cards, (2) due learned cards (capped), (3) new cards (capped).
 *   Order within each group is stable-random (day-based seed) so decks vary without being arbitrary.
 * - **getActivePracticing**: Counts how many cards are currently in "practicing" status (used for caps).
 * - **getTotalAvailable**: Total cards available to study now (due practicing + due learned + new available), with breakdown for future use.
 * - **getNextDueTimestamp**: Earliest future due time across practicing/learned cards (for UI countdown).
 *
 * All "due" checks use current time (Date.now()); cards with nextDue <= now are considered due.
 */
import type { Card, CardState } from "../vocabulary/types"

/** Maximum number of cards in a single deck/session. */
const DECK_SIZE = 20
/** Maximum number of "learned" cards allowed in one deck (30% of DECK_SIZE). Prevents learned cards from dominating. */
const MAX_LEARNED_PER_DECK = 6
/** Maximum number of cards that can be in "practicing" status at once. New cards are not introduced beyond this. */
const MAX_ACTIVE_POOL = 40
/** Maximum new cards that can be introduced in a single session (across deck builds in that session). */
const MAX_NEW_PER_SESSION = 10

/** Returns a stable numeric hash for a string (djb2). Same input → same output. */
function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return h >>> 0
}

/** Seed for stable randomness: same calendar day → same order across deck builds. */
function getStableSeed(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Returns a copy of the array ordered by stable random order (hash of seed + key).
 * Same seed + same items → same order; different days get different order.
 */
function stableShuffleBy<T>(arr: T[], seed: string, key: (item: T) => string): T[] {
  const seedHash = hashString(seed)
  return [...arr].sort((a, b) => {
    const ha = hashString(seed + key(a)) ^ seedHash
    const hb = hashString(seed + key(b)) ^ seedHash
    return ha - hb
  })
}

export interface BuildDeckResult {
  /** The assembled deck of cards to study (length ≤ DECK_SIZE). */
  deck: Card[]
  /** Number of new cards added to the deck in this call (for session cap tracking). */
  introducedNewCount: number
}

/**
 * Builds the next deck of cards to study from the full set and their states.
 *
 * **Priority order (each step fills the deck up to DECK_SIZE):**
 * 1. **Due practicing cards** – status "practicing" and nextDue <= now, most overdue first (smallest nextDue).
 * 2. **Due learned cards** – status "learned" and nextDue <= now, most overdue first; **capped at MAX_LEARNED_PER_DECK** so learned cards don't dominate.
 * 3. **New cards** – only if: active practicing count < MAX_ACTIVE_POOL, session new count < MAX_NEW_PER_SESSION, and there are remaining slots. New cards are in stable-random order (same day → same order) and added up to the minimum of: remaining new allowance, remaining slots, and (MAX_ACTIVE_POOL - active practicing count).
 *
 * **Behavioural notes:**
 * - "Due" is evaluated once at the start (now); cards due "now" are included.
 * - sessionNewCardCount is the number of new cards already introduced this session; the caller must track and pass this so MAX_NEW_PER_SESSION is enforced across multiple buildDeck calls.
 * - Cards with no state or status "new" are candidates for "new" in step 3; cards in "practicing" or "learned" are only considered in steps 1–2 when due.
 *
 * @param allCards - Full list of cards (e.g. for current level/set).
 * @param states - Current state per card id; may be missing for unseen cards.
 * @param sessionNewCardCount - Number of new cards already introduced in this session (for cap).
 * @returns The built deck and how many new cards were introduced in this call.
 */
export const buildDeck = (
  allCards: Card[],
  states: Record<string, CardState>,
  sessionNewCardCount: number,
): BuildDeckResult => {
  const now = Date.now()
  const deck: Card[] = []
  const seed = getStableSeed()

  // Priority 1: due practicing cards, most overdue first; tie-break by stable hash
  const duePracticing = allCards
    .filter((c) => {
      const s = states[c.id]
      return (
        s?.status === "practicing" && s.nextDue !== null && s.nextDue <= now
      )
    })
    .sort((a, b) => {
      const na = states[a.id].nextDue
      const nb = states[b.id].nextDue
      if (na == null || nb == null) return 0
      if (na !== nb) return na - nb // most overdue = smallest timestamp = first
      return hashString(seed + a.id) - hashString(seed + b.id)
    })

  for (const card of duePracticing) {
    if (deck.length >= DECK_SIZE) break
    deck.push(card)
  }

  // Priority 2: due learned cards, capped at MAX_LEARNED_PER_DECK; tie-break by stable hash
  const dueLearned = allCards
    .filter((c) => {
      const s = states[c.id]
      return s?.status === "learned" && s.nextDue !== null && s.nextDue <= now
    })
    .sort((a, b) => {
      const na = states[a.id].nextDue
      const nb = states[b.id].nextDue
      if (na == null || nb == null) return 0
      if (na !== nb) return na - nb
      return hashString(seed + a.id) - hashString(seed + b.id)
    })

  for (const card of dueLearned) {
    if (deck.length >= DECK_SIZE) break
    if (
      deck.filter((c) => states[c.id]?.status === "learned").length >=
      MAX_LEARNED_PER_DECK
    )
      break
    deck.push(card)
  }

  // Priority 3: new cards, subject to session cap and active pool limit
  const activePracticingCount = getActivePracticing(states)
  const remainingNewAllowance = MAX_NEW_PER_SESSION - sessionNewCardCount
  const remainingSlots = DECK_SIZE - deck.length
  const canIntroduceNew =
    activePracticingCount < MAX_ACTIVE_POOL &&
    remainingNewAllowance > 0 &&
    remainingSlots > 0

  let introducedNewCount = 0

  if (canIntroduceNew) {
    const newCandidates = allCards.filter(
      (c) => !states[c.id] || states[c.id].status === "new",
    )
    const newCards = stableShuffleBy(newCandidates, seed, (c) => c.id)

    const limit = Math.min(
      remainingNewAllowance,
      remainingSlots,
      MAX_ACTIVE_POOL - activePracticingCount,
    )

    for (const card of newCards) {
      if (introducedNewCount >= limit || deck.length >= DECK_SIZE) break
      deck.push(card)
      introducedNewCount += 1
    }
  }

  return { deck, introducedNewCount }
}

/**
 * Counts how many cards currently have status "practicing".
 *
 * Used when building the deck to enforce MAX_ACTIVE_POOL: new cards are not
 * introduced once this count reaches MAX_ACTIVE_POOL, so the total number of
 * cards in the "practicing" pipeline is capped.
 *
 * @param states - All known card states (keyed by card id).
 * @returns Number of cards with status "practicing".
 */
export const getActivePracticing = (
  states: Record<string, CardState>,
): number => {
  return Object.values(states).filter((s) => s.status === "practicing").length
}

/** Result of getTotalAvailable; breakdown is for future use (e.g. tooltips or detailed UI). */
export interface TotalAvailableResult {
  total: number
  duePracticing: number
  dueLearned: number
  newAvailable: number
}

/**
 * Returns the total number of cards available to study right now, with a breakdown.
 * Uses the same "due" and "new" rules as buildDeck; does not apply DECK_SIZE or
 * MAX_NEW_PER_SESSION, so this is the full pool that could be studied.
 *
 * @param allCards - Full list of cards (e.g. for current level/set).
 * @param states - Current state per card id; may be missing for unseen cards.
 * @returns Total count and breakdown (duePracticing, dueLearned, newAvailable).
 */
export const getTotalAvailable = (
  allCards: Card[],
  states: Record<string, CardState>,
): TotalAvailableResult => {
  const now = Date.now()
  const duePracticing = allCards.filter((c) => {
    const s = states[c.id]
    return (
      s?.status === "practicing" && s.nextDue !== null && s.nextDue <= now
    )
  }).length
  const dueLearned = allCards.filter((c) => {
    const s = states[c.id]
    return s?.status === "learned" && s.nextDue !== null && s.nextDue <= now
  }).length
  const activePracticingCount = getActivePracticing(states)
  const newCandidates = allCards.filter(
    (c) => !states[c.id] || states[c.id].status === "new",
  )
  const newAvailable = Math.min(
    newCandidates.length,
    Math.max(0, MAX_ACTIVE_POOL - activePracticingCount),
  )
  return {
    total: duePracticing + dueLearned + newAvailable,
    duePracticing,
    dueLearned,
    newAvailable,
  }
}

/**
 * Returns the earliest future due timestamp among practicing and learned cards.
 *
 * Only considers cards that have nextDue set and nextDue > now. Used for UI
 * (e.g. "next review in X") and does not include cards that are already due.
 *
 * @param states - All known card states (keyed by card id).
 * @returns Earliest nextDue (ms) in the future, or null if none.
 */
export const getNextDueTimestamp = (
  states: Record<string, CardState>,
): number | null => {
  const now = Date.now()
  let earliest: number | null = null
  for (const s of Object.values(states)) {
    if (
      (s.status === "practicing" || s.status === "learned") &&
      s.nextDue !== null &&
      s.nextDue > now
    ) {
      if (earliest === null || s.nextDue < earliest) {
        earliest = s.nextDue
      }
    }
  }
  return earliest
}
