# Voice direction for the bedtime fables

How to perform a fable script with the ElevenLabs `eleven_v3` voices so it sounds like a
wonderful bedtime storyteller, not a reading. Worked example: `fables/milkmaid/script.json`.

**Slowness is not expressiveness.** Expression lives in the voice itself: delight, wonder,
giggles, a little gasp, teasing, a sigh, a smile you can hear. Long pauses and slowed-down
takes just make the story drag. The director rejected our first slow version ("too slow, no need
for them to be this slow"). Tell the story at a natural, lively tempo, and only ease off at the
very end.

## How a line is voiced

- Captions use `text`. The voice speaks `speech` if it is set, otherwise the voice's default
  `tag` + `text`. `text` stays clean. `speech` must have the same words in the same order; you may
  only add `[tags]` and change punctuation.
- Give every line its own `speech`, with a tag that names the feeling. The voice's default tag is
  only a fallback.
- `pause` (in seconds, after the line, times `pause_scale` in voices.json, which stays at **1.0**)
  sets the rhythm between lines. Tags set the colour inside a line.
- `speed_scale`: `eleven_v3` ignores the API speed setting, so `tools/tts.py` time-stretches the
  finished take with rubberband instead. Leave it at 1.0. Use 0.95 at most, and only on the last
  narrator line before the goodnight.

## Tempo targets

| | Target | Milkmaid result |
|---|---|---|
| Total runtime (including the 7 s lead-in and the 30 s silence after the goodnight) | about 200–210 s or less | 197 s |
| Narration speed, words per clip-second | about 2.6–2.9 | 2.52 for n01–n07 (the 2.6 s Splash beat inside n06 pulls it down) |
| Ending speed (the three lines before the goodnight) | about 2.3 | 2.34 |
| Pause between dialogue lines | 0.5–0.8 s | |
| Pause after narration | 0.8–1.0 s | |
| Pause at the turning point or after the lesson | 1.2–1.3 s at most | |
| Pauses in the goodnight scene | 1.5 s | |
| Pause after the final whisper | 30 s | |

## The narrator: a grandfather by the fire

Peter is a beloved grandfather telling the story to one child. He is warm and gentle, but
**animated**: he enjoys the story, there is a smile in his voice, he is playful and teasing in the funny
bits, and he reacts to what happens (a little gasp at the spill). He is never hushed in the middle of the
story, never theatrical, never loud. He slows only a touch for the final lines, then whispers the goodnight.

| Moment | How to tag it | Milkmaid example |
|---|---|---|
| Opening | `[warm, smiling storytelling]`, then a mid-line `[delighted]` on the hero's name, ending with `!` | `...there lived a young milkmaid [delighted] called Molly!` |
| Scene-setting | `[cheerful storytelling]` with a mid-line `[playful]` | `...the gentle brown cow, [playful] while the hens clucked...` |
| Short link lines | the narrator's reaction as a tag (`[warmly, with a twinkle]`, `[amused, warm storytelling]`) | `[warmly, with a twinkle] Molly's mother gave her a kind smile.` |
| Turning point | wonder, then delight | `[storytelling, full of wonder] And as she walked, [delighted] she began to dream!` |
| Sound words ("Splash!") | the one place for `...` and a reaction tag: playful build-up, then `[gasps]`, then `[dismayed]` | `[playful storytelling] And Molly tossed her head... [gasps] Splash! [dismayed] Down came the pail...` |
| Lead-ins to dialogue | the feeling of the scene (`[sympathetic storytelling]`) | |
| Goodnight scene | `[warm, happy storytelling]`, then `[warm, smiling storytelling]`, then `[tender storytelling]` with a mid-line `[sighs happily]` | |
| Goodnight | the `whisper` voice (Peter) | `[whispers] Goodnight, little one... [whispers] Sweet dreams.` |

## Characters

- **Children** (Molly: Jessica, stability 0.4) are bright, quick and real. Build the emotion
  across a sequence. In the daydream each step is brighter and faster than the last: eggs
  `[dreamy, then suddenly excited]`, chicks `[excited] ... [more excited, giggles]`, dress
  `[very excited, delighted] ... [amazed]`, fair `[excited, giggling] ... [proudly, with a playful giggle]`.
  Then real dismay: `[gasps] Oh no! [dismayed] The milk... [rising dismay] ... [sighs sadly] All gone.`
  Change the tag in the middle of the line as the feeling changes, and end happy lines with `!`.
- **Parents** (Mother: Beth, stability 0.45) are tender and smiling:
  `[tender, smiling] ... my dear! [playful] Whatever you earn...` and, for the lesson,
  `[chuckles warmly] Oh, my darling. Never mind. [tender] But remember...`.
- Non-verbal tags are performed as sounds and never spoken as words: `[gasps]`, `[giggles]`,
  `[chuckles warmly]`, `[sighs happily]`, `[sighs sadly]`.

## Voice settings

- `stability`: narrator 0.4, children 0.4, parents 0.45, whisper 0.5. Lower is more expressive but
  less consistent. In A/B tests 0.3 was not measurably livelier than 0.4. The difference between two takes
  of the same line was bigger than the difference between the settings, so retaking is the real tool.
- Keep the voice IDs, `gain` and loudness filters as they are. Every clip is loudness-normalised.

## Do's and don'ts (from listening tests)

- **Do name the emotion**, not the volume. `[delighted]`, `[amazed]`, `[playful]`, `[teasing]`,
  `[dismayed]` and `[tender]` give pitch movement (13–16 semitones). `[softly]`, `[quietly]` and
  `[hushed]` make Peter half-whisper and go flat (5–7 semitones).
- **Don't put `...` on every short line** to slow it down. Keep it for one dramatic beat per fable.
  A short line is fixed with a vivid reaction tag. Short lines (under about 8 words) still vary the most
  from take to take, so expect to retake them.
- **Don't use long pauses or `speed_scale` for mood.** The first version, slowed that way, ran 230 s and
  dragged. The lively version runs 197 s.
- Use `[pause]` only together with `...` at the one big moment.
- **Don't capitalise words for emphasis.** It is rarely needed.
- Even with mood tags such as `[sighs]`, the transcripts never contained tag words. If a tag is ever spoken,
  rephrase it.
- Always check every clip and redo the ones that fail:
  1. Transcribe it (Whisper small.en through sherpa-onnx) and check it matches `text` word for word.
     Allow for homophones: pail/pale, "sun set softly"/"sets".
  2. Check the pitch range (5th–95th percentile): 13 semitones or more on lively narrator lines, 12 or more on
     character lines, and 10 or more on the gentle ending.
  3. Check that the share of clearly voiced frames is 0.12 or more for any line that isn't a whisper,
     and close to 0 for the whisper.
  4. Check that no peak is above −17 dBFS.
  To redo one line, delete its clip from `build/<fable>/clips/` and run `tools/tts.py` again without `--force`.
  Most lines pass within 1–4 takes. If a line still fails, keep its best take.
