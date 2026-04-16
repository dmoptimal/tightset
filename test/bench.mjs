/**
 * Benchmark for tightset fit()
 *
 * Usage:  node scripts/bench.mjs
 *
 * Measures fit() performance across different word counts, box sizes,
 * and simulated resize scenarios.
 */
import { createCanvas } from 'canvas'
import { setMeasureContext, fit, clearCache } from 'tightset'

// ── Setup canvas context for Node.js ──
const canvas = createCanvas(1, 1)
setMeasureContext(canvas.getContext('2d'))

// ── Test texts ──
const texts = {
  '3 words':  'Hello Beautiful World',
  '6 words':  'Every Line Fills The Entire Width',
  '10 words': 'This Is A Much Longer Piece Of Text To Fit',
  '15 words': 'This Is A Much Longer Piece Of Text That Should Really Push The Engine To Its Limits',
  '20 words': 'We Want To See How The Algorithm Handles A Very Long String Of Words That Goes On And On And On Forever',
}

const sizes = {
  'small (400×250)':   { width: 400, height: 250 },
  'medium (800×500)':  { width: 800, height: 500 },
  'large (1200×630)':  { width: 1200, height: 630 },
  'tall (600×900)':    { width: 600, height: 900 },
}

// ── Benchmark helper ──
function bench(label, fn, iterations = 200) {
  // Warmup
  for (let i = 0; i < 10; i++) fn()

  const times = []
  for (let i = 0; i < iterations; i++) {
    clearCache()
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }

  times.sort((a, b) => a - b)
  const median = times[Math.floor(times.length / 2)]
  const p95 = times[Math.floor(times.length * 0.95)]
  const p99 = times[Math.floor(times.length * 0.99)]
  const avg = times.reduce((a, b) => a + b, 0) / times.length

  return { label, median, p95, p99, avg, iterations }
}

// ── Resize simulation ──
function benchResize(text, startW, startH, steps = 50) {
  // Simulates dragging a resize handle — many fit() calls with incrementally changing dimensions
  // Text stays the same, only dimensions change — cache should help here
  const dw = 200 / steps
  const dh = 120 / steps
  return () => {
    for (let i = 0; i < steps; i++) {
      fit(text, {
        width: startW + dw * i,
        height: startH + dh * i,
        fontFamily: 'sans-serif',
      })
    }
  }
}

// ── Run benchmarks ──
console.log('tightset fit() benchmark')
console.log('='.repeat(80))
console.log()

// 1) Single calls — word count × box size
console.log('── Single fit() call (cold cache) ──')
console.log()
console.log(
  'Test'.padEnd(40),
  'Median'.padStart(8),
  'P95'.padStart(8),
  'P99'.padStart(8),
  'Avg'.padStart(8),
)
console.log('-'.repeat(80))

for (const [textLabel, text] of Object.entries(texts)) {
  for (const [sizeLabel, size] of Object.entries(sizes)) {
    const label = `${textLabel} / ${sizeLabel}`
    const r = bench(label, () => {
      fit(text, { ...size, fontFamily: 'sans-serif' })
    })
    console.log(
      r.label.padEnd(40),
      `${r.median.toFixed(2)}ms`.padStart(8),
      `${r.p95.toFixed(2)}ms`.padStart(8),
      `${r.p99.toFixed(2)}ms`.padStart(8),
      `${r.avg.toFixed(2)}ms`.padStart(8),
    )
  }
}

console.log()
console.log('── Single fit() call (warm cache, same text) ──')
console.log()
console.log(
  'Test'.padEnd(40),
  'Median'.padStart(8),
  'P95'.padStart(8),
  'P99'.padStart(8),
  'Avg'.padStart(8),
)
console.log('-'.repeat(80))

for (const [textLabel, text] of Object.entries(texts)) {
  const size = { width: 800, height: 500 }
  const label = `${textLabel} / warm cache`
  // Don't clear cache between iterations for warm-cache test
  const r = bench(label, () => {
    fit(text, { ...size, fontFamily: 'sans-serif' })
  })
  // Override — don't clear cache in this bench
  // Re-run without clearCache
  const times2 = []
  fit(text, { ...size, fontFamily: 'sans-serif' }) // prime
  for (let i = 0; i < 200; i++) {
    const start = performance.now()
    fit(text, { ...size, fontFamily: 'sans-serif' })
    times2.push(performance.now() - start)
  }
  times2.sort((a, b) => a - b)
  console.log(
    label.padEnd(40),
    `${times2[100].toFixed(2)}ms`.padStart(8),
    `${times2[190].toFixed(2)}ms`.padStart(8),
    `${times2[198].toFixed(2)}ms`.padStart(8),
    `${(times2.reduce((a, b) => a + b, 0) / 200).toFixed(2)}ms`.padStart(8),
  )
}

console.log()
console.log('── Resize simulation (50 incremental fit() calls, cold cache) ──')
console.log()
console.log(
  'Test'.padEnd(40),
  'Median'.padStart(8),
  'P95'.padStart(8),
  'P99'.padStart(8),
  'Avg'.padStart(8),
)
console.log('-'.repeat(80))

for (const [textLabel, text] of Object.entries(texts)) {
  const label = `${textLabel} / 50-step resize (cold)`
  const r = bench(label, benchResize(text, 400, 250), 50)
  console.log(
    r.label.padEnd(40),
    `${r.median.toFixed(2)}ms`.padStart(8),
    `${r.p95.toFixed(2)}ms`.padStart(8),
    `${r.p99.toFixed(2)}ms`.padStart(8),
    `${r.avg.toFixed(2)}ms`.padStart(8),
  )
}

console.log()
console.log('── Resize simulation (50 incremental fit() calls, warm — text unchanged) ──')
console.log()
console.log(
  'Test'.padEnd(40),
  'Median'.padStart(8),
  'P95'.padStart(8),
  'P99'.padStart(8),
  'Avg'.padStart(8),
)
console.log('-'.repeat(80))

for (const [textLabel, text] of Object.entries(texts)) {
  const label = `${textLabel} / 50-step resize (warm)`
  // Prime the cache first
  fit(text, { width: 400, height: 250, fontFamily: 'sans-serif' })
  const resizeFn = benchResize(text, 400, 250)
  // Don't clear cache between iterations — simulates real resize
  const times = []
  for (let i = 0; i < 50; i++) {
    const start = performance.now()
    resizeFn()
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  console.log(
    label.padEnd(40),
    `${times[25].toFixed(2)}ms`.padStart(8),
    `${times[47].toFixed(2)}ms`.padStart(8),
    `${times[49].toFixed(2)}ms`.padStart(8),
    `${(times.reduce((a, b) => a + b, 0) / 50).toFixed(2)}ms`.padStart(8),
  )
}

console.log()
console.log('Done. Times above 16ms will cause visible jank at 60fps.')
