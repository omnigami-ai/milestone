# Milestone: critique

Judge the film as a stranger seeing it in a feed, with the sound off first.

Look at: the key-frame sheet (`node scripts/render.mjs film --size 9:16 --times key --sheet`), the quick test's sheets (`--stress`), the phone sheet (`--phone`), strips of consecutive frames from the MP4 at the tap, the lift, the field, the counter's landing and the close, and the MP4 twice (picture, then sound).

## Score each 1–10 (nothing ships under 8)

1. **The point:** with the sound off, a stranger can say the number, what it counts and whose it is.
2. **Truth:** the number is the user's, exactly; the action, its result and the field are the product's own, captured.
3. **One, then many:** the single action reads before anything multiplies; the field is clearly made of that result.
4. **Readability:** every line read before the next; the counter readable over the field at every frame; nothing under 28 px on the phone sheet.
5. **Motion:** the result fills smoothly, never in steps; the lift has depth (the result forward, the phone back out of focus), never a flat cut-out sliding; the pull-back feels like a camera (zoom blur, soft edges); the close one move; the result never shown twice; nothing pops in a single frame.
6. **Rhythm and sound:** the tap, the landing and the mark on beats; ticks quicken with the counter; nothing harsh.
7. **Brand:** the product's ground, type, accent and mark.

## Hunt for

- **Breathing room** (a failure here caps the film at 7): an action the viewer can't follow on one viewing: a click within half a second of the camera or cursor arriving, a result gone in under a second, a caption or headline replaced before it can be read. Lengthen the film rather than compress the holds.
- **Type centred in its container** (pills, buttons, chips, badges, a word beside a mark): the capitals sit on the container's centre line, measured, not by eye. Words that ride high are the usual fault (textBaseline 'middle' and CSS line boxes both centre the font's em box, not the letters); draw with `kit.centreText`, and in HTML use `text-box: trim-both cap alphabetic` with equal padding. The quick test fails canvas text set with 'middle'; captured screens and HTML are checked on the stills.
- **The film's own shapes, finished:** every click has a press state on its visual onset (what's pressed sinks a few percent and lights or darkens, then comes back), and a held control shows it's held; apertures and reveals are clean circles or the product's own shapes, never blades or drawn lines; a shape that becomes another does it in one continuous move, not a chain of in-between shapes; a pulse is one thin ring that thins as it grows; nothing (a check, a label, an icon) vanishes or appears in a single frame at a hand-off: it moves, shrinks or is covered. Check each on a strip of consecutive frames from the MP4.
- a second copy of the result while it lifts (on the page and in the field);
- a field of square tiles when the result is round (or the reverse): the capture's background must not show;
- a counter that jumps (it must pass through every order of magnitude) or ends on anything but the exact number.

For each issue write the time, what's wrong and the exact fix. Fix the worst three, review again, score again. After three rounds, report what remains.

With each fix, write what it must keep (the timing, sizes and moves already right) and the times to look at again; look at them, and at the cuts either side, before scoring again. If the same problem survives two fixes, stop fixing it and report it with what you tried. Never loosen a check, a size floor or the bar to get a pass.
