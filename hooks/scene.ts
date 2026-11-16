import { snowPinesSvg } from './pines'
// Claude Christmas: a tree set in code glyphs with spark ornaments, a cabin in the snow, a prompt typing its greeting, snow in characters.
// Clawd is all over it: delivering presents by sled, popping out of the chimney, sledding off the roof, in a snowball fight,
// and riding the sleigh, which drops presents by parachute. Every act runs on a clock of its own length, so the scene
// as a whole does not come round to the same picture.
// Claude's own warm dark, cream and terracotta. A dark-window scene.
// Pure string building: no DOM, nothing read from outside, the same string on every call.

const WIDTH = 1600
const HEIGHT = 1000

const INK = '#1f1e1d'
const CREAM = '#faf9f5'
const CLAY = '#d97757'
const GOLD = '#e8b86d'
const SAGE = '#8fb996'
const LIGHTS: readonly string[] = [CLAY, CREAM, GOLD, SAGE]

const CELL_WIDTH = 16
const CELL_HEIGHT = 20

interface Mark {
  x: number
  y: number
  glyph: string
}

/** A seeded generator, so every build is the same picture. */
function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function n(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

function escapeGlyph(glyph: string): string {
  return glyph === '<' ? '&lt;' : glyph === '>' ? '&gt;' : glyph === '&' ? '&amp;' : glyph
}

/** ONE text element for a list of glyphs, each at its own x and y, so the grid holds whatever the font. */
function glyphs(list: readonly Mark[], size: number, colour: string, opacity: number, attributes = ''): string {
  if (list.length === 0) return ''
  const xs = list.map(mark => Math.round(mark.x)).join(' ')
  const ys = list.map(mark => Math.round(mark.y)).join(' ')
  const text = list.map(mark => escapeGlyph(mark.glyph)).join('')
  // One class attribute only: a second one makes the document invalid XML, and the app then shows it as a still picture.
  const classes = attributes.includes('class=') ? '' : ' class="g"'
  return `<text${classes} x="${xs}" y="${ys}" fill="${colour}" fill-opacity="${opacity}" font-size="${size}"${attributes}>${text}</text>`
}

/** A twinkle about x,y: a four-armed glint with shorter diagonals, one stroked path. */
function spark(x: number, y: number, radius: number, colour: string, _seed: number, classes: string, _rays?: number): string {
  const r = n(radius)
  const d = n(radius * 0.5)
  return `<path class="${classes}" transform="translate(${n(x)} ${n(y)})" d="M-${r} 0H${r}M0 -${r}V${r}M-${d} -${d}L${d} ${d}M-${d} ${d}L${d} -${d}" fill="none" stroke="${colour}" stroke-width="${n(radius * 0.2)}" stroke-linecap="round"/>`
}

/** [turn off its even place in degrees, reach] of each ray of Claude's mark: uneven on purpose, as the mark is hand-drawn. */
const RAYS: ReadonlyArray<readonly [number, number]> = [
  [0, 100], [4, 78], [-3, 94], [5, 72], [-2, 98], [3, 80], [-5, 92], [2, 74], [-4, 100], [4, 82], [-2, 90], [3, 76],
]

/**
 * Claude's mark about 0,0 and a hundred units out, as one filled shape: twelve solid rays, each a little wider at its
 * rounded end than at the middle, where they run together.
 */
function mark(): string {
  let path = ''
  RAYS.forEach(([turn, reach], index) => {
    const angle = ((index * 30 + turn - 90) * Math.PI) / 180
    const at = (along: number, across: number): string =>
      `${n(Math.cos(angle) * along - Math.sin(angle) * across)} ${n(Math.sin(angle) * along + Math.cos(angle) * across)}`
    path += `M${at(0, -5)}L${at(reach - 8, -8.5)}Q${at(reach + 5, 0)} ${at(reach - 8, 8.5)}L${at(0, 5)}z`
  })
  return path
}

const APEX = 13
const TOP = 17
const ROWS = 27
const INSIDE = '01{}();=<>[]:+01'

function halfWidthAt(row: number): number {
  if (row === 0) return 0
  return Math.max(1, Math.round(row * 0.3 + ((row - 1) % 6) * 0.6))
}

/** The tree: a ground of dark fir behind every cell, slashes at the bough ends, code inside, sparks hung as ornaments. */
function tree(): string {
  const random = seeded(41)
  const edge: Mark[] = []
  const lit: Mark[] = []
  const dim: Mark[] = []
  const dust: Mark[] = []
  let ground = ''
  let hung = ''
  let count = 0
  for (let row = 0; row < ROWS; row += 1) {
    const half = halfWidthAt(row)
    const top = (TOP + row) * CELL_HEIGHT
    ground += `M${(APEX - half) * CELL_WIDTH} ${top}h${(half * 2 + 1) * CELL_WIDTH}v${CELL_HEIGHT}h-${(half * 2 + 1) * CELL_WIDTH}z`
    for (let offset = -half; offset <= half; offset += 1) {
      const x = (APEX + offset) * CELL_WIDTH + CELL_WIDTH / 2
      const y = top + 16
      const pick = random()
      if (row === 0) continue
      if (offset === -half) edge.push({ x, y, glyph: '/' })
      else if (offset === half) edge.push({ x, y, glyph: '\\' })
      else if (pick < 0.075 && row > 2 && Math.abs(offset) < half - 0) {
        const colour = LIGHTS[count % 3] ?? CLAY
        hung += count % 2 === 0
          ? `<use href="#mark" class="tw b${count % 5}" fill="${colour}" transform="translate(${n(x)} ${n(y - 6)}) rotate(${count * 37}) scale(.13)"/>`
          : `<g class="tw b${count % 5}"><rect x="${n(x - 2)}" y="${n(y - 16)}" width="4" height="4" fill="${GOLD}"/><circle cx="${n(x)}" cy="${n(y - 6)}" r="7" fill="${colour === CREAM ? HAT_RED : colour}"/><circle cx="${n(x - 2.5)}" cy="${n(y - 8.5)}" r="2" fill="${CREAM}" fill-opacity=".8"/></g>`
        count += 1
      } else if (pick < 0.13) dust.push({ x, y, glyph: '*' })
      else {
        const glyph = INSIDE[Math.floor(random() * INSIDE.length)] ?? '0'
        ;(offset > half * 0.25 && pick > 0.55 ? lit : dim).push({ x, y, glyph })
      }
    }
  }
  const trunkTop = (TOP + ROWS) * CELL_HEIGHT
  const trunk: Mark[] = [0, 1].map(row => ({ x: APEX * CELL_WIDTH + CELL_WIDTH / 2, y: trunkTop + row * CELL_HEIGHT + 16, glyph: '#' }))
  const starX = APEX * CELL_WIDTH + CELL_WIDTH / 2
  const starY = TOP * CELL_HEIGHT + 2
  let tiers = ''
  let strings = ''
  let bulb = 0
  for (const row of [6, 12, 18, 24]) {
    const half = halfWidthAt(row)
    const under = halfWidthAt(row + 1)
    const top = (TOP + row) * CELL_HEIGHT
    const left = (APEX - half) * CELL_WIDTH
    const right = (APEX + half + 1) * CELL_WIDTH
    tiers += `<rect x="${(APEX - under) * CELL_WIDTH}" y="${top + CELL_HEIGHT}" width="${(under * 2 + 1) * CELL_WIDTH}" height="8" fill="#0d0c0b" fill-opacity=".3"/>`
    // A string of lights swagged across the tier.
    const y = top - 6
    const sag = 20 + half * 1.6
    strings += `<path d="M${left + 8} ${y}Q${starX} ${n(y + sag * 2)} ${right - 8} ${y}" fill="none" stroke="#1c1b1a" stroke-opacity=".7" stroke-width="1.6"/>`
    const bulbs = half + 2
    for (let index = 0; index < bulbs; index += 1) {
      const t = (index + 0.5) / bulbs
      const x = (1 - t) * (1 - t) * (left + 8) + 2 * (1 - t) * t * starX + t * t * (right - 8)
      const drop = 2 * (1 - t) * t * sag * 2
      strings += `<circle class="tw b${bulb % 5}" cx="${n(x)}" cy="${n(y + drop + 3)}" r="3.6" fill="${LIGHTS[bulb % LIGHTS.length] ?? GOLD}"/>`
      bulb += 1
    }
  }
  const skirtY = trunkTop + CELL_HEIGHT * 2
  return shade(starX, skirtY + 1, 60) + `<rect x="${APEX * CELL_WIDTH - 7}" y="${trunkTop}" width="${CELL_WIDTH + 14}" height="${CELL_HEIGHT * 2}" fill="#3a2c22"/><rect x="${APEX * CELL_WIDTH - 7}" y="${trunkTop}" width="9" height="${CELL_HEIGHT * 2}" fill="#0d0c0b" fill-opacity=".3"/>` +
    `<path d="${ground}" fill="url(#fir)"/>` + tiers +
    glyphs(dim, 17, '#5f7d66', 1) + glyphs(lit, 17, '#9fc0a3', 1) + glyphs(edge, 18, '#c5dcc4', 1) +
    glyphs(dust, 17, CREAM, 0.85, ' class="g tw b2"') + strings + hung +
    `<g transform="translate(${starX} ${starY - 8}) scale(.36)"><use href="#mark" class="spin" fill="${CLAY}"/></g>`
}

/** A wrapped present, five cells wide and three tall from its column and row: box, lid, ribbon and bow. */
function present(column: number, row: number, frame: string, ribbon: string): string {
  const x = column * CELL_WIDTH + 4
  const y = row * CELL_HEIGHT + 6
  const width = 5 * CELL_WIDTH - 8
  const height = 3 * CELL_HEIGHT - 12
  const middle = x + width / 2
  return shade(middle, y + height - 1, width * 0.56) +
    `<rect x="${x + 3}" y="${y + 14}" width="${width - 6}" height="${height - 14}" fill="${frame}"/><rect x="${x + width - 22}" y="${y + 14}" width="19" height="${height - 14}" fill="#0d0c0b" fill-opacity=".2"/>` +
    `<rect x="${x}" y="${y + 4}" width="${width}" height="12" rx="2" fill="${frame}"/><rect x="${x}" y="${y + 13}" width="${width}" height="3" fill="#0d0c0b" fill-opacity=".22"/><rect x="${x + 3}" y="${y + 6}" width="${width - 6}" height="2" fill="${CREAM}" fill-opacity=".3"/>` +
    `<rect x="${middle - 5}" y="${y + 4}" width="10" height="${height - 4}" fill="${ribbon}"/>` +
    `<path d="M${middle - 4} ${y - 4}h-8v-4h-8v12h12v-4h4zM${middle + 4} ${y - 4}h8v-4h8v12h-12v-4h-4z" fill="${ribbon}"/><rect x="${middle - 4}" y="${y - 4}" width="8" height="10" fill="${ribbon}"/>`
}

/** A present on the ground at a column, let down onto the snow there and a little into it. */
function settled(column: number, inner: string): string {
  return `<g transform="translate(0 ${n(sink(column))})">${inner}</g>`
}

function sink(column: number): number {
  return groundCrest(column * CELL_WIDTH + 40) + 7 - (43 * CELL_HEIGHT + 54)
}

function groundCrest(x: number): number {
  return 916 + Math.sin(x * 0.004 + 0.8) * 9
}

/** What stands on the snow casts a soft shadow on it, so it stands and does not float. */
function shade(x: number, y: number, radius: number): string {
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(radius)}" ry="${n(radius * 0.2)}" fill="#0d0c0b" fill-opacity=".34"/>`
}

function bankCrest(x: number): number {
  return 1012 + Math.sin(x * 0.0055 + 2.1) * 8
}

