# Voice direction for the bedtime fables

How to perform a fable script with the ElevenLabs `eleven_v3` voices so it sounds like a
wonderful bedtime storyteller, not a reading. Worked example: `fables/milkmaid/script.json`.

## How a line is voiced

- Captions use `text`. The voice speaks `speech` if it is set, otherwise the voice's default
  `tag` + `text`. `text` stays clean. `speech` must have the same words in the same order; you may
  only add `[tags]` and change punctuation.
- Give every narrator line its own `speech`. The voice's default tag is only a fallback.
- `pause` (in seconds, after the line, times `pause_scale` in voices.json) sets the rhythm *between* lines.
  Tags and punctuation set the rhythm *inside* a line.
- `speed_scale` (per line): `eleven_v3` **ignores the API speed setting** (we tested 0.7 and 1.2
  and both takes came out the same length), so `tools/tts.py` time-stretches the finished take with
  rubberband instead. Use it only to slow things down, with values between 0.88 and 1.0. Below that,
  the voice starts to sound stretched.

## The narrator: a grandfather by the fire

Peter is a beloved grandfather telling the story to one child at bedtime. He is warm and
intimate, never in a hurry, and you can hear the smile in his voice. He is playful in the funny bits and
quieter in the tender or suspenseful bits. He is never theatrical, never loud, never a "voice-over".
Over the last scene he gets gradually slower and softer, until he whispers the goodnight.

| Moment | How to tag it | Example |
|---|---|---|
| Opening | `[warm, slow, smiling]` or `[warm, smiling storytelling]`; ellipses after "Once upon a time" and before the hero's name | `[warm, slow, smiling] Once upon a time... on a little farm, ... there lived a young milkmaid... called Molly.` |
| Scene-setting | `[cheerful, storytelling]`, `[gently, with a smile]`; commas for breaths, `...` before the second half | `...the gentle brown cow... while the hens clucked, and the sun came up over the hills!` |
| Short link lines (under about 8 words) | anchor the tags with **storytelling** and add one `...` (see Don'ts) | `[warm, tender storytelling] Molly's mother... gave her a kind smile.` |
| Turning point or gentle suspense | `[intrigued, warmly]` and an ellipsis before the key words | `And as she walked... she began to dream.` |
| Sound words ("Splash!") | build up with `...` and a `[pause]` before it; make it a playful hushed surprise, not a shout; then `[softly, sympathetic]` | `[playful, hushed] And Molly tossed her head... [pause] Splash! [softly, sympathetic] Down came the pail...` |
| Lists | `...` between the items so each one lands; rising, then falling | `the milk... and the eggs, and the chicks, and the hens... and my blue dress.` |
| Dialogue lead-ins | tag the line with the feeling of the speech that follows, so the narrator hands over smoothly (`[tenderly]`, `[gently, a little sad]`) | `[gently, a little sad] Molly walked slowly home, with her empty pail...` |
| The lesson | spoken by a character if you can (here, Mother); `[warmly, a soft smile] But remember...`, then a longer `pause` (1.7 s or more) | |
| Sleepy ending | `[calm, warm storytelling]`, then `[sleepy, warm storytelling]`, then `[very softly, slowly, dreamy]`; `speed_scale` 0.95, then 0.9; pauses 2.2–3.0 s | |
| Goodnight | the `whisper` voice (Peter), `[whispers] Goodnight, little one... [whispers] Sweet dreams.`, `speed_scale` 0.92, pause 30 s | |

## Characters

- **Children** (Molly: Jessica, stability 0.4) are bright, quick and natural, like a real child
  thinking out loud. Change the tag in the middle of the line as the feeling changes, e.g.
  `[excited, imagining] ... chicks! [delighted] And the chicks...`. Non-verbal tags work
  well and are not spoken as words: `[gasps]`, `[giggles]`, `[sighs]`, `[giggles softly, bright]`.
  End happy lines with `!`. A plain `[laughs softly] ... .` came out flat (6.7 semitones of pitch
  range). `[giggles softly, bright] I'll remember, Mother! [warmly, smiling] ...` came out at 12.2.
- **Parents** (Mother: Beth, stability 0.45) are tender and unhurried, smiling. Put a soft
  second tag on the reassuring half of the line (`[softly] Whatever you earn... you may keep.`).

## Pacing

- Pauses after lines: 1.0 s between quick dialogue lines; 1.3–1.6 s after narration; 0.5 s
  when the next line is the result of an action (Molly's head-toss, then Splash); 1.6–1.8 s after
  the opening, the turning point and the lesson; 2.2–3.0 s in the goodnight scene; 30 s after the goodnight.
- Inside a line: `...` gives about a 0.5–0.8 s beat. `...` plus `[pause]` gives about 1.5 s,
  so save that for the one big moment in each fable.
- In the milkmaid fable, the ending (n08–n10) runs at 2.0 words per clip-second against 2.5 in the opening.
  Aim for about a 20% slowdown.

## Voice settings

- `stability`: narrator 0.4, children 0.4, parents 0.45, whisper 0.5. Lower is more expressive but
  less consistent. In A/B tests 0.3 was not measurably livelier than 0.4, and the difference between two
  takes of the same line was bigger than the difference between the settings. So the real tool is
  measuring and retaking, not lowering stability.
- Keep the voice IDs, `gain` and loudness filters as they are. Every clip is loudness-normalised, so
  "softly" changes the voice's colour, not its level.

## Do's and don'ts (from listening tests)

- **Do anchor narrator tags with "storytelling"** (`[warm, tender storytelling]`,
  `[calm, warm storytelling]`). Peter stays in his full, voiced storytelling register.
- **Don't use `softly`, `quietly`, `with wonder` or a bare `[warmly, smiling]` on short narrator lines
  in the middle of a story.** Peter tends to slip into a half-whisper: the share of clearly voiced frames
  drops from about 0.3 to between 0.0 and 0.06, and the pitch goes flat (about 5–7 semitones of range against
  11–13). Keep breathy delivery for the end of the story.
- **Don't leave short lines bare.** Under about 8 words, v3 rushes them and reads them flat. One ellipsis gives
  the line a breath and some shape.
- **Don't capitalise words for emphasis.** It is rarely needed, because tags and punctuation do the work.
- Tag words were never spoken aloud in any of our takes (every clip was checked by transcribing it). Keep tags to
  plain delivery words anyway. If a tag is ever spoken, rephrase it.
- Takes vary. Always check every clip and redo the ones that fail.
  1. Transcribe it (Whisper small.en through sherpa-onnx) and check it matches `text` word for word.
     Allow for homophones: pail/pale, "sun set softly"/"sets".
  2. Check the pitch range: 9 semitones or more (5th–95th percentile) for an expressive line.
  3. Check that the share of clearly voiced frames is 0.12 or more for any line that isn't a whisper,
     and close to 0 for the whisper.
  4. Check that no peak is above −17 dBFS.
  To redo one line, delete its clip from `build/<fable>/clips/` and run `tools/tts.py` again without `--force`.
