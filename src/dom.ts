/**
 * tightset/dom — HTML/DOM renderer for Tailwind & CSS styling.
 *
 * Instead of drawing to a <canvas>, this outputs plain HTML elements
 * that can be styled with Tailwind classes, CSS Modules, or any CSS framework.
 *
 * @license MIT
 */

import type { FitResult } from './index'

export interface DomRenderOptions {
  /** Font family name (must match what was used in fit()) */
  fontFamily?: string
  /** Text color — applied as inline style (default: '#ffffff') */
  color?: string
  /** Text alignment (default: 'center') */
  align?: 'center' | 'left' | 'right'
  /** Gap between lines in pixels (applied as margin-top on lines 2+) */
  gap?: number
  /** Vertical padding (default: 40) */
  padY?: number
  /** CSS class for the container div */
  containerClass?: string
  /** CSS class applied to every line div */
  lineClass?: string
  /** Per-line CSS class (receives line index, return additional class string) */
  lineClassFn?: (index: number, line: string) => string
}

/**
 * Render a FitResult as an HTML string.
 *
 * Returns a `<div>` containing one `<div>` per line with inline
 * font-size, font-weight, and font-family. The container has flexbox
 * centering so lines are vertically centered within the box.
 *
 * Apply Tailwind classes via `containerClass` and `lineClass`.
 *
 * @example
 * ```ts
 * import { fit } from 'tightset'
 * import { renderToHTML } from 'tightset/dom'
 *
 * const result = fit('Make it tight', { width: 800, height: 400, fontFamily: 'Inter' })
 * if (result) {
 *   document.getElementById('target')!.innerHTML = renderToHTML(result, {
 *     fontFamily: 'Inter',
 *     color: '#ffffff',
 *     containerClass: 'bg-black rounded-2xl overflow-hidden',
 *     lineClass: 'tracking-tight',
 *   })
 * }
 * ```
 */
export function renderToHTML(result: FitResult, options: DomRenderOptions = {}): string {
  const {
    fontFamily = 'sans-serif',
    color = '#ffffff',
    align = 'center',
    gap = 20,
    padY = 40,
    containerClass = '',
    lineClass = '',
    lineClassFn,
  } = options

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const lines = result.lines.map((line, i) => {
    const classes = [lineClass, lineClassFn?.(i, line)].filter(Boolean).join(' ')
    const classAttr = classes ? ` class="${esc(classes)}"` : ''
    const mt = i > 0 ? `margin-top:${gap}px;` : ''
    return `<div${classAttr} style="${mt}font-size:${result.sizes[i].toFixed(1)}px;font-weight:${result.weights[i]};font-family:${esc(fontFamily)};color:${esc(color)};line-height:1;text-align:${align};white-space:nowrap;">${esc(line)}</div>`
  }).join('\n    ')

  const containerClassAttr = containerClass ? ` class="${esc(containerClass)}"` : ''

  return `<div${containerClassAttr} style="display:flex;flex-direction:column;justify-content:center;align-items:${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'};padding:${padY}px 0;height:100%;box-sizing:border-box;">
    ${lines}
  </div>`
}

/**
 * Render a FitResult into a DOM element.
 *
 * Replaces the element's innerHTML with the rendered HTML.
 * Returns the container div element for further manipulation.
 *
 * @example
 * ```ts
 * import { fit } from 'tightset'
 * import { renderToDOM } from 'tightset/dom'
 *
 * const result = fit('Hello World', { width: 800, height: 400, fontFamily: 'Inter' })
 * if (result) {
 *   const container = renderToDOM(document.getElementById('target')!, result, {
 *     fontFamily: 'Inter',
 *     containerClass: 'bg-gradient-to-br from-purple-600 to-blue-500',
 *     lineClass: 'drop-shadow-lg',
 *   })
 * }
 * ```
 */
export function renderToDOM(
  element: HTMLElement,
  result: FitResult,
  options: DomRenderOptions = {},
): HTMLElement {
  element.innerHTML = renderToHTML(result, options)
  return element.firstElementChild as HTMLElement
}

/**
 * Get inline style objects for each line (useful in React/Vue without canvas).
 *
 * @example
 * ```tsx
 * const styles = getLineStyles(result, { fontFamily: 'Inter' })
 * return (
 *   <div className="flex flex-col justify-center items-center h-full bg-black">
 *     {result.lines.map((line, i) => (
 *       <div key={i} style={styles[i]} className="tracking-tight drop-shadow-lg">
 *         {line}
 *       </div>
 *     ))}
 *   </div>
 * )
 * ```
 */
export function getLineStyles(
  result: FitResult,
  options: { fontFamily?: string; color?: string; align?: string; gap?: number } = {},
): Record<string, string | number>[] {
  const { fontFamily = 'sans-serif', color = '#ffffff', align = 'center', gap = 20 } = options
  return result.lines.map((_, i) => ({
    fontSize: `${result.sizes[i].toFixed(1)}px`,
    fontWeight: result.weights[i],
    fontFamily,
    color,
    lineHeight: 1,
    textAlign: align,
    whiteSpace: 'nowrap',
    ...(i > 0 ? { marginTop: `${gap}px` } : {}),
  }))
}
