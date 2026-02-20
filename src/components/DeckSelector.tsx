import type { Deck } from "../vocabulary/types"

interface DeckSelectorProps {
  decks: Deck[]
  selectedId: string
  onSelect: (id: string) => void
}

export function DeckSelector({
  decks,
  selectedId,
  onSelect,
}: DeckSelectorProps) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onSelect(e.target.value)}
      className="px-4 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500"
    >
      {decks.map((d) => (
        <option key={d.id} value={d.id}>
          {d.label}
        </option>
      ))}
    </select>
  )
}
