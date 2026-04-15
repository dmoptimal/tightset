<!--
  tightset/svelte — Svelte component for variable-weight text fitting.
  @license MIT
-->
<script lang="ts">
  import { fit, type TightsetOptions, type FitResult } from '../index'
  import { render as renderCanvas } from '../canvas'

  /** The text to fit */
  export let text: string
  /** Canvas width in CSS pixels */
  export let width: number
  /** Canvas height in CSS pixels */
  export let height: number
  /** Font family (default: 'sans-serif') */
  export let fontFamily: string = 'sans-serif'
  /** Text color (default: '#ffffff') */
  export let color: string = '#ffffff'
  /** Background color (default: undefined = transparent) */
  export let background: string | undefined = undefined
  /** Max font weight (default: 900) */
  export let maxWeight: number = 900
  /** Weight spread (default: 150) */
  export let spread: number = 150
  /** Horizontal padding (default: 60) */
  export let padX: number = 60
  /** Vertical padding (default: 40) */
  export let padY: number = 40
  /** Line gap (default: 20) */
  export let gap: number = 20
  /** Max lines (default: 8) */
  export let maxLines: number = 8
  /** Uppercase (default: true) */
  export let uppercase: boolean = true

  let canvas: HTMLCanvasElement
  let dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

  $: opts = {
    width, height, padX, padY, gap,
    maxWeight, spread, maxLines, uppercase, fontFamily,
  } satisfies TightsetOptions

  $: result = text.trim() ? fit(text, opts) : null

  $: if (canvas && result) {
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    renderCanvas(canvas, result, { fontFamily, color, background, gap, padY, dpr })
  }
</script>

<canvas
  bind:this={canvas}
  width={Math.round(width * dpr)}
  height={Math.round(height * dpr)}
  style="width: {width}px; height: {height}px;"
  {...$$restProps}
/>
