/**
 * Demo script for the tightset docs page.
 * Built as a self-contained bundle for GitHub Pages.
 */
import { fit, clearCache } from '../src/index'
import { render } from '../src/canvas'
import { renderToDOM } from '../src/dom'

// ── Font weight ranges (Google Fonts CSS declarations) ──
const fontMaxWeight: Record<string, number> = {
  'Inter': 900,
  'Outfit': 900,
  'Space Grotesk': 700,
  'Fraunces': 900,
  'Fredoka': 700,
  'Syne': 800,
  'Unbounded': 900,
  'Rubik': 900,
  'system-ui': 900,
}

// ── Elements ──
const heroCanvas = document.getElementById('heroCanvas') as HTMLCanvasElement
const titleCanvas = document.getElementById('titleCanvas') as HTMLCanvasElement
const typerCursor = document.getElementById('typerCursor')!
const resizeBox = document.getElementById('resizeBox')!
const resizeCanvas = document.getElementById('resizeCanvas') as HTMLCanvasElement
const resizeDims = document.getElementById('resizeDims')!
const textInput = document.getElementById('textInput') as HTMLInputElement
const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement
const weightSlider = document.getElementById('weightSlider') as HTMLInputElement
const spreadSlider = document.getElementById('spreadSlider') as HTMLInputElement
const gapSlider = document.getElementById('gapSlider') as HTMLInputElement
const padXSlider = document.getElementById('padXSlider') as HTMLInputElement
const padYSlider = document.getElementById('padYSlider') as HTMLInputElement
const maxLinesSlider = document.getElementById('maxLinesSlider') as HTMLInputElement
const uppercaseSelect = document.getElementById('uppercaseSelect') as HTMLSelectElement
const weightVal = document.getElementById('weightVal')!
const spreadVal = document.getElementById('spreadVal')!
const gapVal = document.getElementById('gapVal')!
const padXVal = document.getElementById('padXVal')!
const padYVal = document.getElementById('padYVal')!
const maxLinesVal = document.getElementById('maxLinesVal')!
const domTarget = document.getElementById('domTarget')!

// ── State ──
let currentFont = fontSelect.value
const dpr = window.devicePixelRatio

// ── Shared options (rebuilt on every change) ──
function getOptions() {
  const fontFamily = fontSelect.value
  const maxWeight = Math.min(parseInt(weightSlider.value), fontMaxWeight[fontFamily] ?? 900)
  return {
    text: textInput.value,
    fontFamily,
    maxWeight,
    spread: parseInt(spreadSlider.value),
    gap: parseInt(gapSlider.value),
    padX: parseInt(padXSlider.value),
    padY: parseInt(padYSlider.value),
    maxLines: parseInt(maxLinesSlider.value),
    uppercase: uppercaseSelect.value === 'true',
  }
}

// ── Update resizable canvas only (called on resize) ──
function updateCanvas() {
  const o = getOptions()

  // Clear cache when font changes so measurements are fresh
  if (o.fontFamily !== currentFont) {
    clearCache()
    currentFont = o.fontFamily
  }

  weightVal.textContent = String(o.maxWeight)
  spreadVal.textContent = String(o.spread)
  gapVal.textContent = String(o.gap)
  padXVal.textContent = String(o.padX)
  padYVal.textContent = String(o.padY)
  maxLinesVal.textContent = String(o.maxLines)

  const boxW = resizeBox.clientWidth
  const boxH = resizeBox.clientHeight
  resizeDims.textContent = `${boxW} × ${boxH}`
  resizeCanvas.width = Math.round(boxW * dpr)
  resizeCanvas.height = Math.round(boxH * dpr)
  const resizeResult = fit(o.text, { width: boxW, height: boxH, fontFamily: o.fontFamily, maxWeight: o.maxWeight, spread: o.spread, gap: o.gap, padX: o.padX, padY: o.padY, maxLines: o.maxLines, uppercase: o.uppercase })
  if (resizeResult) {
    render(resizeCanvas, resizeResult, { fontFamily: o.fontFamily, color: '#ffffff', background: '#0d0d0d', gap: o.gap, padY: o.padY, dpr })
  }
}

