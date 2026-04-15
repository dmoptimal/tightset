# tightset

Variable-weight text fitting engine. Fills any rectangle with kinetic typography — every line stretches to fill the width, with heavier weight on larger lines.

Works with any variable-weight font. Ships with React, Svelte, Vue, vanilla Canvas, and DOM/Tailwind renderers.

![tightset demo](demo/screenshot.png)

## Install

```bash
npm install tightset
```

## Quick Start

```ts
import { fit } from 'tightset'
import { render } from 'tightset/canvas'

const result = fit('Do All Tattoos Fade The Same?', {
  width: 800,
  height: 500,
  fontFamily: 'Inter',
})

render(document.querySelector('canvas'), result, {
  fontFamily: 'Inter',
  color: '#ffffff',
  background: '#0d0d0d',
})
```

## Packages

| Import | What |
|--------|------|
| `tightset` | Core engine: `fit()`, `clearCache()`, `setMeasureContext()` |
| `tightset/canvas` | Canvas 2D `draw()` and `render()` |
| `tightset/dom` | `renderToHTML()`, `renderToDOM()`, `getLineStyles()` — for Tailwind/CSS |
| `tightset/react` | `<Tightset>` React component |
| `tightset/svelte` | `<Tightset>` Svelte component |
| `tightset/vue` | `<Tightset>` Vue component |

## React

```tsx
import { Tightset } from 'tightset/react'

<Tightset
  text="Make It Tight"
  width={800}
  height={500}
  fontFamily="Inter"
  color="#fff"
  background="#000"
/>
```

## Tailwind / DOM

```ts
import { fit } from 'tightset'
import { renderToHTML } from 'tightset/dom'

const result = fit('Style Me', { width: 800, height: 400, fontFamily: 'Inter' })
const html = renderToHTML(result, {
  fontFamily: 'Inter',
  containerClass: 'bg-black rounded-2xl',
  lineClass: 'tracking-tight drop-shadow-lg',
})
```

Or get style objects for JSX:

```tsx
import { getLineStyles } from 'tightset/dom'

const styles = getLineStyles(result, { fontFamily: 'Inter' })
result.lines.map((line, i) => <div style={styles[i]} className="drop-shadow-lg">{line}</div>)
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `width` | — | Box width (px, required) |
| `height` | — | Box height (px, required) |
| `fontFamily` | `'sans-serif'` | Font family name |
| `padX` | `60` | Horizontal padding |
| `padY` | `40` | Vertical padding |
| `gap` | `20` | Line gap |
| `maxWeight` | `900` | Heaviest font weight |
| `spread` | `150` | Weight range (heavy − light) |
| `maxLines` | `8` | Max lines |
| `uppercase` | `true` | Uppercase transform |

## Node.js / SSR

```ts
import { createCanvas } from 'canvas'
import { setMeasureContext, fit } from 'tightset'

setMeasureContext(createCanvas(1, 1).getContext('2d'))
const result = fit('Server Side', { width: 800, height: 400 })
```

## Demo

**[Live demo → dmoptimal.github.io/tightset](https://dmoptimal.github.io/tightset/)**

Or run locally:

```bash
# From the repo root
npx serve .
# Open http://localhost:3000/demo/
```

## License

MIT
