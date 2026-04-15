/**
 * Demo script for the tightset docs page.
 * Built as a self-contained bundle for GitHub Pages.
 */
import { fit } from '../src/index'
import { render } from '../src/canvas'
import { renderToDOM } from '../src/dom'

const grid = document.getElementById('grid')!
const textInput = document.getElementById('textInput') as HTMLInputElement
const fontSelect = document.getElementById('fontSelect') as HTMLSelectElement
const weightSlider = document.getElementById('weightSlider') as HTMLInputElement
const spreadSlider = document.getElementById('spreadSlider') as HTMLInputElement
const weightVal = document.getElementById('weightVal')!
const spreadVal = document.getElementById('spreadVal')!
const domTarget = document.getElementById('domTarget')!

const sizes = [
  { w: 800, h: 500, label: '800 × 500 (landscape)' },
  { w: 600, h: 600, label: '600 × 600 (square)' },
  { w: 400, h: 700, label: '400 × 700 (portrait)' },
  { w: 1200, h: 630, label: '1200 × 630 (OG image)' },
]

const dpr = window.devicePixelRatio

const canvases = sizes.map(({ w, h, label }) => {
  const card = document.createElement('div')
  card.className = 'card'
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  canvas.style.width = '100%'
  canvas.style.aspectRatio = `${w}/${h}`
  card.appendChild(canvas)
  const lbl = document.createElement('div')
  lbl.className = 'card-label'
  lbl.textContent = label
  card.appendChild(lbl)
  grid.appendChild(card)
  return { canvas, w, h }
})

function update() {
  const text = textInput.value
  const fontFamily = fontSelect.value
  const maxWeight = parseInt(weightSlider.value)
  const spread = parseInt(spreadSlider.value)
  weightVal.textContent = String(maxWeight)
  spreadVal.textContent = String(spread)

  canvases.forEach(({ canvas, w, h }) => {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const result = fit(text, { width: w, height: h, fontFamily, maxWeight, spread })
    if (result) {
      render(canvas, result, { fontFamily, color: '#ffffff', background: '#0d0d0d', dpr })
    }
  })

  const domResult = fit(text, { width: 500, height: 312, fontFamily, maxWeight, spread })
  if (domResult) {
    renderToDOM(domTarget, domResult, {
      fontFamily,
      color: '#ffffff',
      containerClass: 'tightset-html',
    })
  }
}

document.fonts.ready.then(update)
textInput.addEventListener('input', update)
fontSelect.addEventListener('change', update)
weightSlider.addEventListener('input', update)
spreadSlider.addEventListener('input', update)
