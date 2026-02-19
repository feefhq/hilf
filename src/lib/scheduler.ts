import type { Card, CardState } from '../vocabulary/types';

const DECK_SIZE = 20;
const MAX_LEARNED_PER_DECK = 6; // 30% of 20
const MAX_ACTIVE_POOL = 40;
const MAX_NEW_PER_SESSION = 10;

export interface BuildDeckResult {
  deck: Card[];
  introducedNewCount: number;
}

/**
 * Order new cards by level → difficulty → category so vocabulary clusters
 * are introduced together, and lower levels come first.
 */
function compareNewCards(a: Card, b: Card): number {
  // Level ascending (A1 < A2 < B1 etc.)
  if (a.level !== b.level) return a.level < b.level ? -1 : 1;

  // Difficulty ascending (A1.1 < A1.2 < A1.3)
  const da = a.difficulty ?? '';
  const db = b.difficulty ?? '';
  if (da !== db) return da < db ? -1 : 1;

  // Category grouped
  const ca = a.category ?? '';
  const cb = b.category ?? '';
  if (ca !== cb) return ca < cb ? -1 : 1;

  return 0;
}

export function buildDeck(
  allCards: Card[],
  states: Record<string, CardState>,
  sessionNewCardCount: number
): BuildDeckResult {
  const now = Date.now();
  const deck: Card[] = [];

  // Priority 1: due practicing cards, most overdue first
  const duePracticing = allCards
    .filter((c) => {
      const s = states[c.id];
      return s?.status === 'practicing' && s.nextDue !== null && s.nextDue <= now;
    })
    .sort((a, b) => {
      const na = states[a.id].nextDue!;
      const nb = states[b.id].nextDue!;
      return na - nb; // most overdue = smallest timestamp = first
    });

  for (const card of duePracticing) {
    if (deck.length >= DECK_SIZE) break;
    deck.push(card);
  }

  // Priority 2: due learned cards, capped at MAX_LEARNED_PER_DECK
  const dueLearned = allCards
    .filter((c) => {
      const s = states[c.id];
      return s?.status === 'learned' && s.nextDue !== null && s.nextDue <= now;
    })
    .sort((a, b) => {
      const na = states[a.id].nextDue!;
      const nb = states[b.id].nextDue!;
      return na - nb;
    });

  for (const card of dueLearned) {
    if (deck.length >= DECK_SIZE) break;
    if (deck.filter((c) => states[c.id]?.status === 'learned').length >= MAX_LEARNED_PER_DECK) break;
    deck.push(card);
  }

  // Priority 3: new cards, subject to session cap and active pool limit
  const activePracticingCount = getActivePracticing(states);
  const remainingNewAllowance = MAX_NEW_PER_SESSION - sessionNewCardCount;
  const remainingSlots = DECK_SIZE - deck.length;
  const canIntroduceNew =
    activePracticingCount < MAX_ACTIVE_POOL &&
    remainingNewAllowance > 0 &&
    remainingSlots > 0;

  let introducedNewCount = 0;

  if (canIntroduceNew) {
    const newCards = allCards
      .filter((c) => !states[c.id] || states[c.id].status === 'new')
      .sort(compareNewCards);

    const limit = Math.min(remainingNewAllowance, remainingSlots, MAX_ACTIVE_POOL - activePracticingCount);

    for (const card of newCards) {
      if (introducedNewCount >= limit || deck.length >= DECK_SIZE) break;
      deck.push(card);
      introducedNewCount += 1;
    }
  }

  return { deck, introducedNewCount };
}

/** Count cards currently in practicing status. */
export function getActivePracticing(states: Record<string, CardState>): number {
  return Object.values(states).filter((s) => s.status === 'practicing').length;
}

/** Returns the earliest nextDue timestamp across all practicing and learned cards, or null. */
export function getNextDueTimestamp(states: Record<string, CardState>): number | null {
  const now = Date.now();
  let earliest: number | null = null;
  for (const s of Object.values(states)) {
    if ((s.status === 'practicing' || s.status === 'learned') && s.nextDue !== null && s.nextDue > now) {
      if (earliest === null || s.nextDue < earliest) {
        earliest = s.nextDue;
      }
    }
  }
  return earliest;
}
