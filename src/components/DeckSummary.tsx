import { AppFooter } from "./AppFooter"

interface DeckSummaryProps {
  stats: {
    total: number
    correct: number
    incorrect: number
  }
  nextDeckSize: number
  onContinue: () => void
  onStop: () => void
}

export const DeckSummary = ({
  stats,
  nextDeckSize,
  onContinue,
  onStop,
}: DeckSummaryProps) => (
  <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col p-4">
    <div className="flex-1 flex items-center justify-center">
    <div className="w-full max-w-sm flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
          Deck complete
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {stats.total} card{stats.total !== 1 ? "s" : ""} reviewed
        </p>
      </div>

      <div className="w-full flex gap-4 justify-center">
        <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-800 p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-emerald-500">{stats.correct}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Correct
          </p>
        </div>
        <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-800 p-5 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-400">{stats.incorrect}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Incorrect
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {nextDeckSize} card{nextDeckSize !== 1 ? "s" : ""} in your next deck
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="w-full px-6 py-3 rounded-xl bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-medium hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={onStop}
          className="w-full px-6 py-3 rounded-xl bg-transparent border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 font-medium hover:opacity-70 transition-opacity"
        >
          Stop for now
        </button>
      </div>
    </div>
    </div>
    <AppFooter />
  </div>
)
