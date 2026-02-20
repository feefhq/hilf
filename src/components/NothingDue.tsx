const formatNextDue = (timestamp: number): string => {
  const now = Date.now()
  const diffMs = timestamp - now
  const diffMins = Math.round(diffMs / (60 * 1000))
  const diffHours = Math.round(diffMs / (60 * 60 * 1000))
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

  if (diffMins < 60) {
    return `in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`
  }
  if (diffHours < 24) {
    return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}`
  }
  return `in ${diffDays} day${diffDays !== 1 ? "s" : ""}`
}

interface NothingDueProps {
  nextDueAt: number | null
  learnedCount: number
  totalCount: number
}

export const NothingDue = ({
  nextDueAt,
  learnedCount,
  totalCount,
}: NothingDueProps) => {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center p-4 gap-6">
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
          You're all caught up!
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400">
          Come back later to review more.
        </p>
        {nextDueAt !== null && (
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-2">
            Next review {formatNextDue(nextDueAt)}.
          </p>
        )}
      </div>

      <div className="mt-2 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {learnedCount}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            {totalCount}
          </span>{" "}
          words learned
        </p>
      </div>
    </div>
  )
}
