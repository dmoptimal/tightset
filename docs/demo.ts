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
const domGradient = document.getElementById('domGradient')!
const domNeon = document.getElementById('domNeon')!

// ── State ──
let currentFont = fontSelect.value
const dpr = window.devicePixelRatio

// ── Update everything ──
function update() {
  const text = textInput.value
  const fontFamily = fontSelect.value
  const maxWeight = Math.min(parseInt(weightSlider.value), fontMaxWeight[fontFamily] ?? 900)
  const spread = parseInt(spreadSlider.value)
  const gap = parseInt(gapSlider.value)
  const padX = parseInt(padXSlider.value)
  const padY = parseInt(padYSlider.value)
  const maxLines = parseInt(maxLinesSlider.value)
  const uppercase = uppercaseSelect.value === 'true'
  weightVal.textContent = String(maxWeight)
  spreadVal.textContent = String(spread)
  gapVal.textContent = String(gap)
  padXVal.textContent = String(padX)
  padYVal.textContent = String(padY)
  maxLinesVal.textContent = String(maxLines)

  // Clear cache when font changes so measurements are fresh
  if (fontFamily !== currentFont) {
    clearCache()
    currentFont = fontFamily
  }

  // Resizable canvas demo
  const boxW = resizeBox.clientWidth
  const boxH = resizeBox.clientHeight
  resizeDims.textContent = `${boxW} × ${boxH}`
  resizeCanvas.width = Math.round(boxW * dpr)
  resizeCanvas.height = Math.round(boxH * dpr)
  const resizeResult = fit(text, { width: boxW, height: boxH, fontFamily, maxWeight, spread, gap, padX, padY, maxLines, uppercase })
  if (resizeResult) {
    render(resizeCanvas, resizeResult, { fontFamily, color: '#ffffff', background: '#0d0d0d', gap, padY, dpr })
  }

  // DOM mode — plain
  const domResult = fit(text, { width: 400, height: 250, fontFamily, maxWeight, spread, gap, padX, padY, maxLines, uppercase })
  if (domResult) {
    renderToDOM(domTarget, domResult, {
      fontFamily,
      color: '#ffffff',
      gap,
      containerClass: 'tightset-html',
    })
  }

  // DOM mode — gradient background
  const gradResult = fit(text, { width: 400, height: 250, fontFamily, maxWeight, spread, gap, padX, padY, maxLines, uppercase })
  if (gradResult) {
    renderToDOM(domGradient, gradResult, {
      fontFamily,
      color: '#ffffff',
      gap,
      containerClass: 'tightset-html',
    })
    // Add drop-shadow to each line
    domGradient.querySelectorAll('.tightset-html div').forEach(el => {
      ;(el as HTMLElement).style.filter = 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))'
    })
  }

  // DOM mode — neon glow
  const neonResult = fit(text, { width: 400, height: 250, fontFamily, maxWeight, spread, gap, padX, padY, maxLines, uppercase })
  if (neonResult) {
    renderToDOM(domNeon, neonResult, {
      fontFamily,
      color: '#0ff',
      gap,
      containerClass: 'tightset-html',
    })
    domNeon.querySelectorAll('.tightset-html div').forEach(el => {
      ;(el as HTMLElement).style.textShadow = '0 0 7px #0ff, 0 0 20px #0ff, 0 0 42px #0a8, 0 0 82px #0a8'
    })
  }
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
  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(update)
  })
  resizeObserver.observe(resizeBox)

  // Initial render
  update()
}

init()
textInput.addEventListener('input', update)
fontSelect.addEventListener('change', update)
weightSlider.addEventListener('input', update)
spreadSlider.addEventListener('input', update)
gapSlider.addEventListener('input', update)
padXSlider.addEventListener('input', update)
padYSlider.addEventListener('input', update)
maxLinesSlider.addEventListener('input', update)
uppercaseSelect.addEventListener('change', update)
