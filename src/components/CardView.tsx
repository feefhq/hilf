import type { Card } from "../vocabulary/types"

interface CardViewProps {
  card: Card
  revealed: boolean
  onReveal: () => void
}

/** Fallback when card has no separate example fields (e.g. legacy tab/em-dash in prompt/answer). */
function parseParts(text: string): { primary: string; example: string | null } {
  const sep = text.includes("\t") ? "\t" : " — "
  const idx = text.indexOf(sep)
  if (idx < 0) return { primary: text, example: null }
  return {
    primary: text.slice(0, idx).trim(),
    example: text.slice(idx + sep.length).trim() || null,
  }
}

function CardContent({
  primary,
  example,
}: {
  primary: string
  example: string | null
}) {
  return (
    <div className="text-center">
      <p className="text-2xl md:text-3xl text-neutral-900 dark:text-neutral-100 font-medium">
        {primary}
      </p>
      {example && (
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {example}
        </p>
      )}
    </div>
  )
}

export function CardView({ card, revealed, onReveal }: CardViewProps) {
  const promptPrimary =
    card.promptExample != null ? card.prompt : parseParts(card.prompt).primary
  const promptExample =
    card.promptExample ?? parseParts(card.prompt).example ?? null
  const answerPrimary =
    card.answerExample != null ? card.answer : parseParts(card.answer).primary
  const answerExample =
    card.answerExample ?? parseParts(card.answer).example ?? null

  return (
    <div className="rounded-xl bg-white dark:bg-neutral-800 shadow-lg p-8 min-h-[20rem] flex flex-col items-center">
      <div className="w-full pt-8 pb-6 text-center">
        <CardContent primary={promptPrimary} example={promptExample} />
      </div>
      {revealed ? (
        <div className="w-full flex flex-col">
          <div className="w-full border-t border-neutral-200 dark:border-neutral-600" />
          <div className="py-6 text-center">
            <CardContent primary={answerPrimary} example={answerExample} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onReveal}
          className="mt-2 px-5 py-2.5 rounded-lg bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-800 dark:text-neutral-200 font-medium transition-colors inline-flex items-center gap-2"
        >
          Reveal translation
          <kbd className="ml-1.5 px-1.5 py-0.5 text-xs font-mono rounded bg-neutral-200/80 dark:bg-neutral-600/50 border border-neutral-300/80 dark:border-neutral-500/50 text-neutral-500 dark:text-neutral-400">
            ⌴
          </kbd>
        </button>
      )}
    </div>
  )
}