// ── Update DOM demo (called on text/option changes, NOT on resize) ──
function updateDOM() {
  const o = getOptions()

  const domResult = fit(o.text, { width: 400, height: 250, fontFamily: o.fontFamily, maxWeight: o.maxWeight, spread: o.spread, gap: o.gap, padX: o.padX, padY: o.padY, maxLines: o.maxLines, uppercase: o.uppercase })
  if (!domResult) return

  renderToDOM(domTarget, domResult, {
    fontFamily: o.fontFamily,
    color: '#ffffff',
    gap: o.gap,
    containerClass: 'tightset-html',
  })
  // Apply gradient text — the kind of thing you'd do with Tailwind's bg-clip-text
  domTarget.querySelectorAll('.tightset-html div').forEach(el => {
    const s = (el as HTMLElement).style
    s.background = 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)'
    s.webkitBackgroundClip = 'text'
    s.webkitTextFillColor = 'transparent'
    s.backgroundClip = 'text'
  })
}

// ── Full update (canvas + DOM) ──
function update() {
  updateCanvas()
  updateDOM()
}

// ── Debounced update for text input ──
let inputTimer = 0
function debouncedUpdate() {
  // Canvas updates immediately via RAF for responsive feel
  requestAnimationFrame(updateCanvas)
  // DOM demos are deferred — they're below the fold anyway
  clearTimeout(inputTimer)
  inputTimer = window.setTimeout(updateDOM, 150)
}

// ── Font loading: wait for ALL requested fonts, then render ──
async function init() {
  const families = ['Inter', 'Outfit', 'Space Grotesk', 'Fraunces', 'Fredoka', 'Syne', 'Unbounded', 'Rubik']
  for (const f of families) {
    const maxW = fontMaxWeight[f] ?? 900
    try { await document.fonts.load(`400 16px "${f}"`) } catch {}
    try { await document.fonts.load(`${maxW} 16px "${f}"`) } catch {}
  }
  await document.fonts.ready

  // Start observing resize AFTER fonts are loaded
  let resizeRaf = 0
  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(updateCanvas)
  })
  resizeObserver.observe(resizeBox)

  // Initial render
  update()
}

init()
textInput.addEventListener('input', debouncedUpdate)
fontSelect.addEventListener('change', update)
weightSlider.addEventListener('input', debouncedUpdate)
spreadSlider.addEventListener('input', debouncedUpdate)
gapSlider.addEventListener('input', debouncedUpdate)
padXSlider.addEventListener('input', debouncedUpdate)
padYSlider.addEventListener('input', debouncedUpdate)
maxLinesSlider.addEventListener('input', debouncedUpdate)
uppercaseSelect.addEventListener('change', update)

// ── Hero typing animation ──
const heroEntries: { text: string, font: string }[] = [
  { text: 'tight set', font: 'Inter' },
  { text: 'every line fills the width', font: 'Outfit' },
  { text: 'bold words fill space', font: 'Syne' },
  { text: 'tight set', font: 'Rubik' },
  { text: 'pack it in make it fit', font: 'Space Grotesk' },
  { text: 'fill the box', font: 'Fraunces' },
  { text: 'tight set', font: 'Unbounded' },
  { text: 'big type energy', font: 'Fredoka' },
  { text: 'weight gives hierarchy', font: 'Inter' },
  { text: 'tight set', font: 'Outfit' },
  { text: 'stretch to fill any rectangle', font: 'Syne' },
  { text: 'max impact words', font: 'Rubik' },
  { text: 'tight set', font: 'Fraunces' },
  { text: 'crisp bold type', font: 'Space Grotesk' },
  { text: 'one box any text', font: 'Unbounded' },
  { text: 'tight set', font: 'Fredoka' },
  { text: 'variable weight kinetic type', font: 'Inter' },
  { text: 'snug fit text', font: 'Syne' },
]

// ── Per-line colors (isolated — set to null to disable) ──
const heroLineColors: string[] | null = [
  '#ff6b6b',  // coral red
  '#ffd93d',  // warm yellow
  '#6bcb77',  // green
  '#4d96ff',  // blue
  '#9b59b6',  // purple
  '#ff8a5c',  // orange
  '#00d2d3',  // teal
  '#ff6b6b',  // repeat cycle
]