/** The snow on the ground: a field lit along its crest that falls away into the dark, a second drift nearer, and sparkle set in characters. */
function ground(): string {
  const random = seeded(67)
  let line = `M-1800 ${n(groundCrest(-1800))}`
  let near = `M-1800 ${n(groundCrest(-1800) + 34)}`
  for (let x = -1720; x <= WIDTH + 1800; x += 80) {
    line += `L${x} ${n(groundCrest(x))}`
    near += `L${x} ${n(groundCrest(x) + 34 + Math.sin(x * 0.009) * 5)}`
  }
  const crest: Mark[] = []
  const body: Mark[] = []
  const far: Mark[] = []
  for (let x = -420; x < WIDTH + 420; x += 15) {
    const pick = random()
    if (pick < 0.7) crest.push({ x, y: groundCrest(x) + 3, glyph: '_-~_.-'[Math.floor(random() * 6)] ?? '_' })
    if (pick > 0.55) body.push({ x, y: groundCrest(x) + 16 + random() * 34, glyph: ".,'*."[Math.floor(random() * 5)] ?? '.' })
    if (pick > 0.3 && pick < 0.62) far.push({ x: x + 6, y: groundCrest(x) + 56 + random() * 150, glyph: ".'*.,+"[Math.floor(random() * 6)] ?? '.' })
  }
  let piles = ''
  for (const [x, size] of [[-160, 7], [90, 6], [262, 8], [500, 5], [742, 7], [1004, 6], [1190, 5], [1404, 8], [1530, 6], [1760, 7]] as const) {
    const y = Math.round(groundCrest(x) + 5)
    piles += `<path d="M${x - 5 * size} ${y}h${10 * size}v${-size}h${-size}v${-size}h${-2 * size}v${-size}h${-3 * size}v${size}h${-2 * size}v${size}h${-2 * size}z" fill="#e6e1d3"/>` +
      `<path d="M${x - 5 * size} ${y}h${10 * size}v${-size}h${-10 * size}z" fill="#0d0c0b" fill-opacity=".1"/>`
  }
  return `<path d="${line}V${HEIGHT + 900}H-1800z" fill="url(#snowfield)"/><path d="${line}" fill="none" stroke="#f4f1e8" stroke-opacity=".9" stroke-width="4"/>${piles}` +
    `<path d="${near}" fill="none" stroke="${CREAM}" stroke-opacity=".13" stroke-width="2"/>` +
    glyphs(crest, 15, CREAM, 0.75) + glyphs(body, 13, CREAM, 0.4, ' class="g tw b3"') + glyphs(far, 13, CREAM, 0.26, ' class="g tw b1"')
}

/** The nearest drift, in front of everyone: it hides nobody's feet and gives the front of the scene an edge. */
function foreBank(): string {
  const random = seeded(71)
  let line = `M-1800 ${n(bankCrest(-1800))}`
  for (let x = -1720; x <= WIDTH + 1800; x += 80) line += `L${x} ${n(bankCrest(x))}`
  const crest: Mark[] = []
  const body: Mark[] = []
  for (let x = -420; x < WIDTH + 420; x += 17) {
    const pick = random()
    if (pick < 0.6) crest.push({ x, y: bankCrest(x) + 3, glyph: '_~-_.'[Math.floor(random() * 5)] ?? '_' })
    if (pick > 0.5) body.push({ x, y: bankCrest(x) + 18 + random() * 90, glyph: "*.'+."[Math.floor(random() * 5)] ?? '.' })
  }
  return `<path d="${line}V${HEIGHT + 900}H-1800z" fill="url(#bank)"/><path d="${line}" fill="none" stroke="${CREAM}" stroke-opacity=".34" stroke-width="2.5"/>` +
    glyphs(crest, 15, CREAM, 0.55) + glyphs(body, 14, CREAM, 0.3, ' class="g tw b2"')
}

/** Swags of lights hung across the top of the window, in Claude's own colours. */
function garland(): string {
  const swags = 8
  const span = WIDTH / swags
  let wire = 'M0 -4'
  // The bulbs are gathered by colour and twinkle, so each is one short circle: its glow is its own wide, faint stroke.
  const sets = new Map<string, string>()
  for (let swag = 0; swag < swags; swag += 1) {
    const from = swag * span
    const dip = 46 + (swag % 2) * 12
    wire += `Q${n(from + span / 2)} ${dip * 2 + 4} ${n(from + span)} -4`
    for (let step = 1; step <= 6; step += 1) {
      const t = step / 7
      const x = from + span * t
      const y = 6 + (dip * 2 + 8) * 2 * t * (1 - t)
      const colour = LIGHTS[(step + swag) % LIGHTS.length] ?? CLAY
      const set = `<g class="tw b${(step + swag * 3) % 5}" fill="${colour}" stroke="${colour}" stroke-opacity=".16" stroke-width="9">`
      sets.set(set, `${sets.get(set) ?? ''}<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="5"/>`)
    }
  }
  return `<path d="${wire}" fill="none" stroke="#4a4842" stroke-width="2"/>${[...sets].map(([open, bulbs]) => `${open}${bulbs}</g>`).join('')}`
}

/** A layer of snow in characters: the flakes twice over, a screen apart, so the fall loops with no seam. */
/** A few real flakes close to the glass: six arms each, each its own size and turn, falling as one layer. */
function flakes(seed: number, count: number, seconds: number, sway: number): string {
  const random = seeded(seed)
  let out = ''
  for (let index = 0; index < count; index += 1) {
    out += `<use href="#flake" opacity="${n(0.45 + random() * 0.4)}" transform="translate(${n(random() * (WIDTH + 80) - 40)} ${n(random() * HEIGHT)}) rotate(${Math.round(random() * 60)}) scale(${n(0.7 + random() * 0.9)})"/>`
  }
  return `<g style="animation:fall ${seconds}s linear infinite,sway ${sway}s ease-in-out infinite alternate"><g id="f${seed}">${out}</g><use href="#f${seed}" y="${-HEIGHT}"/></g>`
}

function snow(seed: number, count: number, size: number, opacity: number, seconds: number, sway: number, set: string): string {
  const random = seeded(seed)
  const flakes: Mark[] = []
  for (let index = 0; index < count; index += 1) {
    const x = random() * (WIDTH + 80) - 40
    const y = random() * HEIGHT
    const glyph = set[Math.floor(random() * set.length)] ?? '.'
    flakes.push({ x, y, glyph })
  }
  return `<g class="sn${seed}" style="animation:fall ${seconds}s linear infinite,sway ${sway}s ease-in-out infinite alternate">${glyphs(flakes, size, CREAM, opacity, ` id="s${seed}"`)}<use href="#s${seed}" y="${-HEIGHT}"/></g>`
}

const CABIN_COLUMN = 73
const CABIN_CENTRE = CABIN_COLUMN + 7
const WALL_TOP = 41
const LOG = '#33261d'

/** A cabin on the same grid as the tree: a snowed gable, log walls, two lit windows, lights under the eave, smoke in characters. */
function cabin(): string {
  const random = seeded(73)
  const left = CABIN_COLUMN * CELL_WIDTH
  const wallTop = WALL_TOP * CELL_HEIGHT
  const chimney = (CABIN_CENTRE + 4) * CELL_WIDTH
  let out = `<ellipse class="pulse" cx="${left + 120}" cy="${wallTop + 112}" rx="250" ry="36" fill="url(#spill)"/>`
  for (let puff = 0; puff < 6; puff += 1) {
    out += `<text class="g smoke" x="${chimney + 16}" y="${wallTop - 128}" font-size="${18 + (puff % 3) * 4}" fill="${CREAM}" style="animation-delay:-${n(puff * 1.6)}s">${'~.*'[puff % 3]}</text>`
  }
  out += `<rect x="${chimney}" y="${wallTop - 120}" width="32" height="70" fill="#43332a"/><rect x="${chimney - 4}" y="${wallTop - 127}" width="40" height="11" rx="5.5" fill="#e6e1d3"/>`
  const eave: Mark[] = []
  const drift: Mark[] = []
  const ridge = (CABIN_CENTRE + 0.5) * CELL_WIDTH
  out += `<path d="M${ridge} ${wallTop - 92}L${ridge + 150} ${wallTop - 14}v14H${ridge - 150}v-14z" fill="#e6e1d3"/><path d="M${ridge - 150} ${wallTop - 8}h300v8h-300z" fill="#b5af9f"/>`
  for (let tier = 0; tier < 4; tier += 1) {
    const row = WALL_TOP - 4 + tier
    const half = 2 + tier * 2
    for (let offset = -half; offset <= half; offset += 1) {
      const mark = { x: (CABIN_CENTRE + offset) * CELL_WIDTH + CELL_WIDTH / 2, y: row * CELL_HEIGHT + 16, glyph: offset === -half ? '/' : offset === half ? '\\' : '_~.'[Math.floor(random() * 3)] ?? '_' }
      if (Math.abs(offset) === half) continue
      else if (random() < 0.4) drift.push(mark)
    }
  }
  out += glyphs(drift, 17, '#a39e90', 1) + glyphs(eave, 18, '#6f6a5f', 1)
  out += `<rect x="${left}" y="${wallTop}" width="${15 * CELL_WIDTH}" height="${5 * CELL_HEIGHT}" fill="${LOG}"/>`
  const logs: Mark[] = []
  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 15; column += 1) {
      const isWindow = (row === 1 || row === 2) && (column === 2 || column === 3 || column === 11 || column === 12)
      const isDoor = row >= 2 && column >= 6 && column <= 8
      if (!isWindow && !isDoor) logs.push({ x: left + column * CELL_WIDTH + CELL_WIDTH / 2, y: wallTop + row * CELL_HEIGHT + 15, glyph: '=' })
    }
  }
  out += glyphs(logs, 18, '#66503f', 1)
  for (const column of [2, 11]) {
    const x = left + column * CELL_WIDTH
    const y = wallTop + CELL_HEIGHT
    out += `<circle class="pulse" cx="${x + 16}" cy="${y + 20}" r="52" fill="url(#pane)"/><rect class="pulse" x="${x}" y="${y}" width="32" height="40" fill="${GOLD}"/><path d="M${x + 16} ${y}v40M${x} ${y + 20}h32" stroke="${LOG}" stroke-width="2.5"/>`
  }
  const door = left + 6 * CELL_WIDTH
  out += `<rect x="${door}" y="${wallTop + 40}" width="48" height="60" fill="#8a4a33"/><circle cx="${door + 24}" cy="${wallTop + 60}" r="9" fill="none" stroke="${SAGE}" stroke-width="4.5" stroke-dasharray="3 2.2"/><circle cx="${door + 24}" cy="${wallTop + 68.5}" r="2.6" fill="${CLAY}"/><circle cx="${door + 39}" cy="${wallTop + 74}" r="2.2" fill="${GOLD}"/>`
  const from = (CABIN_CENTRE - 8) * CELL_WIDTH + 10
  for (let light = 0; light < 10; light += 1) {
    const x = from + light * ((17 * CELL_WIDTH - 20) / 9)
    const colour = LIGHTS[light % LIGHTS.length] ?? CLAY
    out += `<g class="tw b${light % 5}"><circle cx="${n(x)}" cy="${wallTop + 6}" r="8" fill="${colour}" fill-opacity=".2"/><circle cx="${n(x)}" cy="${wallTop + 6}" r="3.6" fill="${colour}"/></g>`
  }
  return out
}

/** A small pine in characters on a finer grid, for the stand around the cabin. */
function smallPine(x: number, base: number, rows: number, cellWidth: number, cellHeight: number, seed: number): string {
  const random = seeded(seed)
  const edge: Mark[] = []
  const inner: Mark[] = []
  const dust: Mark[] = []
  let body = ''
  for (let row = 0; row < rows; row += 1) {
    const half = row === 0 ? 0 : Math.max(1, Math.round(row * 0.3 + ((row - 1) % 4) * 0.5))
    const top = base - (rows - row + 1) * cellHeight
    body += `M${n(x - (half + 0.5) * cellWidth)} ${n(top)}h${n((half * 2 + 1) * cellWidth)}v${cellHeight}h-${n((half * 2 + 1) * cellWidth)}z`
    for (let offset = -half; offset <= half; offset += 1) {
      const mark = { x: x + offset * cellWidth, y: top + cellHeight * 0.8, glyph: '^' }
      const pick = random()
      if (row === 0) edge.push(mark)
      else if (offset === -half) edge.push({ ...mark, glyph: '/' })
      else if (offset === half) edge.push({ ...mark, glyph: '\\' })
      else if (pick < 0.16) dust.push({ ...mark, glyph: '*' })
      else inner.push({ ...mark, glyph: ".:;'"[Math.floor(random() * 4)] ?? '.' })
    }
  }
  const size = Math.round(cellHeight * 0.9)
  return `<path d="${body}" fill="#222d25"/><rect x="${n(x - cellWidth / 2)}" y="${n(base - cellHeight)}" width="${cellWidth}" height="${cellHeight}" fill="#3a2c22"/>` +
    glyphs(inner, size, '#4f6a56', 1) + glyphs(edge, size, '#8fae94', 1) + glyphs(dust, size, CREAM, 0.85)
}

const MESSAGES: readonly string[] = [
  '$ claude --season christmas',
  '$ echo "ho ho ho"',
  '$ git commit -m "be merry"',
  '$ npm install joy',
  '$ sudo make cookies',
  '$ ping north-pole',
]
const MESSAGE_SECONDS = 12
const TYPE_SECONDS = MESSAGES.length * MESSAGE_SECONDS

