interface IntroScreenProps {
  onGetStarted: () => void
}

export const IntroScreen = ({ onGetStarted }: IntroScreenProps) => {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center p-4 gap-8">
      <div className="text-center max-w-sm space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
            Welcome to <span className="wordmark">hilf</span>
          </h2>
          <p className="text-base font-medium text-neutral-500 dark:text-neutral-400">
            German vocabulary with spaced repetition
          </p>
        </div>
        <hr className="border-0 border-t border-neutral-200 dark:border-neutral-700" />
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <span className="wordmark">hilf</span> is a small flashcard app that helps you learn German words with
          spaced repetition. You’ll see a card, reveal the answer, then rate
          whether you got it right—the app schedules when you’ll see it again.
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
          Only a few new words are added per session, so it stays manageable.
          Sometimes you’ll see “nothing due” and can come back later. No rush.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onGetStarted}
          className="px-6 py-3 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-900 font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
        >
          Get started
        </button>
        <a
          href="https://en.wikipedia.org/wiki/Spaced_repetition"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 hover:underline transition-colors"
        >
          What is spaced repetition?
        </a>
      </div>
    </div>
  )
}
