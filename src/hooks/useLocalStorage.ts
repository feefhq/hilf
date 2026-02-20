import { useState, useEffect, useCallback } from "react"
import type { CardState } from "../vocabulary/types"

const STORAGE_KEY = "hilf-card-states-v2"
const LEGACY_KEY = "hilf-card-states"

export type StoredCardStates = Record<string, CardState>

interface LegacyCardState {
  repetitions: number
  easeFactor: number
  interval: number
  nextReview: number
}

function migrateLegacy(
  legacy: Record<string, LegacyCardState>,
): StoredCardStates {
  const migrated: StoredCardStates = {}
  for (const [id, old] of Object.entries(legacy)) {
    migrated[id] = {
      status: old.interval >= 14 ? "learned" : "practicing",
      interval: old.interval,
      easeFactor: old.easeFactor,
      repetitions: old.repetitions,
      lastReviewed: null,
      nextDue: old.nextReview,
      correctStreak: 0,
      totalCorrect: 0,
      totalSeen: 0,
    }
  }
  return migrated
}

function load(): StoredCardStates {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoredCardStates

    // Migrate from v1 if present
    const legacyRaw = localStorage.getItem(LEGACY_KEY)
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Record<string, LegacyCardState>
      const migrated = migrateLegacy(legacy)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(LEGACY_KEY)
      return migrated
    }
  } catch {
    // fall through
  }
  return {}
}

function save(data: StoredCardStates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn("Failed to save card states:", e)
  }
}

export function useCardStates() {
  const [states, setStates] = useState<StoredCardStates>(load)

  useEffect(() => {
    save(states)
  }, [states])

  const updateState = useCallback((cardId: string, update: CardState) => {
    setStates((prev) => ({ ...prev, [cardId]: update }))
  }, [])

  const getState = useCallback(
    (cardId: string): CardState | null => states[cardId] ?? null,
    [states],
  )

  return { states, updateState, getState }
}