/** One prompt line set in the snow under the cabin: it types a line, holds it, clears it, and types the next of six. */
function greeting(x: number, y: number): string {
  const step = 10.4
  let out = ''
  MESSAGES.forEach((message, which) => {
    const first = ` m${which}`
    const delay = `animation-delay:${which * MESSAGE_SECONDS - TYPE_SECONDS}s`
    const marks: Mark[] = []
    for (let index = 1; index < message.length; index += 1) {
      const glyph = message[index] ?? ' '
      if (glyph !== ' ') marks.push({ x: x + index * step, y, glyph })
    }
    // The line is whole from the start; a cover the colour of the snow slides off it a character at a time, the cursor on its edge.
    out += `<g class="ch${first}" style="${delay}">${glyphs([{ x, y, glyph: '$' }], 17, CLAY, 1)}${glyphs(marks, 17, '#cfcabd', 1)}` +
      `<g class="wipe" style="--w:${n(message.length * step)}px;${delay};animation-timing-function:steps(${message.length},end)">` +
      `<rect x="${x - 6}" y="${y - 16}" width="420" height="23" fill="${INK}"/><rect class="blink" x="${x - 4}" y="${y - 15}" width="9" height="18" fill="${CLAY}"/></g></g>`
  })
  // A wooden sign planted in the snow, a terminal for a board, holds the line, so the cover that types it is never seen past its edge.
  const width = Math.max(...MESSAGES.map(message => message.length)) * step + 44
  const chip = `x="${x - 22}" y="${y - 27}" width="${n(width)}" height="42" rx="9"`
  const [left, top, wide] = [x - 30, y - 35, Math.round(width) + 16]
  const wood = '#7a5234'
  // Two posts, the frame, and snow settled along its top in steps.
  const stand = shade(left + wide / 2, y + 52, wide * 0.44) +
    `<path d="M${left + 28} ${y + 20}h12v32h-12zM${left + wide - 40} ${y + 20}h12v32h-12z" fill="#5a3d28"/>` +
    `<rect x="${left}" y="${top}" width="${wide}" height="58" fill="${wood}"/><path d="M${left} ${top + 50}h${wide}v8h${-wide}z" fill="#0d0c0b" fill-opacity=".25"/>` +
    `<path d="M${left - 4} ${top}h${wide + 8}v-4h-12v-4h-${Math.round(wide * 0.3)}v-4h-${Math.round(wide * 0.25)}v4h-${Math.round(wide * 0.2)}v4h${-(wide - 4 - Math.round(wide * 0.3) - Math.round(wide * 0.25) - Math.round(wide * 0.2))}z" fill="${HAT_WHITE}"/>`
  return `${stand}<clipPath id="chip"><rect ${chip}/></clipPath><rect ${chip} fill="${INK}"/><g clip-path="url(#chip)">${out}</g>`
}

const HAT_RED = '#e0524a'
const HAT_WHITE = '#f4f1e8'

/** What every Clawd shares, a pixel to the unit, and what every dropped present shares: each svg that draws them carries this in its defs. */
const SHARED_DEFS =
  `<path id="mark" d="${mark()}"/>` +
  `<path id="flake" fill="none" stroke="${CREAM}" stroke-width="1.5" stroke-linecap="round" d="M0 -9V9M-7.8 -4.5L7.8 4.5M-7.8 4.5L7.8 -4.5M-2.5 -6.5L0 -4.5L2.5 -6.5M-2.5 6.5L0 4.5L2.5 6.5M-6.9 -1L-3.9 -2.2L-4.4 -5.4M6.9 1L3.9 2.2L4.4 5.4M-6.9 1L-3.9 2.2L-4.4 5.4M6.9 -1L3.9 -2.2L4.4 -5.4"/>` +
  `<path id="eyes" fill="#1c1b1a" d="M2 2h1v2h-1zM9 2h1v2h-1z"/><path id="antlers" fill="#9a6b45" d="M2 -2h1v2h-1zM1 -3h1v1h-1zM3 -3h1v1h-1zM9 -2h1v2h-1zM8 -3h1v1h-1zM10 -3h1v1h-1z"/>` +
  `<g id="hat"><path fill="${HAT_RED}" d="M2 -1h8v1h-8zM3 -2h7v1h-7zM5 -3h6v1h-6zM8 -4h4v1h-4z"/><path fill="${HAT_WHITE}" d="M1 0h10v1h-10zM11 -4h2v2h-2z"/></g>` +
  `<path id="canopy" d="M-26 -66q26 -30 52 0q-13 -7 -26 0q-13 -7 -26 0z"/><path id="cords" d="M-26 -66L-13 -30M26 -66L13 -30M0 -66V-30" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.2"/>` +
  `<path id="ribbon" fill="${CREAM}" d="M-3 -30h6v30h-6zM-17 -18h34v5h-34zM-3 -34h-6v-3h-6v9h9v-3h3zM3 -34h6v-3h6v9h-9v-3h-3z"/>`

interface ClawdLook {
  body?: string
  legs?: string
  arms?: string
  antlers?: boolean
  /** Nothing on his head. */
  bare?: boolean
  nose?: boolean
}

/**
 * Clawd in pixels, his body's top-left corner at 0,0 and `u` to a pixel: a 12 x 8 body, 1 x 2 eyes, 2 x 2 arms halfway down,
 * four 1 x 2 legs in two pairs that step in turn. He wears a santa hat, or antlers where he pulls the sleigh.
 */
function clawd(u: number, look: ClawdLook = {}): string {
  const body = look.body ?? CLAY
  // Every pixel of one colour and one motion is a box in the same path.
  const boxes = (fill: string, cells: ReadonlyArray<readonly [number, number, number, number]>, classes = ''): string =>
    `<path${classes === '' ? '' : ` class="${classes}"`} fill="${fill}" d="${cells.map(([x, y, width, height]) => `M${n(x * u)} ${n(y * u)}h${n(width * u)}v${n(height * u)}h${n(-width * u)}z`).join('')}"/>`
  const legs = look.legs ?? ''
  // The parts that are the same on every Clawd are drawn once, a pixel to the unit, in CLAWD_DEFS, and used here to scale.
  const used = (id: string): string => `<use href="#${id}" transform="scale(${u})"/>`
  const top = look.antlers === true ? used('antlers') : look.bare === true ? '' : `<g class="hat">${used('hat')}</g>`
  return boxes(body, [[1, 8, 1, 2], [8, 8, 1, 2]], legs) + boxes(body, [[3, 8, 1, 2], [10, 8, 1, 2]], legs === '' ? '' : legs.endsWith(' off') ? legs.slice(0, -4) : `${legs} off`) +
    boxes(body, [[-2, 3, 2, 2], [12, 3, 2, 2]], look.arms ?? '') +
    boxes(body, [[0, 0, 12, 8]]) + used('eyes') +
    (look.nose === true ? boxes(HAT_RED, [[5.5, 4, 1, 1]]) : '') + top
}

const WALK_SECONDS = 61
const DOOR_X = 1252
const DROP_X = 794
const PLAY_X = 1150
const WALKER_Y = 860

const TRIPS: ReadonlyArray<readonly [box: string, ribbon: string]> = [[GOLD, CLAY], [HAT_RED, CREAM], [SAGE, CREAM]]

/** The present of each of three trips in turn, so no two deliveries in a row bring the same one. */
// How far below its own origin a present's box ends: what sits it flat on the sled's deck.
const CARGO_DROP = 54

function trips(column: number, row: number): string {
  return TRIPS.map(([box, ribbon], which) => `<g class="trip t${which}" style="animation-delay:${which * WALK_SECONDS - TRIPS.length * WALK_SECONDS}s">${present(column, row, box, ribbon)}</g>`).join('')
}

/**
 * Clawd on the ground: out of the cabin door pushing a sled with a present on it, across to the pile by the tree, where the present
 * joins the pile and he hops twice and waves; on the way back he stops to jump at the snowflakes, then home with the empty sled.
 * One loop of WALK_SECONDS, every part on the same clock.
 */
function walker(): { markup: string; frames: string } {
  const u = 6
  const frames =
    `@keyframes walk{0%,3%{transform:translateX(${DOOR_X}px)}30%,40%{transform:translateX(${DROP_X}px)}58%,66%{transform:translateX(${PLAY_X}px)}88%,100%{transform:translateX(${DOOR_X}px)}}` +
    `@keyframes door{0%{opacity:0}3%,91%{opacity:1}95%,100%{opacity:0}}` +
    `@keyframes hop{0%,31%{transform:translateY(0)}32%{transform:translateY(-38px)}33%{transform:translateY(0)}34%{transform:translateY(-38px)}35%,59%{transform:translateY(0)}60%{transform:translateY(-48px)}61%{transform:translateY(0)}62%{transform:translateY(-48px)}63%{transform:translateY(0)}64%{transform:translateY(-48px)}65%,100%{transform:translateY(0)}}` +
    `@keyframes wave{0%,35%{transform:translateY(0)}36%{transform:translateY(-${u * 2}px)}37%{transform:translateY(0)}38%{transform:translateY(-${u * 2}px)}39%{transform:translateY(0)}40%,59.5%{transform:translateY(0)}60%,64.5%{transform:translateY(-${u * 2}px)}65%,100%{transform:translateY(0)}}` +
    `@keyframes cargo{0%{opacity:0}3%,30%{opacity:1}31.5%,100%{opacity:0}}` +
    `@keyframes pile{0%,30%{opacity:0}31.5%,95%{opacity:1}99%,100%{opacity:0}}`
  const sled = `<rect x="${-14 * u}" y="${10 * u - 4}" width="${12 * u + 4}" height="4" fill="${GOLD}"/><path d="M${-14 * u} ${10 * u - 4}h-4v-4h-4v-4h4v4h4z" fill="${GOLD}"/>` +
    `<path d="M${-12 * u} ${10 * u - 4}v-6h4v6zM${-5 * u} ${10 * u - 4}v-6h4v6z" fill="#7a5234"/><rect x="${-14 * u}" y="${10 * u - 16}" width="${12 * u}" height="6" fill="#9a6b45"/>` +
    `<path d="M${-2 * u} ${10 * u - 14}h4v-4h4v-4h4v-4h4v4h-4v4h-4v4h-4v4h-8z" fill="#9a6b45"/>`
  const clock = `${WALK_SECONDS}s linear infinite`
  const markup = `<g class="pile" style="animation:pile ${clock}">${settled(45, trips(45, 43))}</g>` +
    `<g class="walker" style="animation:walk ${clock}"><g style="animation:door ${clock}"><g transform="translate(0 ${WALKER_Y})">` +
    `<ellipse cx="-8" cy="${10 * u + 1}" rx="84" ry="6" fill="#0d0c0b" fill-opacity=".3"/>${sled}<g class="cargo" style="animation:cargo ${clock}"><g transform="translate(${-14 * u} ${10 * u - 16 - CARGO_DROP})">${trips(0, 0)}</g></g>` +
    `<g style="animation:hop ${clock}">${clawd(u, { legs: 'leg', arms: 'wave' })}</g></g></g></g>`
  return { markup, frames }
}

/** Two small Clawds a little way back, lobbing a snowball to and fro. */
function snowballFight(): string {
  const u = 3
  const left = 962
  const right = 1102
  const top = 874
  return `<g transform="translate(${left} ${top})">${clawd(u, { legs: 'leg', body: '#e8a084' })}</g><g transform="translate(${right} ${top})">${clawd(u, { legs: 'leg off', body: '#e8a084' })}</g>` +
    `<g class="lob"><g class="arc"><circle cx="${left + 16 * u}" cy="${top + 8}" r="5.5" fill="${CREAM}"/></g></g>`
}

/** A small Clawd who sleds down the cabin roof, flies off the eave, and lands in the snow with a puff. */
function roofSled(): { markup: string; frames: string } {
  const u = 2.4
  const ridgeX = (CABIN_CENTRE + 0.5) * CELL_WIDTH
  const ridgeY = WALL_TOP * CELL_HEIGHT - 92
  const at = (x: number): string => `translate(${n(x)}px,${n(ridgeY + (ridgeX - x) * 0.52)}px) rotate(-27.5deg)`
  const frames =
    `@keyframes roof{0%,40%{transform:${at(ridgeX - 14)};opacity:0}44%{transform:${at(ridgeX - 22)};opacity:1}60%{transform:${at(ridgeX - 152)}}66%{transform:translate(${ridgeX - 210}px,${ridgeY + 86}px) rotate(-58deg)}73%{transform:translate(${ridgeX - 238}px,${ridgeY + 184}px) rotate(-12deg);opacity:1}79%,100%{transform:translate(${ridgeX - 242}px,${ridgeY + 196}px) rotate(0deg);opacity:0}}` +
    `@keyframes puff{0%,72%{transform:translateY(0) scale(.4);opacity:0}74%{transform:translateY(-10px) scale(1);opacity:.9}84%,100%{transform:translateY(-34px) scale(1.5);opacity:0}}`
  const puff: Mark[] = [-26, -12, 2, 16, 30].map((dx, index) => ({ x: ridgeX - 238 + dx, y: ridgeY + 186 - (index % 2) * 10, glyph: '*.+*.'[index] ?? '*' }))
  const markup = `<g class="roof"><g transform="translate(${n(-6 * u)} ${n(-10 * u - 5)})">${clawd(u)}<rect x="${n(-2 * u)}" y="${n(10 * u)}" width="${n(16 * u)}" height="3" fill="${GOLD}"/></g></g>` +
    `<g class="puff" style="transform-origin:${ridgeX - 238}px ${ridgeY + 186}px">${glyphs(puff, 20, CREAM, 1)}</g>`
  return { markup, frames }
}

