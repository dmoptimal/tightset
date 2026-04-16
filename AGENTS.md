# tightset — AI Agent Guide

## What is tightset?

A TypeScript library that fits text into a fixed-size rectangle using **variable font weight** to create visual hierarchy. Larger lines get heavier weight, smaller lines get lighter weight. Think kinetic typography — every line stretches to fill the width.

**Use cases:** Social media cards, hero banners, Open Graph images, slide decks, presentations, thumbnail generation.

## Installation

```bash
npm install tightset
```

## Core API

```ts
import { fit, type FitResult, type TightsetOptions } from 'tightset'

const result = fit('Every Line Fills The Width', {
  width: 800,      // Required: box width in px
  height: 500,     // Required: box height in px
  fontFamily: 'Inter',  // Default: 'sans-serif'
  maxWeight: 900,       // Default: 900 — heaviest weight
  spread: 150,          // Default: 150 — weight range
  padX: 60,             // Default: 60 — horizontal padding
  padY: 40,             // Default: 40 — vertical padding
  gap: 20,              // Default: 20 — line gap
  maxLines: 8,          // Default: 8
  uppercase: true,      // Default: true
})

// result: { lines, sizes, weights, metrics, totalHeight } | null
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | — | Box width in pixels (required) |
| `height` | `number` | — | Box height in pixels (required) |
| `fontFamily` | `string` | `'sans-serif'` | Font family name — must be loaded |
| `padX` | `number` | `60` | Horizontal padding |
| `padY` | `number` | `40` | Vertical padding |
| `gap` | `number` | `20` | Pixel gap between lines |
| `maxWeight` | `number` | `900` | Heaviest font weight |
| `spread` | `number` | `150` | Weight range (heavy − light) |
| `maxLines` | `number` | `8` | Maximum line count |
| `uppercase` | `boolean` | `true` | Convert text to uppercase |

### FitResult

```ts
interface FitResult {
  lines: string[]       // Text per line
  sizes: number[]       // Font size per line (px)
  weights: number[]     // Font weight per line
  metrics: LineMetrics[] // { width, capTop, capBottom } per line
  totalHeight: number   // Total text block height
}
```

## Canvas Rendering

```ts
import { fit } from 'tightset'
import { draw, render } from 'tightset/canvas'

const result = fit('Hello World', { width: 800, height: 400, fontFamily: 'Inter' })

// Option 1: Full render onto a canvas element
render(canvas, result, {
  fontFamily: 'Inter',
  color: '#ffffff',
  background: '#0d0d0d',
  gap: 20,
  padY: 40,
  dpr: window.devicePixelRatio,
})

// Option 2: Draw at a specific position (for compositing)
draw(ctx, result, x, y, gap, { fontFamily: 'Inter', color: '#fff', align: 'center' })
```

## DOM / Tailwind Rendering

For CSS-styled output (Tailwind, CSS Modules, etc.):

```ts
import { fit } from 'tightset'
import { renderToHTML, renderToDOM, getLineStyles } from 'tightset/dom'

const result = fit('Make It Tight', { width: 800, height: 400, fontFamily: 'Inter' })

// HTML string (SSR, innerHTML, etc.)
const html = renderToHTML(result, {
  fontFamily: 'Inter',
  color: '#ffffff',
  containerClass: 'bg-black rounded-2xl overflow-hidden',
  lineClass: 'tracking-tight drop-shadow-lg',
})

// Mount into a DOM element
renderToDOM(document.getElementById('target'), result, {
  fontFamily: 'Inter',
  containerClass: 'bg-gradient-to-br from-purple-600 to-blue-500',
})

// Get style objects (for React/Vue JSX without canvas)
const styles = getLineStyles(result, { fontFamily: 'Inter', color: '#fff' })
```

## React Component

```tsx
import { Tightset } from 'tightset/react'

<Tightset
  text="Every Line Fills The Width"
  width={800}
  height={500}
  fontFamily="Inter"
  color="#ffffff"
  background="#0d0d0d"
  maxWeight={900}
  spread={150}
  className="rounded-2xl shadow-xl"
  onFit={(result) => console.log(result)}
