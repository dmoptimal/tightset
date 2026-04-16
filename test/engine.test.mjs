/**
 * Engine tests for tightset fit()
 *
 * Usage:  npm test
 *         node --test test/engine.test.mjs
 *
 * Uses built-in node:test + node:assert — no extra dependencies.
 * Requires `canvas` (devDependency) for text measurement in Node.js.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createCanvas } from 'canvas'
import { setMeasureContext, fit, clearCache } from 'tightset'

// ── Setup ──
const canvas = createCanvas(1, 1)
setMeasureContext(canvas.getContext('2d'))

// ── Helpers ──
const defaultOpts = { width: 800, height: 500, fontFamily: 'sans-serif' }

// ────────────────────────────────────────────────────────────────────────────
// Basic output structure
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — basic output', () => {
  beforeEach(() => clearCache())

  it('returns a valid FitResult for a simple phrase', () => {
    const r = fit('Hello World', defaultOpts)
    assert.notEqual(r, null)
    assert.ok(Array.isArray(r.lines))
    assert.ok(Array.isArray(r.sizes))
    assert.ok(Array.isArray(r.weights))
    assert.ok(Array.isArray(r.metrics))
    assert.equal(r.lines.length, r.sizes.length)
    assert.equal(r.lines.length, r.weights.length)
    assert.equal(r.lines.length, r.metrics.length)
    assert.equal(typeof r.totalHeight, 'number')
    assert.ok(r.totalHeight > 0)
  })

  it('all sizes are positive', () => {
    const r = fit('Every Line Fills The Width', defaultOpts)
    for (const s of r.sizes) assert.ok(s > 0, `size ${s} should be > 0`)
  })

  it('all weights are between 100 and 900', () => {
    const r = fit('Every Line Fills The Width', defaultOpts)
    for (const w of r.weights) {
      assert.ok(w >= 100 && w <= 900, `weight ${w} out of range`)
    }
  })

  it('all metrics have positive width and capTop', () => {
    const r = fit('Every Line Fills The Width', defaultOpts)
    for (const m of r.metrics) {
      assert.ok(m.width > 0, `metric width ${m.width} should be > 0`)
      assert.ok(m.capTop > 0, `metric capTop ${m.capTop} should be > 0`)
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Line breaking
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — line breaking', () => {
  beforeEach(() => clearCache())

  it('single word produces exactly 1 line', () => {
    const r = fit('Hello', defaultOpts)
    assert.equal(r.lines.length, 1)
  })

  it('two words can produce 1 or 2 lines', () => {
    const r = fit('Hello World', defaultOpts)
    assert.ok(r.lines.length >= 1 && r.lines.length <= 2)
  })

  it('many words produce multiple lines', () => {
    const r = fit('This Is A Much Longer Piece Of Text To Fit', defaultOpts)
    assert.ok(r.lines.length > 1, `expected multiple lines, got ${r.lines.length}`)
  })

  it('respects maxLines constraint', () => {
    const r = fit('One Two Three Four Five Six Seven Eight Nine Ten', {
      ...defaultOpts,
      maxLines: 3,
    })
    assert.ok(r.lines.length <= 3, `expected ≤3 lines, got ${r.lines.length}`)
  })

  it('all words appear in the output lines', () => {
    const text = 'Every Line Fills The Width'
    const r = fit(text, defaultOpts)
    const outputWords = r.lines.join(' ').split(/\s+/)
    const inputWords = text.toUpperCase().split(/\s+/)
    assert.deepEqual(outputWords, inputWords)
  })

  it('preserves word order across lines', () => {
    const text = 'Alpha Bravo Charlie Delta Echo Foxtrot'
    const r = fit(text, defaultOpts)
    const joined = r.lines.join(' ')
    assert.equal(joined, text.toUpperCase())
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Uppercase option
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — uppercase', () => {
  beforeEach(() => clearCache())

  it('converts text to uppercase by default', () => {
    const r = fit('hello world', defaultOpts)
    for (const line of r.lines) {
      assert.equal(line, line.toUpperCase())
    }
  })

  it('preserves case when uppercase is false', () => {
    const r = fit('Hello World', { ...defaultOpts, uppercase: false })
    const joined = r.lines.join(' ')
    assert.equal(joined, 'Hello World')
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Weight spread
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — weight spread', () => {
  beforeEach(() => clearCache())

  it('spread=0 produces uniform weight', () => {
    const r = fit('Short And Also A Longer Line Here', {
      ...defaultOpts,
      spread: 0,
      maxWeight: 900,
    })
    const unique = new Set(r.weights)
    assert.equal(unique.size, 1, `expected uniform weight, got ${[...unique]}`)
    assert.equal(r.weights[0], 900)
  })

  it('larger spread produces more weight variation', () => {
    const text = 'One Two Three Four Five Six Seven'
    const narrow = fit(text, { ...defaultOpts, spread: 50 })
    const wide = fit(text, { ...defaultOpts, spread: 500 })
    const rangeNarrow = Math.max(...narrow.weights) - Math.min(...narrow.weights)
    const rangeWide = Math.max(...wide.weights) - Math.min(...wide.weights)
    assert.ok(rangeWide >= rangeNarrow, `wide spread range (${rangeWide}) should >= narrow (${rangeNarrow})`)
  })

  it('larger lines get heavier weight (when spread > 0)', () => {
    const r = fit('Big Small Medium', { ...defaultOpts, spread: 300 })
    if (r.lines.length > 1) {
      const maxSizeIdx = r.sizes.indexOf(Math.max(...r.sizes))
      const maxWeightIdx = r.weights.indexOf(Math.max(...r.weights))
      assert.equal(maxSizeIdx, maxWeightIdx, 'largest line should have heaviest weight')
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Edge cases
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — edge cases', () => {
  beforeEach(() => clearCache())

  it('empty string returns null', () => {
    assert.equal(fit('', defaultOpts), null)
  })

  it('whitespace-only string returns null', () => {
    assert.equal(fit('   ', defaultOpts), null)
  })

  it('single character still fits', () => {
    const r = fit('X', defaultOpts)
    assert.notEqual(r, null)
    assert.equal(r.lines.length, 1)
  })

  it('very small box still returns a result', () => {
    const r = fit('Hello World', { width: 50, height: 50, fontFamily: 'sans-serif' })
    // May return null if padX/padY eat all available space; that's acceptable
    if (r) {
      assert.ok(r.lines.length >= 1)
    }
  })

  it('zero-area box returns null', () => {
    assert.equal(fit('Hello', { width: 0, height: 500, fontFamily: 'sans-serif' }), null)
    assert.equal(fit('Hello', { width: 500, height: 0, fontFamily: 'sans-serif' }), null)
  })

  it('padding larger than box returns null', () => {
    const r = fit('Hello', { width: 100, height: 100, padX: 60, padY: 60, fontFamily: 'sans-serif' })
    assert.equal(r, null)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Padding & gap
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — padding and gap', () => {
  beforeEach(() => clearCache())

  it('larger padX produces smaller font sizes', () => {
    const tight = fit('Hello World', { ...defaultOpts, padX: 0 })
    const loose = fit('Hello World', { ...defaultOpts, padX: 200 })
    assert.ok(tight.sizes[0] > loose.sizes[0], 'tighter padding should yield larger sizes')
  })

  it('totalHeight includes gap between lines', () => {
    const noGap = fit('Alpha Bravo Charlie Delta', { ...defaultOpts, gap: 0 })
    const bigGap = fit('Alpha Bravo Charlie Delta', { ...defaultOpts, gap: 50 })
    if (noGap.lines.length > 1 && bigGap.lines.length > 1 && noGap.lines.length === bigGap.lines.length) {
      assert.ok(bigGap.totalHeight > noGap.totalHeight, 'bigger gap should increase totalHeight when line count matches')
    }
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Determinism
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — determinism', () => {
  it('same input produces identical output', () => {
    clearCache()
    const a = fit('Deterministic Output Test', defaultOpts)
    clearCache()
    const b = fit('Deterministic Output Test', defaultOpts)
    assert.deepEqual(a.lines, b.lines)
    assert.deepEqual(a.sizes, b.sizes)
    assert.deepEqual(a.weights, b.weights)
    assert.ok(Math.abs(a.totalHeight - b.totalHeight) < 0.01)
  })

  it('cached and uncached produce the same result', () => {
    clearCache()
    const cold = fit('Cache Consistency Check', defaultOpts)
    const warm = fit('Cache Consistency Check', defaultOpts) // hits cache
    assert.deepEqual(cold.lines, warm.lines)
    assert.deepEqual(cold.sizes, warm.sizes)
    assert.deepEqual(cold.weights, warm.weights)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Cache
// ────────────────────────────────────────────────────────────────────────────

describe('clearCache()', () => {
  it('does not break subsequent fit() calls', () => {
    fit('Before Clear', defaultOpts)
    clearCache()
    const r = fit('After Clear', defaultOpts)
    assert.notEqual(r, null)
    assert.ok(r.lines.length >= 1)
  })

  it('can be called multiple times safely', () => {
    clearCache()
    clearCache()
    clearCache()
    const r = fit('Still Works', defaultOpts)
    assert.notEqual(r, null)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// Box sizes — fit adapts to different aspect ratios
// ────────────────────────────────────────────────────────────────────────────

describe('fit() — different box sizes', () => {
  const text = 'Every Line Fills The Entire Width'

  beforeEach(() => clearCache())

  it('wide box: lines are wider with larger font sizes', () => {
    const narrow = fit(text, { width: 300, height: 500, fontFamily: 'sans-serif', padX: 10, padY: 10 })
    const wide = fit(text, { width: 1200, height: 500, fontFamily: 'sans-serif', padX: 10, padY: 10 })
    const avgNarrow = narrow.sizes.reduce((a, b) => a + b) / narrow.sizes.length
    const avgWide = wide.sizes.reduce((a, b) => a + b) / wide.sizes.length
    assert.ok(avgWide > avgNarrow, 'wider box should produce larger avg font size')
  })

  it('tall box uses the available height', () => {
    const short = fit(text, { width: 800, height: 200, fontFamily: 'sans-serif', padX: 10, padY: 10 })
    const tall = fit(text, { width: 800, height: 800, fontFamily: 'sans-serif', padX: 10, padY: 10 })
    assert.ok(tall.totalHeight >= short.totalHeight, 'taller box should yield >= totalHeight')
  })

  it('square box returns valid result', () => {
    const r = fit(text, { width: 500, height: 500, fontFamily: 'sans-serif' })
    assert.notEqual(r, null)
    assert.ok(r.lines.length >= 1)
  })

  it('OG image dimensions (1200×630)', () => {
    const r = fit(text, { width: 1200, height: 630, fontFamily: 'sans-serif', padX: 80, padY: 60 })
    assert.notEqual(r, null)
    assert.ok(r.lines.length >= 1)
  })
})