/** A small Clawd who pops out of the cabin's chimney, looks left and right, and drops back in. */
function chimneyClawd(): string {
  const u = 2.4
  const x = (CABIN_CENTRE + 4) * CELL_WIDTH + 16 - 6 * u
  const top = WALL_TOP * CELL_HEIGHT - 127
  return `<clipPath id="flue"><rect x="${n(x - 30)}" y="${top - 120}" width="90" height="120"/></clipPath>` +
    `<g clip-path="url(#flue)"><g class="pop"><g transform="translate(${n(x)} ${top})">${clawd(u)}</g></g></g>`
}

/** The sleigh team about 0,0, heading right: sparks behind, Santa Clawd in the sleigh, two small Clawds in antlers ahead. */
function team(): string {
  const turn = `${FLY_SECONDS}s steps(1,end) infinite`
  let trail = ''
  for (let index = 0; index < 6; index += 1) trail += spark(-34 - index * 34, 18 + (index % 2) * 10, 10 - index * 1.2, index % 2 === 0 ? GOLD : CLAY, index + 90, `tw b${index % 5}`, 8)
  return trail +
    `<path d="M48 16L112 20M112 20L170 12" fill="none" stroke="#9a6b45" stroke-width="2"/>` +
    `<g transform="translate(160 -4)">${clawd(3, { body: '#e8a084', legs: 'trot', antlers: true, nose: true })}</g>` +
    `<g transform="translate(102 4)">${clawd(3, { body: '#e8a084', legs: 'trot', antlers: true })}</g>` +
    `<circle cx="-2" cy="2" r="12" fill="#9a6b45"/><g transform="translate(8 -16)"><g style="animation:riderClawd ${turn}">${clawd(3, { arms: 'cheer' })}</g><g style="animation:riderSanta ${turn};opacity:0">${santa(3)}</g></g>` +
    `<path d="M-8 2h10v10h38v-6h8v22h-56z" fill="#c2453b"/><path d="M-8 12h56v3h-56z" fill="${GOLD}"/><path d="M-4 28v5M40 28v5" stroke="${GOLD}" stroke-width="2.5"/><path d="M-12 34h62q8 0 8 -8" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`
}

const FLY_SECONDS = 211

interface Pass {
  /** 1 flies left to right; -1 is the same team mirrored, flying right to left. */
  flip: 1 | -1
  /** [percent of the loop, x, y] */
  path: ReadonlyArray<readonly [number, number, number]>
  drops: ReadonlyArray<readonly [x: number, colour: string]>
}

/** Three different passes in one long loop: across high, back low the other way, across again higher and faster. Always level. */
const PASSES: readonly Pass[] = [
  { flip: 1, path: [[0, -1000, 240], [6, 640, 150], [12, 2600, 220]], drops: [[520, HAT_RED], [930, GOLD]] },
  { flip: -1, path: [[36, 2600, 410], [42, 900, 330], [48, -1000, 420]], drops: [[1040, SAGE], [640, CLAY]] },
  { flip: 1, path: [[70, -1000, 110], [75.5, 700, 190], [81, 2600, 80]], drops: [[470, SAGE], [700, HAT_RED], [1010, GOLD]] },
]
const LAND_Y = 921

/** When a pass is over an x, and how high it is there. */
function over(pass: Pass, x: number): { percent: number; y: number } {
  for (let index = 1; index < pass.path.length; index += 1) {
    const [p0, x0, y0] = pass.path[index - 1] ?? [0, 0, 0]
    const [p1, x1, y1] = pass.path[index] ?? [0, 0, 0]
    if ((x - x0) * (x - x1) <= 0) {
      const part = (x - x0) / (x1 - x0)
      return { percent: p0 + (p1 - p0) * part, y: y0 + (y1 - y0) * part }
    }
  }
  return { percent: 0, y: 0 }
}

/**
 * The sleigh: two small Clawds in antlers pull it, Santa Clawd rides it upright, sparks trail behind. It never tilts.
 * On each pass it lets presents go: each comes down under a little parachute, lands in the snow and stays a while.
 */
function sleigh(santaPasses: readonly boolean[] = []): { markup: string; frames: string } {
  const last = PASSES[PASSES.length - 1]?.path.at(-1) ?? [0, 0, 0]
  let frames = `@keyframes fly{${PASSES.map(pass => pass.path.map(([percent, x, y]) => `${percent}%{transform:translate(${x}px,${y}px) scaleX(${pass.flip})}`).join('')).join('')}100%{transform:translate(${last[1]}px,${last[2]}px) scaleX(1)}}`
  const rider = (name: string, isSanta: boolean): string => `@keyframes ${name}{${PASSES.map((pass, index) => `${pass.path[0]?.[0] ?? 0}%{opacity:${(santaPasses[index] === true) === isSanta ? 1 : 0}}`).join('')}}`
  frames += rider('riderClawd', false) + rider('riderSanta', true)
  let drops = ''
  let count = 0
  for (const pass of PASSES) {
    for (const [x, colour] of pass.drops) {
      const { percent, y } = over(pass, x)
      const from = y + 50
      const stay = Math.min(percent + 27, 96)
      const step = (part: number, tilt: number): string => `${n(percent + 2.6 * part)}%{transform:translate(${x}px,${n(from + (LAND_Y - from) * part)}px) rotate(${tilt}deg);opacity:1}`
      frames += `@keyframes drop${count}{0%,${n(percent)}%{transform:translate(${x}px,${n(from)}px);opacity:0}${step(0.08, 0)}${step(0.4, -10)}${step(0.75, 10)}${step(1, 0)}${n(stay)}%{transform:translate(${x}px,${LAND_Y}px);opacity:1}${n(stay + 2)}%,100%{transform:translate(${x}px,${LAND_Y}px);opacity:0}}` +
        `@keyframes chute${count}{0%,${n(percent)}%{opacity:0}${n(percent + 0.2)}%,${n(percent + 2.5)}%{opacity:1}${n(percent + 3)}%,100%{opacity:0}}`
      drops += `<g class="drop" style="animation:drop${count} ${FLY_SECONDS}s linear infinite">` +
        `<g style="animation:chute${count} ${FLY_SECONDS}s linear infinite"><use href="#canopy" fill="${count % 2 === 0 ? CREAM : HAT_RED}"/><use href="#cords"/></g>` +
        `<rect x="-17" y="-30" width="34" height="30" fill="${colour}"/><use href="#ribbon"/></g>`
      count += 1
    }
  }
  const markup = `${drops}<g class="fly"><g class="bob">${team()}</g></g>`
  return { markup, frames }
}

/** A candy cane in pixels, its foot at x,base: a striped stem and a hook to the right. */
function cane(x: number, base: number, u: number): string {
  const cell = (column: number, row: number): string => `M${n(x + (column - 0.5) * u)} ${n(base - row * u)}h${u}v${u}h-${u}z`
  // Column 0 is the stem, rows counted up from the foot; the hook is the top two columns over.
  const white = [1, 3, 5, 7].map(row => cell(0, row)).join('') + cell(0, 8) + cell(2, 7)
  const red = [2, 4, 6].map(row => cell(0, row)).join('') + cell(1, 8) + cell(2, 6)
  return `<path fill="${HAT_WHITE}" d="${white}"/><path fill="${HAT_RED}" d="${red}"/>`
}

/** A parade that comes through now and then: five small Clawds in a line, each holding something up. */
function parade(): string {
  const u = 3
  let out = ''
  for (let index = 0; index < 5; index += 1) {
    const x = index * 70
    // Each holds something up in the leading hand: the hand is at x + 39, 9, and whatever is held starts there.
    const hand = x + 39
    const pole = `<rect x="${hand - 1.5}" y="-22" width="3" height="34" fill="#9a6b45"/>`
    const held = index === 1
      ? pole + spark(hand, -26, 11, GOLD, 140, 'tw b1', 8)
      : index === 2
        ? `<rect x="${hand - 11}" y="-11" width="22" height="20" fill="${SAGE}"/><rect x="${hand - 3}" y="-11" width="6" height="20" fill="${CREAM}"/><rect x="${hand - 11}" y="-4" width="22" height="5" fill="${CREAM}"/>`
        : index === 3
          ? pole + `<path d="M${hand - 4} -40h8v4h4v8h4v4h-24v-4h4v-8h4z" fill="${GOLD}"/><circle cx="${hand}" cy="-22" r="3.5" fill="#7a5234"/>`
          : cane(hand, 12, 4)
    const body = index % 2 === 0 ? CLAY : '#e8a084'
    out += `<g transform="translate(${x} 0)">${shade(18, 31, 23)}${clawd(u, { legs: index % 2 === 0 ? 'leg' : 'leg off', body })}</g>${held}<rect x="${hand - 4}" y="7" width="8" height="7" fill="${body}"/>`
  }
  return out
}

/** A snowman in the foreground in a santa hat and scarf: he waves a twig arm, tips his hat now and then, and a small Clawd peeks from behind him. */
function snowman(x: number, base: number, part: (name: SnowmanPart, inner: string) => string = (_name, inner) => inner): string {
  const ink = '#1c1b1a'
  return `<g class="peek"><g transform="translate(${x - 18} ${base - 42})">${clawd(3)}</g></g>` +
    part('face', `<path d="M${x - 28} ${base - 46}L${x - 58} ${base - 70}M${x - 48} ${base - 62}l-10 4M${x - 48} ${base - 62}l-2 -11" stroke="#9a6b45" stroke-width="3.5" stroke-linecap="round" fill="none"/>` +
      `<g class="twig" style="transform-origin:${x + 28}px ${base - 46}px"><path d="M${x + 28} ${base - 46}L${x + 60} ${base - 74}M${x + 50} ${base - 65}l11 3M${x + 50} ${base - 65}l1 -12" stroke="#9a6b45" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>`) +
    part('body', shade(x, base + 3, 48) + `<circle cx="${x}" cy="${base - 30}" r="35" fill="#ece8dc"/>` +
      `<rect x="${x - 3}" y="${base - 40}" width="6" height="6" fill="${ink}"/><rect x="${x - 3}" y="${base - 24}" width="6" height="6" fill="${ink}"/>`) +
    part('head', `<circle cx="${x}" cy="${base - 80}" r="25" fill="#f4f1e8"/>`) +
    part('face', `<rect x="${x - 11}" y="${base - 90}" width="5" height="6" fill="${ink}"/><rect x="${x + 6}" y="${base - 90}" width="5" height="6" fill="${ink}"/><rect x="${x - 2}" y="${base - 81}" width="15" height="5" fill="${CLAY}"/>` +
      `<path d="M${x - 10} ${base - 71}h4v3h4v0h4v-3h4" fill="none" stroke="${ink}" stroke-width="2.5"/>` +
      `<rect x="${x - 25}" y="${base - 62}" width="50" height="9" rx="3" fill="${HAT_RED}"/><rect x="${x + 9}" y="${base - 58}" width="10" height="26" fill="${HAT_RED}"/><rect x="${x + 9}" y="${base - 36}" width="10" height="4" fill="${HAT_WHITE}"/>`) +
    part('hat', `<g><use href="#hat" transform="translate(${x - 26} ${base - 103}) scale(4.3)"/></g>`)
}

/** Two shooting stars on clocks of their own. */
function shootingStars(): string {
  const one = (x: number, y: number, seconds: number, delay: number): string =>
    `<g class="shoot" style="animation-duration:${seconds}s;animation-delay:-${delay}s"><g transform="translate(${x} ${y})"><path d="M0 0L84 -38" stroke="${CREAM}" stroke-opacity=".45" stroke-width="2" stroke-linecap="round"/><circle r="3.4" fill="${CREAM}"/></g></g>`
  return one(1130, 120, 19, 0) + one(760, 80, 43, 20) + one(1480, 330, 31, 11)
}

/** Sparks that rise off the tree's star and fade, one after another. */
function starSparks(): string {
  const x = APEX * CELL_WIDTH + CELL_WIDTH / 2
  const y = TOP * CELL_HEIGHT + 2
  let out = ''
  for (let index = 0; index < 6; index += 1) {
    out += `<g class="rise" style="animation-delay:-${n(index * 1.5)}s"><g transform="translate(${(index % 3 - 1) * 26} 0)">${spark(x, y - 20, 7, index % 2 === 0 ? GOLD : CLAY, index + 120, '', 8)}</g></g>`
  }
  return out
}

// ---- The show: one act at a time on a long clock, in an order the seed picks, so no two sittings play alike. ----

const SHOW_SECONDS = 613
const SHOW_CLOCK = `${SHOW_SECONDS}s linear infinite`
const INKY = '#1c1b1a'
const LANE = 976
const CAROL_FEET = 950

interface Slot {
  start: number
  span: number
}

