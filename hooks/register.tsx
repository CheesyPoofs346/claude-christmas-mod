import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { BandMood } from '../types'
import { bandSvg, christmasEveSvg, shifted, christmasSafeSvg, probeMark, probeSvg, PROBES } from './scene'
import type { Mood } from './scene'
import { snowPinesSvg } from './pines'

const PLUGIN = 'christmas'
const SCENE = 'claude-christmas'
const VERSION = '0.21.3'
// A small scene that says on screen what the window lets a backdrop do: /christmas test draws it.
const TEST_SCENE = 'claude-christmas-test'
// The theme-examples mod's own snow scene, unchanged, drawn by this mod: /christmas pines.
const PINES_SCENE = 'claude-christmas-pines'
const TEST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" font-family="monospace" color="#888"><style>' +
  'text{font:600 34px monospace;fill:#faf9f5}.s{transform-box:fill-box;transform-origin:center}.a{animation:spin 2s linear infinite}.b{\\61nimation:spin 2s linear infinite!important}' +
  '.on{opacity:0;animation:show 1s -5s forwards}.rm{display:none}@keyframes spin{to{transform:rotate(360deg)}}@keyframes show{to{opacity:1}}' +
  '@media (prefers-reduced-motion:reduce){.rm{display:inline}.nrm{display:none}}</style><rect width="1600" height="1000" fill="#3a1f24"/>' +
  `<text x="500" y="250">christmas backdrop test ${VERSION}</text>` +
  '<rect class="s a" x="500" y="320" width="90" height="90" fill="#d97757"/><text x="620" y="380">1 plain spin</text>' +
  '<rect class="s b" x="500" y="450" width="90" height="90" fill="#e8b86d"/><text x="620" y="510">2 guarded spin</text>' +
  '<text x="500" y="620">plain animation: <tspan class="on" fill="#8fb996">ALLOWED</tspan></text>' +
  '<text x="500" y="690">reduced motion: <tspan class="rm" fill="#e0524a">ON</tspan><tspan class="nrm" fill="#8fb996">off</tspan></text></svg>'
// No colors are set: the app keeps Claude's own, and the scene is drawn in them.
const glass = { blur: 0, tint: '#1f1e1d', opacity: 0.4 } as const
// How long the sleigh takes to cross the band, and how long the opened present stays.
const SEND_MS = 2800
const DONE_MS = 6500

const idle: BandMood = 'idle'
const mood = atom({ plugin: 'christmas', key: 'mood' } as const, idle)
// How many steps the session has taken: the backdrop is drawn from it.
const frame = atom({ plugin: 'christmas', key: 'frame' } as const, 0)
// The newest things made in this session, newest first: the scene keeps a nod to each.
const noNames: string[] = []
const made = atom({ plugin: 'christmas', key: 'made' } as const, noNames)
// Whether the theme is on: while it is, the reports are a little merrier.
const cheer = atom({ plugin: 'christmas', key: 'cheer' } as const, false)
// When the scene and the music began, on the engine's clock: both are drawn and played from here, wherever the person has been since.
const epoch = atom({ plugin: 'christmas', key: 'epoch' } as const, 0)
// Whether the person asked for no music.
const quiet = atom({ plugin: 'christmas', key: 'quiet' } as const, false)
const MADE_KEPT = 4
// The scene is redrawn with its new keepsakes at the end of a turn, and no more often than this: a redraw starts its motion over.
const REDRAW_MS = 180_000
const CHEER = "IMPORTANT, set by the user: the Christmas theme is on in this session, and the user wants you jolly. Every message you write to the user (answers, questions back, progress notes, summaries) is unmistakably merry and playful: open or close with a bit of festive cheer, and work in a Christmas turn of phrase, a pun or a ho-ho-ho, the way a cheerful workshop elf who loves the job would talk. This holds even when another instruction asks for a terse or plain style: stay short, but jolly. It changes tone only: keep the same accuracy and honesty, say plainly when something is broken or unverified, and keep everything written into files, code, comments, commit messages and commands free of festive wording."

