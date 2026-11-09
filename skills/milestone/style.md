# Milestone: style

omnigami's own grammar for one announcement: a number the product has
reached, shown as the one action it counts, done once, then multiplied.

## The grammar

- **One, then many.** The film earns its number: first the single real action on the product's screen, its result held, then that same result multiplying into a field of thousands. The counter rolls as the field grows, so the number and the picture say the same thing.
- **The result fills smoothly.** Where the app animates its result (Fernwise's ring), the film draws it the app's own way (its geometry, its colours) over the page before the action, with a soft start and a soft landing (ease in-out, quartic, 1.1 s), and hands off to the real page after the action. Never step through captures: steps read as stutter.
- **The lift has depth.** The result comes toward the camera (18 % larger, on a growing soft shadow) while the phone falls back out of focus: smaller, blurred (to 18 px), darker, then sinking away. The page keeps an empty space where the result was; the result is never shown twice. A flat slide reads as a paper cut-out.
- **The field has depth.** Near results spring in one ring at a time (each ring 0.32 s × log₂ of its distance later). Across the whole pull-back and count, the even cells slowly loosen into a dispersed, uneven drift, with unequal sizes and depths, plus seeded distant subjects. Each subject has its own easing and slight timing offset; none finishes travelling before the count and pull-back finish. The same real results move throughout: the original and a few neighbours stay recognisable, while the rest lose focus and dissolve into bokeh before the spacing can alias. Optical softening and travel have separate timing. No miniature grid or dot texture. During the hold, independent, very slow drift keeps the field alive and the number's ground calm.
- **One lens, one light.** Every subject uses the same reciprocal-depth focus equation, including the broad foreground blur and intermediate neighbours. Monty anchors the focus plane. The camera retreats smoothly through the dispersed subjects and slows after the count lands. Soft portrait edges, reflected green light, a common grade, local darkening, vignette and fixed fine grain bind all depths; there is no sharp group pasted above a blurred background. Draw the counter and all lines afterwards, entirely crisp.
- **The number** rolls from 1, slowly then fast (an exponent curve), lands on exactly the milestone with a small pop, and holds with its line; the depth scene keeps quiet ground behind it, including mid-roll. Then the thanks, in the italic accent.
- **The close:** the same square of depth shrinks, its corners rounding, into the app's icon on the existing size and timing curve; depth compresses and the app's green covers the subjects before it lands; the mark (the app's own cream mark, at 62.5 % of the tile, centred as the app icon has it) springs in; the name and tagline rise.
- **Text rises out of a mask line** and leaves through the top; no line rises into the one above.
- **Room where the viewer needs it.** The film keeps its pace, with no pauses for their own sake: the counter, the field and the close are the product's own result multiplying and run straight through. The room goes where the viewer has something to find or read (the founder, 2026-10-22): a beat after the phone rises before the touch settles on the button (the eye finds it first; the touch then rests 0.45 s and taps), a beat on "One plant, watered." before it lifts, a beat on the number and its line before the thanks, and a beat on the thanks before the words leave. Each line holds at least a second once it has landed, about a quarter second a word. Held type stays still while the field drifts very slowly.

## The beats (120 BPM, 32 beats, 16 s; t = when it starts)

The film's `T` is written on the original 14 s grid and shifted by `INSERTS` (a beat each before 1.5, 4.3, 9.4 and 10.7 s): these are the times it plays at.

| t (s) | State | What happens |
|---|---|---|
| 0.3 | "One tap." | rises; the phone rises in with the screen before the action (0.45) |
| 2.05 | touch | a beat after the phone lands, a soft touch settles on the button |
| 2.5 | tap | the button sinks and lights; the result fills (2.55–3.65); the camera pushes in on it (to 1.4×) |
| 3.68 | done | the real screen after the action; "One plant, watered." (3.87), held 1.2 s |
| 5.4 | lift | the result comes forward and to the middle; the phone falls back out of focus and sinks (to 6.7) |
| 6.1 | many | near results spring in; pull-back (6.2–9.0); softness grows (6.55–7.6) while individual cells travel gradually (about 6.5–9.48), settling only after the count and pull; very slow drift through the hold |
| 6.3 | the number | rolls from 1 to the milestone (to 8.9); its line (9.1), read 1.5 s; the thanks (10.95), read 1.5 s |
| 12.75 | out | the words leave |
| 12.85 | close | the field closes into the icon, turning green as it goes (to 13.75); the mark (13.8); the name (14.2); the tagline (14.5); held to 16 |

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
risers. The skill's own song (`music/song.mp3`, bright, uplifting electro-pop at
120 BPM), landing one hit near the end as its drums stop and the rest fades;
with `--music`, the synthesised 120 BPM score instead: quiet, the beat in from
the action to the number, pads for the thanks and the end card. About −14 LUFS.

The score's sound is `music.style`: here `'organic'` (plucked strings, a marimba, a shaker), as the reference's plants or botanicals brand has it. For the user's product, pick by what it is: `'organic'` for plants, food and drink, and other natural or handmade things; `'synth'` (oscillators, the default) for software and tools; `'felt'` (a sparse felt piano over a sub bass and a light kit) for a quiet, minimal film. In a break (`music.breaks`) the drums, bass and lead stop and the chords play on; the film's name seeds the key (always major), the progressions and the patterns.

## Banned

An invented or rounded-up number; a field made of anything but the product's
own results; a flat miniature grid; separate sharp and blurred layers; the result shown twice; a counter that can't be read over the
field; crossfades; cuts; 3D; particles; another company's name, logo or UI.

## Engine rules

- `seek(t, values)` paints from its arguments only: no `Date`, `performance.now()`, unseeded `Math.random`, timers or network.
- CPU-backed canvases (`getContext('2d', { willReadFrequently: true })`) for the frame and every helper (the pre-scaled results, sprites and depth scene).
- `ctx.reset()` at the start of every frame.
- Every file the film loads is inside its folder; fonts load in `prepare()`.