/** Keyframes on the show clock: steps are [percent of the act, css]; before the act the first holds, after it the last. */
function act(name: string, slot: Slot, steps: ReadonlyArray<readonly [number, string]>): string {
  const at = (percent: number): number => Math.round((slot.start + (percent * slot.span) / 100) * 1000) / 1000
  const first = steps[0]?.[1] ?? ''
  const last = steps.at(-1)?.[1] ?? ''
  return `@keyframes ${name}{0%{${first}}${steps.map(([percent, css]) => `${at(percent)}%{${css}}`).join('')}100%{${last}}}`
}

function played(name: string, inner: string, extra = ''): string {
  return `<g style="animation:${name} ${SHOW_CLOCK}${extra}">${inner}</g>`
}

/** Pixels of one colour, `u` to a pixel. */
function px(fill: string, cells: ReadonlyArray<readonly [number, number, number, number]>, u: number, classes = ''): string {
  return `<path${classes === '' ? '' : ` class="${classes}"`} fill="${fill}" d="${cells.map(([x, y, width, height]) => `M${n(x * u)} ${n(y * u)}h${n(width * u)}v${n(height * u)}h${n(-width * u)}z`).join('')}"/>`
}

/** Santa himself from the waist up, the size of the Clawd who usually rides: beard, coat, belt and the same hat. */
function santa(u: number): string {
  return px(HAT_RED, [[0, 4, 12, 6], [-2, 5, 2, 2], [12, 5, 2, 2]], u) + px(HAT_WHITE, [[-2, 7, 2, 1], [12, 7, 2, 1], [2, 2, 8, 4], [3, 6, 6, 1]], u) +
    px('#f1c9a5', [[3, 1, 6, 2]], u) + px(INKY, [[4, 1, 1, 1], [7, 1, 1, 1], [0, 8, 12, 1]], u) + px(HAT_RED, [[5.5, 2, 1, 1]], u) + px(GOLD, [[5, 8, 2, 1]], u) +
    `<use href="#hat" transform="scale(${u})"/>`
}

const GRINCH_HEIGHT = 10
const GRINCH_GREEN = '#7fae36'

/**
 * The Grinch as one of the Clawds: the same blocky 12 x 8 body, stub arms, four legs and santa hat, but green, with yellow
 * eyes and red pupils under brows drawn down in a V, a grin from cheek to cheek that curls up at both ends, and the hem of
 * a fur-trimmed santa coat. His cousin who is after the RAM has the same face under brown hair and a grey jumper with a name tag.
 */
function grinch(u: number, kind: 'grinch' | 'sam'): string {
  const isSam = kind === 'sam'
  return shade(6 * u, 10 * u + 1, 7.4 * u) + clawd(u, { body: GRINCH_GREEN, legs: 'leg', bare: isSam, arms: isSam ? 'sarm' : 'garm' }) +
    px(isSam ? '#4a5362' : HAT_RED, [[0, 6.3, 12, 1.7]], u) + px(HAT_WHITE, isSam ? [[7.6, 6.6, 2.4, 1.1]] : [[0, 5.9, 12, 0.7]], u) +
    px('#f3d54e', [[1.3, 2, 2.4, 1.9], [8.3, 2, 2.4, 1.9]], u) + px('#c2453b', [[2.7, 2.5, 1, 1.4], [8.3, 2.5, 1, 1.4]], u) +
    px(INKY, [[0.9, 1, 1.6, 0.7], [2.5, 1.5, 1.6, 0.7], [9.5, 1, 1.6, 0.7], [7.9, 1.5, 1.6, 0.7], [2.2, 4.7, 7.6, 0.7], [1.5, 4.1, 0.7, 0.7], [9.8, 4.1, 0.7, 0.7]], u) +
    (isSam ? px('#5a3d28', [[1, -1.3, 10, 1.5], [0, -0.6, 2, 2], [10.5, -0.6, 1.5, 1.2]], u) : '') +
    px(isSam ? HAT_WHITE : HAT_RED, [[0.2, 9.1, 2.4, 0.9], [7.2, 9.1, 2.4, 0.9]], u, 'stride') + px(isSam ? HAT_WHITE : HAT_RED, [[2.2, 9.1, 2.4, 0.9], [9.2, 9.1, 2.4, 0.9]], u, 'stride off')
}

/** Two green hands on either side of something held to the chest, the thing's left edge at x and its middle height at y. */
function grip(x: number, y: number, width: number): string {
  return `<rect x="${n(x - 6)}" y="${n(y - 4)}" width="8" height="9" fill="${GRINCH_GREEN}"/><rect x="${n(x + width - 2)}" y="${n(y - 4)}" width="8" height="9" fill="${GRINCH_GREEN}"/>`
}

function n2(value: number): number {
  return Math.round(value * 10) / 10
}

/** A stick of RAM, its top-left at x,y. */
function ram(x: number, y: number): string {
  return `<rect x="${x}" y="${y}" width="44" height="11" fill="#2f7d4f"/><path fill="${INKY}" d="M${x + 4} ${y + 2}h7v6h-7zM${x + 14} ${y + 2}h7v6h-7zM${x + 24} ${y + 2}h7v6h-7zM${x + 34} ${y + 2}h7v6h-7z"/><rect x="${x + 2}" y="${y + 11}" width="40" height="2.5" fill="${GOLD}"/>`
}

function said(x: number, y: number, words: string, colour: string): string {
  return `<text class="g" x="${x}" y="${y}" font-size="15" fill="${colour}">${words}</text>`
}

/** The parade crosses on the lane in front of everything. */
function paradeAct(slot: Slot): { markup: string; frames: string } {
  const frames = act('parade', slot, [[0, 'transform:translateX(-1100px);opacity:0'], [0.5, 'transform:translateX(-1100px);opacity:1'], [46, 'transform:translateX(2500px);opacity:1'], [46.5, 'transform:translateX(2500px);opacity:0']])
  return { markup: played('parade', `<g transform="translate(0 ${LANE - 30})">${parade()}</g>`, ';opacity:0'), frames }
}

/** The Grinch tiptoes in, makes off with a present from under the tree, thinks better of it, and brings it back with a heart. */
function grinchAct(slot: Slot): { markup: string; frames: string } {
  const u = 4.4
  const stop = 476
  const feet = 938
  const move = (x: number, opacity = 1): string => `transform:translateX(${x}px);opacity:${opacity}`
  const frames =
    act('grinch', slot, [[0, move(-900, 0)], [1, move(-900)], [16, move(stop)], [23, move(stop)], [36, move(-900)], [36.5, move(-900, 0)], [60, move(-900, 0)], [60.5, move(-900)], [75, move(stop)], [84, move(stop)], [98, move(-900)], [98.5, move(-900, 0)]]) +
    act('swag', slot, [[0, 'opacity:0'], [21.9, 'opacity:0'], [22, 'opacity:1'], [77.9, 'opacity:1'], [78, 'opacity:0']]) +
    act('loot', slot, [[0, 'opacity:1'], [21.9, 'opacity:1'], [22, 'opacity:0'], [77.9, 'opacity:0'], [78, 'opacity:1']]) + `.garm{animation:loot ${SHOW_CLOCK}}` +
    act('heart', slot, [[0, 'transform:translateY(0);opacity:0'], [78, 'transform:translateY(0);opacity:0'], [79, 'transform:translateY(-8px);opacity:1'], [88, 'transform:translateY(-70px);opacity:0']])
  const top = feet - GRINCH_HEIGHT * u
  const heart = `<path transform="translate(${stop + 84} ${top + 10}) scale(1.2)" fill="${HAT_RED}" d="M-1 5h2v-2h2v-2h2v-2h2v-6h-2v-2h-4v2h-2v2h-2v-2h-2v-2h-4v2h-2v6h2v2h2v2h2v2h2z"/>`
  const markup = played('grinch', `<g transform="translate(0 ${top})">${grinch(u, 'grinch')}${played('swag', `<rect x="${n(6 * u - 15)}" y="${n(5.4 * u)}" width="30" height="14" fill="${GOLD}"/><rect x="${n(6 * u - 3)}" y="${n(5.4 * u)}" width="6" height="14" fill="${CLAY}"/><rect x="${n(6 * u - 15)}" y="${n(5.4 * u + 5)}" width="30" height="4" fill="${CLAY}"/>${grip(6 * u - 15, 5.4 * u + 7, 30)}`, ';opacity:0')}</g>`, ';opacity:0') +
    played('heart', heart, ';opacity:0')
  return { markup, frames }
}

/** The RAM heist: he creeps up to the cabin, comes away with the RAM, and a Clawd chases him off the far side. */
function heistAct(slot: Slot): { markup: string; frames: string } {
  const u = 4.4
  const feet = 944
  const move = (x: number, opacity = 1): string => `transform:translateX(${x}px);opacity:${opacity}`
  const frames =
    act('heist', slot, [[0, move(2500, 0)], [1, move(2500)], [16, move(DOOR_X + 40)], [26, move(DOOR_X + 40)], [62, move(-900)], [62.5, move(-900, 0)]]) +
    act('haul', slot, [[0, 'opacity:0'], [23.9, 'opacity:0'], [24, 'opacity:1']]) +
    act('sarm', slot, [[0, 'opacity:1'], [23.9, 'opacity:1'], [24, 'opacity:0']]) + `.sarm{animation:sarm ${SHOW_CLOCK}}` +
    act('chase', slot, [[0, move(DOOR_X + 20, 0)], [28, move(DOOR_X + 20, 0)], [28.5, move(DOOR_X + 20)], [29, move(DOOR_X + 20)], [68, move(-900)], [68.5, move(-900, 0)]])
  const top = feet - GRINCH_HEIGHT * u
  const markup = played('heist', `<g transform="translate(0 ${top})">${grinch(u, 'sam')}${played('haul', `${ram(n2(6 * u - 22), n2(5.2 * u))}${grip(6 * u - 22, 5.2 * u + 6, 44)}${said(n2(6 * u), -24, 'more compute!', GOLD)}`, ';opacity:0')}</g>`, ';opacity:0') +
    played('chase', `<g transform="translate(0 ${feet + 6 - 40})">${shade(24, 41, 31)}${clawd(4, { legs: 'leg', arms: 'cheer' })}${said(24, -24, 'my RAM!!', CREAM)}</g>`, ';opacity:0')
  return { markup, frames }
}

/** Three small Clawds come by to sing at the cabin, notes drifting up. */
function carolAct(slot: Slot): { markup: string; frames: string } {
  const move = (x: number, opacity = 1): string => `transform:translateX(${x}px);opacity:${opacity}`
  const frames = act('carol', slot, [[0, move(1500, 0)], [1, move(1500)], [14, move(0)], [82, move(0)], [96, move(1500)], [96.5, move(1500, 0)]]) +
    act('notes', slot, [[0, 'opacity:0'], [15, 'opacity:0'], [16, 'opacity:1'], [80, 'opacity:1'], [81, 'opacity:0']])
  let singers = ''
  let notes = ''
  for (let index = 0; index < 3; index += 1) {
    const x = 1130 + index * 52
    singers += `<g class="cheer" style="animation-delay:-${n(index * 0.17)}s"><g transform="translate(${x} ${CAROL_FEET - 30})">${shade(18, 31, 23)}${clawd(3, { body: index === 1 ? CLAY : '#e8a084' })}<rect x="8" y="14" width="20" height="12" fill="${CREAM}"/><rect x="17" y="14" width="2" height="12" fill="#9a6b45"/></g></g>`
    const colour = [GOLD, CREAM, SAGE][index] ?? CREAM
    notes += `<g style="animation:rise 4.6s linear -${n(index * 1.5)}s infinite"><path d="M${x + 22} ${CAROL_FEET - 52}v-16l8 -3" fill="none" stroke="${colour}" stroke-width="2.5"/><circle cx="${x + 18}" cy="${CAROL_FEET - 52}" r="4.5" fill="${colour}"/></g>`
  }
  return { markup: played('carol', `${singers}${played('notes', notes, ';opacity:0')}`, ';opacity:0'), frames }
}

type SnowmanPart = 'body' | 'head' | 'face' | 'hat'

