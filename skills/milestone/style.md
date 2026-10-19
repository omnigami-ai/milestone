# Milestone: style

omnigami's own grammar for one announcement: a number the product has
reached, shown as the one action it counts, done once, then multiplied.

## The grammar

- **One, then many.** The film earns its number: first the single real action on the product's screen, its result held, then that same result multiplying into a field of thousands. The counter rolls as the field grows, so the number and the picture say the same thing.
- **The result fills smoothly.** Where the app animates its result (Fernwise's ring), the film draws it the app's own way (its geometry, its colours) over the page before the action, with a soft start and a soft landing (ease in-out, quartic, 1.1 s), and hands off to the real page after the action. Never step through captures: steps read as stutter.
- **The lift has depth.** The result comes toward the camera (18 % larger, on a growing soft shadow) while the phone falls back out of focus: smaller, blurred (to 18 px), darker, then sinking away. The page keeps an empty space where the result was; the result is never shown twice. A flat slide reads as a paper cut-out.
- **The field** grows one ring at a time around the first result (each ring 0.32 s × log₂ of its distance later, on a spring), and the camera pulls back in one move, size eased in log space, until each result is a speck.
- **Seen through a lens.** As the camera pulls back: a zoom blur in step with its speed (five copies, each 2.2 % larger and fainter), the edges out of focus (a blurred copy masked to the edges, easing to a little once the camera settles), and a vignette. All three ease away as the field closes into the icon.
- **The number** rolls from 1, slowly then fast (an exponent curve), lands on exactly the milestone with a small pop, and holds with its line; the field dims behind it. Then the thanks, in the italic accent.
- **The close:** the field lights up again and shrinks, its corners rounding, into the app's icon; it turns the icon's colour as it shrinks, fully before it lands; the mark (the app's own cream mark, at 62.5 % of the tile, centred as the app icon has it) springs in; the name and tagline rise.
- **Text rises out of a mask line** and leaves through the top; no line rises into the one above.

## The beats (120 BPM; t = when it starts)

| t (s) | State | What happens |
|---|---|---|
| 0.3 | "One tap." | rises; the phone rises in with the screen before the action (0.45) |
| 1.55 | touch | a soft touch settles on the button |
| 2.0 | tap | the button sinks and lights; the result fills (2.05–3.15); the camera pushes in on it (to 1.4×) |
| 3.18 | done | the real screen after the action; "One plant, watered." (3.37) |
| 4.4 | lift | the result comes forward and to the middle; the phone falls back out of focus and sinks (to 5.7) |
| 5.1 | many | the field grows ring by ring; the camera pulls back (5.2–8.0) through the lens |
| 5.3 | the number | rolls from 1 to the milestone (to 7.9); its line (8.1); the thanks (9.45) |
| 10.75 | out | the words leave |
| 10.85 | close | the field closes into the icon, turning green as it goes (to 11.75); the mark (11.8); the name (12.2); the tagline (12.5); held to 14 |

## Type

| Where | Face | Size |
|---|---|---|
| the first lines | display (Fraunces, soft) | 120, fitted to 960 |
| the number | display | 230, fitted to 900, a soft dark shadow |
| what it counts | text (Nunito 700) | 58 |
| the thanks | italic, accent | 96 |
| end card: name / tagline | display / italic | 132 / 58 |

## Sound

A `pop` on each line, a `tap` on the action, `swish`es on the phone's moves,
the lift, the pull-back and the close (with their `motion`), ten `tick`s
quickening with the counter, a stronger `pop` as it lands. No impacts or
risers. A 120 BPM bed: quiet, the beat in from the action to the number,
pads for the thanks and the end card. About −14 LUFS.

## Banned

An invented or rounded-up number; a field made of anything but the product's
own results; the result shown twice; a counter that can't be read over the
field; crossfades; cuts; 3D; particles; another company's name, logo or UI.

## Engine rules

- `seek(t, values)` paints from its arguments only: no `Date`, `performance.now()`, unseeded `Math.random`, timers or network.
- CPU-backed canvases (`getContext('2d', { willReadFrequently: true })`) for the frame and every helper (the pre-scaled results, the far field).
- `ctx.reset()` at the start of every frame.
- Every file the film loads is inside its folder; fonts load in `prepare()`.
