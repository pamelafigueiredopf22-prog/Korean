# 한국어 두 길 · Korean, two paths

A Korean learning app with two ways to learn:

- **📖 The Book**: chapters that go step by step through Hangul, pronunciation rules and grammar, like a textbook. Each chapter ends with a **Review Room** where you can practise as often as you like. It uses spaced repetition, so the things you get wrong come back sooner.
- **🎭 Live It**: role-play scenes (meeting someone, a café, a convenience store). Each scene unlocks once you've learned what it needs. You can type, tap a suggestion or speak, and 💡 Help gives you more support each time you tap it.

You don't need a Korean keyboard: type in **romanization** (`annyeonghaseyo` → 안녕하세요), or use the built-in **Hangul keyboard** (the 한 button).

## Run it
It's a static site with no build step. Open `index.html`, or serve the folder:

```
python3 -m http.server 8000   # then open http://localhost:8000
```

Audio uses the device's Korean text-to-speech voice. The microphone uses the browser's speech recognition (Chrome or Safari).

## Structure
| File | What |
|---|---|
| `js/hangul.js` | Hangul engine: syllable building, romanization → Hangul, pronunciation rules (표준 발음법), Revised Romanization, answer checking |
| `js/content-book.js` | Chapters, lessons, review items and quizzes |
| `js/content-scenes.js` | Role-play scenes (branching scripts) |
| `js/speech.js` | Text-to-speech and speech recognition |
| `js/app.js` | App: router, Book, Review Room, Live It, keyboard |
| `tests/` | `node tests/hangul.test.js` and `node tests/content.test.js` |

## Accuracy
- Pronunciation follows the National Institute of Korean Language's **Standard Pronunciation** rules (표준 발음법).
- Romanization follows the **Revised Romanization of Korean** (국어의 로마자 표기법). The engine is tested against the official examples.
- `tests/content.test.js` checks every pronunciation shown in the Book against the engine. It also checks that every hint answer in the scenes is accepted, and that every "wrong" answer is rejected.
- Run `node tests/content.test.js --list` to print every Korean string with its romanization and pronunciation for proofreading.
