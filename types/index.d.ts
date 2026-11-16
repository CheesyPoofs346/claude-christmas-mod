/** What the band above the prompt plays: nothing, the sleigh dashing off, the workshop, the present opening. */
export type BandMood = 'idle' | 'send' | 'think' | 'done'

declare module 'claude-code' {
  interface PluginState {
    christmas: { mood: BandMood; frame: number; probe: number; made: string[]; cheer: boolean; quiet: boolean; epoch: number }
  }
}
