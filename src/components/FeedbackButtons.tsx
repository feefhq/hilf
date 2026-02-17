import type { Quality } from '../lib/srs';

interface FeedbackButtonsProps {
  onFeedback: (quality: Quality) => void;
}

const kbdClass =
  'ml-1.5 px-1.5 py-0.5 text-xs font-mono rounded border opacity-80 border-neutral-400/60 dark:border-neutral-500/50 bg-neutral-200/70 dark:bg-neutral-600/40 text-neutral-500 dark:text-neutral-400';

export function FeedbackButtons({ onFeedback }: FeedbackButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        onClick={() => onFeedback(5)}
        className="px-6 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-medium transition-colors inline-flex items-center"
      >
        Correct
        <kbd className={kbdClass}>1</kbd>
      </button>
      <button
        onClick={() => onFeedback(2)}
        className="px-6 py-3 rounded-xl bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 font-medium transition-colors inline-flex items-center"
      >
        Incorrect
        <kbd className={kbdClass}>2</kbd>
      </button>
    </div>
  );
}
