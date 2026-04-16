/**
 * tightset — Variable-weight text fitting engine.
 *
 * Fills a W×H rectangle with text, optimally choosing line breaks so every
 * line stretches to fill the width. Uses variable font weight to create
 * visual hierarchy: larger lines get heavier weight, smaller lines get lighter.
 *
 * Works with any variable-weight font (Geist, Inter, etc.).
 * Requires a Canvas 2D context for text measurement.
 *
 * @license MIT
 */

// ── Types ──

export interface TightsetOptions {
  /** Available width in pixels */
  width: number
  /** Available height in pixels */
  height: number
  /** Horizontal padding inside the box (default: 60) */
  padX?: number
  /** Vertical padding inside the box (default: 40) */
  padY?: number
  /** Gap between lines in pixels (default: 20) */
  gap?: number
  /** Maximum font weight for the largest line (default: 900) */
  maxWeight?: number
  /** Weight spread — difference between heaviest and lightest lines (default: 150) */
  spread?: number
  /** Maximum number of lines to try (default: 8) */
  maxLines?: number
  /** Convert text to uppercase before fitting (default: true) */
  uppercase?: boolean
  /** Font family name (default: 'sans-serif') */
  fontFamily?: string
}

export interface FitResult {
  /** Text content of each line */
  lines: string[]
  /** Computed font size for each line (px) */
  sizes: number[]
  /** Computed font weight for each line */
  weights: number[]
  /** Metrics for each line */
  metrics: LineMetrics[]
  /** Total height of the fitted text block */
  totalHeight: number
}

export interface LineMetrics {
  /** Measured text width in pixels */
  width: number
  /** Distance from baseline to top of capital letters */
  capTop: number
  /** Distance from baseline to bottom of descenders */
  capBottom: number
}

// ── Engine ──

/** Reference font size used for all pre-measurements. */
const REF = 100

/** Maximum measurement cache entries before oldest are evicted (FIFO). */
const MAX_CACHE = 2000
const cache = new Map<string, LineMetrics>()

let _ctx: CanvasRenderingContext2D | null = null

function getCtx(): CanvasRenderingContext2D {
  if (!_ctx) {
    if (typeof document !== 'undefined') {
      _ctx = document.createElement('canvas').getContext('2d')!
    } else if (typeof globalThis !== 'undefined' && 'OffscreenCanvas' in globalThis) {
      _ctx = new OffscreenCanvas(1, 1).getContext('2d') as unknown as CanvasRenderingContext2D
    } else {
      throw new Error('tightset: No canvas available. Call setMeasureContext() first.')
    }
  }
  return _ctx
}

/**
 * Provide a custom CanvasRenderingContext2D for text measurement.
 * Useful in Node.js (with node-canvas) or workers (with OffscreenCanvas).
 */
export function setMeasureContext(ctx: CanvasRenderingContext2D) {
  _ctx = ctx
  cache.clear()
}

function makeFont(size: number, weight: number, family: string) {
  return `${weight} ${size}px ${family}`
}

/**
 * Measure a single line of text at a given size/weight and cache the result.
 */
function measureLine(text: string, fontSize: number, weight: number, family: string): LineMetrics {
  const key = `${text}\t${Math.round(fontSize * 10)}\t${Math.round(weight)}\t${family}`
  const cached = cache.get(key)
  if (cached) return cached

  const ctx = getCtx()
  ctx.font = makeFont(fontSize, weight, family)
  const m = ctx.measureText(text)
  const result: LineMetrics = {
    width: m.width,
    capTop: m.actualBoundingBoxAscent,
    capBottom: m.actualBoundingBoxDescent,
  }

  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value
    if (first !== undefined) cache.delete(first)
  }
  cache.set(key, result)
  return result
}

// ── Prepared text (pretext-inspired prepare/layout split) ──
// The expensive canvas measureText() calls happen once in prepare().
// The search loop then uses pure arithmetic over cached reference widths.

interface PreparedWord {
  text: string
  /** Width at REF size and the given weight/family */
  refWidth: number
  /** capTop at REF size */
  refCapTop: number
  /** capBottom at REF size */
  refCapBottom: number
}

interface PreparedText {
  words: PreparedWord[]
  /** Width of a single space character at REF size */
  spaceWidth: number
  /** Weight used for preparation */
  weight: number
  /** Font family used for preparation */
  family: string
}

/** Cache for prepare() results — keyed by "words|weight|family". */
const MAX_PREP_CACHE = 50
const prepCache = new Map<string, PreparedText>()

/**
 * Pre-measure all words at REF size. Cached by text+weight+family.
 */