/>
```

### React with Tailwind (DOM mode)

Use `getLineStyles` from `tightset/dom` for full Tailwind control:

```tsx
import { useMemo } from 'react'
import { fit } from 'tightset'
import { getLineStyles } from 'tightset/dom'

function TightsetTailwind({ text, width, height }) {
  const result = useMemo(() => fit(text, { width, height, fontFamily: 'Inter' }), [text])
  const styles = useMemo(() => result ? getLineStyles(result, { fontFamily: 'Inter' }) : [], [result])

  if (!result) return null
  return (
    <div className="flex flex-col justify-center items-center h-full bg-black rounded-2xl">
      {result.lines.map((line, i) => (
        <div key={i} style={styles[i]} className="tracking-tight drop-shadow-lg">
          {line}
        </div>
      ))}
    </div>
  )
}
```

## Svelte Component

```svelte
<script>
  import Tightset from 'tightset/svelte'
</script>

<Tightset
  text="Hello World"
  width={800}
  height={500}
  fontFamily="Inter"
  color="#ffffff"
  background="#0d0d0d"
  class="rounded-2xl"
/>
```

## Vue Component

```vue
<script setup>
import Tightset from 'tightset/vue'
</script>

<template>
  <Tightset
    text="Hello World"
    :width="800"
    :height="500"
    fontFamily="Inter"
    color="#ffffff"
    background="#0d0d0d"
    @fit="(r) => console.log(r)"
  />
</template>
```

### Vue with Tailwind (HTML mode)

The Vue component supports `mode="html"` for DOM rendering:

```vue
<Tightset
  text="Style Me With Tailwind"
  :width="800"
  :height="500"
  fontFamily="Inter"
  mode="html"
/>
```

## Node.js / SSR

tightset needs a Canvas 2D context for text measurement. In Node.js:

```ts
import { createCanvas } from 'canvas' // npm install canvas
import { setMeasureContext, fit } from 'tightset'

const canvas = createCanvas(1, 1)
setMeasureContext(canvas.getContext('2d'))

const result = fit('Server Side Text', { width: 800, height: 400, fontFamily: 'Inter' })
```

Or with OffscreenCanvas in workers:

```ts
import { setMeasureContext } from 'tightset'
const ctx = new OffscreenCanvas(1, 1).getContext('2d')
setMeasureContext(ctx)
```

## Fonts

tightset works best with **variable-weight fonts**. Recommended:

- **Inter** — Clean, geometric sans-serif (Google Fonts)
- **Geist** — Modern, by Vercel
- **Outfit** — Friendly geometric (Google Fonts)
- **Space Grotesk** — Technical feel (Google Fonts)

Load fonts before calling `fit()` — the browser needs them for accurate measurement.

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
```

Or in CSS:

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
}
```

## Import Map

| Import | Contents |
|--------|----------|
| `tightset` | Core `fit()`, `clearCache()`, `setMeasureContext()`, types |
| `tightset/canvas` | `draw()`, `render()` for Canvas 2D |
| `tightset/dom` | `renderToHTML()`, `renderToDOM()`, `getLineStyles()` for Tailwind/CSS |
| `tightset/react` | `<Tightset>` React component + re-exported core |
| `tightset/svelte` | `<Tightset>` Svelte component |
| `tightset/vue` | `<Tightset>` Vue component |

## Tips

- Call `clearCache()` if you change fonts at runtime
- The `spread` option controls visual contrast — set to `0` for uniform weight
- `maxWeight: 900, spread: 150` gives weights from 750–900 (subtle hierarchy)
- `maxWeight: 900, spread: 500` gives weights from 400–900 (dramatic hierarchy)
- For OG images, a good starting point is `width: 1200, height: 630, padX: 80, padY: 60`
- For Instagram squares: `width: 1080, height: 1080, padX: 80, padY: 80`