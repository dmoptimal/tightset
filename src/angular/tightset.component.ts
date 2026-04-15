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
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnChanges,
  AfterViewInit,
} from '@angular/core'
import { fit, type TightsetOptions, type FitResult } from '../index'
import { render as renderCanvas } from '../canvas'

@Component({
  selector: 'tightset',
  standalone: true,
  template: '<canvas #canvas [style.width.px]="width" [style.height.px]="height"></canvas>',
})
export class TightsetComponent implements OnChanges, AfterViewInit {
  /** The text to fit */
  @Input({ required: true }) text!: string
  /** Canvas width in CSS pixels */
  @Input({ required: true }) width!: number
  /** Canvas height in CSS pixels */
  @Input({ required: true }) height!: number
  /** Font family (must be loaded; default: 'sans-serif') */
  @Input() fontFamily = 'sans-serif'
  /** Text color (default: '#ffffff') */
  @Input() color = '#ffffff'
  /** Background color (default: undefined = transparent) */
  @Input() background?: string
  /** Max font weight (default: 900) */
  @Input() maxWeight = 900
  /** Weight spread between largest and smallest lines (default: 150) */
  @Input() spread = 150
  /** Horizontal padding (default: 60) */
  @Input() padX = 60
  /** Vertical padding (default: 40) */
  @Input() padY = 40
  /** Line gap in pixels (default: 20) */
  @Input() gap = 20
  /** Max lines (default: 8) */
  @Input() maxLines = 8
  /** Uppercase text (default: true) */
  @Input() uppercase = true
  /** Device pixel ratio override */
  @Input() dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

  /** Emits the FitResult after each render (or null if fitting failed) */
  @Output() fitResult = new EventEmitter<FitResult | null>()

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>

  private viewReady = false

  ngAfterViewInit() {
    this.viewReady = true
    this.redraw()
  }

  ngOnChanges() {
    if (this.viewReady) this.redraw()
  }

  private redraw() {
    const canvas = this.canvasRef.nativeElement
    if (!canvas || !this.text?.trim()) {
      this.fitResult.emit(null)
      return
    }

    const opts: TightsetOptions = {
      width: this.width,
      height: this.height,
      padX: this.padX,
      padY: this.padY,
      gap: this.gap,
      maxWeight: this.maxWeight,
      spread: this.spread,
      maxLines: this.maxLines,
      uppercase: this.uppercase,
      fontFamily: this.fontFamily,
    }

    const result = fit(this.text, opts)
    this.fitResult.emit(result)

    if (!result) return

    canvas.width = Math.round(this.width * this.dpr)
    canvas.height = Math.round(this.height * this.dpr)
    renderCanvas(canvas, result, {
      fontFamily: this.fontFamily,
      color: this.color,
      background: this.background,
      gap: this.gap,
      padY: this.padY,
      dpr: this.dpr,
    })
  }
}

export { fit, type FitResult, type TightsetOptions } from '../index'
