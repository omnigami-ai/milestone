# Milestone · omnigami

One tap, a million times. Celebrate the number.

A 14-second milestone film on your real screens. The one action your number counts, done once on your product, then its result lifts out of the app and multiplies into thousands as a counter rolls to your milestone. A thank-you, and the field closes into your app’s icon.

Watch it play live, and change its words, at [omnigami.ai/skills/milestone](https://omnigami.ai/skills/milestone).

## Install

In Claude Code:

```
/plugin marketplace add omnigami-ai/skills
/plugin install milestone@omnigami
```

With the skills CLI, for Claude Code and other agents that read SKILL.md:

```bash
npx skills add omnigami-ai/milestone
```

Or copy `skills/milestone/` into your agent's skills folder (for Claude Code, `~/.claude/skills/milestone/`). Then ask:

```
Make a milestone video for https://your-product.com: we just passed 1,000,000 orders
```

## What it runs

The skill works on your computer. It runs the Node scripts in `skills/milestone/scripts/`: they open your product's pages in a local headless browser to capture its real screens, then render the film with that browser and ffmpeg, writing MP4s and an editable HTML film to your project. It sends nothing to omnigami or anyone else, and uses no network beyond loading your own product's pages and the fonts and assets in this folder.

## You need

- Claude Code with Opus 5.5
- Node 20 or later
- ffmpeg
- Chrome, Chromium, Edge or Brave

None beyond your Claude plan’s usage. Node, ffmpeg and the browser are free.

## Licence

Free to use. Use the films and anything else the skill makes for anything, commercial work included. Don't redistribute the skill. See [LICENSE.md](LICENSE.md). The bundled fonts keep their own licence (SIL Open Font License, beside them in `reference/assets/fonts/`).

## Credits

Its motion is omnigami’s own. Its example shows Fernwise, a fictional company made for omnigami’s examples, with sample data.

omnigami is not affiliated with Anthropic. More skills at [omnigami.ai](https://omnigami.ai).
