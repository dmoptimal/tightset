<!--
  tightset/vue — Vue component for variable-weight text fitting.
  @license MIT
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { fit, type TightsetOptions, type FitResult } from '../index'
import { render as renderCanvas } from '../canvas'

const props = withDefaults(defineProps<{
  /** The text to fit */
  text: string
  /** Canvas width in CSS pixels */
  width: number
  /** Canvas height in CSS pixels */
  height: number
  /** Font family (default: 'sans-serif') */
  fontFamily?: string
  /** Text color (default: '#ffffff') */
  color?: string
  /** Background color (default: undefined = transparent) */
  background?: string
  /** Max font weight (default: 900) */
  maxWeight?: number
  /** Weight spread (default: 150) */
  spread?: number
  /** Horizontal padding (default: 60) */
  padX?: number
  /** Vertical padding (default: 40) */
  padY?: number
  /** Line gap (default: 20) */
  gap?: number
  /** Max lines (default: 8) */
  maxLines?: number
  /** Uppercase (default: true) */
  uppercase?: boolean
  /** Render as HTML elements instead of canvas (for Tailwind styling) */
  mode?: 'canvas' | 'html'
}>(), {
  fontFamily: 'sans-serif',
  color: '#ffffff',
  background: undefined,
  maxWeight: 900,
  spread: 150,
  padX: 60,
  padY: 40,
  gap: 20,
  maxLines: 8,
  uppercase: true,
  mode: 'canvas',
})

const emit = defineEmits<{
  fit: [result: FitResult | null]
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

const opts = computed<TightsetOptions>(() => ({
  width: props.width,
  height: props.height,
  padX: props.padX,
  padY: props.padY,
  gap: props.gap,
  maxWeight: props.maxWeight,
  spread: props.spread,
  maxLines: props.maxLines,
  uppercase: props.uppercase,
  fontFamily: props.fontFamily,
}))

const result = computed(() => {
  if (!props.text.trim()) return null
  return fit(props.text, opts.value)
})

watch(result, (r) => emit('fit', r))

function redraw() {
  if (!canvas.value || !result.value || props.mode !== 'canvas') return
  canvas.value.width = Math.round(props.width * dpr)
  canvas.value.height = Math.round(props.height * dpr)
  renderCanvas(canvas.value, result.value, {
    fontFamily: props.fontFamily,
    color: props.color,
    background: props.background,
    gap: props.gap,
    padY: props.padY,
    dpr,
  })
}

watch([result, () => props.color, () => props.background], redraw)
onMounted(redraw)
</script>

<template>
  <canvas
    v-if="mode === 'canvas'"
    ref="canvas"
    :width="Math.round(width * dpr)"
    :height="Math.round(height * dpr)"
    :style="{ width: width + 'px', height: height + 'px' }"
  />
  <div
    v-else-if="result"
    :style="{ width: width + 'px', height: height + 'px', background: background }"
    class="tightset-html"
  >
    <div
      v-for="(line, i) in result.lines"
      :key="i"
      :style="{
        fontSize: result.sizes[i] + 'px',
        fontWeight: result.weights[i],
        fontFamily: fontFamily,
        color: color,
        lineHeight: 1,
        textAlign: 'center',
        marginTop: i > 0 ? gap + 'px' : '0',
      }"
    >
      {{ line }}
    </div>
  </div>
</template>