function prepare(words: string[], weight: number, family: string): PreparedText {
  const key = `${words.join(' ')}\t${weight}\t${family}`
  const cached = prepCache.get(key)
  if (cached) return cached

  const ctx = getCtx()
  ctx.font = makeFont(REF, weight, family)

  const spaceM = ctx.measureText(' ')
  const spaceWidth = spaceM.width

  const prepared: PreparedWord[] = []
  for (const word of words) {
    const m = ctx.measureText(word)
    prepared.push({
      text: word,
      refWidth: m.width,
      refCapTop: m.actualBoundingBoxAscent,
      refCapBottom: m.actualBoundingBoxDescent,
    })
  }

  const result = { words: prepared, spaceWidth, weight, family }

  if (prepCache.size >= MAX_PREP_CACHE) {
    const first = prepCache.keys().next().value
    if (first !== undefined) prepCache.delete(first)
  }
  prepCache.set(key, result)
  return result
}

/**
 * Compute the reference-size width of a line (sum of word widths + space widths).
 * Pure arithmetic — no canvas calls.
 */
function lineRefWidth(prep: PreparedText, startIdx: number, count: number): number {
  let w = 0
  for (let i = startIdx; i < startIdx + count; i++) {
    w += prep.words[i].refWidth
  }
  // Add spaces between words
  if (count > 1) w += prep.spaceWidth * (count - 1)
  return w
}

/**
 * Compute reference-size height metrics for a line (max capTop + max capBottom
 * across constituent words). Pure arithmetic.
 */
function lineRefHeight(prep: PreparedText, startIdx: number, count: number): { capTop: number, capBottom: number } {
  let capTop = 0, capBottom = 0
  for (let i = startIdx; i < startIdx + count; i++) {
    if (prep.words[i].refCapTop > capTop) capTop = prep.words[i].refCapTop
    if (prep.words[i].refCapBottom > capBottom) capBottom = prep.words[i].refCapBottom
  }
  return { capTop, capBottom }
}

// ── Line-break generators ──
// Now yield word counts per line instead of joined strings, avoiding
// string allocation during the search.

/** Join words into a line string (only needed for final output). */
function joinWords(prep: PreparedText, startIdx: number, count: number): string {
  const parts: string[] = []
  for (let i = startIdx; i < startIdx + count; i++) parts.push(prep.words[i].text)
  return parts.join(' ')
}

/**
 * Exhaustive generator: yields every way to split N words into numLines groups.
 * Each yield is an array of word-counts per line.
 */
function* wordCountSplits(numWords: number, numLines: number): Generator<number[]> {
  if (numLines === 1) { yield [numWords]; return }
  const gaps = numWords - 1
  const choose = numLines - 1
  if (choose > gaps) return

  function* combos(start: number, remaining: number, chosen: number[]): Generator<number[]> {
    if (remaining === 0) { yield chosen; return }
    for (let i = start; i <= gaps - remaining; i++) {
      yield* combos(i + 1, remaining - 1, [...chosen, i])
    }
  }

  for (const dividers of combos(0, choose, [])) {
    const counts: number[] = []
    let prev = 0
    for (const d of dividers) {
      counts.push(d + 1 - prev)
      prev = d + 1
    }
    counts.push(numWords - prev)
    yield counts
  }
}

/**
 * Heuristic generator for longer text: even distribution + 1/2-word shifts.
 */
function* heuristicCountSplits(numWords: number, numLines: number): Generator<number[]> {
  const base = Math.floor(numWords / numLines)
  const extra = numWords % numLines
  const baseCounts: number[] = []
  for (let i = 0; i < numLines; i++) baseCounts.push(base + (i < extra ? 1 : 0))

  yield [...baseCounts]

  for (let i = 0; i < numLines - 1; i++) {
    if (baseCounts[i] > 1) {
      const s = [...baseCounts]; s[i]--; s[i + 1]++
      yield s
    }
    if (baseCounts[i + 1] > 1) {
      const s = [...baseCounts]; s[i]++; s[i + 1]--
      yield s
    }
  }

  for (let i = 0; i < numLines - 1; i++) {
    if (baseCounts[i] > 2) {
      const s = [...baseCounts]; s[i] -= 2; s[i + 1] += 2
      yield s
    }
    if (baseCounts[i + 1] > 2) {
      const s = [...baseCounts]; s[i] += 2; s[i + 1] -= 2
      yield s
    }
  }
}

// ── Scoring (pure arithmetic) ──

/**
 * Score a candidate word-count split. Pure arithmetic over pre-measured widths.
 * Zero canvas calls.
 */
