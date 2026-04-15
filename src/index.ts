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
// The core uses a Canvas 2D context purely for measureText() calls.
// Results are cached by (text, size, weight, family) to avoid redundant
// measurement during the brute-force line-break search.

/** Maximum cache entries before oldest are evicted (FIFO). */
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
 * Cache key is quantised (size to 0.1px, weight to nearest integer) to
 * balance hit-rate vs accuracy.
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

  // Evict oldest entries when the cache exceeds the limit
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value
    if (first !== undefined) cache.delete(first)
  }
  cache.set(key, result)
  return result
}

/**
 * Compute the font size that makes `text` exactly fill `targetWidth`.
 * Uses a reference measurement at 100px and scales linearly — this is
 * accurate because font metrics scale proportionally with size.
 */
function fontSizeForWidth(text: string, targetWidth: number, weight: number, family: string): number {
  const REF = 100
  const refM = measureLine(text, REF, weight, family)
  if (refM.width === 0) return REF
  return (targetWidth / refM.width) * REF
}

// ── Line-break generators ──
// The algorithm tries every possible distribution of words across N lines
// and picks the one whose total height best fills the available rectangle.
// For short text (≤12 words) it brute-forces all combinations; for longer
// text it uses a heuristic that distributes words evenly then tries
// single-word shifts between adjacent lines.

/** Join words into lines given the number of words per line. */
function buildLines(words: string[], counts: number[]): string[] {
  const lines: string[] = []
  let idx = 0
  for (const c of counts) {
    lines.push(words.slice(idx, idx + c).join(' '))
    idx += c
  }
  return lines
}

/**
 * Exhaustive generator: yields every possible way to split `words` into
 * `numLines` lines. Used when word count is small (≤12) so the
 * combinatorial space is manageable.
 */
function* wordSplits(words: string[], numLines: number): Generator<string[]> {
  if (numLines === 1) { yield [words.join(' ')]; return }
  const gaps = words.length - 1
  const choose = numLines - 1
  if (choose > gaps) return

  function* combos(start: number, remaining: number, chosen: number[]): Generator<number[]> {
    if (remaining === 0) { yield chosen; return }
    for (let i = start; i <= gaps - remaining; i++) {
      yield* combos(i + 1, remaining - 1, [...chosen, i])
    }
  }

  for (const dividers of combos(0, choose, [])) {
    const lines: string[] = []
    let prev = 0
    for (const d of dividers) {
      lines.push(words.slice(prev, d + 1).join(' '))
      prev = d + 1
    }
    lines.push(words.slice(prev).join(' '))
    yield lines
  }
}

/**
 * Fast heuristic generator for longer text: starts with an even
 * distribution then yields single-word shifts between adjacent lines.
 * Produces O(numLines) candidates instead of O(C(n,k)).
 */
function* heuristicSplits(words: string[], numLines: number): Generator<string[]> {
  const M = words.length
  const base = Math.floor(M / numLines)
  const extra = M % numLines
  const baseCounts: number[] = []
  for (let i = 0; i < numLines; i++) baseCounts.push(base + (i < extra ? 1 : 0))

  yield buildLines(words, baseCounts)

  for (let i = 0; i < numLines - 1; i++) {
    if (baseCounts[i] > 1) {
      const s = [...baseCounts]; s[i]--; s[i + 1]++
      yield buildLines(words, s)
    }
    if (baseCounts[i + 1] > 1) {
      const s = [...baseCounts]; s[i]++; s[i + 1]--
      yield buildLines(words, s)
    }
  }
}

// ── Scoring ──
// Each candidate split is scored by how well its total text height fills
// the available rectangle. A score of 1.0 means a perfect fit. Scores
// above 1.0 (text overflows) are penalised heavily.

/** Score a candidate line split by how close its total height is to the target. */
function scoreSplit(
  lineTexts: string[],
  targetWidth: number,
  targetHeight: number,
  gap: number,
  weight: number,
  family: string,
) {
  const sizes = lineTexts.map(t => fontSizeForWidth(t, targetWidth, weight, family))
  const metrics = lineTexts.map((t, i) => measureLine(t, sizes[i], weight, family))
  let totalHeight = 0
  for (let i = 0; i < metrics.length; i++) {
    totalHeight += metrics[i].capTop + metrics[i].capBottom
    if (i < metrics.length - 1) totalHeight += gap
  }
  const ratio = totalHeight / targetHeight
  const score = ratio <= 1 ? ratio : 1 / ratio - 1
  return { lines: lineTexts, sizes, metrics, totalHeight, score }
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
  const words = processed.split(/\s+/)
  if (words.length === 0) return null

  const availW = width - padX * 2
  const availH = height - padY * 2
  if (availW <= 0 || availH <= 0) return null

  let best: ReturnType<typeof scoreSplit> | null = null
  const lineLimit = Math.min(words.length, maxLines)

  for (let n = 1; n <= lineLimit; n++) {
    const candidates = words.length <= 12
      ? wordSplits(words, n)
      : heuristicSplits(words, n)

    for (const lineTexts of candidates) {
      const result = scoreSplit(lineTexts, availW, availH, gap, maxWeight, fontFamily)
      if (!best || result.score > best.score) best = result
    }
  }

  if (!best) return null

  // ── Weight assignment ──
  // Map each line's font size to a weight: the largest line gets
  // maxWeight, the smallest gets (maxWeight - spread), with linear
  // interpolation for lines in between.
  const minSize = Math.min(...best.sizes)
  const maxSize = Math.max(...best.sizes)
  const sizeRange = maxSize - minSize
  const weights = best.sizes.map(s => {
    if (sizeRange === 0 || spread === 0) return maxWeight
    const ratio = (s - minSize) / sizeRange
    const w = maxWeight - spread * (1 - ratio)
    return Math.max(100, Math.min(900, Math.round(w / 10) * 10))
  })

  // Re-measure with final weights
  const finalSizes = best.lines.map((t, i) => fontSizeForWidth(t, availW, weights[i], fontFamily))
  const finalMetrics = best.lines.map((t, i) => measureLine(t, finalSizes[i], weights[i], fontFamily))
  let totalHeight = 0
  for (let i = 0; i < finalMetrics.length; i++) {
    totalHeight += finalMetrics[i].capTop + finalMetrics[i].capBottom
    if (i < finalMetrics.length - 1) totalHeight += gap
  }

  return { lines: best.lines, sizes: finalSizes, weights, metrics: finalMetrics, totalHeight }
}

/**
 * Clear the internal measurement cache.
 * Call this if the font changes or you need to free memory.
 */
export function clearCache() {
  cache.clear()
}
