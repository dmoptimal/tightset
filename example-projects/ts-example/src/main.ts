import { fit, type FitResult, type TightsetOptions } from 'tightset'
import { render } from 'tightset/canvas'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const input = document.getElementById('textInput') as HTMLInputElement

const opts: TightsetOptions = {
  width: 800,
  height: 400,
  fontFamily: 'Inter',
  maxWeight: 900,
  spread: 150,
}

function redraw(): void {
  const result: FitResult | null = fit(input.value, opts)
  if (result) {
    render(canvas, result, {
      fontFamily: 'Inter',
      color: '#ffffff',
      background: '#0d0d0d',
      dpr: 2,
    })
  }
}

async function init(): Promise<void> {
  await document.fonts.ready
  canvas.width = 1600
  canvas.height = 800
  canvas.style.width = '800px'
  canvas.style.height = '400px'
  redraw()
  input.addEventListener('input', redraw)
}

init()