/** The snowman melts away and a Clawd builds him again: rolls the body up, rolls the head and lifts it on, then down comes the hat. */
function buildAct(slot: Slot, x: number, base: number): { markup: string; frames: string; parts: (part: SnowmanPart, inner: string) => string } {
  const gone = 'opacity:0'
  const here = 'opacity:1'
  const push = (dx: number, opacity = 1): string => `transform:translateX(${dx}px);opacity:${opacity}`
  const roll = (dx: number, dy: number, scale: number, opacity = 1): string => `transform:translate(${dx}px,${dy}px) scale(${scale});opacity:${opacity}`
  const frames =
    act('smBody', slot, [[0, here], [3, here], [3.1, gone], [21.9, gone], [22, here]]) +
    act('smHead', slot, [[0, here], [3, here], [3.1, gone], [49.9, gone], [50, here]]) +
    act('smFace', slot, [[0, here], [3, here], [3.1, gone], [61.9, gone], [62, here]]) +
    act('smHat', slot, [[0, 'transform:translateY(0);opacity:1'], [3, 'transform:translateY(0);opacity:1'], [3.1, 'transform:translateY(0);opacity:0'], [53.9, 'transform:translateY(-340px);opacity:0'], [54, 'transform:translateY(-340px);opacity:1'], [60, 'transform:translateY(0);opacity:1']]) +
    act('smPush', slot, [[0, push(760, 0)], [5, push(760, 0)], [5.2, push(760)], [22, push(0)], [24, push(0)], [33, push(760)], [34, push(760)], [48, push(40)], [74, push(40)], [92, push(760)], [92.5, push(760, 0)]]) +
    act('smRoll1', slot, [[0, roll(760, 0, 0.25, 0)], [5, roll(760, 0, 0.25, 0)], [5.2, roll(760, 0, 0.25)], [22, roll(0, 0, 1)], [22.1, roll(0, 0, 1, 0)]]) +
    act('smRoll2', slot, [[0, roll(760, 55, 0.3, 0)], [34, roll(760, 55, 0.3, 0)], [34.2, roll(760, 55, 0.3)], [48, roll(62, 55, 1)], [49, roll(62, 55, 1)], [50, roll(0, 0, 1)], [50.1, roll(0, 0, 1, 0)]])
  const markup = played('smRoll1', `<g style="animation:spin 1.6s steps(12,end) infinite reverse;transform-origin:${x}px ${base - 30}px"><circle cx="${x}" cy="${base - 30}" r="35" fill="#ece8dc"/><path d="M${x - 20} ${base - 46}h10v10h-10zM${x + 8} ${base - 24}h12v12h-12zM${x - 10} ${base - 14}h7v7h-7zM${x + 12} ${base - 52}h7v7h-7z" fill="#bdb9ae"/></g>`, `;opacity:0;transform-origin:${x}px ${base}px`) +
    played('smRoll2', `<g style="animation:spin 1.3s steps(12,end) infinite reverse;transform-origin:${x}px ${base - 80}px"><circle cx="${x}" cy="${base - 80}" r="25" fill="#f4f1e8"/><path d="M${x - 14} ${base - 92}h7v7h-7zM${x + 5} ${base - 76}h9v9h-9zM${x - 8} ${base - 70}h5v5h-5zM${x + 8} ${base - 96}h5v5h-5z" fill="#c6c2b7"/></g>`, `;opacity:0;transform-origin:${x}px ${base - 55}px`) +
    played('smPush', `<g transform="translate(${x + 52} ${base - 40})">${shade(24, 41, 31)}${clawd(4, { legs: 'leg', arms: 'cheer' })}</g>`, ';opacity:0')
  const names: Record<SnowmanPart, string> = { body: 'smBody', head: 'smHead', face: 'smFace', hat: 'smHat' }
  return { markup, frames, parts: (part, inner) => played(names[part], inner) }
}

/** A snow globe about cx,cy: a tiny Clawd on a mound under glass, snow going round inside, the newest thing made named on its base. */
function globe(cx: number, cy: number, label: string, swirl: number): string {
  const r = 26
  let snowing = ''
  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.4
    const reach = 6 + ((index * 7) % 15)
    snowing += `<circle cx="${n(cx + Math.cos(angle) * reach)}" cy="${n(cy + Math.sin(angle) * reach)}" r="${index % 3 === 0 ? 2.2 : 1.6}" fill="${CREAM}"/>`
  }
  const width = Math.max(52, label.length * 5.4 + 12)
  return `<path d="M${n(cx - width / 2)} ${cy + r + 15}l5 -15h${n(width - 10)}l5 15z" fill="#6b4a33"/><rect x="${n(cx - width / 2 + 5)}" y="${cy + r - 2}" width="${n(width - 10)}" height="4" fill="${GOLD}"/>` +
    `<text class="g" x="${cx}" y="${cy + r + 12}" font-size="9" fill="${CREAM}">${label}</text>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2b3a44" fill-opacity=".55"/><path d="M${cx - 20} ${cy + 15}h8v-5h24v5h8v5h-8v5h-24v-5h-8z" fill="${CREAM}" fill-opacity=".9"/>` +
    `<g transform="translate(${cx - 9} ${cy - 3})">${clawd(1.5)}</g>` +
    `<g style="animation:spin ${swirl}s linear infinite;transform-origin:${cx}px ${cy}px">${snowing}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CREAM}" stroke-opacity=".75" stroke-width="2"/><path d="M${cx - 17} ${cy - 10}v-5h5v-5h8v4h-4v6z" fill="${CREAM}" fill-opacity=".6"/>`
}

/** A Clawd comes out of the cabin with a snow globe, stops, gives it a good shake so the snow inside flies, admires it, and takes it home. */
function globeAct(slot: Slot, label: string): { markup: string; frames: string } {
  const feet = 942
  const stop = 1010
  const move = (x: number, opacity = 1): string => `transform:translateX(${x}px);opacity:${opacity}`
  const frames = act('globeWalk', slot, [[0, move(DOOR_X, 0)], [1, move(DOOR_X)], [20, move(stop)], [80, move(stop)], [97, move(DOOR_X)], [98, move(DOOR_X, 0)]]) +
    act('globeStill', slot, [[0, 'opacity:1'], [27.9, 'opacity:1'], [28, 'opacity:0'], [57.9, 'opacity:0'], [58, 'opacity:1']]) +
    act('globeShaken', slot, [[0, 'opacity:0'], [27.9, 'opacity:0'], [28, 'opacity:1'], [57.9, 'opacity:1'], [58, 'opacity:0']]) +
    '@keyframes wig{from{transform:translateY(-3px) rotate(-14deg)}to{transform:translateY(3px) rotate(14deg)}}'
  // He faces us and hugs the globe to his front with both hands, one on each side of the glass; to shake it he lifts it and rocks it.
  const held = (swirl: number): string => `<g transform="translate(24 -46) scale(.7)">${globe(0, 0, label, swirl)}</g>` +
    `<rect x="-3" y="-27" width="10" height="10" fill="${CLAY}"/><rect x="41" y="-27" width="10" height="10" fill="${CLAY}"/>`
  const arms = `<rect x="-4" y="-20" width="8" height="36" fill="${CLAY}"/><rect x="44" y="-20" width="8" height="36" fill="${CLAY}"/>`
  const markup = played('globeWalk', `<g transform="translate(0 ${feet - 40})">${shade(24, 41, 31)}${arms}${clawd(4, { legs: 'leg' })}` +
    played('globeStill', held(7)) +
    played('globeShaken', `<g style="animation:wig .2s ease-in-out infinite alternate;transform-origin:24px -20px">${held(0.9)}</g>`, ';opacity:0') + '</g>', ';opacity:0')
  return { markup, frames }
}

/** Tags on the presents under the tree for the things made before the newest. */
function keepsakes(made: readonly string[]): string {
  let out = ''
  made.slice(1, 4).forEach((name, index) => {
    const column = 27 + index * 6
    const label = name.slice(0, 11)
    const width = label.length * 5.6 + 10
    const x = column * CELL_WIDTH + 40
    const y = 43 * CELL_HEIGHT + 34 + sink(column)
    out += `<g transform="rotate(-4 ${x} ${n(y)})"><path d="M${x} ${n(y - 16)}V${n(y - 7)}" stroke="#9a6b45" stroke-width="1.5"/><rect x="${n(x - width / 2)}" y="${n(y - 7)}" width="${n(width)}" height="14" rx="3" fill="${CREAM}"/><text class="g" x="${x}" y="${n(y + 3.5)}" font-size="9" fill="#1c1b1a">${label}</text></g>`
  })
  return out
}

interface Show {
  markup: string
  frames: string
  snowman: string
  /** Which of the sleigh's three passes Santa himself takes. */
  santaPasses: boolean[]
}

/** The acts in an order of the seed's choosing, one to a sixth of the show clock with quiet between them. */
function show(seed: number, made: readonly string[] = []): Show {
  const random = seeded(seed * 7919 + 13)
  const order = [0, 1, 2, 3, 4, 5]
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    const held = order[index] ?? 0
    order[index] = order[other] ?? 0
    order[other] = held
  }
  const slotOf = (which: number): Slot => ({ start: order.indexOf(which) * 16.6 + 1.2, span: 14 })
  const build = buildAct(slotOf(0), 1512, 958)
  const acts = [paradeAct(slotOf(1)), grinchAct(slotOf(2)), heistAct(slotOf(3)), carolAct(slotOf(4)), globeAct(slotOf(5), (made[0] ?? 'claude').slice(0, 12))]
  const santaPasses = PASSES.map(() => random() < 0.45)
  if (!santaPasses.includes(true)) santaPasses[Math.floor(random() * santaPasses.length)] = true
  if (!santaPasses.includes(false)) santaPasses[Math.floor(random() * santaPasses.length)] = false
  return {
    markup: build.markup + acts.map(one => one.markup).join(''),
    frames: build.frames + acts.map(one => one.frames).join(''),
    snowman: snowman(1512, 958, build.parts),
    santaPasses,
  }
}