let currentHeroIdx = 0

function renderHero(text: string) {
  const entry = heroEntries[currentHeroIdx]
  const font = entry.font
  const maxWeight = fontMaxWeight[font] ?? 900
  const w = 170
  const h = 170
  heroCanvas.width = Math.round(w * dpr)
  heroCanvas.height = Math.round(h * dpr)
  if (!text.trim()) {
    const ctx = heroCanvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    typerCursor.style.opacity = '1'
    typerCursor.style.top = '14px'
    typerCursor.style.right = (w / 2 - 2) + 'px'
    typerCursor.style.height = (h - 28) + 'px'
    return
  }
  const padY = 14
  const gap = 6
  const result = fit(text, { width: w, height: h, fontFamily: font, maxWeight, spread: 200, gap, padX: 14, padY, maxLines: 4, uppercase: true })
  if (result) {
    const ctx = heroCanvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, w, h)

    const textY = padY + (h - padY * 2 - result.totalHeight) / 2
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'center'
    let curY = textY
    for (let i = 0; i < result.lines.length; i++) {
      const m = result.metrics[i]
      ctx.font = `${result.weights[i]} ${result.sizes[i]}px ${font}`
      // Per-line color or white fallback
      ctx.fillStyle = heroLineColors ? (heroLineColors[i % heroLineColors.length]) : '#ffffff'
      ctx.fillText(result.lines[i], w / 2, curY + m.capTop)
      curY += m.capTop + m.capBottom
      if (i < result.lines.length - 1) curY += gap
    }

    // Position cursor
    const textTop = padY + (h - padY * 2 - result.totalHeight) / 2
    const lastMetrics = result.metrics[result.metrics.length - 1]
    const lastWidth = lastMetrics.width
    const lastX = (w - lastWidth) / 2 + lastWidth
    typerCursor.style.top = textTop + 'px'
    typerCursor.style.height = result.totalHeight + 'px'
    typerCursor.style.right = (w - lastX - 4) + 'px'
    typerCursor.style.opacity = '1'
  }
}

async function typeLoop(startWith: string) {
  const TYPE_SPEED = 90
  const DELETE_SPEED = 50
  const PAUSE_AFTER_TYPE = 2500
  const PAUSE_AFTER_DELETE = 400

  let wordIdx = 1 // start from second word since first is already displayed
  let current = startWith

  while (true) {
    const target = heroEntries[wordIdx].text

    // Switch font when we start deleting toward a new target
    // (keep old font during delete, switch when typing starts)
    
    // Find common prefix
    let common = 0
    while (common < current.length && common < target.length && current[common] === target[common]) {
      common++
    }

    // Delete back to common prefix
    while (current.length > common) {
      current = current.slice(0, -1)
      renderHero(current)
      await sleep(DELETE_SPEED)
    }

    if (current.length === 0 && common === 0) {
      await sleep(PAUSE_AFTER_DELETE)
    }

    // Switch to new font/entry before typing forward
    currentHeroIdx = wordIdx

    // Type forward to target
    while (current.length < target.length) {
      current = target.slice(0, current.length + 1)
      renderHero(current)
      await sleep(TYPE_SPEED)
    }

    await sleep(PAUSE_AFTER_TYPE)
    wordIdx = (wordIdx + 1) % heroEntries.length
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Render the title wordmark
function renderTitle() {
  const w = 120
  const h = 120
  titleCanvas.width = Math.round(w * dpr)
  titleCanvas.height = Math.round(h * dpr)
  titleCanvas.style.width = w + 'px'
  titleCanvas.style.height = h + 'px'
  const result = fit('tight set', { width: w, height: h, fontFamily: 'Inter', maxWeight: 900, spread: 150, gap: 4, padX: 8, padY: 8, maxLines: 2, uppercase: true })
  if (result) {
    render(titleCanvas, result, { fontFamily: 'Inter', color: '#bbb', gap: 4, padY: 8, dpr })
  }
}

// Start the hero animation after fonts load
document.fonts.ready.then(() => {
  renderTitle()
  currentHeroIdx = 0
  renderHero(heroEntries[0].text)
  setTimeout(() => {
    typeLoop(heroEntries[0].text)
  }, 2000)
})
