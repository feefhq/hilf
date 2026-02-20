/**
 * Parses scripts/goethe_a1_vocabulary.csv into Card format.
 * Run: node scripts/parse-a1-vocab.mjs
 *
 * CSV columns: German Word, Article (der/die/das), Part of Speech, English Translation,
 *              German Example Sentence, English Example Sentence, Category
 * One row = one card.
 */

const fs = await import("node:fs")
const path = await import("node:path")
const crypto = await import("node:crypto")

const CSV_PATH = path.join(process.cwd(), "scripts", "goethe_a1_vocabulary.csv")

/** Stable short ID from card content so reordering/appending doesn't break progress. */
function stableCardId(prompt, answer, level = "A1") {
  const payload = `${level}|${prompt}|${answer}`
  const hash = crypto.createHash("sha256").update(payload, "utf8").digest("hex")
  return `${level.toLowerCase()}-${hash.slice(0, 10)}`
}

/** Parse a single CSV line respecting quoted fields. */
function parseCSVLine(line) {
  const out = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      i += 1
      let field = ""
      while (i < line.length && line[i] !== '"') {
        if (line[i] === "\\") {
          i += 1
          if (i < line.length) field += line[i++]
        } else {
          field += line[i++]
        }
      }
      if (line[i] === '"') i += 1
      out.push(field)
      if (line[i] === ",") i += 1
    } else {
      let field = ""
      while (i < line.length && line[i] !== ",") {
        field += line[i++]
      }
      out.push(field.trim())
      if (line[i] === ",") i += 1
    }
  }
  return out
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { header: [], rows: [] }
  const header = parseCSVLine(lines[0])
  const rows = lines.slice(1).map((line) => parseCSVLine(line))
  return { header, rows }
}

function rowToCard(row, _index) {
  const [
    germanWord,
    article,
    partOfSpeech,
    englishTranslation,
    germanExample,
    englishExample,
    _category,
  ] = row
  const basePrompt = (englishTranslation || "").trim()
  const hasArticle = article && /^(der|die|das)$/i.test(article.trim())
  const prompt = hasArticle ? `the ${basePrompt}` : basePrompt
  const answer =
    article?.trim()
      ? `${article.trim()} ${(germanWord || "").trim()}`.trim()
      : (germanWord || "").trim()
  if (!basePrompt || !answer) return null

  const card = {
    id: stableCardId(prompt, answer),
    prompt,
    answer,
    level: "A1",
    type:
      partOfSpeech && /noun|verb|adv|adj/i.test(partOfSpeech)
        ? "word"
        : "phrase",
  }
  if ((germanExample || "").trim()) card.answerExample = germanExample.trim()
  if ((englishExample || "").trim()) card.promptExample = englishExample.trim()
  return card
}

async function main() {
  const text = fs.readFileSync(CSV_PATH, "utf-8")
  const { rows } = parseCSV(text)

  const cards = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 4) continue
    const card = rowToCard(row, i)
    if (card) cards.push(card)
  }

  const out = `/** A1 vocabulary - from goethe_a1_vocabulary.csv */
import type { Card } from '../types';

export const a1Words: Card[] = ${JSON.stringify(cards, null, 2)} as Card[];
`

  const outPath = path.join(
    process.cwd(),
    "src",
    "vocabulary",
    "a1",
    "words.ts",
  )
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, out, "utf-8")
  console.log(`Wrote ${cards.length} cards to ${outPath}`)
}

main().catch(console.error)