/** A file's name as the scene may show it: the last part of the path, plain characters only, short. */
function nameOf(path: unknown): string | undefined {
  if (typeof path !== 'string') return undefined
  const name = (path.split(/[\\/]/).pop() ?? '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 16)

  return name === '' ? undefined : name
}
let drawnMade = ''
// The music: one quiet loop while the theme is on. `stopMusic` ends it; `lastMusic` says how the last start went.
const MUSIC = 'sounds/ambient.wav'
const MUSIC_GAIN = 0.6
let stopMusic: AbortController | undefined
let lastMusic = 'not started'

// A clip the engine's own player gives up on this soon was never heard: Windows has no player of its own.
const HEARD_MS = 4000
let stopPlayer: (() => void) | undefined

const LOOP_SECONDS = 600
// Reads the loop, turns it round so it begins at XMAS_AT seconds in, and loops that from memory: a seamless loop turned round is still seamless.
const PLAYER = [
  '$b = [IO.File]::ReadAllBytes($env:XMAS_WAV)',
  "$i = [Text.Encoding]::ASCII.GetString($b, 0, 400).IndexOf('data') + 8",
  '$n = $b.Length - $i',
  '$o = ([long]([double]$env:XMAS_AT * 22050) * 2) % $n',
  '$r = New-Object byte[] $b.Length',
  '[Array]::Copy($b, 0, $r, 0, $i)',
  '[Array]::Copy($b, $i + $o, $r, $i, $n - $o)',
  '[Array]::Copy($b, $i, $r, $i + $n - $o, $o)',
  '$p = New-Object System.Media.SoundPlayer (New-Object IO.MemoryStream (,$r))',
  '$p.PlayLooping()',
  'while ($true) { Start-Sleep -Seconds 3600 }',
].join('; ')

/** Windows: the system's own sound player loops the file in a hidden process that lives until it is stopped. */
function startPlayer($: EngineInterface, atSeconds: number): void {
  const file = `${$.plugin.root.replace(/\//g, '\\')}\\sounds\\ambient.wav`
  const child = $.process.spawn({
    argv: ['powershell.exe', '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', PLAYER],
    env: { XMAS_WAV: file, XMAS_AT: String(Math.round(atSeconds * 100) / 100) },
  })
  let isStopped = false
  stopPlayer = () => {
    isStopped = true
    void child.return?.(undefined as never)
  }
  lastMusic = 'playing (system player)'
  void (async () => {
    try {
      for await (const piece of child) {
        if (isStopped) break
        if (piece.stream === 'stderr') lastMusic = `system player said: ${piece.text.trim().slice(0, 160)}`
      }
      if (!isStopped) lastMusic = lastMusic.startsWith('system player said') ? lastMusic : 'system player ended by itself'
    } catch (error) {
      lastMusic = `system player could not start (${reasonOf(error)})`
    }
    if (!isStopped) stopPlayer = undefined
  })()
}

// Whether the engine's own player was heard here: once it is known not to be, the system player is used straight away.
let isEnginePlayerDeaf = false

async function startMusic($: EngineInterface): Promise<void> {
  if (stopMusic !== undefined || stopPlayer !== undefined) return
  const startedAt = await $.clock.now()
  const began = (await read($, epoch)) || startedAt
  const atSeconds = ((startedAt - began) / 1000) % LOOP_SECONDS
  if (isEnginePlayerDeaf) {
    startPlayer($, atSeconds)

    return
  }
  const stop = new AbortController()
  stopMusic = stop
  lastMusic = 'playing'
  const fallBack = async (why: string): Promise<void> => {
    if (stopMusic !== stop) return
    stopMusic = undefined
    const now = await $.clock.now()
    if (now - startedAt < HEARD_MS) {
      isEnginePlayerDeaf = true
      startPlayer($, atSeconds)
    } else lastMusic = why
  }
  // Not awaited: a looping clip's promise settles only when it is stopped.
  void $.audio.play({ asset: MUSIC }, { shouldLoop: true, gain: MUSIC_GAIN, signal: stop.signal }).then(
    () => fallBack('ended by itself'),
    (error: unknown) => fallBack(`could not play (${reasonOf(error)})`),
  )
}

// What the window has told the mod, for /christmas status: how often it joined, left and drew.
let joins = 0
let leaves = 0
let draws = 0
// Whether this window has drawn the Christmas backdrop: the theme is on, whichever chat turned it on.
let isShown = false
const desktops = new Set<string>()

function endMusic(): void {
  stopMusic?.abort()
  stopMusic = undefined
  stopPlayer?.()
  stopPlayer = undefined
  lastMusic = 'stopped'
}
let lastRedrawAt = 0
// Which probe picture is up: /christmas probe walks 1 to PROBES.
const probe = atom({ plugin: 'christmas', key: 'probe' } as const, 1)
const PROBE_SCENE = 'claude-christmas-probe'
const PROBE_MS = 7000
// The scene inside the pines document: the form first seen playing, should the fitted one ever stand still.
const SAFE_SCENE = 'claude-christmas-safe'
const IS_BAND_OFF: boolean = true
// The shortest wait between two frames: every frame redraws the whole backdrop.
const FRAME_MS = 2500

const ALT: Record<Mood, string> = {
  send: 'Santa Clawd dashes off in his sleigh with your message',
  think: 'Clawd hammers at the workshop belt while Claude works',
  done: 'A present bursts open: the answer is delivered',
}

/** The engines this mod meets, for the type checker alone: the theme noun may be absent. */
type AnyEngine = { theme?: { set(args: unknown): Promise<unknown>; clear(): Promise<unknown> } }

// What the last set came to: `/christmas status` tells it.
let lastSet = 'never set'
let safe: string | undefined
let built: string | undefined
let builtFor = -1
let localEpoch = 0
let lastFrameAt = 0

/** One frame on. It never fails the event it rides on. */
async function advance($: EngineInterface): Promise<void> {
  try {
    const now = await $.clock.now()
    if (now - lastFrameAt < FRAME_MS) {
      return
    }
    lastFrameAt = now
    await update($, frame, count => count + 1)
  } catch {
    // The scene stays where it is.
  }
}
const bands = new Map<Mood, string>()

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Engines differ on how a backdrop is named: as a scene with the window's kind beside it, or by id with the kind inside. */
async function setTheme($: AnyEngine, scene: string = SCENE): Promise<boolean> {
  try {
    const answer = await $.theme!.set({ backdrop: { scene, id: scene, glass }, overrideColorScheme: 'dark' })
    lastSet = JSON.stringify(answer)

    return true
  } catch {
    try {
      const answer = await $.theme!.set({ backdrop: { id: scene, colorScheme: 'dark', glass } })
      lastSet = JSON.stringify(answer)

      return true
    } catch (error) {
      lastSet = `refused (${reasonOf(error)})`

      return false
    }
  }
}

export const register: Register = on => {
  // Each change of mood takes the next number, so a timer set for an earlier one finds itself stale.
  let beat = 0

  on('session.start', async ($, e, next) => {
    await setTheme($ as AnyEngine)
    await $.command.register({
      name: 'christmas',
      description: 'Claude Christmas scene behind the chat: /christmas on | off | status | test',
    })

    return next(e)
  })

  on('command.run', { command: 'christmas' }, async ($, e) => {
    const arg = String((e as { args?: unknown }).args ?? '').trim().toLowerCase()
    if (arg === 'off') {
      try {
        endMusic()
        isShown = false
        await update($, cheer, () => false)
        await ($ as AnyEngine).theme!.clear()

        return { text: 'Christmas theme off.' }
      } catch (error) {
        return { text: `Nothing to clear (${reasonOf(error)}).` }
      }
    }
    if (arg === 'quiet') {
      await update($, quiet, () => true)
      endMusic()

      return { text: 'Christmas music off. /christmas music turns it back on.' }
    }
    if (arg === 'music') {
      await update($, quiet, () => false)
      await startMusic($)

      return { text: 'Christmas music on. /christmas quiet turns it off.' }
    }
    if (arg === 'status') {
      return { text: `Christmas theme ${VERSION}, scene ${(built ??= christmasEveSvg(VERSION)).length} characters. Last set: ${lastSet}. Band: ${await read($, mood)}. Music: ${lastMusic}. Window: joined ${joins}, left ${leaves}, drew ${draws}.` }
    }

    if (arg === 'probe') {
      await update($, probe, () => 1)
      await setTheme($ as AnyEngine, PROBE_SCENE)
      for (let which = 2; which <= PROBES; which += 1) {
        await $.clock.after(PROBE_MS * (which - 1), async () => {
          await update($, probe, () => which)
        })
      }

      return { text: `Probe: ${PROBES} numbered pictures, 7 seconds each. Note the numbers whose orange square is turning. /christmas on puts the scene back.` }
    }
    if (arg === 'pines') {
      await setTheme($ as AnyEngine, PINES_SCENE)

      return { text: 'The theme-examples snow scene, drawn by this mod: /christmas on puts the scene back.' }
    }
    if (arg === 'safe') {
      await setTheme($ as AnyEngine, SAFE_SCENE)

      return { text: 'Christmas theme on, in its fallback form (cropped to cover).' }
    }
    if (arg === 'test') {
      await setTheme($ as AnyEngine, TEST_SCENE)

      return { text: `Backdrop test ${VERSION} drawn: /christmas on puts the scene back.` }
    }

    await update($, cheer, () => true)
    const startedAt = await $.clock.now()
    if ((await read($, epoch)) === 0) await update($, epoch, () => startedAt)
    if (!(await read($, quiet))) await startMusic($)
    lastRedrawAt = startedAt
    drawnMade = (await read($, made)).join(' ')
    await update($, frame, count => count + 1)

    return { text: (await setTheme($ as AnyEngine)) ? 'Christmas theme on.' : `Christmas theme could not be set: ${lastSet}.` }
  })

  // `/custom-theme christmas` sets this scene too: the command is the theme-examples mod's, and every other word goes on to it.
  on('command.run', { command: 'custom-theme' }, async ($, e, next) => {
    if (String((e as { args?: unknown }).args ?? '').trim().toLowerCase() !== 'christmas') {
      return next(e)
    }

    return { text: (await setTheme($ as AnyEngine)) ? 'Christmas theme on.' : `Christmas theme could not be set: ${lastSet}.` }
  })

  on('prompt.submit', async ($, e, next) => {
    // A slash command starts no turn: the band keeps quiet.
    if ((e as { command?: unknown }).command) {
      return next(e)
    }
    beat += 1
    const mine = beat
    await update($, mood, () => 'send')
    await $.clock.after(SEND_MS, async () => {
      if (mine === beat) {
        await update($, mood, now => (now === 'send' ? 'think' : now))
      }
    })

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    try {
      const call = e as { tool?: unknown; file_path?: unknown; input?: { file_path?: unknown } }
      const name = call.tool === 'Write' || call.tool === 'Edit' ? nameOf(call.file_path ?? call.input?.file_path) : undefined
      if (name !== undefined && (await read($, made))[0] !== name) {
        await update($, made, names => [name, ...names.filter(other => other !== name)].slice(0, MADE_KEPT))
      }
    } catch {
      // The call goes on whatever the scene makes of it.
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    try {
      const names = (await read($, made)).join(' ')
      const now = await $.clock.now()
      if (names !== drawnMade && now - lastRedrawAt >= REDRAW_MS) {
        drawnMade = names
        lastRedrawAt = now
        await update($, frame, count => count + 1)
      }
    } catch {
      // The scene stays as it is.
    }
    beat += 1
    const mine = beat
    // Only an answer is a delivery: a stopped or failed turn just clears the band.
    if (e.reason !== 'answer') {
      await update($, mood, () => 'idle')

      return next(e)
    }
    await update($, mood, () => 'done')
    await $.clock.after(DONE_MS, async () => {
      if (mine === beat) {
        await update($, mood, () => 'idle')
      }
    })

    return next(e)
  })

  on('turn.abort', async ($, e, next) => {
    beat += 1
    await update($, mood, () => 'idle')

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, mood)
    // Only a window's table has `Svg`.
    // The strip is off for now: its acts are to move into the scene itself once the scene plays in the window.
    if (IS_BAND_OFF || now === 'idle' || e.surface !== 'desktop' || e.props.hasSurvey) {
      return next(e)
    }
    let source = bands.get(now)
    if (source === undefined) {
      source = bandSvg(now)
      bands.set(now, source)
    }
    const { Svg } = $.ui.resolve(e)

    // The size is said outright: a frame with none is drawn at the browser's own 300 by 150.
    return <Svg isInteractive alt={ALT[now]} source={source} width={720} height={84} />
  })

  // The music follows the window: it plays while a desktop window shows this session and stops when the last one leaves.
  on('session.attach', async ($, e, next) => {
    const joined = await next(e)
    try {
      if (e.surface === 'desktop') {
        joins += 1
        desktops.add(e.clientId)
        if ((isShown || (await read($, cheer))) && !(await read($, quiet))) await startMusic($)
      }
    } catch {
      // Joining goes on.
    }

    return joined
  })

  on('session.detach', async ($, e, next) => {
    try {
      if (e.surface === 'desktop') {
        leaves += 1
        desktops.delete(e.clientId)
        if (desktops.size === 0) endMusic()
      }
    } catch {
      // Leaving goes on.
    }

    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    try {
      if (!isShown && !(await read($, cheer))) return composed
    } catch {
      return composed
    }

    return { ...composed, sections: [...composed.sections, { id: 'christmas-cheer', text: CHEER, scope: 'session' as const }] }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    const props = e.props as { plugin?: unknown; scene?: unknown; id?: unknown }
    // Only a window has room behind the chat, and only its table has `Svg`.
    if (props.plugin !== PLUGIN || e.surface !== 'desktop') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    if (props.scene === PROBE_SCENE || props.id === PROBE_SCENE) {
      const which = await read($, probe)

      return <Svg isInteractive alt={`Probe picture ${which}`} source={probeSvg(which)} />
    }
    if (props.scene === PINES_SCENE || props.id === PINES_SCENE) {
      return <Svg isInteractive alt="Snow falling over pines" source={snowPinesSvg()} />
    }
    if (props.scene === SAFE_SCENE || props.id === SAFE_SCENE) {
      return <Svg isInteractive alt="Claude Christmas scene" source={(safe ??= christmasSafeSvg())} />
    }
    if (props.scene === TEST_SCENE || props.id === TEST_SCENE) {
      return <Svg isInteractive alt="Backdrop test: two squares and what the window allows" source={TEST_SVG} />
    }
    draws += 1
    isShown = true
    try {
      if (!(await read($, quiet))) await startMusic($)
    } catch {
      // The scene is drawn whatever the music does.
    }
    const at = await read($, frame)
    const now = await $.clock.now()
    const began = (await read($, epoch)) || (localEpoch ||= now)
    if (built === undefined || builtFor !== at) {
      // One seed for the whole sitting, so a redraw for a new keepsake changes nothing else.
      built = christmasEveSvg('', Math.floor(began / 1000) % 1_000_000, await read($, made))
      builtFor = at
    }

    return (
      <Svg
        isInteractive
        alt="Claude Christmas: a tree set in code with spark ornaments, a cabin among pines, falling snow, and Clawd in a santa hat delivering presents by sled"
        source={shifted(built, (now - began) / 1000)}
      />
    )
  })
}