function scene(seed = 0, made: readonly string[] = []): string {
  const stage = show(seed, made)
  const walk = walker()
  const sky = sleigh(stage.santaPasses)
  const roof = roofSled()
  const style = `
text{font-family:ui-monospace,"Cascadia Code","SF Mono",Menlo,Consolas,monospace;font-weight:700}
.g{text-anchor:middle}
.tw{animation:tw 3.6s ease-in-out infinite}
.b1{animation-delay:-.7s}.b2{animation-delay:-1.5s;animation-duration:4.4s}.b3{animation-delay:-2.3s}.b4{animation-delay:-3s;animation-duration:5.2s}
.pulse{animation:pulse 5s ease-in-out infinite alternate}
.spin{animation:spin 70s linear infinite}
.slow{animation:spin 240s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.blink{animation:blink 1.1s steps(1,end) infinite}
.drift{animation:drift 26s ease-in-out infinite alternate}
.smoke{animation:smoke 9.6s linear infinite;opacity:0}
.leg{animation:step .36s steps(1,end) infinite}
.stride{animation:stride .36s steps(1,end) infinite}
@keyframes stride{0%{transform:translate(0,0)}50%{transform:translate(4px,-7px)}}
.trot{animation:trot .3s steps(1,end) infinite}
.off{animation-delay:-.18s}
.trot.off{animation-delay:-.15s}
.hat{animation:nod .72s steps(1,end) infinite}
.pop{transform:translate(0,-22px);animation:pop 17s ease-in-out infinite}
.walker{transform:translateX(848px)}
.wave{animation:wave ${WALK_SECONDS}s linear infinite}
.fly{transform:translate(520px,170px);animation:fly ${FLY_SECONDS}s linear infinite}
.drop{opacity:0}
.roof{opacity:0;animation:roof 23s linear infinite}
.puff{opacity:0;animation:puff 23s linear infinite}
.trip{opacity:0;animation:trip ${TRIPS.length * WALK_SECONDS}s linear infinite}
.trip.t0{opacity:1}
.march{opacity:0;animation:march 97s linear infinite}
.bout{animation:bout 83s linear infinite}
.peek{transform:translateX(58px);animation:peek 31s ease-in-out infinite}
.tip{animation:tip 13s ease-in-out infinite}
.twig{animation:twig 1.1s ease-in-out infinite alternate}
.shoot{opacity:0;animation:shoot linear infinite}
.lob{animation:lob 1.5s linear infinite alternate}
.arc{animation:arc .75s ease-out infinite alternate}
.cheer{animation:step .5s steps(1,end) infinite}
.rise{animation:rise 9s linear infinite;opacity:0}
.bob{animation:bob 2.6s ease-in-out infinite alternate}
.ch{opacity:0;animation:type ${TYPE_SECONDS}s linear infinite}
.ch.m0{opacity:1}
.wipe{transform:translateX(var(--w));animation:wipe ${TYPE_SECONDS}s infinite}
@keyframes wipe{0%{transform:translateX(0)}4.5%,100%{transform:translateX(var(--w))}}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.42}}
@keyframes pulse{from{opacity:.6}to{opacity:1}}
@keyframes smoke{0%{transform:translate(0,0);opacity:0}14%{opacity:.6}100%{transform:translate(54px,-190px);opacity:0}}
@keyframes type{0%{opacity:0}.2%,14.4%{opacity:1}14.6%,100%{opacity:0}}
@keyframes trip{0%,33.2%{opacity:1}33.4%,100%{opacity:0}}
@keyframes march{0%{transform:translateX(-420px);opacity:1}40%,100%{transform:translateX(1680px);opacity:1}}
@keyframes bout{0%,4%{opacity:0;transform:translateY(46px)}8%,58%{opacity:1;transform:translateY(0)}62%,100%{opacity:0;transform:translateY(46px)}}
@keyframes peek{0%,58%{transform:translateX(0)}65%,80%{transform:translateX(58px)}87%,100%{transform:translateX(0)}}
@keyframes tip{0%,78%{transform:translateY(0)}85%{transform:translateY(-16px)}92%,100%{transform:translateY(0)}}
@keyframes twig{from{transform:rotate(-16deg)}to{transform:rotate(12deg)}}
@keyframes shoot{0%{transform:translate(0,0);opacity:0}1.5%{opacity:1}7%,100%{transform:translate(-400px,182px);opacity:0}}
${walk.frames}
${stage.frames}
@keyframes step{0%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes nod{0%{transform:translateY(0)}50%{transform:translateY(-2px)}}
@keyframes trot{0%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes pop{0%,52%{transform:translate(0,34px)}58%,63%{transform:translate(0,-22px)}66%{transform:translate(-4px,-22px)}71%{transform:translate(4px,-22px)}75%,80%{transform:translate(0,-22px)}86%,100%{transform:translate(0,34px)}}
${sky.frames}
${roof.frames}
@keyframes lob{from{transform:translateX(0)}to{transform:translateX(86px)}}
@keyframes arc{from{transform:translateY(0)}to{transform:translateY(-52px)}}
@keyframes rise{0%{transform:translate(0,0);opacity:0}10%{opacity:.9}100%{transform:translate(22px,-150px);opacity:0}}
@keyframes bob{from{transform:translateY(-7px)}to{transform:translateY(7px)}}
@keyframes blink{0%{opacity:1}50%{opacity:0}}
@keyframes fall{from{transform:translateY(0)}to{transform:translateY(${HEIGHT}px)}}
@keyframes sway{from{translate:-22px 0}to{translate:16px 0}}
@keyframes drift{from{transform:translate(0,0) rotate(0deg)}to{transform:translate(-26px,14px) rotate(40deg)}}
`

  const defs = `${SHARED_DEFS}
<radialGradient id="ember"><stop offset="0" stop-color="${CLAY}" stop-opacity=".2"/><stop offset=".55" stop-color="${CLAY}" stop-opacity=".06"/><stop offset="1" stop-color="${CLAY}" stop-opacity="0"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="${CLAY}" stop-opacity=".5"/><stop offset="1" stop-color="${CLAY}" stop-opacity="0"/></radialGradient>
<radialGradient id="north"><stop offset="0" stop-color="${GOLD}" stop-opacity=".2"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#191817"/><stop offset=".7" stop-color="${INK}"/><stop offset="1" stop-color="#2b2926"/></linearGradient>
<radialGradient id="spill"><stop offset="0" stop-color="${GOLD}" stop-opacity=".3"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
<linearGradient id="snowfield" gradientUnits="userSpaceOnUse" x1="0" y1="905" x2="0" y2="1120"><stop offset="0" stop-color="#cfcbbf"/><stop offset=".2" stop-color="#9a968c"/><stop offset="1" stop-color="#4a4743"/></linearGradient>
<linearGradient id="bank" gradientUnits="userSpaceOnUse" x1="0" y1="1004" x2="0" y2="1150"><stop offset="0" stop-color="#b3afa4"/><stop offset=".3" stop-color="#7d7970"/><stop offset="1" stop-color="#3b3835"/></linearGradient>
<linearGradient id="fir" gradientUnits="userSpaceOnUse" x1="0" y1="340" x2="0" y2="880"><stop offset="0" stop-color="#34503f"/><stop offset="1" stop-color="#1c2a22"/></linearGradient>
<radialGradient id="pane"><stop offset="0" stop-color="${GOLD}" stop-opacity=".28"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>`

  const treeX = APEX * CELL_WIDTH + CELL_WIDTH / 2
  const random = seeded(19)
  let small = ''
  for (let index = 0; index < 9; index += 1) {
    const x = 420 + random() * 1120
    const y = 130 + random() * 380
    const colour = index % 3 === 0 ? GOLD : CLAY
    small += `<g class="drift" style="animation-delay:-${index * 3}s">${spark(x, y, 5 + random() * 6, colour, index + 60, `tw b${index % 5}`, 8)}</g>`
  }

  const cover = `viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"`
  // The window is the root's own size: no viewBox, so each piece below chooses the edge it keeps to.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" font-family="monospace" color="#888"><style>${style}</style><defs>${defs}</defs>
<rect width="100%" height="100%" fill="url(#night)"/>
<svg ${cover}>${snow(11, 80, 13, 0.34, 48, 17, "..'*.")}</svg>
<svg x="62%" width="38%" height="52%" viewBox="0 0 520 520" preserveAspectRatio="xMaxYMin meet" overflow="visible">
<g transform="translate(330 200) scale(.8)"><use href="#mark" class="slow" fill="${CLAY}"/></g>
</svg>
<svg viewBox="0 0 ${WIDTH} ${HEIGHT + 150}" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" overflow="visible">
<ellipse cx="${treeX}" cy="700" rx="520" ry="460" fill="url(#ember)"/>
${small}
${shootingStars()}
${ground()}
${tree()}
${starSparks()}
${settled(27, present(27, 43, CLAY, CREAM))}${played('loot', settled(33, present(33, 43, GOLD, CLAY)))}${settled(39, present(39, 43, SAGE, CREAM))}
${smallPine(1092, 922, 15, 11, 14, 81)}${smallPine(1474, 920, 19, 12, 15, 83)}${smallPine(1552, 924, 12, 10, 13, 85)}
${cabin()}
${chimneyClawd()}
${roof.markup}
${sky.markup}
${[1246, 1330, 424].map(x => cane(x, Math.round(groundCrest(x) + 7), 5)).join("")}
<g class="bout">${snowballFight()}</g>
${walk.markup}
${keepsakes(made)}
${stage.snowman}
${stage.markup}
${foreBank()}
${greeting(1272, 1040)}
</svg>
<svg ${cover}>${snow(29, 54, 17, 0.5, 32, 13, '*.+*.')}${snow(53, 20, 22, 0.55, 21, 9, '**+')}${flakes(97, 16, 27, 11)}</svg>
<svg viewBox="0 0 ${WIDTH} 130" width="100%" height="100%" preserveAspectRatio="xMidYMin meet" overflow="visible">${garland()}</svg>
</svg>`
}

export type Mood = 'send' | 'think' | 'done'

const BAND_WIDTH = 720
const BAND_HEIGHT = 84

/** A small wrapped present, its foot at x,base. */
function gift(x: number, base: number, box: string, ribbon: string): string {
  return `<rect x="${x - 12}" y="${base - 20}" width="24" height="20" fill="${box}"/><rect x="${x - 2.5}" y="${base - 20}" width="5" height="20" fill="${ribbon}"/><rect x="${x - 12}" y="${base - 13}" width="24" height="4" fill="${ribbon}"/>`
}

/**
 * The strip above the prompt, a small live scene for what the session is doing: the sleigh dashing off as a message is sent,
 * Clawd hammering at the workshop belt while Claude works, a present bursting open when the answer lands.
 */
export function bandSvg(mood: Mood): string {
  let flakes = ''
  const random = seeded(301)
  for (let index = 0; index < 22; index += 1) {
    const x = random() * BAND_WIDTH
    const y = random() * BAND_HEIGHT
    const r = 0.8 + random() * 1.2
    flakes += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/><circle cx="${n(x)}" cy="${n(y - BAND_HEIGHT)}" r="${n(r)}"/>`
  }
  const floor = BAND_HEIGHT - 16
  let act = ''
  let frames = ''
  if (mood === 'send') {
    act = `<text class="say in" x="${BAND_WIDTH - 24}" y="24" text-anchor="end"><tspan fill="${CLAY}">&gt; </tspan>off to the north pole</text>` +
      `<g class="dash"><g class="bob" transform="translate(0 26) scale(.62)">${team()}</g></g>`
    frames = `.dash{animation:dash 2.8s cubic-bezier(.5,0,.3,1) both}.in{animation:in 2.8s linear both}` +
      `@keyframes dash{from{transform:translateX(-240px)}to{transform:translateX(${BAND_WIDTH + 200}px)}}@keyframes in{0%,45%{opacity:0}70%,100%{opacity:1}}`
  } else if (mood === 'think') {
    let belt = ''
    const colours: ReadonlyArray<readonly [string, string]> = [[CLAY, CREAM], [GOLD, CLAY], [SAGE, CREAM], [HAT_RED, CREAM]]
    for (let index = 0; index < 4; index += 1) {
      const [box, ribbon] = colours[index] ?? [CLAY, CREAM]
      belt += `<g class="ride" style="animation-delay:-${n(index * 2.2)}s">${gift(0, floor - 5, box, ribbon)}</g>`
    }
    const clawdX = 330
    const u = 3.2
    const hitX = clawdX + 14 * u + 22
    act = `<path class="belt" d="M0 ${floor - 3}H${BAND_WIDTH}" stroke="#6f6a5f" stroke-width="4" stroke-dasharray="10 7"/>` + belt +
      `<g transform="translate(${clawdX} ${floor - 5 - 10 * u})">${clawd(u, { legs: 'leg' })}</g>` +
      `<g class="hammer" style="transform-origin:${clawdX + 13 * u}px ${floor - 5 - 6 * u}px"><rect x="${clawdX + 13 * u}" y="${floor - 7 - 6 * u}" width="26" height="4" fill="#9a6b45"/><rect x="${clawdX + 13 * u + 20}" y="${floor - 13 - 6 * u}" width="10" height="16" fill="#c9c5b8"/></g>` +
      `<g class="hit">${spark(hitX, floor - 26, 9, GOLD, 7, '', 8)}</g>` +
      `<path d="M40 ${floor - 5}l-16 0l16 -22l16 22zM40 ${floor - 20}l-12 0l12 -18l12 18z" fill="#27352b" stroke="#8fb996" stroke-width="1.5"/><circle class="tw" cx="34" cy="${floor - 12}" r="2.6" fill="${CLAY}"/><circle class="tw b2" cx="46" cy="${floor - 16}" r="2.6" fill="${GOLD}"/><circle class="tw b3" cx="40" cy="${floor - 28}" r="2.6" fill="${CREAM}"/>` +
      `<text class="say" x="${BAND_WIDTH - 24}" y="24" text-anchor="end">claude.wrap(gifts)<tspan class="tw">.</tspan><tspan class="tw b1">.</tspan><tspan class="tw b2">.</tspan></text>`
    frames = `.ride{animation:ride 8.8s linear infinite}.belt{animation:belt .6s linear infinite}.hammer{animation:hammer .45s ease-in infinite alternate}.hit{animation:hit .9s steps(1,end) infinite}` +
      `@keyframes ride{from{transform:translateX(-30px)}to{transform:translateX(${BAND_WIDTH + 30}px)}}@keyframes belt{to{stroke-dashoffset:-17}}@keyframes hammer{from{transform:rotate(-62deg)}to{transform:rotate(14deg)}}@keyframes hit{0%,45%{opacity:0}50%,80%{opacity:1}85%,100%{opacity:0}}`
  } else {
    const x = BAND_WIDTH / 2
    let burst = ''
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI * (0.08 + (index / 9) * 0.84)
      frames += `@keyframes b${index}{0%{transform:translate(0,0) scale(.4);opacity:0}12%{opacity:1}100%{transform:translate(${n(Math.cos(angle) * 190)}px,${n(Math.sin(angle) * 64)}px) scale(1.2);opacity:0}}`
      burst += `<g style="animation:b${index} 1.9s ease-out ${n((index % 3) * 0.12)}s infinite">${spark(x, floor - 22, 8, [GOLD, CLAY, CREAM, HAT_RED][index % 4] ?? GOLD, index + 200, '', 8)}</g>`
    }
    act = burst + gift(x, floor - 3, HAT_RED, CREAM) + `<g class="lid"><rect x="${x - 14}" y="${floor - 28}" width="28" height="7" fill="${HAT_RED}"/><rect x="${x - 2.5}" y="${floor - 28}" width="5" height="7" fill="${CREAM}"/></g>` +
      `<g class="jump"><g transform="translate(${x - 96} ${floor - 3 - 30})">${clawd(3, { arms: 'cheer' })}</g></g><g class="jump late"><g transform="translate(${x + 60} ${floor - 3 - 30})">${clawd(3, { arms: 'cheer', body: '#e8a084' })}</g></g>` +
      `<text class="say" x="${BAND_WIDTH - 24}" y="24" text-anchor="end"><tspan fill="${SAGE}">[ok] </tspan>delivered</text>`
    frames += `.lid{animation:lid 1.9s ease-out infinite}.jump{animation:jump .42s ease-out infinite alternate}.late{animation-delay:-.21s}` +
      `@keyframes lid{0%{transform:translate(0,0) rotate(0)}25%,80%{transform:translate(18px,-26px) rotate(24deg)}100%{transform:translate(0,0) rotate(0)}}@keyframes jump{from{transform:translateY(0)}to{transform:translateY(-12px)}}`
  }
  const style = `text{font-family:ui-monospace,"Cascadia Code","SF Mono",Menlo,Consolas,monospace}.say{font-size:14px;font-weight:600;fill:#cfcabd}` +
    `.tw{animation:tw 1.2s ease-in-out infinite}.b1{animation-delay:-.3s}.b2{animation-delay:-.6s}.b3{animation-delay:-.9s}.b4{animation-delay:-.45s}` +
    `.leg{animation:step .36s steps(1,end) infinite}.trot{animation:trot .3s steps(1,end) infinite}.off{animation-delay:-.18s}.hat{animation:nod .72s steps(1,end) infinite}.cheer{animation:step .5s steps(1,end) infinite}.bob{animation:bob 1s ease-in-out infinite alternate}` +
    `.snow{animation:snow 7s linear infinite}${frames}` +
    `@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}@keyframes step{0%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes trot{0%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes nod{0%{transform:translateY(0)}50%{transform:translateY(-2px)}}` +
    `@keyframes bob{from{translate:0 -3px}to{translate:0 3px}}@keyframes snow{to{transform:translateY(${BAND_HEIGHT}px)}}@media (prefers-reduced-motion: reduce){*{animation:none!important}}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BAND_WIDTH} ${BAND_HEIGHT}" width="${BAND_WIDTH}" height="${BAND_HEIGHT}" font-family="monospace" color="#888"><style>${style}</style>` +
    `<defs>${SHARED_DEFS}</defs><clipPath id="plate"><rect width="${BAND_WIDTH}" height="${BAND_HEIGHT}" rx="12"/></clipPath><g clip-path="url(#plate)"><rect width="${BAND_WIDTH}" height="${BAND_HEIGHT}" fill="#191817"/>` +
    `<g class="snow" fill="${CREAM}" fill-opacity=".45">${flakes}</g><rect y="${floor}" width="${BAND_WIDTH}" height="16" fill="#34322e"/>${act}</g>` +
    `<rect x=".75" y=".75" width="${BAND_WIDTH - 1.5}" height="${BAND_HEIGHT - 1.5}" rx="12" fill="none" stroke="#45433d" stroke-width="1.5"/></svg>`
}

