# Christmas theme mod (v0.21.3)

A snowy code-tree scene behind the chat, plus a live Clawd workshop band above the prompt while Claude works. Plugin name: `christmas`.

## What's in the repo

- `.claude-plugin/plugin.json`: plugin manifest
- `hooks/register.tsx`: registers the scene, band and slash commands (`/christmas`)
- `hooks/scene.ts`, `hooks/pines.ts`: SVG scene generation
- `types/index.d.ts`: the plugin's state type
- `sounds/ambient.wav`: looping ambient track (see credits)
- `sounds/CREDITS.txt`: attribution

## Requirements

- Claude desktop app / Claude Code with the local mods plugin host. The mod imports from the `claude-code` host module, so it will not run in a plain terminal session.
- A local marketplace named `local-mods` (a folder with `.claude-plugin/marketplace.json`).

## Install

1. Clone this repo into the local marketplace's `mods` folder:

   ```bash
   git clone https://github.com/CheesyPoofs346/claude-christmas-mod.git "$HOME/.claude/local-mods/mods/christmas"
   ```

   On Windows (Git Bash or PowerShell), the same path is `%USERPROFILE%\.claude\local-mods\mods\christmas`.

2. Make sure `$HOME/.claude/local-mods/.claude-plugin/marketplace.json` lists the plugin. Add this entry to its `plugins` array if it is missing:

   ```json
   { "name": "christmas", "source": "./mods/christmas", "description": "Christmas theme" }
   ```

3. Install the plugin from the marketplace, then restart the app or session:

   ```
   /plugin install christmas@local-mods
   ```

   The exact install command depends on your app version. If it differs, use your app's plugin or mods manager to enable the `christmas` plugin from `local-mods`.

## Check that it works

- `/christmas test` draws a test scene that shows what the backdrop can do.
- `/christmas pines` draws the snow-pines scene.
- Send a chat message: the band above the prompt should animate while Claude works.

## Updating

```bash
git -C "$HOME/.claude/local-mods/mods/christmas" pull
```

Then restart the session.

## Credits

The ambient track is based on "Wish Background" by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0. Modified: see `sounds/CREDITS.txt`. Keep that file when redistributing.
