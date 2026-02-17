import type { Card } from '../vocabulary/types';
import type { CardState } from '../vocabulary/types';

export function getNextCards(
  cards: Card[],
  states: Map<string, CardState>,
  limit: number
): Card[] {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const withScores = cards.map((card) => {
    const state = states.get(card.id);
    const nextReview = state?.nextReview ?? 0;
    const isNew = !state || (state.repetitions === 0 && state.nextReview === 0);
    const isDeferred = nextReview > now;
    const isOverdue = nextReview > 0 && nextReview < now;
    const isDueToday = nextReview >= startOfTodayMs && nextReview < startOfTodayMs + 24 * 60 * 60 * 1000;
    let score = 0;
    if (isNew) score = 1000;
    else if (isDeferred) score = 0;
    else if (isOverdue) score = 500 - (now - nextReview) / (60 * 60 * 1000);
    else if (isDueToday) score = 200;
    const sortKey = Math.random();
    return { card, score, sortKey };
  });

  return withScores
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.sortKey - b.sortKey;
    })
    .slice(0, limit)
    .map(({ card }) => card);
}
