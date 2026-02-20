export type Level = "A1" | "A2"

export type CardType = "word" | "phrase" | "sentence"

export type CardStatus = "new" | "practicing" | "learned"

export interface Card {
  id: string
  prompt: string
  answer: string
  /** Example sentence or phrase for the prompt (e.g. English). */
  promptExample?: string
  /** Example sentence or phrase for the answer (e.g. German). */
  answerExample?: string
  example?: string
  level: Level
  difficulty?: string
  category?: string
  type?: CardType
  tags?: string[]
  vocabularyRefs?: string[]
}

export interface CardState {
  status: CardStatus
  interval: number
  easeFactor: number
  repetitions: number
  lastReviewed: number | null
  nextDue: number | null
  correctStreak: number
  totalCorrect: number
  totalSeen: number
}

export interface Deck {
  id: string
  label: string
  level: Level
  tags?: string[]
}