/**
 * A window that takes its backdrop for a still picture adds `*{animation:none!important}` and strips `!important` from every
 * declaration it reads as an animation. Each of ours is written with its first letter as a CSS escape, which the window does not
 * read and the browser does, and marked important, so the scene keeps moving there.
 * Nothing in a stylesheet outranks those, so reduced motion is kept another way: the keyframes exist only where motion is welcome.
 */
function keepMoving(svg: string): string {
  let frames = ''
  return svg
    .replace(/@keyframes [\w-]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}\n?/g, found => {
      frames += found.trim()
      return ''
    })
    .replace('</style>', () => `@media (prefers-reduced-motion:no-preference){${frames}}</style>`)
    .replace(/(?<![-\w])animation(-[a-z-]+)?:([^;}"]+)/g, (_, part: string | undefined, value: string) => `\\61nimation${part ?? ''}:${value}!important`)
}

// A line of read-outs in the corner while the scene will not move in the window: each word shows only where its kind of motion is let through.
const SHOW = '1s -5s forwards'
const READOUT_CSS =
  `.d{font:600 13px monospace;fill:#faf9f5}.dz{opacity:0}.dA{animation:dshow ${SHOW}}.dB{\\61nimation:dshow ${SHOW}!important}` +
  `.dT{\\61nimation:dtick 10s steps(1,end) infinite!important}.dR{display:none}@media (prefers-reduced-motion:reduce){.dR{display:inline}.dN{display:none}}` +
  `@keyframes dshow{to{opacity:1}}@keyframes dtick{0%{opacity:1}10%,100%{opacity:0}}` +
  // Two style elements in a row at the top mean the window added its own; an escaped `fill` tells whether escapes arrive whole.
  `.dK{display:none}style+style~text>.dK{display:inline}style+style~text>.dk{display:none}.dE{\\66ill:#7ee787}`

function readout(version: string): string {
  let ticks = ''
  for (let digit = 0; digit < 10; digit += 1) ticks += `<text class="d dz dT" x="430" y="100" style="\\61nimation-delay:${digit - 10}s!important">${digit}</text>`
  return `<rect x="8" y="84" width="450" height="46" rx="6" fill="#000" fill-opacity=".55"/>` +
    `<text class="d" x="16" y="122">stilled:<tspan class="dK">YES</tspan><tspan class="dk">no</tspan> escapes:<tspan class="dE">green=ok</tspan>` +
    ` smil:<tspan opacity="0">ON<set attributeName="opacity" to="1"/></tspan></text>` +
    `<text class="d" x="16" y="100">${version} ` +
    `plain:<tspan class="dz dA">ON</tspan> class:<tspan class="dz dB">ON</tspan> inline:<tspan class="dz" style="\\61nimation:dshow ${SHOW}!important">ON</tspan>` +
    ` reduced:<tspan class="dR">YES</tspan><tspan class="dN">no</tspan> tick:</text>${ticks}`
}

/**
 * Where the window plays no motion, the scene still moves a frame at a time: each frame the hooks count puts the sleigh,
 * the sled, the snow and the prompt line a step further on. These are rest states, so the animations override them wherever they do run.
 */
function frameCss(frame: number): string {
  if (frame === 0) return ''
  const sleighX = -160 + ((frame * 130) % 1900)
  const sleighY = 150 + Math.round(Math.sin(frame * 0.8) * 45)
  // Sixteen frames to a delivery: eight out with the present, eight back without it.
  const leg = frame % 16
  const isOut = leg < 8
  const walkerX = isOut ? DOOR_X - ((DOOR_X - DROP_X) * (leg + 1)) / 8 : DROP_X + ((DOOR_X - DROP_X) * (leg - 7)) / 8
  const message = Math.floor(frame / 5) % MESSAGES.length
  const trip = Math.floor(frame / 16) % TRIPS.length
  return `.fly{transform:translate(${sleighX}px,${sleighY}px)}.walker{transform:translateX(${n(walkerX)}px)}` +
    `.cargo{opacity:${isOut ? 1 : 0}}.pile{opacity:${isOut ? 0 : 1}}.trip.t0{opacity:0}.trip.t${trip}{opacity:1}` +
    `.ch.m0{opacity:0}.ch.m${message}{opacity:1}` +
    `.pop{transform:translate(0,${frame % 4 < 2 ? -22 : 34}px)}.peek{transform:translateX(${frame % 6 < 3 ? 58 : 0}px)}` +
    [11, 29, 53].map((seed, index) => `.sn${seed}{transform:translateY(${(frame * (60 + index * 45)) % HEIGHT}px)}`).join('') +
    [0, 1, 2, 3, 4].map(blink => `.tw.b${blink}{opacity:${(blink + frame) % 5 < 2 ? 0.45 : 1}}`).join('')
}

/**
 * The scene. `version` adds the corner read-outs; `frame` is how many steps the session has taken, for a window that plays
 * no motion.
 */
export function christmasEveSvg(version = '', frame = 0, made: readonly string[] = []): string {
  // Plain CSS: every picture the app froze went through the old !important / media rewrite, every one it played did not.
  const svg = pixelated(scene(frame, made))
  if (version === '') return svg
  return svg.replace('</style>', () => `${READOUT_CSS}</style>`).replace(/<\/svg>\s*$/, () => `${readout(version)}</svg>`)
}

/** How many pictures the probe shows: `/christmas probe` walks through them, a few seconds each. */
/** How many pictures the probe shows: `/christmas probe` walks through them, a few seconds each. */
export const PROBES = 4

/** A big number in the corner, so the person can say which picture moved. */
export function probeMark(svg: string, which: number): string {
  const mark = `<rect x="40" y="130" width="160" height="130" rx="14" fill="#000" fill-opacity=".7"/><text x="80" y="230" style="font:700 96px monospace;fill:#faf9f5">${which}</text>`
  return svg.replace(/<\/svg>\s*$/, () => `${mark}</svg>`)
}

/** The main scene's own frame, around one piece, laid over the pines scene whose snow shows whether the window plays motion. */
function overPines(piece: string): string {
  const ours = scene()
  const style = ours.slice(ours.indexOf('<style>') + 7, ours.indexOf('</style>'))
  const defs = ours.slice(ours.indexOf('<defs>'), ours.indexOf('</defs>') + 7)
  return snowPinesSvg().replace(/<\/svg>\s*$/, () =>
    `<style>${style}</style>${defs}<svg viewBox="0 0 ${WIDTH} ${HEIGHT + 150}" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" overflow="visible">${piece}</svg></svg>`)
}

/** 1 pines + our tree (moved before), 2 the scene as shipped, 3 our scene alone with plain CSS, 4 our scene with the old rewrite. */
export function probeSvg(which: number): string {
  if (which === 1) return probeMark(overPines(tree()), 1)
  if (which === 2) return probeMark(christmasEveSvg(), 2)
  if (which === 3) return probeMark(scene(), 3)
  return probeMark(keepMoving(scene()), 4)
}

/** The scene inside the pines scene's document, cropped to cover: the form first seen playing in the app, kept as a fallback. */
export function christmasSafeSvg(): string {
  const own = scene()

  return snowPinesSvg().replace(/<\/svg>\s*$/, () => own.slice(own.indexOf('<style>')))
}

/**
 * The scene as it stands `seconds` after it began: every animation is started that much earlier, so a window that draws
 * it afresh (a tab come back to) shows it where it would be had it never stopped. Only the delays change, by plain numbers.
 */
export function shifted(svg: string, seconds: number): string {
  if (!(seconds > 0)) return svg
  const late = (delay: number): string => `${Math.round((delay - seconds) * 1000) / 1000}s`
  const time = /(^|\s)(-?\d*\.?\d+)s(?=\s|$)/g
  const shorthand = svg.replace(/animation:([^;"}]+)/g, (_whole, value: string) => `animation:${value.split(',').map(one => {
    // In a shorthand the first time is the duration and the second the delay; with no delay, one goes in after the duration.
    let seen = 0
    const out = one.replace(time, (match: string, lead: string, amount: string) => {
      seen += 1
      return seen === 2 ? `${lead}${late(Number(amount))}` : match
    })
    return seen === 1 ? one.replace(/(^|\s)(-?\d*\.?\d+s)(?=\s|$)/, match => `${match} ${late(0)}`) : out
  }).join(',')}`)
  return shorthand.replace(/animation-delay:\s*(-?\d*\.?\d+)s/g, (_whole, amount: string) => `animation-delay:${late(Number(amount))}`)
}

/** A disc of radius r drawn in square steps, as the outline of one closed path. */
function stepped(cx: number, cy: number, r: number): string {
  const rows = Math.max(2, Math.round((2 * r) / Math.min(7, Math.max(3, Math.round(r / 5)))))
  const step = (2 * r) / rows
  const round = (value: number): number => Math.round(value * 10) / 10
  const halves: number[] = []
  for (let row = 0; row < rows; row += 1) {
    const middle = -r + (row + 0.5) * step
    halves.push(Math.max(step, Math.round(Math.sqrt(r * r - middle * middle) / step) * step))
  }
  let d = `M${round(cx - (halves[0] ?? r))} ${round(cy - r)}`
  for (let row = 0; row < rows; row += 1) d += `H${round(cx + (halves[row] ?? r))}V${round(cy - r + (row + 1) * step)}`
  for (let row = rows - 1; row >= 0; row -= 1) d += `H${round(cx - (halves[row] ?? r))}V${round(cy - r + row * step)}`

  return `${d}z`
}

/**
 * The scene with its round things squared off, to match the Clawds: every plain circle becomes a stepped disc (a square
 * when small), and no box keeps a rounded corner. Glows (gradient fills) and dashed rings are left as they are.
 */
function pixelated(svg: string): string {
  const number = (attributes: string, name: string): number => Number(new RegExp(`\\s${name}="([^"]*)"`).exec(attributes)?.[1] ?? 0)

  return svg
    .replace(/<rect\b[^>]*>/g, tag => tag.replace(/\srx="[^"]*"/, ''))
    .replace(/<circle\b([^>]*?)\/>/g, (whole, attributes: string) => {
      if (attributes.includes('url(') || attributes.includes('dasharray')) return whole
      const [cx, cy, r] = [number(attributes, 'cx'), number(attributes, 'cy'), number(attributes, 'r')]
      const rest = attributes.replace(/\s(?:cx|cy|r)="[^"]*"/g, '')
      if (r < 4.6) {
        const side = Math.max(2, Math.round(r * 1.8))

        return `<rect x="${Math.round((cx - side / 2) * 10) / 10}" y="${Math.round((cy - side / 2) * 10) / 10}" width="${side}" height="${side}"${rest}/>`
      }

      return `<path d="${stepped(cx, cy, r)}"${rest}/>`
    })
}
