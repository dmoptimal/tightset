/**
 * tightset/angular — Angular standalone component for variable-weight text fitting.
 *
 * Renders fitted text onto a <canvas> element. Requires Angular 16+ (standalone components).
 * Re-renders automatically when any input changes.
 *
 * @example
 * ```ts
 * import { TightsetComponent } from 'tightset/angular'
 *
 * @Component({
 *   standalone: true,
 *   imports: [TightsetComponent],
 *   template: `
 *     <tightset
 *       text="Every Line Fills The Width"
 *       [width]="800"
 *       [height]="500"
 *       fontFamily="Inter"
 *       color="#ffffff"
 *       background="#0d0d0d"
 *     />
 *   `,
 * })
 * export class MyComponent {}
 * ```
 *
 * @license MIT
 */

import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  effect,
} from '@angular/core'
import { fit, type TightsetOptions, type FitResult } from 'tightset'
import { render as renderCanvas } from 'tightset/canvas'

@Component({
  selector: 'tightset',
  standalone: true,
  template: '<canvas #canvas [style.width.px]="width()" [style.height.px]="height()"></canvas>',
})
export class TightsetComponent {
  /** The text to fit */
  readonly text = input.required<string>()
  /** Canvas width in CSS pixels */
  readonly width = input.required<number>()
  /** Canvas height in CSS pixels */
  readonly height = input.required<number>()
  /** Font family (must be loaded; default: 'sans-serif') */
  readonly fontFamily = input<string>('sans-serif')
  /** Text color (default: '#ffffff') */
  readonly color = input<string>('#ffffff')
  /** Background color (default: undefined = transparent) */
  readonly background = input<string | undefined>(undefined)
  /** Max font weight (default: 900) */
  readonly maxWeight = input<number>(900)
  /** Weight spread between largest and smallest lines (default: 150) */
  readonly spread = input<number>(150)
  /** Horizontal padding (default: 60) */
  readonly padX = input<number>(60)
  /** Vertical padding (default: 40) */
  readonly padY = input<number>(40)
  /** Line gap in pixels (default: 20) */
  readonly gap = input<number>(20)
  /** Max lines (default: 8) */
  readonly maxLines = input<number>(8)
  /** Uppercase text (default: true) */
  readonly uppercase = input<boolean>(true)
  /** Device pixel ratio override */
  readonly dpr = input<number>(typeof window !== 'undefined' ? window.devicePixelRatio : 1)

  /** Emits the FitResult after each render (or null if fitting failed) */
  readonly fitResult = output<FitResult | null>()

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas')

  constructor() {
    effect(() => {
      this.redraw()
    })
  }

  private redraw() {
    const canvas = this.canvasRef().nativeElement
    const text = this.text()
    if (!canvas || !text?.trim()) {
      this.fitResult.emit(null)
      return
    }

    const opts: TightsetOptions = {
      width: this.width(),
      height: this.height(),
      padX: this.padX(),
      padY: this.padY(),
      gap: this.gap(),
      maxWeight: this.maxWeight(),
      spread: this.spread(),
      maxLines: this.maxLines(),
      uppercase: this.uppercase(),
      fontFamily: this.fontFamily(),
    }

    const result = fit(text, opts)
    this.fitResult.emit(result)

    if (!result) return

    const dpr = this.dpr()
    canvas.width = Math.round(this.width() * dpr)
    canvas.height = Math.round(this.height() * dpr)
    renderCanvas(canvas, result, {
      fontFamily: this.fontFamily(),
      color: this.color(),
      background: this.background(),
      gap: this.gap(),
      padY: this.padY(),
      dpr,
    })
  }
}

export { fit, type FitResult, type TightsetOptions } from 'tightset'
