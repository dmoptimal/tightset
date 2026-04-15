/**
 * tightset/react — React component for variable-weight text fitting.
 *
 * @license MIT
 */

import { useRef, useEffect, useMemo, type CSSProperties } from 'react'
import { fit, clearCache, type TightsetOptions, type FitResult } from '../index'
import { render as renderCanvas } from '../canvas'

export interface TightsetProps {
  /** The text to fit */
  text: string
  /** Canvas width in CSS pixels */
  width: number
  /** Canvas height in CSS pixels */
  height: number
  /** Font family (must be loaded; default: 'sans-serif') */
  fontFamily?: string
  /** Text color (default: '#ffffff') */
  color?: string
  /** Background color (default: transparent) */
  background?: string
  /** Max font weight (default: 900) */
  maxWeight?: number
  /** Weight spread between largest and smallest lines (default: 150) */
  spread?: number
  /** Horizontal padding (default: 60) */
  padX?: number
  /** Vertical padding (default: 40) */
  padY?: number
  /** Line gap in pixels (default: 20) */
  gap?: number
  /** Max lines (default: 8) */
  maxLines?: number
  /** Uppercase text (default: true) */
  uppercase?: boolean
  /** Device pixel ratio override */
  dpr?: number
  /** Additional CSS class */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
  /** Callback with the fit result (for custom rendering) */
  onFit?: (result: FitResult | null) => void
}

/**
 * React component that renders variable-weight fitted text on a canvas.
 *
 * @example
 * ```tsx
 * import { Tightset } from 'tightset/react'
 *
 * function App() {
 *   return (
 *     <Tightset
 *       text="Do All Tattoos Fade The Same?"
 *       width={800}
 *       height={500}
 *       fontFamily="Inter"
 *       color="#ffffff"
 *       background="#0d0d0d"
 *       maxWeight={900}
 *       spread={150}
 *     />
 *   )
 * }
 * ```
 */
export function Tightset({
  text,
  width,
  height,
  fontFamily = 'sans-serif',
  color = '#ffffff',
  background,
  maxWeight = 900,
  spread = 150,
  padX = 60,
  padY = 40,
  gap = 20,
  maxLines = 8,
  uppercase = true,
  dpr: dprProp,
  className,
  style,
  onFit,
}: TightsetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dpr = dprProp ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1)

  const opts: TightsetOptions = useMemo(() => ({
    width, height, padX, padY, gap,
    maxWeight, spread, maxLines, uppercase, fontFamily,
  }), [width, height, padX, padY, gap, maxWeight, spread, maxLines, uppercase, fontFamily])

  const result = useMemo(() => {
    if (!text.trim()) return null
    return fit(text, opts)
  }, [text, opts])

  useEffect(() => {
    onFit?.(result)
  }, [result, onFit])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    renderCanvas(canvas, result, { fontFamily, color, background, gap, padY, dpr })
  }, [result, width, height, dpr, fontFamily, color, background, gap, padY])

  return (
    <canvas
      ref={canvasRef}
      width={Math.round(width * dpr)}
      height={Math.round(height * dpr)}
      className={className}
      style={{ width, height, ...style }}
    />
  )
}

export { fit, clearCache, type FitResult, type TightsetOptions } from '../index'
