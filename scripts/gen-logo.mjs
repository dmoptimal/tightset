/**
 * Generate the tightset logo SVG.
 * 
 * Since Node.js has no canvas for text measurement, we compute the layout
 * manually using known Inter font metrics. The concept matches what the
 * engine would produce: two lines, wider line gets heavier weight.
 * 
 * Run: node scripts/gen-logo.mjs > docs/logo.svg
 */

const W = 400
const H = 400
const PAD = 40
const GAP = 16
const RADIUS = 32
const BG = '#0a0a0a'
const FG = '#ffffff'
const STROKE = '#222'
const FONT = 'Inter, system-ui, sans-serif'

// Two lines: TIGHT (5 chars) and SET (3 chars)
// Both fill the full width. SET has fewer chars → bigger font → heavier weight.
// This matches engine behavior: larger font size = heavier weight.
//
// Inter caps width ratios (approximate):
// Weight 700: ~0.60× font-size per cap
// Weight 900: ~0.62× font-size per cap

const innerW = W - PAD * 2  // 320px available
const innerH = H - PAD * 2

// Size each line to fill the width
const tightSize = innerW / (5 * 0.60)  // ~107 — smaller, lighter
const setSize = innerW / (3 * 0.62)    // ~172 — bigger, heavier

// Cap height is roughly 0.72× font-size for Inter
const tightCapH = tightSize * 0.72
const setCapH = setSize * 0.72

const totalH = tightCapH + GAP + setCapH
const startY = PAD + (innerH - totalH) / 2

const tightBaseline = startY + tightCapH
const setBaseline = tightBaseline + GAP + setCapH

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="${RADIUS}" fill="${BG}" stroke="${STROKE}" stroke-width="2"/>
  <text x="${W / 2}" y="${Math.round(tightBaseline)}" text-anchor="middle" font-family="${FONT}" font-size="${Math.round(tightSize)}" font-weight="700" fill="${FG}" letter-spacing="-0.03em">TIGHT</text>
  <text x="${W / 2}" y="${Math.round(setBaseline)}" text-anchor="middle" font-family="${FONT}" font-size="${Math.round(setSize)}" font-weight="900" fill="${FG}" letter-spacing="-0.03em">SET</text>
</svg>
`

process.stdout.write(svg)
