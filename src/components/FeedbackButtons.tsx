import type { Quality } from "../lib/srs"

interface FeedbackButtonsProps {
  onFeedback: (quality: Quality) => void
}

const kbdClass =
  "ml-1.5 px-1.5 py-0.5 text-xs font-mono rounded border opacity-80 border-neutral-400/60 dark:border-neutral-500/50 bg-neutral-200/70 dark:bg-neutral-600/40 text-neutral-500 dark:text-neutral-400"

export const FeedbackButtons = ({ onFeedback }: FeedbackButtonsProps) => (
  <div className="flex flex-wrap gap-3 justify-center">
    <button
      type="button"
      onClick={() => onFeedback(5)}
      className="px-6 py-3 rounded-2xl shadow-sm bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium transition-colors inline-flex items-center hover:bg-emerald-500/15 dark:hover:bg-emerald-500/25"
    >
      Correct
      <kbd className={kbdClass}>1</kbd>
    </button>
    <button
      type="button"
      onClick={() => onFeedback(2)}
      className="px-6 py-3 rounded-2xl shadow-sm bg-red-400/10 dark:bg-red-400/15 text-red-500 dark:text-red-400 font-medium transition-colors inline-flex items-center hover:bg-red-400/15 dark:hover:bg-red-400/25"
    >
      Incorrect
      <kbd className={kbdClass}>2</kbd>
    </button>
  </div>
)
