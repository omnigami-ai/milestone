---
name: milestone
description: Make a 14-second milestone video for a product on its real screens - one tap on the action the product counts, that one result lifting out of the app and multiplying into thousands as a counter rolls to the number, a thank-you, and the field of results closing into the app's icon. Renders a tall (9:16) MP4 with sound. Use when the user asks for a milestone, "we hit N users", thank-you, anniversary or celebration video for their product.
---

# Milestone

You make a 14-second film for a number the product has reached. It starts
with the one action the number counts, done once on the product's real
screen ("One tap." "Water Monty": his ring fills, "One plant, watered."),
then that one result lifts out of the app and multiplies, from a handful to
thousands, as a counter rolls from 1 to the milestone ("1,000,000 plants
watered on time."). "Thank you." Then the field of results closes into the
app's icon and the end card.

You work by **adapting a finished film**: `reference/` is a complete film
for Fernwise (a fictional plant-care app made for omnigami's examples), on
Monty's real plant page, captured as his ring fills, and every plant's
portrait. Keep its motion; change its content. The film is tall (1080 × 1920).

Read `style.md` before you start and `critique.md` before you judge.

## Before you start

1. **Check the tools:** `node -v` (20 or later), `ffmpeg -version`, and a Chrome, Chromium, Edge or Brave install (`scripts/chrome.mjs` finds it; `CHROME_PATH` overrides). If something is missing, say how to install it and stop.
2. **Ask once, in one message,** for what the user hasn't given: the product's URL (and a demo account if needed), the milestone (the real number, and what it counts), and its tagline. **Never invent or round up the number:** use the one the user gives you, and say in the caption what it counts.

## Steps

`SKILL_DIR` is the folder this file is in. Work in `milestone-film/` in the current directory.

1. **Set up.**
   ```bash
   mkdir -p milestone-film && cp -R "$SKILL_DIR/reference" milestone-film/reference && cp -R "$SKILL_DIR/reference" milestone-film/film && cp -R "$SKILL_DIR/scripts" milestone-film/scripts
   rm -rf milestone-film/reference/out milestone-film/film/out
   cd milestone-film && npm init -y >/dev/null && npm i -D puppeteer-core
   ```
2. **Learn the product.** `node scripts/capture.mjs <url> capture`, then look at every screenshot and read `capture/brand.json`.
3. **Map the story.** Find the **one action** the milestone counts and the screen it happens on (Fernwise: watering, on a plant's page), and **the one result** it leaves (Monty's full ring). The result must be a small, self-contained thing the product really shows, so that many of them make a field: a portrait, a card, a tile, a photo, an avatar. Stand-ins: a booking → its stay's photo; a message → its bubble; a file → its thumbnail; a user → an avatar (initials or an illustration, never AI photos of people). Write the story in one sentence and the state list to `film/STATES.md`.
4. **Capture.** Write `film/plans/mobile.json` in the shape of `reference/plans/mobile.json` (format at the top of `scripts/screens.mjs`), 390 × 844 at scale 4: the screen before the action (`plant-000`), the screen after the action (`plant-100`, by clicking the real button), and one capture of the result per kind of object (`portrait-<id>`, around the element). Record the rects of the result and the button. Then:
   ```bash
   node scripts/screens.mjs film/plans/mobile.json film/assets/screens
   (printf 'window.SCREENS = '; cat film/assets/screens/screens.json; printf ';\n') > film/assets/screens/screens.js
   ```
5. **Adapt `film/index.html`:**
   - `DEFAULTS` and `FIELDS`: the lines, the number (digits and separators: the counter rolls to it), what it counts, the thanks, the name and tagline.
   - `PLANTS` and `plantAt`: the kinds of result and how they mix in the field (no two the same side by side). `portrait()` draws one, round, from a pre-scaled copy; make it the result's own shape.
   - `pageAt`, `ring`, `fillAt`, `SCR.rects.plant`: which capture shows when, the result appearing as the app draws it (its geometry and colours, from the product's own code or styles), and where the result and the button are.
   - colour and type: `GROUND`, `CREAM`, `SPROUT`, `MOSS`, the product's faces, and `MARK` (its mark as a `Path2D`) for the icon.
   Keep the motion code: the tap and its press, the push, the lift, the field's growth (one ring of results at a time) and zoom, the counter, the close.
6. **Check:** `node scripts/compare.mjs reference film out/compare-9x16.png --size 9:16`, `node scripts/render.mjs film --size 9:16 --stress` and `--phone`. Fix anything that fails `critique.md`.
7. **Check the motion** on strips of consecutive frames from the MP4 (step 9): the tap and the fill (1.9–3.3), the lift (4.4–5.7), the field and counter (5.1–8.0), the close (10.7–12.0). The lifted result is never shown twice, and the counter is readable against the field at every frame. Then get a fresh judgement, from a sub-agent with only `critique.md` and the images if you can start one.
8. **Check it's repeatable:** `node scripts/render.mjs film --size 9:16 --check`.
9. **Render.** `node scripts/render.mjs film --size 9:16 --video --blur 4 --music --sound --poster 8.3` writes `out/9x16.mp4`, 60 fps, about −14 LUFS, and a poster.
10. **Write `milestone-film/README.md`** and `out/CAPTION.md` (under 280 characters, the product's words, its URL; the real number and what it counts).
11. **Report:** the MP4, the poster, the caption, the story and state list, the scores, and the one change that would improve it most.

## Rules

- **The real number,** from the user, never rounded up or invented; the counter ends on exactly it.
- **The real action and result,** captured from the product; the field is made only of the product's own results.
- **Let each beat land:** the action is seen before it's tapped, its result holds before it lifts, the number holds with its line before the thanks, the thanks before the close.
- **Keep the motion** (`style.md`): press states, one-step moves, nothing shown twice.
- **Engine rules:** `seek(t)` paints from its arguments only; every file inside `film/`.
- **Only the user's brand;** the phone is the reference's unbranded photograph.

## Files

- `reference/`: the Fernwise film (`index.html`), its capture plan and captures (`assets/screens/`), the unbranded phone, fonts (Fraunces, Nunito; SIL Open Font License), `kit.js`. Fernwise is a fictional company made for omnigami's examples.
- `scripts/`, `style.md`, `critique.md`.

This skill's motion is omnigami's own; it isn't a study of another film.

This skill is omnigami's (https://omnigami.ai), © 2026 Auberon LLC. Use what it makes for anything,
commercial work included, and change the skill for your own use; don't redistribute or
sell the skill. Full terms: https://github.com/omnigami-ai/skills/blob/main/LICENSE.md
