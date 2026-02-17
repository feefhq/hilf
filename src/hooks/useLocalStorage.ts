import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hilf-card-states';

export interface StoredCardStates {
  [cardId: string]: {
    repetitions: number;
    easeFactor: number;
    interval: number;
    nextReview: number;
  };
}

function load(): StoredCardStates {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredCardStates;
  } catch {
    return {};
  }
}

function save(data: StoredCardStates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save card states:', e);
  }
}

export function useCardStates() {
  const [states, setStates] = useState<StoredCardStates>(load);

  useEffect(() => {
    save(states);
  }, [states]);

  const updateState = useCallback(
    (
      cardId: string,
      update: {
        repetitions: number;
        easeFactor: number;
        interval: number;
        nextReview: number;
      }
    ) => {
      setStates((prev) => ({
        ...prev,
        [cardId]: update,
      }));
    },
    []
  );

  const getState = useCallback(
    (cardId: string) => states[cardId] ?? null,
    [states]
  );

  return { states, updateState, getState };
}