function scoreSplitFast(
  counts: number[],
  prep: PreparedText,
  targetWidth: number,
  targetHeight: number,
  gap: number,
) {
  const sizes: number[] = []
  let totalHeight = 0
  let idx = 0
  for (let i = 0; i < counts.length; i++) {
    const refW = lineRefWidth(prep, idx, counts[i])
    if (refW === 0) { sizes.push(REF); idx += counts[i]; continue }
    const scale = targetWidth / refW
    sizes.push(scale * REF)
    const h = lineRefHeight(prep, idx, counts[i])
    totalHeight += (h.capTop + h.capBottom) * scale
    if (i < counts.length - 1) totalHeight += gap
    idx += counts[i]
  }
  const ratio = totalHeight / targetHeight
  const score = ratio <= 1 ? ratio : 1 / ratio - 1
  return { counts, sizes, totalHeight, score }
}

// ── Public API ──

/**
 * Fit text into a rectangle with optimal line breaks and variable weight.
 *
 * @param text - The text to fit
 * @param opts - Fitting options (width and height are required)
 * @returns A FitResult with lines, sizes, weights and metrics, or null if fitting failed
 *
 * @example
 * ```ts
 * const result = fit('Hello World This Is Tightset', {
 *   width: 800,
 *   height: 400,
 *   fontFamily: 'Geist',
 *   maxWeight: 900,
 *   spread: 150,
 * })
 *
 * if (result) {
 *   result.lines.forEach((line, i) => {
 *     ctx.font = `${result.weights[i]} ${result.sizes[i]}px Geist`
 *     ctx.fillText(line, x, y)
 *     y += result.metrics[i].capTop + result.metrics[i].capBottom + gap
 *   })
 * }
 * ```
 */
export function fit(text: string, opts: TightsetOptions): FitResult | null {
  const {
    width, height,
    padX = 60, padY = 40, gap = 20,
    maxWeight = 900, spread = 150, maxLines = 8,
    uppercase = true,
    fontFamily = 'sans-serif',
  } = opts

  const processed = uppercase ? text.trim().toUpperCase() : text.trim()
  if (processed.length === 0) return null
  const words = processed.split(/\s+/)
  if (words.length === 0) return null

  const availW = width - padX * 2
  const availH = height - padY * 2
  if (availW <= 0 || availH <= 0) return null

  // ── Prepare: one-time measurement of all words at reference size ──
  const prep = prepare(words, maxWeight, fontFamily)

  // ── Search: pure arithmetic over pre-measured widths ──
  let best: ReturnType<typeof scoreSplitFast> | null = null
  const lineLimit = Math.min(words.length, maxLines)

  outer:
  for (let n = 1; n <= lineLimit; n++) {
    const candidates = words.length <= 8
      ? wordCountSplits(words.length, n)
      : heuristicCountSplits(words.length, n)

    for (const counts of candidates) {
      const result = scoreSplitFast(counts, prep, availW, availH, gap)
      if (!best || result.score > best.score) best = result
      if (best.score > 0.98) break outer
    }
  }

  if (!best) return null

  // ── Build final line strings ──
  const lines: string[] = []
  let idx = 0
  for (const c of best.counts) {
    lines.push(joinWords(prep, idx, c))
    idx += c
  }

  // ── Weight assignment ──
  const minSize = Math.min(...best.sizes)
  const maxSize = Math.max(...best.sizes)
  const sizeRange = maxSize - minSize
  const weights = best.sizes.map(s => {
    if (sizeRange === 0 || spread === 0) return maxWeight
    const ratio = (s - minSize) / sizeRange
    const w = maxWeight - spread * (1 - ratio)
    return Math.max(100, Math.min(900, Math.round(w / 10) * 10))
  })

  // Re-measure with final weights (only N measureText calls, where N = line count)
  const finalSizes = lines.map((t, i) => {
    const refM = measureLine(t, REF, weights[i], fontFamily)
    if (refM.width === 0) return REF
    return (availW / refM.width) * REF
  })
  const finalMetrics = lines.map((t, i) => measureLine(t, finalSizes[i], weights[i], fontFamily))
  let totalHeight = 0
  for (let i = 0; i < finalMetrics.length; i++) {
    totalHeight += finalMetrics[i].capTop + finalMetrics[i].capBottom
    if (i < finalMetrics.length - 1) totalHeight += gap
  }

  return { lines, sizes: finalSizes, weights, metrics: finalMetrics, totalHeight }
}

/**
 * Clear the internal measurement cache.
 * Call this if the font changes or you need to free memory.
 */
export function clearCache() {
  cache.clear()
  prepCache.clear()
}
