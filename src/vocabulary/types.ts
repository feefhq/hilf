export type Level = 'A1' | 'A2';

export type CardType = 'word' | 'phrase' | 'sentence';

export interface Card {
  id: string;
  prompt: string;
  answer: string;
  /** Example sentence or phrase for the prompt (e.g. English). */
  promptExample?: string;
  /** Example sentence or phrase for the answer (e.g. German). */
  answerExample?: string;
  example?: string;
  level: Level;
  type?: CardType;
  tags?: string[];
  vocabularyRefs?: string[];
}

export interface CardState {
  cardId: string;
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: number;
}

export interface Deck {
  id: string;
  label: string;
  level: Level;
  tags?: string[];
}
