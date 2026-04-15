/**
 * tightset/canvas — Vanilla Canvas 2D drawing helper.
 *
 * Renders a FitResult onto any CanvasRenderingContext2D.
 *
 * @license MIT
 */

import type { FitResult } from './index'

export interface DrawOptions {
  /** Font family name (must match what was used in fit()) */
  fontFamily?: string
  /** Text color (default: '#ffffff') */
  color?: string
  /** Text alignment: 'center' | 'left' | 'right' (default: 'center') */
  align?: 'center' | 'left' | 'right'
}

/**
 * Draw a FitResult onto a canvas context.
 *
 * @param ctx - The CanvasRenderingContext2D to draw on
 * @param result - The FitResult from fit()
 * @param x - X position (center, left, or right depending on align)
 * @param y - Y position (top of the text block)
 * @param gap - Gap between lines in pixels
 * @param options - Drawing options
 *
 * @example
 * ```ts
 * import { fit } from 'tightset'
 * import { draw } from 'tightset/canvas'
 *
 * const result = fit('Hello World', { width: 800, height: 400, fontFamily: 'Inter' })
 * if (result) {
 *   draw(ctx, result, 400, 50, 20, { fontFamily: 'Inter', color: '#000' })
 * }
 * ```
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  result: FitResult,
  x: number,
  y: number,
  gap: number,
  options: DrawOptions = {},
) {
  const {
    fontFamily = 'sans-serif',
    color = '#ffffff',
    align = 'center',
  } = options

  ctx.fillStyle = color
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = align

  let curY = y
  for (let i = 0; i < result.lines.length; i++) {
    const m = result.metrics[i]
    ctx.font = `${result.weights[i]} ${result.sizes[i]}px ${fontFamily}`
    ctx.fillText(result.lines[i], x, curY + m.capTop)
    curY += m.capTop + m.capBottom
    if (i < result.lines.length - 1) curY += gap
  }
}

/**
 * Render tightset text onto a canvas element (convenience wrapper).
 * Clears the canvas, optionally fills background, then draws the fitted text
 * vertically centred within the padY region.
 *
 * Note: resets the canvas transform to account for devicePixelRatio scaling.
 *
 * @example
 * ```ts
 * import { fit } from 'tightset'
 * import { render } from 'tightset/canvas'
 *
 * const canvas = document.getElementById('myCanvas') as HTMLCanvasElement
 * const result = fit('Make it tight', { width: 800, height: 400, fontFamily: 'Inter' })
 * if (result) {
 *   render(canvas, result, {
 *     fontFamily: 'Inter',
 *     color: '#ffffff',
 *     background: '#000000',
 *     gap: 20,
 *     padY: 40,
 *   })
 * }
 * ```
 */
export function render(
  canvas: HTMLCanvasElement,
  result: FitResult,
  options: DrawOptions & {
    background?: string
    gap?: number
    padY?: number
    dpr?: number
  } = {},
) {
  const {
    background,
    gap = 20,
    padY = 40,
    dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    ...drawOpts
  } = options

  const w = canvas.width / dpr
  const h = canvas.height / dpr

  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, w, h)
  } else {
    ctx.clearRect(0, 0, w, h)
  }

  const textY = padY + (h - padY * 2 - result.totalHeight) / 2
  draw(ctx, result, w / 2, textY, gap, drawOpts)
}
