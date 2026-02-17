import { supermemo } from 'supermemo';
import type { CardState } from '../vocabulary/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Grade 5 = correct, 4 = correct but hard, 2 = incorrect */
export type Quality = 5 | 4 | 2;

export function applySm2(
  state: CardState,
  quality: Quality
): Omit<CardState, 'cardId'> {
  const result = supermemo(
    {
      interval: state.interval,
      repetition: state.repetitions,
      efactor: state.easeFactor,
    },
    quality
  );
  const now = Date.now();
  const nextReview = now + result.interval * MS_PER_DAY;
  return {
    repetitions: result.repetition,
    easeFactor: result.efactor,
    interval: result.interval,
    nextReview,
  };
}

export function createInitialState(cardId: string): CardState {
  return {
    cardId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReview: 0,
  };
}
