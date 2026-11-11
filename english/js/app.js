/* Cuppa English — app logic (no build step, no server). Progress lives in this browser (localStorage). */
(function () {
"use strict";

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const V = $("#view");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const strip = s => String(s).replace(/<[^>]+>/g, "");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const fmt = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => fmt(new Date());
const addDays = (ds, n) => { const [y, m, d] = ds.split("-").map(Number); return fmt(new Date(y, m - 1, d + n)); };
const fold = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’‘]/g, "'");
const it = (txt, cls = "") => txt ? `<div class="it ${cls}">${txt}</div>` : "";

/* ---------- storage ---------- */
const KEY = "cuppa-english.v1";
const defaults = () => ({ name: "", welcomed: false, set: { it: true, rate: 0.95, voice: "", size: 1, len: 5, theme: "auto" },
  srs: {}, days: {}, streak: { n: 0, best: 0, last: "" }, path: {}, life: {}, quiz: {}, diary: [], recent: [], stars: [] });
function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); return Object.assign(d, o, { set: Object.assign(d.set, o.set || {}), streak: Object.assign(d.streak, o.streak || {}) }); }
  } catch (e) {}
  return d;
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

function markPractised() {
  const t = today();
  if (!S.days[t]) {
    S.streak.n = S.streak.last === addDays(t, -1) ? S.streak.n + 1 : 1;
    S.streak.last = t;
    S.streak.best = Math.max(S.streak.best, S.streak.n);
    S.days[t] = 1;
  } else S.days[t]++;
  save();
}
function currentStreak() { const t = today(); return (S.streak.last === t || S.streak.last === addDays(t, -1)) ? S.streak.n : 0; }

/* ---------- toast ---------- */
let toastT;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2200); }

/* ---------- speech: text to speech ---------- */
const TTS = { ok: "speechSynthesis" in window, voices: [] };
function loadVoices() { if (TTS.ok) TTS.voices = speechSynthesis.getVoices(); }
if (TTS.ok) { loadVoices(); try { speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch (e) { speechSynthesis.onvoiceschanged = loadVoices; } }
function enVoices() {
  const v = TTS.voices.filter(v => /^en[-_]/i.test(v.lang));
  return v.sort((a, b) => (/GB/i.test(b.lang) - /GB/i.test(a.lang)));
}
function chooseVoice() {
  if (S.set.voice) { const v = TTS.voices.find(v => v.name === S.set.voice); if (v) return v; }
  const gb = TTS.voices.filter(v => /^en[-_]GB/i.test(v.lang));
  const pref = ["Google UK English Female", "Serena", "Kate", "Martha", "Stephanie", "Libby", "Sonia", "Google UK English Male", "Daniel", "Arthur", "Oliver"];
  for (const p of pref) { const v = gb.find(v => v.name.indexOf(p) >= 0); if (v) return v; }
  return gb[0] || TTS.voices.find(v => /^en[-_]/i.test(v.lang)) || null;
}
const cleanSpeech = s => strip(s).replace(/\s\/\s/g, ", ").replace(/…/g, ".").replace(/\((red)\)/g, "").replace(/[“”]/g, "").replace(/\s+/g, " ").trim();
let playingBtn = null;
function stopSpeech() { if (TTS.ok) speechSynthesis.cancel(); if (playingBtn) playingBtn.classList.remove("playing"); playingBtn = null; }
function say(text, opt = {}) {
  if (!TTS.ok) { toast("Sorry — audio isn't available in this browser."); opt.onend && opt.onend(); return; }
  stopSpeech();
  const u = new SpeechSynthesisUtterance(cleanSpeech(text));
  const v = chooseVoice();
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-GB";
  u.rate = opt.slow ? Math.max(0.55, S.set.rate - 0.3) : S.set.rate;
  if (opt.btn) { opt.btn.classList.add("playing"); playingBtn = opt.btn; }
  let ended = false;
  const end = () => { if (ended) return; ended = true; if (opt.btn) opt.btn.classList.remove("playing"); if (playingBtn === opt.btn) playingBtn = null; opt.onend && opt.onend(); };
  u.onend = end; u.onerror = end;
  speechSynthesis.speak(u);
  if (speechSynthesis.paused) speechSynthesis.resume();
}
const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>';
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg>';
const sayBtn = (t, slow) => `<button class="say${slow ? " slow" : ""}" data-say="${esc(t)}"${slow ? ' data-slow="1"' : ""} aria-label="${slow ? "Listen slowly" : "Listen"}">${slow ? "🐢" : SPK}</button>`;
const sayPair = t => sayBtn(t) + sayBtn(t, true);

/* ---------- speech: recognition + recorder fallback ---------- */
const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
function recognise(onResult, onError) {
  let done = false;
  const r = new SRC();
  r.lang = "en-GB"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
  r.onresult = e => { if (done) return; done = true; const alts = []; for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript); onResult(alts); };
  r.onerror = e => { if (done) return; done = true; onError(e.error || "error"); };
  r.onend = () => { if (done) return; done = true; onError("no-speech"); };
  try { r.start(); } catch (e) { done = true; onError("start"); }
  return r;
}
async function startRecorder() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  const done = new Promise(res => { rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/mp4" }))); }; });
  rec.start();
  return { stop: () => rec.stop(), done };
}
const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

/* ---------- comparing sentences ---------- */
const CONTR = { "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is", "it's": "it is", "we're": "we are", "they're": "they are",
  "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have", "i'll": "i will", "you'll": "you will", "he'll": "he will",
  "she'll": "she will", "we'll": "we will", "they'll": "they will", "it'll": "it will", "i'd": "i would", "you'd": "you would", "he'd": "he would",
  "she'd": "she would", "we'd": "we would", "they'd": "they would", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "can not",
  "cannot": "can not", "won't": "will not", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "haven't": "have not",
  "hasn't": "has not", "hadn't": "had not", "couldn't": "could not", "shouldn't": "should not", "wouldn't": "would not", "mustn't": "must not",
  "that's": "that is", "there's": "there is", "what's": "what is", "let's": "let us", "here's": "here is", "where's": "where is", "how's": "how is",
  "who's": "who is", "name's": "name is", "okay": "ok", "o'clock": "oclock" };
const NUMS = { zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19",
  twenty: "20", thirty: "30", forty: "40", fifty: "50", sixty: "60", hundred: "100", first: "1st", second: "2nd", third: "3rd", twelfth: "12th" };
function words(s) {
  s = String(s).toLowerCase().replace(/<[^>]+>/g, " ").replace(/[’‘`]/g, "'").replace(/[“”"]/g, " ").replace(/£/g, " ")
    .replace(/(\d),(\d)/g, "$1$2").replace(/[-–—/:.]/g, " ").replace(/[^a-z0-9' ]/g, " ");
  const out = [];
  s.split(/\s+/).forEach(w => {
    w = w.replace(/^'+|'+$/g, "");
    if (!w) return;
    if (CONTR[w]) { out.push(...CONTR[w].split(" ")); return; }
    w = w.replace(/'/g, "");
    if (NUMS[w]) w = NUMS[w];
    if (w === "mr" || w === "mrs" || w === "ms") { out.push(w); return; }
    out.push(w);
  });
  return out;
}
function lcs(a, b) {
  const n = a.length, m = b.length, dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ma = new Array(n).fill(-1), mb = new Array(m).fill(-1);
  let i = 0, j = 0;
  while (i < n && j < m) { if (a[i] === b[j]) { ma[i] = j; mb[j] = i; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  return { ma, mb };
}
function compare(target, attempt) {
  const toks = target.split(/\s+/).filter(Boolean), flat = [], own = [];
  toks.forEach((t, ti) => words(t).forEach(w => { flat.push(w); own.push(ti); }));
  const user = words(attempt);
  const { ma, mb } = lcs(flat, user);
  const ok = toks.map(() => true);
  flat.forEach((w, k) => { if (ma[k] < 0) ok[own[k]] = false; });
  const matched = ma.filter(x => x >= 0).length;
  return { toks, ok, score: flat.length ? Math.round(100 * matched / flat.length) : 0, extra: user.filter((w, j) => mb[j] < 0) };
}
function diffHTML(c) {
  return `<div class="diff">${c.toks.map((t, i) => `<span class="${c.ok[i] ? "ok" : "miss"}">${esc(t)}</span>`).join("")}${c.extra.length ? `<div class="small muted" style="margin-top:6px">Extra: ${c.extra.map(w => `<span class="extra">${esc(w)}</span>`).join("")}</div>` : ""}</div>`;
}
const praise = sc => sc >= 95 ? ["Perfect!", "Perfetto!"] : sc >= 80 ? ["Very good!", "Molto bene!"] : sc >= 60 ? ["Good — nearly there.", "Bene, quasi!"] : ["Keep trying — listen again.", "Riprova, riascolta."];

/* ---------- data indexes ---------- */
const G = {}, P = {}, L = {}, VT = {}, CARD = {};
D.grammar.forEach(g => G[g.id] = g);
D.pron.forEach(p => P[p.id] = p);
D.life.forEach(l => L[l.id] = l);
D.vocab.forEach(t => { VT[t.id] = t; t.items.forEach(([en, itx, ex]) => { CARD["v|" + en] = { en, it: itx, ex, src: t.t }; }); });
D.life.forEach(l => l.phrases.forEach(([en, itx]) => { CARD["p|" + en] = { en, it: itx, ex: "", src: l.t }; }));
D.falseFriends.forEach(([en, itx, fit, fen]) => { CARD["f|" + en] = { en, it: itx, ex: "", note: `⚠️ “${fit}” in Italian = ${fen}`, src: "False friends" }; });
D.verbs.forEach(([b, p, pp, itx]) => { CARD["i|" + b] = { en: `${b} – ${p} – ${pp}`, it: itx, ex: "", src: "Irregular verbs" }; });
const weekOfGrammar = id => D.path.findIndex(w => w.g.indexOf(id) >= 0);

/* ---------- spaced repetition (Leitner boxes) ---------- */
const INT = [0, 1, 3, 7, 14, 30, 60];
function grade(key, ok) {
  const c = S.srs[key] || { b: 0, d: today() };
  if (ok) { c.b = Math.min(c.b + 1, INT.length - 1); c.d = addDays(today(), INT[c.b]); }
  else { c.b = 1; c.d = addDays(today(), 1); }
  c.n = (c.n || 0) + 1;
  S.srs[key] = c; save();
}
const dueKeys = () => { const t = today(); return Object.keys(S.srs).filter(k => CARD[k] && S.srs[k].d <= t); };
const learnedIn = th => VT[th].items.filter(i => S.srs["v|" + i[0]] && S.srs["v|" + i[0]].b >= 2).length;
function newKeys(themeFirst, n) {
  const order = [themeFirst].concat(D.vocab.map(t => t.id).filter(id => id !== themeFirst)).filter(Boolean);
  const out = [];
  for (const th of order) { for (const i of VT[th].items) { const k = "v|" + i[0]; if (!S.srs[k] && out.indexOf(k) < 0) out.push(k); if (out.length >= n) return out; } }
  return out;
}
function toggleStar(key) {
  const i = S.stars.indexOf(key);
  if (i >= 0) S.stars.splice(i, 1);
  else { S.stars.push(key); if (!S.srs[key]) S.srs[key] = { b: 0, d: today() }; }
  save();
  return i < 0;
}
const starBtn = key => CARD[key] ? `<button class="star${S.stars.indexOf(key) >= 0 ? " on" : ""}" data-star="${esc(key)}" aria-label="Save to my words" title="Save to my words">${S.stars.indexOf(key) >= 0 ? "⭐" : "☆"}</button>` : "";

/* ---------- path helpers ---------- */
const DAY_NAMES = [["Grammar", "Grammatica"], ["Words", "Vocaboli"], ["Real life", "Vita reale"], ["Sounds & listening", "Suoni e ascolto"], ["Review & write", "Ripasso e scrittura"]];
const dayDone = (w, d) => !!S.path[w + "-" + d];
const weekCount = w => [0, 1, 2, 3, 4].filter(d => dayDone(w, d)).length;
function curWeek() { for (let i = 0; i < D.path.length; i++) if (weekCount(i) < 5) return i; return D.path.length - 1; }
function nextDay(w) { for (let d = 0; d < 5; d++) if (!dayDone(w, d)) return d; return 4; }

/* ---------- sentence pools ---------- */
const POOL = [];
D.life.forEach(l => l.dlg.forEach(([, en, itx]) => POOL.push([en, itx])));
D.grammar.forEach(g => g.ex.forEach(([en, itx]) => POOL.push([en, itx])));
D.vocab.forEach(t => t.items.forEach(([, , ex]) => ex && POOL.push([ex, ""])));
const wc = s => s.split(/\s+/).length;
const listenPool = lvl => POOL.filter(([en]) => lvl === "easy" ? wc(en) <= 7 && wc(en) >= 3 : wc(en) > 7 && wc(en) <= 16);
const speakPool = () => { const a = []; D.life.forEach(l => l.phrases.forEach(p => a.push(p))); return a; };

/* =========================================================
   SESSION STEPS — each renders into el and calls next(result)
   ========================================================= */
const STEPS = {};
const nextBtn = (label = "Next", itl = "Avanti") => `<button class="btn primary block big" data-next style="margin-top:18px">${label} <span class="it noflag" style="color:inherit;opacity:.85">· ${itl}</span></button>`;
function wireNext(el, next, res) { const b = $("[data-next]", el); if (b) b.onclick = () => next(res); }

STEPS.card = (el, st, next) => {
  const c = CARD[st.key];
  const box = (S.srs[st.key] || {}).b || 0;
  const rev = !st.again && box >= 2 && Math.random() < 0.5;
  const isNew = !S.srs[st.key] || !S.srs[st.key].n;
  el.innerHTML = `
    <div class="card flash">
      <div class="step-kind">${isNew ? "New word · Parola nuova" : "Review · Ripasso"}${c.src ? ` · <span class="muted">${esc(c.src)}</span>` : ""}</div>
      ${rev ? `<p class="muted">How do you say this in English?</p><div class="word" style="color:var(--navy)">${esc(c.it)}</div>`
            : `<div class="word">${esc(c.en)}</div><div class="btn-row" style="justify-content:center">${sayPair(c.en)}</div>`}
      <div id="ans" ${rev ? "hidden" : ""}>
        ${rev ? `<div class="word">${esc(c.en)}</div><div class="btn-row" style="justify-content:center">${sayPair(c.en)}</div>` : ""}
        ${c.ex ? `<p class="ex">“${esc(c.ex)}” ${sayBtn(c.ex)}</p>` : ""}
      </div>
      <div id="mean" hidden>${rev ? "" : `<div class="meaning">🇮🇹 ${esc(c.it)}</div>`}${c.note ? `<p class="small">${esc(c.note)}</p>` : ""}</div>
    </div>
    <div id="acts"><button class="btn navy block big" id="show" style="margin-top:16px">${rev ? "Show the answer" : "Show the meaning"} <span class="it noflag" style="color:inherit">· ${rev ? "Mostra la risposta" : "Mostra il significato"}</span></button></div>`;
  if (!rev) setTimeout(() => say(c.en), 250);
  $("#show", el).onclick = () => {
    $("#ans", el).hidden = false; $("#mean", el).hidden = false;
    if (rev) say(c.en);
    $("#acts", el).innerHTML = `<p class="center muted small" style="margin:14px 0 0">Did you know it? · Lo sapevi?</p>
      <div class="flash-actions"><button class="btn no big" data-g="0">✗ Not yet<br><span class="small">Non ancora</span></button><button class="btn yes big" data-g="1">✓ I knew it<br><span class="small">Lo sapevo</span></button></div>`;
    $$("[data-g]", el).forEach(b => b.onclick = () => { const ok = b.dataset.g === "1"; grade(st.key, ok); next({ ok, requeue: !ok && !st.again }); });
  };
};

function quizData(st) {
  if (st.custom) return st.custom;
  const q = G[st.g].quiz[st.i];
  return { q: q[0], opts: q[1], ans: q[2], why: q[3], whyIt: q[4], title: G[st.g].t };
}
STEPS.quiz = (el, st, next) => {
  const d = quizData(st);
  const order = shuffle(d.opts.map((o, i) => i));
  const qhtml = esc(d.q).replace("___", '<span class="gap">?</span>');
  el.innerHTML = `<div class="card"><div class="step-kind">${st.custom ? "Quiz" : "Grammar · Grammatica"}${d.title ? ` · <span class="muted">${esc(d.title)}</span>` : ""}</div>
    <div class="q">${qhtml}</div>
    <div class="opts">${order.map(i => `<button class="opt" data-i="${i}">${esc(d.opts[i])}</button>`).join("")}</div>
    <div id="fb"></div></div>`;
  $$(".opt", el).forEach(b => b.onclick = () => {
    if (el.dataset.answered) return;
    el.dataset.answered = 1;
    const i = +b.dataset.i, ok = i === d.ans;
    b.classList.add(ok ? "right" : "wrong");
    $$(".opt", el).forEach(x => { if (+x.dataset.i === d.ans) x.classList.add("right"); });
    if (st.g) { const r = S.quiz[st.g] || { r: 0, w: 0 }; ok ? r.r++ : r.w++; S.quiz[st.g] = r; save(); }
    const full = d.q.indexOf("___") >= 0 ? d.q.replace("___", d.opts[d.ans]).replace(/\s+([?.!,])/g, "$1") : "";
    $("#fb", el).innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><b>${ok ? "✓ Correct! · Giusto!" : "✗ Not quite · Non proprio"}</b>${esc(d.why || "")}${it(d.whyIt ? esc(d.whyIt) : "")}
      ${full && !/^(Choose|Which)/.test(d.q) ? `<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><span>${esc(full)}</span>${sayBtn(full)}</div>` : ""}</div>${nextBtn()}`;
    wireNext(el, next, { ok });
  });
};

STEPS.listen = (el, st, next) => {
  el.innerHTML = `<div class="card"><div class="step-kind">Listening · Ascolto</div>
    <p><b>Listen and write what you hear.</b>${it("Ascolta e scrivi quello che senti.")}</p>
    <div class="btn-row" style="margin:14px 0"><button class="btn navy" id="play">${SPK.replace("<svg", '<svg width="22" height="22"')} Play</button><button class="btn" id="slow">🐢 Slowly</button></div>
    <textarea id="ans" rows="3" placeholder="Type here… · Scrivi qui…" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea>
    <div class="btn-row" style="margin-top:12px"><button class="btn primary" id="chk">Check · Controlla</button><button class="btn ghost" id="give">Show me · Mostra</button></div>
    <div id="res"></div></div>`;
  const play = slow => say(st.text, { slow, btn: slow ? $("#slow", el) : $("#play", el) });
  $("#play", el).onclick = () => play(false); $("#slow", el).onclick = () => play(true);
  setTimeout(() => play(false), 300);
  const show = attempt => {
    const c = compare(st.text, attempt);
    const [p, pi] = attempt ? praise(c.score) : ["Here it is:", "Eccola:"];
    $("#res", el).innerHTML = `<div class="feedback ${c.score >= 80 ? "ok" : "no"}"><b>${attempt ? c.score + "% · " : ""}${p}</b>${it(pi)}
      ${attempt ? diffHTML(c) : ""}<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><span>${esc(st.text)}</span>${sayBtn(st.text)}</div>${it(esc(st.it || ""))}</div>${nextBtn()}`;
    $("#chk", el).disabled = true; $("#give", el).disabled = true;
    wireNext(el, next, { ok: attempt ? c.score >= 80 : false });
  };
  $("#chk", el).onclick = () => { const v = $("#ans", el).value.trim(); if (!v) { toast("Write something first · Scrivi qualcosa"); return; } show(v); };
  $("#give", el).onclick = () => show("");
};

STEPS.speak = (el, st, next) => {
  const hidden = !!st.hide;
  el.innerHTML = `<div class="card"><div class="step-kind">${hidden ? "Your turn · Tocca a te" : "Speaking · Parlare"}</div>
    ${hidden ? `<p class="muted">Say this in English:</p><p class="q" style="color:var(--navy)">🇮🇹 ${esc(st.it)}</p>
      ${st.prev ? `<p class="small muted">They said: “${esc(st.prev)}”</p>` : ""}
      <div id="model" hidden><p class="q">${esc(st.text)}</p><div class="btn-row">${sayPair(st.text)}</div></div>
      <button class="btn ghost" id="peek" style="margin-top:8px">💡 Show me the English · Mostra</button>`
    : `<p class="q">${esc(st.text)}</p>${it(esc(st.it || ""))}<div class="btn-row" style="margin-top:10px">${sayPair(st.text)}</div>`}
    <div class="center" style="margin-top:20px">
      <button class="mic" id="mic" aria-label="Speak">${MIC}</button>
      <p class="small muted" id="micMsg">${SRC ? "Tap and say it · Tocca e parla" : canRecord ? "Tap to record yourself · Tocca per registrarti" : "Say it out loud · Dillo ad alta voce"}</p>
    </div>
    <div id="res"></div></div>${nextBtn(hidden ? "Next" : "Next", "Avanti")}`;
  const reveal = () => { const m = $("#model", el); if (m) { m.hidden = false; const pk = $("#peek", el); if (pk) pk.remove(); } };
  const pk = $("#peek", el); if (pk) pk.onclick = () => { reveal(); say(st.text); };
  let result = { ok: undefined };
  const mic = $("#mic", el), msg = $("#micMsg", el);
  if (SRC) {
    mic.onclick = () => {
      if (mic.classList.contains("rec")) return;
      stopSpeech();
      mic.classList.add("rec"); msg.textContent = "Listening… · Ti ascolto…";
      setTimeout(() => recognise(alts => {
        mic.classList.remove("rec"); msg.textContent = "Tap to try again · Tocca per riprovare";
        let best = null; alts.forEach(a => { const c = compare(st.text, a); if (!best || c.score > best.score) { best = c; best.heard = a; } });
        const [p, pi] = praise(best.score);
        result = { ok: best.score >= 80 };
        reveal();
        $("#res", el).innerHTML = `<div class="feedback ${best.score >= 80 ? "ok" : "no"}"><div class="score">${best.score}%</div><b>${p}</b>${it(pi)}${diffHTML(best)}
          <p class="small muted">I heard: “${esc(best.heard)}”</p></div>`;
      }, err => {
        mic.classList.remove("rec");
        msg.innerHTML = err === "not-allowed" || err === "service-not-allowed" ? "Microphone blocked. Allow it in your browser settings. · Microfono bloccato." : "I didn't hear anything — tap and try again. · Non ho sentito, riprova.";
      }), 120);
    };
  } else if (canRecord) {
    let rec = null;
    mic.onclick = async () => {
      if (rec) { rec.stop(); return; }
      try {
        stopSpeech();
        rec = await startRecorder();
        mic.classList.add("rec"); msg.textContent = "Recording… tap to stop · Registro… tocca per fermare";
        const url = await rec.done;
        rec = null; mic.classList.remove("rec"); msg.textContent = "Tap to record again · Tocca per registrare di nuovo";
        reveal();
        $("#res", el).innerHTML = `<div class="feedback ok"><b>Listen and compare · Ascolta e confronta</b>
          <div class="btn-row" style="margin-top:8px;align-items:center"><span>Model:</span>${sayBtn(st.text)}</div>
          <p style="margin:8px 0 4px">You:</p><audio controls src="${url}" style="width:100%"></audio></div>`;
      } catch (e) { rec = null; mic.classList.remove("rec"); msg.textContent = "Microphone not available. Say it out loud instead. · Dillo ad alta voce."; }
    };
  } else mic.onclick = () => { reveal(); toast("Say it out loud, then press Next"); };
  $("[data-next]", el).onclick = () => next(result);
};

STEPS.hear = (el, st, next) => {
  el.innerHTML = `<div class="card"><div class="step-kind">Listen · Ascolta</div>
    <div class="bubble"><div class="who">${esc(st.who)}</div><div class="q" style="font-weight:400">${esc(st.text)}</div>${it(esc(st.it))}</div>
    <div class="btn-row" style="margin-top:12px">${sayPair(st.text)}</div></div>${nextBtn()}`;
  setTimeout(() => say(st.text), 250);
  wireNext(el, next);
};

STEPS.ear = (el, st, next) => {
  const pool = [];
  (st.pron ? [P[st.pron]] : D.pron.filter(p => p.pairs)).forEach(p => (p.pairs || []).forEach(pr => pool.push(pr)));
  const rounds = st.rounds || 3;
  let r = 0, right = 0;
  const round = () => {
    if (r >= rounds) {
      el.innerHTML = `<div class="card center"><div class="done-big">👂</div><h2>${right} / ${rounds}</h2><p>${right === rounds ? "Excellent ears! · Ottimo orecchio!" : "Good practice! · Buon esercizio!"}</p></div>${nextBtn()}`;
      wireNext(el, next, { ok: right >= rounds - 1 }); return;
    }
    const pair = pick(pool), k = Math.random() < 0.5 ? 0 : 1, target = pair[k];
    el.innerHTML = `<div class="card"><div class="step-kind">Ear training · Allena l'orecchio (${r + 1}/${rounds})</div>
      <p><b>Which word do you hear?</b>${it("Quale parola senti?")}</p>
      <div class="btn-row" style="margin:12px 0"><button class="btn navy" id="play">${SPK.replace("<svg", '<svg width="22" height="22"')} Play again</button></div>
      <div class="grid2">${pair.map((w, i) => `<button class="opt center" data-i="${i}" style="font-size:1.4rem;font-weight:700">${esc(w)}</button>`).join("")}</div><div id="fb"></div></div>`;
    const play = () => say(target, { btn: $("#play", el) });
    $("#play", el).onclick = play; setTimeout(play, 250);
    $$(".opt", el).forEach(b => b.onclick = () => {
      if (el.dataset.ans) return; el.dataset.ans = 1;
      const ok = +b.dataset.i === k; if (ok) right++;
      b.classList.add(ok ? "right" : "wrong"); $$(".opt", el)[k].classList.add("right");
      $("#fb", el).innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><b>${ok ? "✓ Yes!" : "✗ It was “" + esc(target) + "”"}</b>
        <div class="btn-row" style="margin-top:8px">${pair.map(w => `<span style="display:inline-flex;align-items:center;gap:6px">${sayBtn(w)} ${esc(w)}</span>`).join("")}</div></div>
        <button class="btn primary block big" id="nr" style="margin-top:14px">Next · Avanti</button>`;
      $("#nr", el).onclick = () => { delete el.dataset.ans; r++; round(); };
    });
  };
  round();
};

STEPS.verb = (el, st, next) => {
  const [b, p, pp, itx] = st.v;
  el.innerHTML = `<div class="card"><div class="step-kind">Irregular verbs · Verbi irregolari</div>
    <div class="q" style="font-size:1.6rem">${esc(b)} ${sayBtn(b)}</div>${it(esc(itx), "reveal-on")}
    <label class="small muted" style="display:block;margin-top:14px">Past simple</label><input type="text" id="p1" autocapitalize="off" autocomplete="off" spellcheck="false">
    <label class="small muted" style="display:block;margin-top:10px">Past participle</label><input type="text" id="p2" autocapitalize="off" autocomplete="off" spellcheck="false">
    <button class="btn primary block" id="chk" style="margin-top:14px">Check · Controlla</button><div id="res"></div></div>`;
  const norm = s => s.toLowerCase().replace(/\(.*?\)/g, "").trim();
  const okv = (val, ans) => ans.split("/").map(norm).indexOf(norm(val)) >= 0;
  $("#chk", el).onclick = () => {
    const a = okv($("#p1", el).value, p), c = okv($("#p2", el).value, pp);
    $("#res", el).innerHTML = `<div class="feedback ${a && c ? "ok" : "no"}"><b>${a && c ? "✓ Correct! · Giusto!" : "Here's the answer · Ecco la risposta"}</b>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px"><span class="q">${esc(b)} – ${esc(p)} – ${esc(pp)}</span>${sayBtn(`${b}, ${p}, ${pp}`)}</div></div>${nextBtn()}`;
    $("#chk", el).disabled = true;
    say(`${b}, ${p}, ${pp}`);
    wireNext(el, next, { ok: a && c });
  };
};

STEPS.grammar = (el, st, next) => { el.innerHTML = `<div class="step-kind">Grammar · Grammatica</div>${grammarHTML(G[st.g], true)}${nextBtn("Practise", "Esercitati")}`; wireNext(el, next); };
STEPS.pron = (el, st, next) => { el.innerHTML = `<div class="step-kind">Sounds · Suoni</div>${pronHTML(P[st.p], true)}${nextBtn()}`; wireNext(el, next); };
STEPS.phrases = (el, st, next) => {
  const l = L[st.life];
  el.innerHTML = `<div class="step-kind">Key phrases · Frasi utili</div><h2>${l.icon} ${esc(l.t)}</h2>${it(esc(l.ti))}
    <div class="card" style="margin-top:12px"><p class="small">${l.tip}</p>${it(l.tipIt)}</div>
    <div class="card" style="margin-top:12px">${l.phrases.map(([en, itx]) => lineHTML(en, itx, "p|" + en)).join("")}</div>${nextBtn()}`;
  wireNext(el, next);
};
STEPS.dialogue = (el, st, next) => {
  const l = L[st.life];
  el.innerHTML = `<div class="step-kind">Conversation · Dialogo</div><h2>${esc(l.t)}</h2>
    <button class="btn navy block" data-playall="${esc(l.id)}" style="margin:12px 0">▶ Play the whole conversation · Ascolta tutto</button>${dialogueHTML(l)}${nextBtn()}`;
  wireNext(el, next);
};
STEPS.tip = (el, st, next) => {
  const [en, itx, fit, fen] = st.ff;
  el.innerHTML = `<div class="card"><div class="step-kind">False friend of the day · Falso amico</div>
    <div class="q" style="font-size:1.5rem">${esc(en)} ${sayBtn(en)}</div>
    <p>🇮🇹 = <b>${esc(itx)}</b></p>
    <div class="feedback no">⚠️ Not “<b>${esc(fit)}</b>”! In English, “${esc(fit)}” is <b>${esc(fen)}</b>. ${sayBtn(fen)}</div></div>${nextBtn("Finish", "Fine")}`;
  wireNext(el, next);
};
STEPS.diary = (el, st, next) => {
  const p = D.diary[st.idx];
  el.innerHTML = `<div class="card"><div class="step-kind">Write · Scrivi</div><p class="q">${esc(p.p)}</p>${it(esc(p.pIt))}
    <p class="small muted">Useful starters:</p><div class="chips">${p.help.map(h => `<button disabled>${esc(h)}</button>`).join("")}</div></div>
    <button class="btn primary block big" id="w" style="margin-top:16px">✍️ Write it now · Scrivi ora</button>
    <button class="btn ghost block" data-next style="margin-top:10px">Later · Più tardi</button>`;
  $("#w", el).onclick = () => next({ go: "#/diary/write/" + st.idx });
  wireNext(el, next);
};

/* ---------- session engine ---------- */
let SES = null;
function startSession(def) { SES = Object.assign({ i: 0, right: 0, total: 0 }, def); renderStep(); }
function renderStep() {
  const s = SES;
  if (!s) return;
  if (s.i >= s.steps.length) return finishSession();
  stopSpeech();
  const st = s.steps[s.i];
  setTop(s.title, false);
  V.innerHTML = `<div class="sess-head"><button class="x" id="quit" aria-label="Stop">✕</button><div class="bar"><i style="width:${Math.round(100 * s.i / s.steps.length)}%"></i></div>
    <span class="small muted">${s.i + 1}/${s.steps.length}</span></div><div id="stepEl"></div>`;
  $("#quit").onclick = () => { if (confirm("Stop this session? Your flashcard progress is saved.\nVuoi fermarti? I progressi delle flashcard sono salvati.")) { SES = null; location.hash = s.back || "#/"; } };
  STEPS[st.type]($("#stepEl"), st, res => {
    if (SES !== s) return;
    res = res || {};
    if (res.ok !== undefined) { s.total++; if (res.ok) s.right++; }
    if (res.requeue) s.steps.push(Object.assign({}, st, { again: true }));
    if (res.go) { finishSession(true); location.hash = res.go; return; }
    s.i++; renderStep(); window.scrollTo(0, 0);
  });
}
function finishSession(silent) {
  const s = SES; SES = null;
  markPractised();
  if (s.onDone) s.onDone();
  save();
  if (silent) return;
  const nm = S.name ? ", " + esc(S.name) : "";
  const msgs = [["Well done" + nm + "!", "Brava!"], ["Brilliant" + nm + "!", "Bravissima!"], ["Lovely work" + nm + "!", "Ottimo lavoro!"]];
  const [m, mi] = pick(msgs);
  V.innerHTML = `<div class="card center" style="margin-top:20px;padding:28px 18px"><div class="done-big">☕</div><h1>${m}</h1>${it(mi)}
    ${s.total ? `<p style="margin-top:14px">You got <b>${s.right} out of ${s.total}</b> right.</p>` : ""}
    <div class="streak" style="justify-content:center;margin-top:14px"><span style="font-size:2rem">🔥</span><span class="num">${currentStreak()}</span><span>day${currentStreak() === 1 ? "" : "s"} in a row<br><span class="it noflag">giorni di fila</span></span></div></div>
    <div class="stack" style="margin-top:16px">${s.after || ""}<a class="btn primary block big" href="${esc(s.back || "#/")}">Done · Fatto</a>${s.again ? `<a class="btn block" href="${esc(s.again)}">Another round · Ancora</a>` : ""}</div>`;
  setTop("Finished", false);
}

/* ---------- session builders ---------- */
function weakGrammar() { return Object.keys(S.quiz).filter(g => G[g] && S.quiz[g].w > S.quiz[g].r); }
function quizSteps(gids, n) {
  let all = [];
  gids.forEach(g => G[g] && G[g].quiz.forEach((q, i) => all.push({ type: "quiz", g, i })));
  all = shuffle(all);
  return typeof n === "number" ? all.slice(0, n) : all;
}
function buildDaily() {
  const big = S.set.len === 10;
  const n = big ? { c: 8, q: 4, l: 2, s: 2 } : { c: 5, q: 2, l: 1, s: 1 };
  const w = D.path[curWeek()];
  let keys = shuffle(dueKeys()).slice(0, n.c);
  if (keys.length < n.c) keys = keys.concat(newKeys(w.vocab, n.c - keys.length));
  const steps = keys.map(key => ({ type: "card", key }));
  const gPool = Array.from(new Set(w.g.concat(weakGrammar(), shuffle(D.grammar.map(g => g.id)).slice(0, 3))));
  steps.push(...quizSteps(gPool, n.q));
  const life = L[w.life];
  const lp = shuffle(life.dlg.map(([, en, itx]) => [en, itx]).filter(([en]) => wc(en) >= 3 && wc(en) <= 14).concat(listenPool("easy").slice(0, 0)));
  for (let i = 0; i < n.l; i++) { const x = lp[i] || pick(listenPool("easy")); steps.push({ type: "listen", text: x[0], it: x[1] }); }
  const sp = shuffle(life.phrases);
  for (let i = 0; i < n.s; i++) { const x = sp[i] || pick(speakPool()); steps.push({ type: "speak", text: x[0], it: x[1] }); }
  steps.push({ type: "tip", ff: D.falseFriends[hash(today() + "ff") % D.falseFriends.length] });
  return steps;
}
function buildWeekDay(wi, d) {
  const w = D.path[wi], steps = [];
  if (d === 0) { steps.push({ type: "grammar", g: w.g[0] }); steps.push(...quizSteps([w.g[0]])); }
  if (d === 1) {
    const themeKeys = VT[w.vocab].items.map(i => "v|" + i[0]);
    let keys = themeKeys.filter(k => !S.srs[k]).slice(0, 8);
    if (keys.length < 8) keys = keys.concat(shuffle(themeKeys.filter(k => keys.indexOf(k) < 0)).slice(0, 8 - keys.length));
    keys.forEach(key => steps.push({ type: "card", key }));
  }
  if (d === 2) {
    const l = L[w.life];
    steps.push({ type: "phrases", life: w.life }, { type: "dialogue", life: w.life });
    shuffle(l.phrases).slice(0, 2).forEach(([en, itx]) => steps.push({ type: "speak", text: en, it: itx }));
  }
  if (d === 3) {
    const p = P[w.pron];
    steps.push({ type: "pron", p: w.pron });
    if (p.pairs) steps.push({ type: "ear", pron: w.pron, rounds: 4 });
    steps.push({ type: "speak", text: pick(p.sents), it: "" });
    shuffle(L[w.life].dlg.filter(x => wc(x[1]) >= 4 && wc(x[1]) <= 14)).slice(0, 2).forEach(([, en, itx]) => steps.push({ type: "listen", text: en, it: itx }));
  }
  if (d === 4) {
    w.g.slice(1).forEach(g => { steps.push({ type: "grammar", g }); steps.push(...quizSteps([g], 3)); });
    steps.push(...quizSteps([w.g[0]], 2));
    steps.push({ type: "diary", idx: w.diary });
  }
  return steps;
}

/* =========================================================
   SHARED RENDER PIECES
   ========================================================= */
function lineHTML(en, itx, key, extra = "") {
  return `<div class="line"><div class="txt"><div>${esc(en)}</div>${it(esc(itx || ""))}${extra}</div><div class="acts">${sayPair(en)}${key ? starBtn(key) : ""}</div></div>`;
}
function dialogueHTML(l, opts = {}) {
  return `<div class="dlg">${l.dlg.map(([who, en, itx], i) => `<div class="dlg-row${who === "Y" ? " me" : ""}"><div class="bubble${who === "Y" ? " me" : ""}" id="b${i}">
    <div class="who">${esc(l.who[who] || who)}</div><div>${esc(en)}</div>${it(esc(itx))}</div>${sayBtn(en)}</div>`).join("")}</div>`;
}
function grammarHTML(g, compact) {
  return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><h2>${esc(g.t)}</h2>${it(esc(g.ti))}</div><span class="chip ${g.lvl.toLowerCase()}">${g.lvl}</span></div>
    <ul class="rule">${g.rule.map(r => `<li>${r}</li>`).join("")}</ul><div class="box it-box">${g.ruleIt}</div></div>
    <div class="section-title"><h2>Examples</h2><span class="small muted">Esempi</span></div>
    <div class="card">${g.ex.map(([en, itx]) => lineHTML(en, itx)).join("")}</div>
    <div class="section-title"><h2>⚠️ Watch out!</h2><span class="small muted">Errori comuni</span></div>
    <div class="card">${g.mist.map(([w, r, why]) => `<div class="mistake"><span class="wrongtxt">${esc(w)}</span><span class="righttxt">${esc(r)}</span>${it(esc(why))}</div>`).join("")}</div>`;
}
function pronHTML(p, compact) {
  return `<div class="card"><h2>${esc(p.t)}</h2>${it(esc(p.ti))}${p.sym ? `<p><span class="chip">${esc(p.sym)}</span></p>` : ""}
    <p>${p.desc}</p><div class="box it-box">${p.descIt}</div>
    <div class="box" style="background:var(--gold-soft)">💡 <b>${esc(p.tip)}</b>${it(esc(p.tipIt))}</div></div>
    ${p.pairs ? `<div class="section-title"><h2>Listen to the difference</h2><span class="small muted">Senti la differenza</span></div>
      <div class="card">${p.pairs.map(([a, b]) => `<div class="pair"><div class="w">${sayBtn(a)}<b>${esc(a)}</b></div><span class="vs">vs</span><div class="w" style="justify-content:flex-end"><b>${esc(b)}</b>${sayBtn(b)}</div></div>`).join("")}</div>` : ""}
    ${p.words ? `<div class="section-title"><h2>Words</h2><span class="small muted">Parole</span></div>
      <div class="card">${p.words.map(([w, h]) => `<div class="line"><div class="txt"><div><b>${esc(w)}</b></div>${h ? `<div class="small muted">${esc(h)}</div>` : ""}</div><div class="acts">${sayPair(w)}</div></div>`).join("")}</div>` : ""}
    <div class="section-title"><h2>Sentences</h2><span class="small muted">Frasi</span></div>
    <div class="card">${p.sents.map(s => lineHTML(s, "")).join("")}</div>`;
}

/* =========================================================
   PAGES
   ========================================================= */
function setTop(title, back) {
  $("#crumb").textContent = title || "Cuppa English";
  $("#back").classList.toggle("show", !!back);
  document.title = title && title !== "Cuppa English" ? title + " · Cuppa English" : "Cuppa English";
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? ["Good morning", "Buongiorno"] : h < 18 ? ["Good afternoon", "Buon pomeriggio"] : ["Good evening", "Buonasera"];
}

function welcomePage() {
  setTop("Welcome", false);
  V.innerHTML = `<div style="padding-top:10px"><div class="eyebrow">Cuppa English ☕</div><h1 style="margin-top:6px">Welcome!</h1>${it("Benvenuta!")}
    <p style="margin-top:14px">Five minutes of English a day — like a cup of tea. British English, with Italian help when you need it.</p>
    ${it("Cinque minuti di inglese al giorno, come una tazza di tè. Inglese britannico, con l'aiuto dell'italiano quando serve.")}
    <div class="list" style="margin-top:18px">
      ${[["☕", "Today", "Your 5-minute daily practice", "La tua pratica di 5 minuti"], ["🚩", "Path", "12 weeks from A2 to B1", "12 settimane dall'A2 al B1"],
        ["💬", "Real life", "The doctor, the bank, the shops…", "Medico, banca, negozi…"], ["🎤", "Practice", "Speaking, listening, writing", "Parlare, ascoltare, scrivere"],
        ["🔎", "Quick check", "Forgot a rule? Look it up fast", "Hai dimenticato una regola? Cercala"]]
        .map(([e, t, d, di]) => `<div class="row"><span class="ico">${e}</span><div class="grow"><b>${t}</b><span class="small muted">${d}</span>${it(di)}</div></div>`).join("")}
    </div>
    <div class="card" style="margin-top:16px"><label for="nm"><b>What's your name?</b> <span class="small muted">(optional · facoltativo)</span></label>
      <input type="text" id="nm" style="margin-top:8px" autocomplete="given-name" placeholder="Your name"></div>
    <div class="card"><b>How long each day?</b>${it("Quanto tempo al giorno?")}<div class="seg" style="margin-top:10px"><button data-len="5" class="on">5 minutes</button><button data-len="10">10 minutes</button></div></div>
    <button class="btn primary block big" id="go" style="margin-top:18px">Let's start! · Iniziamo!</button></div>`;
  let len = 5;
  $$("[data-len]").forEach(b => b.onclick = () => { len = +b.dataset.len; $$("[data-len]").forEach(x => x.classList.toggle("on", x === b)); });
  $("#go").onclick = () => { S.name = $("#nm").value.trim().slice(0, 30); S.set.len = len; S.welcomed = true; save(); route(); };
}

function todayPage() {
  if (!S.welcomed) return welcomePage();
  setTop("Cuppa English", false);
  const [g, gi] = greeting();
  const done = !!S.days[today()];
  const wi = curWeek(), w = D.path[wi], nd = nextDay(wi);
  const due = dueKeys().length;
  const big = S.set.len === 10;
  // week dots (Mon–Sun)
  const now = new Date(), dow = (now.getDay() + 6) % 7, monday = addDays(today(), -dow);
  const dots = ["M", "T", "W", "T", "F", "S", "S"].map((l, i) => { const ds = addDays(monday, i); return `<span><i class="${S.days[ds] ? "on" : ""} ${ds === today() ? "today" : ""}">${S.days[ds] ? "✓" : ""}</i>${l}</span>`; }).join("");
  const allV = []; D.vocab.forEach(t => t.items.forEach(x => allV.push(x)));
  const wod = allV[hash(today()) % allV.length];
  V.innerHTML = `
    <div style="padding:8px 0 14px"><h1>${g}${S.name ? ", " + esc(S.name) : ""}!</h1>${it(gi + (S.name ? ", " + esc(S.name) : "") + "!")}</div>
    <div class="hero">
      ${done ? `<div class="eyebrow" style="color:#fff;opacity:.8">Done today ✓</div><h2 style="margin-top:6px">Brilliant — you practised today!</h2>${it("Fantastico, oggi ti sei esercitata!")}
               <a class="btn primary block big" href="#/go/daily" style="margin-top:16px">☕ Another ${big ? 10 : 5} minutes</a>`
             : `<div class="eyebrow" style="color:#fff;opacity:.8">Your ${big ? 10 : 5} minutes</div><h2 style="margin-top:6px">Today's cup of English</h2>${it("La tua tazza di inglese di oggi")}
               <p class="small" style="margin-top:10px">${big ? "8 words · 4 grammar · 2 listening · 2 speaking" : "5 words · 2 grammar · 1 listening · 1 speaking"}</p>
               <a class="btn primary block big" href="#/go/daily" style="margin-top:12px">▶ Start · Inizia</a>`}
    </div>
    <div class="card" style="margin-top:12px"><div class="streak"><span style="font-size:2rem">🔥</span><div class="grow"><span class="num">${currentStreak()}</span> day${currentStreak() === 1 ? "" : "s"} in a row
      ${it("giorni di fila")}</div><span class="small muted">Best: ${S.streak.best}</span></div><div class="week-dots">${dots}</div></div>

    <div class="section-title"><h2>Continue your path</h2><a class="small" href="#/path">All weeks</a></div>
    <a class="row list" href="#/go/week/${wi}/${nd}" style="border-radius:18px"><span class="ico">🚩</span><div class="grow"><span class="small muted">Week ${wi + 1} · Day ${nd + 1}: ${DAY_NAMES[nd][0]}</span><b>${esc(w.t)}</b>${it(esc(w.ti))}
      <div class="bar" style="margin-top:8px"><i style="width:${weekCount(wi) * 20}%"></i></div></div><span class="chev">›</span></a>

    <div class="grid2" style="margin-top:12px">
      <a class="tile" href="${due ? "#/go/cards/due" : "#/cards"}"><span class="em">🗂️</span><b>${due ? due + " words to review" : "Flashcards"}</b>${it(due ? "parole da ripassare" : "Ripassa le parole")}</a>
      <a class="tile" href="#/diary"><span class="em">✍️</span><b>My diary</b>${it("Il mio diario")}</a>
    </div>

    <div class="section-title"><h2>Word of the day</h2><span class="small muted">Parola del giorno</span></div>
    <div class="card"><div style="display:flex;align-items:center;gap:10px"><div class="grow"><div class="q" style="font-size:1.4rem">${esc(wod[0])}</div><div class="small">🇮🇹 ${esc(wod[1])}</div></div>${sayBtn(wod[0])}${starBtn("v|" + wod[0])}</div>
      <p class="muted" style="margin-bottom:0">“${esc(wod[2])}” ${sayBtn(wod[2])}</p></div>

    <div class="section-title"><h2>Forgot something?</h2><span class="small muted">Hai un dubbio?</span></div>
    <form class="search" id="qs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="search" id="qsi" placeholder="Search a word or rule… · Cerca" enterkeyhint="search"></form>`;
  $("#qs").onsubmit = e => { e.preventDefault(); const q = $("#qsi").value.trim(); location.hash = "#/check/" + encodeURIComponent(q); };
}

function pathPage() {
  setTop("Your path · A2 → B1", false);
  const total = D.path.length * 5, done = D.path.reduce((a, w, i) => a + weekCount(i), 0), cw = curWeek();
  V.innerHTML = `<div class="hero" style="margin-top:6px"><div class="eyebrow" style="color:#fff;opacity:.8">From A2 to B1</div><h2 style="margin-top:6px">12 weeks · 5 short days each</h2>
    ${it("12 settimane · 5 giorni brevi ciascuna")}<div class="bar" style="margin-top:14px"><i style="width:${Math.round(100 * done / total)}%"></i></div>
    <p class="small" style="margin-bottom:0">${done} of ${total} days done · You can do them in any order.</p>${it("Puoi farli in qualsiasi ordine.")}</div>
    <div class="list" style="margin-top:14px">${D.path.map((w, i) => { const c = weekCount(i); return `<a class="row" href="#/week/${i}"><span class="ico" style="${i === cw ? "background:var(--coral);color:#fff" : ""}">${c === 5 ? "✓" : i + 1}</span>
      <div class="grow"><b>${esc(w.t)}</b>${it(esc(w.ti))}<span class="small muted">${w.g.map(g => esc(G[g].t.split(" (")[0])).join(" · ")}</span></div>
      <span class="chip ${c === 5 ? "done" : ""}">${c}/5</span></a>`; }).join("")}</div>`;
}

function weekPage(wi) {
  wi = +wi; const w = D.path[wi]; if (!w) return notFound();
  setTop("Week " + (wi + 1), true);
  const l = L[w.life], p = P[w.pron], v = VT[w.vocab], dy = D.diary[w.diary];
  V.innerHTML = `<div style="padding:6px 0 12px"><div class="eyebrow">Week ${wi + 1} of 12</div><h1 style="margin-top:4px">${esc(w.t)}</h1>${it(esc(w.ti))}
    <p><b>Goal:</b> ${esc(w.goal)}</p>${it(esc(w.goalIt))}</div>
    <div class="list">${DAY_NAMES.map(([n, ni], d) => `<a class="row" href="#/go/week/${wi}/${d}"><span class="ico">${dayDone(wi, d) ? "✅" : ["📘", "🗂️", "💬", "👂", "✍️"][d]}</span>
      <div class="grow"><b>Day ${d + 1}: ${n}</b>${it(ni)}<span class="small muted">${[w.g.slice(0, 1).map(g => esc(G[g].t)).join(""), esc(v.t), esc(l.t), esc(p.t), w.g.slice(1).map(g => esc(G[g].t)).join(" · ") + " + diary"][d]}</span></div>
      <span class="chev">›</span></a>`).join("")}</div>
    <div class="section-title"><h2>This week's material</h2><span class="small muted">Materiale</span></div>
    <div class="list">${w.g.map(g => `<a class="row" href="#/g/${g}"><span class="ico">📘</span><div class="grow"><b>${esc(G[g].t)}</b>${it(esc(G[g].ti))}</div><span class="chev">›</span></a>`).join("")}
      <a class="row" href="#/life/${l.id}"><span class="ico">${l.icon}</span><div class="grow"><b>${esc(l.t)}</b>${it(esc(l.ti))}</div><span class="chev">›</span></a>
      <a class="row" href="#/pron/${p.id}"><span class="ico">👄</span><div class="grow"><b>${esc(p.t)}</b>${it(esc(p.ti))}</div><span class="chev">›</span></a>
      <a class="row" href="#/words/${v.id}"><span class="ico">${v.icon}</span><div class="grow"><b>${esc(v.t)}</b>${it(esc(v.ti))}</div><span class="chev">›</span></a>
      <a class="row" href="#/diary/write/${w.diary}"><span class="ico">✍️</span><div class="grow"><b>${esc(dy.p)}</b>${it(esc(dy.pIt))}</div><span class="chev">›</span></a></div>`;
}

function lifeList() {
  setTop("Real life in the UK", false);
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Real life</h1>${it("Situazioni di vita reale nel Regno Unito")}
    <p class="muted">Key phrases, a conversation to listen to, and a role-play where you play yourself.</p>${it("Frasi chiave, un dialogo da ascoltare e un gioco di ruolo in cui sei tu a parlare.")}</div>
    <div class="list">${D.life.map(l => `<a class="row" href="#/life/${l.id}"><span class="ico">${l.icon}</span><div class="grow"><b>${esc(l.t)}</b>${it(esc(l.ti))}</div>
      ${S.life[l.id] ? '<span class="chip done">✓</span>' : `<span class="chip ${l.lvl.toLowerCase()}">${l.lvl}</span>`}<span class="chev">›</span></a>`).join("")}</div>`;
}

function lifeDetail(id) {
  const l = L[id]; if (!l) return notFound();
  setTop(l.t, true);
  V.innerHTML = `<div style="padding:6px 0 12px"><div style="font-size:2.4rem">${l.icon}</div><h1>${esc(l.t)}</h1>${it(esc(l.ti))}</div>
    <div class="card" style="background:var(--gold-soft);border-color:transparent">💡 <b>Good to know</b><p class="small" style="margin-bottom:0">${l.tip}</p>${it(l.tipIt)}</div>
    <div class="btn-row" style="margin-top:14px"><a class="btn primary big" href="#/go/role/${l.id}">🎭 Your turn: role-play</a></div>
    ${it("Gioco di ruolo: tu fai la tua parte", "small")}
    <div class="section-title"><h2>Key phrases</h2><span class="small muted">Frasi chiave</span></div>
    <div class="card">${l.phrases.map(([en, itx]) => lineHTML(en, itx, "p|" + en)).join("")}</div>
    <div class="btn-row" style="margin-top:10px"><button class="btn" id="saveAll">⭐ Save all to flashcards</button><a class="btn" href="#/go/speaklife/${l.id}">🎤 Practise saying them</a></div>
    <div class="section-title"><h2>Conversation</h2><span class="small muted">Dialogo</span></div>
    <button class="btn navy block" data-playall="${esc(l.id)}" style="margin-bottom:12px">▶ Play the whole conversation · Ascolta tutto</button>
    ${dialogueHTML(l)}`;
  $("#saveAll").onclick = () => { l.phrases.forEach(([en]) => { const k = "p|" + en; if (S.stars.indexOf(k) < 0) toggleStar(k); }); $$("[data-star]").forEach(b => { b.classList.add("on"); b.textContent = "⭐"; }); toast("Saved to your flashcards ⭐"); };
}
function playAll(id, btn) {
  const l = L[id]; let i = 0;
  if (btn.dataset.playing) { btn.dataset.playing = ""; stopSpeech(); $$(".bubble.speaking").forEach(b => b.classList.remove("speaking")); btn.innerHTML = "▶ Play the whole conversation · Ascolta tutto"; return; }
  btn.dataset.playing = "1"; btn.innerHTML = "⏸ Stop";
  const step = () => {
    $$(".bubble.speaking").forEach(b => b.classList.remove("speaking"));
    if (i >= l.dlg.length || !btn.dataset.playing || !document.body.contains(btn)) { btn.dataset.playing = ""; btn.innerHTML = "▶ Play the whole conversation · Ascolta tutto"; return; }
    const b = $("#b" + i); if (b) { b.classList.add("speaking"); b.scrollIntoView({ block: "center", behavior: "smooth" }); }
    say(l.dlg[i][1], { onend: () => { i++; setTimeout(step, 450); } });
  };
  step();
}

function practicePage() {
  setTop("Practice", false);
  const due = dueKeys().length;
  const tiles = [
    ["#/cards", "🗂️", "Flashcards", due ? `${due} to review today` : "Learn new words", "Flashcard"],
    ["#/speak", "🎤", "Speaking coach", "Say it, get feedback", "Allenatore di pronuncia"],
    ["#/listen", "👂", "Listening", "Hear it, write it", "Ascolta e scrivi"],
    ["#/diary", "✍️", "My diary", "Write & get hints", "Scrivi e ricevi suggerimenti"],
    ["#/quiz", "✅", "Grammar quiz", "Test the rules", "Quiz di grammatica"],
    ["#/go/ear", "👄", "Ear training", "Ship or sheep?", "Allena l'orecchio"],
    ["#/go/verbs", "🔁", "Irregular verbs", "Go – went – gone", "Verbi irregolari"],
    ["#/go/ff", "🎭", "False friends", "Actually ≠ attualmente", "Falsi amici"]
  ];
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Practice</h1>${it("Pratica: scegli cosa allenare")}</div>
    <div class="grid2">${tiles.map(([h, e, t, d, di]) => `<a class="tile" href="${h}"><span class="em">${e}</span><b>${t}</b><span class="small muted">${d}</span>${it(di)}</a>`).join("")}</div>`;
}

function cardsPage() {
  setTop("Flashcards", true);
  const due = dueKeys().length;
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Flashcards</h1>${it("Le parole tornano quando stai per dimenticarle.")}
    <p class="muted small">Words you know come back less often; words you find hard come back sooner (spaced repetition).</p></div>
    <div class="list">
      <a class="row" href="#/go/cards/due"><span class="ico">⏰</span><div class="grow"><b>Review today</b>${it("Da ripassare oggi")}</div><span class="chip ${due ? "due" : ""}">${due}</span><span class="chev">›</span></a>
      <a class="row" href="#/go/cards/stars"><span class="ico">⭐</span><div class="grow"><b>My saved words</b>${it("Le mie parole salvate")}</div><span class="chip">${S.stars.length}</span><span class="chev">›</span></a>
    </div>
    <div class="section-title"><h2>By topic</h2><span class="small muted">Per argomento</span></div>
    <div class="list">${D.vocab.map(t => `<a class="row" href="#/go/cards/${t.id}"><span class="ico">${t.icon}</span><div class="grow"><b>${esc(t.t)}</b>${it(esc(t.ti))}
      <div class="bar" style="margin-top:6px"><i style="width:${Math.round(100 * learnedIn(t.id) / t.items.length)}%"></i></div></div><span class="small muted">${learnedIn(t.id)}/${t.items.length}</span><span class="chev">›</span></a>`).join("")}</div>`;
}
function cardsSession(deck) {
  let keys;
  if (deck === "due") keys = shuffle(dueKeys()).slice(0, 12);
  else if (deck === "stars") keys = shuffle(S.stars.filter(k => CARD[k])).slice(0, 12);
  else if (VT[deck]) {
    const all = VT[deck].items.map(i => "v|" + i[0]);
    const t = today();
    keys = all.filter(k => S.srs[k] && S.srs[k].d <= t).concat(all.filter(k => !S.srs[k])).slice(0, 10);
    if (keys.length < 6) keys = keys.concat(shuffle(all.filter(k => keys.indexOf(k) < 0))).slice(0, 10);
  }
  if (!keys || !keys.length) {
    setTop("Flashcards", true);
    V.innerHTML = `<div class="card empty" style="margin-top:20px"><div class="done-big">🎉</div><h2>Nothing to review right now!</h2>${it("Niente da ripassare adesso!")}
      <p>${deck === "stars" ? "Tap ⭐ next to any word or phrase to save it here." : "Learn some new words by topic."}</p><a class="btn primary" href="#/cards">Choose a topic</a></div>`;
    return;
  }
  startSession({ title: "Flashcards", steps: keys.map(key => ({ type: "card", key })), back: "#/cards", again: "#/go/cards/" + deck });
}

function speakPage() {
  setTop("Speaking coach", true);
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Speaking coach</h1>${it("Allenatore di pronuncia")}
    <p>Listen, then say the sentence. ${SRC ? "Your phone will tell you which words were clear." : canRecord ? "Record yourself and compare with the model." : ""}</p>
    ${it(SRC ? "Ascolta e ripeti: il telefono ti dirà quali parole erano chiare." : "Registrati e confronta con il modello.")}
    ${!SRC ? `<div class="card small" style="background:var(--gold-soft);border:0">ℹ️ Automatic checking works best in <b>Chrome</b> or <b>Safari</b>. Here you can record yourself and listen back.</div>` : `<p class="small muted">Tip: speak clearly at a normal speed. If it doesn't hear you, check the microphone permission. On iPhone, use Safari.</p>`}</div>
    <div class="list">
      <a class="row" href="#/go/speak/mix"><span class="ico">🎲</span><div class="grow"><b>Everyday phrases (mix)</b>${it("Frasi di tutti i giorni")}</div><span class="chev">›</span></a>
      <a class="row" href="#/go/speak/sounds"><span class="ico">👄</span><div class="grow"><b>Difficult sounds</b>${it("Suoni difficili (th, h, ship/sheep…)")}</div><span class="chev">›</span></a>
      ${D.life.map(l => `<a class="row" href="#/go/speaklife/${l.id}"><span class="ico">${l.icon}</span><div class="grow"><b>${esc(l.t)}</b>${it(esc(l.ti))}</div><span class="chev">›</span></a>`).join("")}
    </div>`;
}
function listenPage() {
  setTop("Listening", true);
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Listening</h1>${it("Ascolto (dettato)")}
    <p>You'll hear a sentence. Write what you hear — you can play it again or slowly as many times as you like.</p>${it("Ascolta una frase e scrivila. Puoi riascoltarla anche lentamente.")}</div>
    <div class="list"><a class="row" href="#/go/listen/easy"><span class="ico">🙂</span><div class="grow"><b>Short sentences</b>${it("Frasi brevi")}</div><span class="chip a2">A2</span><span class="chev">›</span></a>
      <a class="row" href="#/go/listen/hard"><span class="ico">💪</span><div class="grow"><b>Longer sentences</b>${it("Frasi più lunghe")}</div><span class="chip b1">B1</span><span class="chev">›</span></a></div>`;
}
function quizPage() {
  setTop("Grammar quiz", true);
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Grammar quiz</h1>${it("Quiz di grammatica")}</div>
    <a class="btn primary block big" href="#/go/quiz/mix">🎲 Mixed quiz · 10 questions</a>
    ${weakGrammar().length ? `<a class="btn block" href="#/go/quiz/weak" style="margin-top:10px">💪 My difficult topics (${weakGrammar().length})</a>` : ""}
    ${D.grammarCats.map(([c, t, ti]) => `<div class="section-title"><h2>${t}</h2><span class="small muted">${ti}</span></div><div class="list">${D.grammar.filter(g => g.cat === c).map(g => { const r = S.quiz[g.id];
      return `<a class="row" href="#/go/quiz/${g.id}"><div class="grow"><b>${esc(g.t)}</b>${it(esc(g.ti))}</div>${r ? `<span class="chip ${r.r >= r.w ? "done" : "due"}">${r.r}✓ ${r.w}✗</span>` : `<span class="chip ${g.lvl.toLowerCase()}">${g.lvl}</span>`}<span class="chev">›</span></a>`; }).join("")}</div>`).join("")}`;
}

/* ---------- diary ---------- */
function diaryPage() {
  setTop("My diary", true);
  const sug = D.path[curWeek()].diary;
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>My diary</h1>${it("Il mio diario")}
    <p>Write a few sentences. You'll get friendly hints about common mistakes Italian speakers make.</p>${it("Scrivi qualche frase e ricevi suggerimenti sugli errori tipici degli italiani.")}</div>
    <a class="card" href="#/diary/write/${sug}" style="display:block;text-decoration:none;color:inherit;background:var(--navy-soft);border-color:transparent">
      <div class="eyebrow">Suggested for you · Consigliato</div><p class="q" style="margin:6px 0 2px">${esc(D.diary[sug].p)}</p>${it(esc(D.diary[sug].pIt))}
      <span class="btn primary" style="margin-top:10px">✍️ Write · Scrivi</span></a>
    <a class="btn block" href="#/diary/write/free" style="margin-top:10px">📝 Write about anything · Scrivi liberamente</a>
    ${S.diary.length ? `<div class="section-title"><h2>My entries</h2><span class="small muted">${S.diary.length}</span></div>
      <div class="list">${S.diary.map((e, i) => [e, i]).reverse().map(([e, i]) => `<a class="row" href="#/diary/entry/${i}"><span class="ico">📄</span><div class="grow"><span class="small muted">${esc(e.d)}</span><b style="font-weight:400">${esc(e.text.slice(0, 80))}${e.text.length > 80 ? "…" : ""}</b></div><span class="chev">›</span></a>`).join("")}</div>` : ""}
    <div class="section-title"><h2>All topics</h2><span class="small muted">Tutti gli argomenti</span></div>
    <div class="list">${D.diary.map((p, i) => `<a class="row" href="#/diary/write/${i}"><div class="grow"><b style="font-weight:400">${esc(p.p)}</b>${it(esc(p.pIt))}</div><span class="chip ${p.lvl.toLowerCase()}">${p.lvl}</span><span class="chev">›</span></a>`).join("")}</div>`;
}
function hintsHTML(text) {
  const hs = Checker.check(text);
  if (!text.trim()) return "";
  let html = "", pos = 0;
  hs.forEach(h => { html += esc(text.slice(pos, h.start)) + `<mark class="${h.type === "tip" ? "tip" : ""}">${esc(text.slice(h.start, h.end))}</mark>`; pos = h.end; });
  html += esc(text.slice(pos));
  const errs = hs.filter(h => h.type === "err").length, tips = hs.length - errs;
  return `<div class="card" style="margin-top:14px"><b>${hs.length ? `${errs ? `🔍 ${errs} thing${errs > 1 ? "s" : ""} to check` : "✓ No common mistakes found!"}${tips ? ` · 💡 ${tips} tip${tips > 1 ? "s" : ""}` : ""}` : "✓ No common mistakes found — well done!"}</b>
    ${it(hs.length ? "Controlla le parti evidenziate." : "Nessun errore comune trovato, brava!")}
    <div class="preview" style="margin-top:10px">${html}</div>
    ${hs.map(h => `<div class="hint ${h.type === "tip" ? "tip" : ""}"><div><span class="found">“${esc(h.found)}”</span> → <b>${esc(h.fix)}</b></div><div class="small">${esc(h.en)}</div>${it(esc(h.it))}
      ${h.g && G[h.g] ? `<a class="small" href="#/g/${h.g}">Rule: ${esc(G[h.g].t)} ›</a>` : ""}</div>`).join("")}
    <p class="small muted" style="margin-bottom:0">These hints are automatic and can't find every mistake. For a full correction, use “Ask AI”, or show it to someone.<br><span class="it noflag">I suggerimenti sono automatici e non trovano tutti gli errori.</span></p></div>`;
}
function diaryWrite(idx) {
  const free = idx === "free";
  const p = free ? { p: "Write about anything you like: your day, your plans, a memory…", pIt: "Scrivi quello che vuoi: la tua giornata, i tuoi programmi, un ricordo…", help: ["Today I…", "Yesterday I…", "I'm looking forward to…", "I've been thinking about…"], model: "" } : D.diary[+idx];
  if (!p) return notFound();
  setTop("Write", true);
  const dk = "cuppa-draft-" + idx;
  V.innerHTML = `<div class="card" style="margin-top:6px"><p class="q">${esc(p.p)}</p>${it(esc(p.pIt))}
      <p class="small muted" style="margin:10px 0 6px">Tap to add · Tocca per aggiungere:</p><div class="chips">${p.help.map(h => `<button data-ins="${esc(h)}">${esc(h)}</button>`).join("")}</div></div>
    <textarea id="txt" rows="7" style="margin-top:12px;min-height:180px" placeholder="Write here… · Scrivi qui…" autocapitalize="sentences"></textarea>
    <div class="small muted" id="wc" style="margin-top:4px">0 words · aim for 30–80</div>
    <div class="btn-row" style="margin-top:12px"><button class="btn primary" id="chk">🔍 Check my English</button><button class="btn" id="read">${SPK.replace("<svg", '<svg width="20" height="20"')} Read it to me</button></div>
    <div id="hints"></div>
    <div class="btn-row" style="margin-top:12px"><button class="btn" id="ai">🤖 Copy to ask AI</button><button class="btn navy" id="save">💾 Save · Salva</button></div>
    ${p.model ? `<details class="card" style="margin-top:14px"><summary>👀 Show an example answer · Esempio</summary><p>${esc(p.model)}</p><div class="btn-row">${sayPair(p.model)}</div></details>` : ""}`;
  const ta = $("#txt");
  ta.value = lsGet(dk) || "";
  const upd = () => { const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; $("#wc").textContent = `${n} word${n === 1 ? "" : "s"} · aim for 30–80`; lsSet(dk, ta.value); };
  ta.oninput = upd; upd();
  $$("[data-ins]").forEach(b => b.onclick = () => { const v = ta.value; ta.value = v + (v && !/\s$/.test(v) ? " " : "") + b.dataset.ins.replace(/…$/, "") + " "; upd(); ta.focus(); });
  $("#chk").onclick = () => { if (!ta.value.trim()) return toast("Write something first · Scrivi qualcosa"); $("#hints").innerHTML = hintsHTML(ta.value); };
  $("#read").onclick = () => { if (ta.value.trim()) say(ta.value, { btn: $("#read") }); };
  $("#ai").onclick = async () => {
    if (!ta.value.trim()) return toast("Write something first · Scrivi qualcosa");
    const prompt = `Please correct my English. I'm Italian and my level is A2–B1. I live in the UK, so please use British English.\n1) List each mistake with a short, simple explanation in English and in Italian.\n2) Then write my corrected text.\n3) Finally, suggest one more natural way to say one of my sentences.\n\nTask: ${p.p}\n\nMy text:\n${ta.value.trim()}`;
    try { await navigator.clipboard.writeText(prompt); toast("Copied! Paste it into an AI app (e.g. Claude) · Copiato!"); }
    catch (e) { const t = document.createElement("textarea"); t.value = prompt; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); toast("Copied! · Copiato!"); } catch (er) { toast("Couldn't copy"); } t.remove(); }
  };
  $("#save").onclick = () => {
    if (!ta.value.trim()) return toast("Write something first · Scrivi qualcosa");
    S.diary.push({ d: today(), p: free ? -1 : +idx, text: ta.value.trim() });
    markPractised(); save(); lsSet(dk, "");
    toast("Saved to your diary ✓ · Salvato");
    location.hash = "#/diary/entry/" + (S.diary.length - 1);
  };
}
function diaryEntry(i) {
  const e = S.diary[+i]; if (!e) return notFound();
  setTop(e.d, true);
  const p = e.p >= 0 ? D.diary[e.p] : null;
  V.innerHTML = `<div class="card" style="margin-top:6px">${p ? `<p class="small muted">${esc(p.p)}</p>` : ""}<p class="preview">${esc(e.text)}</p>
    <div class="btn-row">${sayPair(e.text)}</div></div>${hintsHTML(e.text)}
    <div class="btn-row" style="margin-top:14px"><a class="btn" href="#/diary">← My diary</a><button class="btn ghost" id="del">🗑 Delete</button></div>`;
  $("#del").onclick = () => { if (confirm("Delete this entry? · Eliminare?")) { S.diary.splice(+i, 1); save(); location.hash = "#/diary"; } };
}

/* ---------- Quick check (reference) ---------- */
let INDEX = null;
function buildIndex() {
  const X = [];
  D.grammar.forEach(g => X.push({ k: 0, type: "Grammar", t: g.t, sub: g.ti, href: "#/g/" + g.id, txt: [g.t, g.ti, g.tags, strip(g.rule.join(" ")), g.ex.map(e => e.join(" ")).join(" "), g.mist.map(m => m.join(" ")).join(" ")].join(" ") }));
  D.pron.forEach(p => X.push({ k: 1, type: "Pronunciation", t: p.t, sub: p.ti, href: "#/pron/" + p.id, txt: [p.t, p.ti, p.sym, strip(p.desc), (p.pairs || []).flat().join(" "), (p.words || []).map(w => w[0]).join(" ")].join(" ") }));
  D.verbs.forEach(([b, p, pp, itx]) => X.push({ k: 2, type: "Irregular verb", t: `${b} – ${p} – ${pp}`, sub: itx, say: `${b}, ${p}, ${pp}`, key: "i|" + b, txt: [b, p, pp, itx, "irregular verb past participle"].join(" ") }));
  D.falseFriends.forEach(([en, itx, fit, fen]) => X.push({ k: 3, type: "False friend", t: en, sub: `= ${itx} · ⚠️ not “${fit}” (${fen})`, say: en, key: "f|" + en, txt: [en, itx, fit, fen, "false friend falso amico"].join(" ") }));
  D.confusing.forEach((c, i) => X.push({ k: 4, type: "Confusing words", t: c.w, sub: c.it, href: "#/confusing/" + i, txt: [c.w, c.it, strip(c.rule), c.ex.join(" ")].join(" ") }));
  D.vocab.forEach(th => th.items.forEach(([en, itx, ex]) => X.push({ k: 5, type: "Word", t: en, sub: itx, ex, say: en, key: "v|" + en, txt: [en, itx, ex, th.t, th.ti].join(" ") })));
  D.life.forEach(l => l.phrases.forEach(([en, itx]) => X.push({ k: 6, type: "Phrase", t: en, sub: itx + " · " + l.t, say: en, key: "p|" + en, href: "#/life/" + l.id, txt: [en, itx, l.t, l.ti].join(" ") })));
  X.forEach(x => { x.f = fold(x.txt); x.ft = fold(x.t); });
  return X;
}
function search(q) {
  INDEX = INDEX || buildIndex();
  const fq = fold(q).trim(); if (!fq) return [];
  const toks = fq.split(/\s+/).filter(Boolean);
  const res = [];
  INDEX.forEach(x => {
    if (!toks.every(t => x.f.indexOf(t) >= 0)) return;
    let s = x.k;
    if (x.ft === fq) s -= 30; else if (x.ft.indexOf(fq) === 0) s -= 20; else if (x.ft.indexOf(fq) >= 0) s -= 12; else if (fold(x.sub).indexOf(fq) >= 0) s -= 8;
    res.push([s, x]);
  });
  return res.sort((a, b) => a[0] - b[0]).slice(0, 40).map(r => r[1]);
}
function resultHTML(x) {
  const inner = `<div class="grow"><div class="res-type">${x.type}</div><b>${esc(x.t)}</b><span class="small">🇮🇹 ${esc(x.sub)}</span>${x.ex ? `<div class="small muted">“${esc(x.ex)}”</div>` : ""}</div>`;
  if (x.say) return `<div class="row">${inner}${sayBtn(x.say)}${x.key ? starBtn(x.key) : ""}${x.href ? `<a class="chev" href="${x.href}" aria-label="Open">›</a>` : ""}</div>`;
  return `<a class="row" href="${x.href}">${inner}<span class="chev">›</span></a>`;
}
function checkPage(q) {
  setTop("Quick check", false);
  q = q ? decodeURIComponent(q) : "";
  const cats = [["#/grammar", "📘", "Grammar rules", "Regole di grammatica", D.grammar.length], ["#/pron", "👄", "Pronunciation", "Pronuncia", D.pron.length],
    ["#/verbs", "🔁", "Irregular verbs", "Verbi irregolari", D.verbs.length], ["#/ff", "🎭", "False friends", "Falsi amici", D.falseFriends.length],
    ["#/confusing", "🤔", "Confusing words", "Parole che si confondono", D.confusing.length], ["#/words", "🗂️", "Vocabulary by topic", "Vocaboli per argomento", D.vocab.reduce((a, t) => a + t.items.length, 0)],
    ["#/life", "💬", "Useful phrases", "Frasi utili", D.life.length]];
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Quick check</h1>${it("Ripasso veloce: cerca in inglese o in italiano")}</div>
    <form class="search" id="sf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="search" id="si" placeholder="e.g. since, scontrino, past of buy…" value="${esc(q)}" enterkeyhint="search" autocomplete="off"></form>
    <div id="sr"></div>
    <div id="home">
      ${S.recent.length ? `<div class="section-title"><h2>Recently viewed</h2><span class="small muted">Visti di recente</span></div>
        <div class="list">${S.recent.slice(0, 5).map(r => `<a class="row" href="${esc(r.h)}"><span class="ico">🕘</span><div class="grow"><b>${esc(r.t)}</b></div><span class="chev">›</span></a>`).join("")}</div>` : ""}
      <div class="section-title"><h2>Browse</h2><span class="small muted">Sfoglia</span></div>
      <div class="list">${cats.map(([h, e, t, ti, n]) => `<a class="row" href="${h}"><span class="ico">${e}</span><div class="grow"><b>${t}</b>${it(ti)}</div><span class="small muted">${n}</span><span class="chev">›</span></a>`).join("")}</div>
    </div>`;
  const run = () => {
    const v = $("#si").value.trim();
    $("#home").hidden = !!v;
    if (!v) { $("#sr").innerHTML = ""; return; }
    const r = search(v);
    const fv = fold(v), english = !r.length || r.some(x => x.ft.indexOf(fv) >= 0) || (/^[a-z' -]+$/i.test(v) && !r.some(x => fold(x.sub).indexOf(fv) >= 0));
    $("#sr").innerHTML = (english ? `<div class="card" style="margin-top:12px;display:flex;align-items:center;gap:10px"><div class="grow"><span class="small muted">Hear it pronounced · Ascolta la pronuncia</span><b style="display:block">“${esc(v)}”</b></div>${sayPair(v)}</div>` : "") + `
      <div class="list" style="margin-top:12px">${r.length ? r.map(resultHTML).join("") : `<div class="empty">No results. Try another word — in English or Italian.<br><span class="it noflag">Nessun risultato. Prova un'altra parola.</span></div>`}</div>`;
  };
  let t; $("#si").oninput = () => { clearTimeout(t); t = setTimeout(run, 150); };
  $("#sf").onsubmit = e => { e.preventDefault(); run(); $("#si").blur(); };
  if (q) run();
}
function addRecent(h, t) { S.recent = [{ h, t }].concat(S.recent.filter(r => r.h !== h)).slice(0, 8); save(); }

function grammarList() {
  setTop("Grammar rules", true);
  V.innerHTML = `<div style="padding:6px 0 4px"><h1>Grammar rules</h1>${it("Regole di grammatica, spiegate in modo semplice")}</div>
    ${D.grammarCats.map(([c, t, ti]) => `<div class="section-title"><h2>${t}</h2><span class="small muted">${ti}</span></div>
      <div class="list">${D.grammar.filter(g => g.cat === c).map(g => `<a class="row" href="#/g/${g.id}"><div class="grow"><b>${esc(g.t)}</b>${it(esc(g.ti))}</div><span class="chip ${g.lvl.toLowerCase()}">${g.lvl}</span><span class="chev">›</span></a>`).join("")}</div>`).join("")}`;
}
function grammarCard(id) {
  const g = G[id]; if (!g) return notFound();
  setTop("Grammar", true); addRecent("#/g/" + id, g.t);
  const wk = weekOfGrammar(id);
  V.innerHTML = `<div style="margin-top:6px">${grammarHTML(g)}</div>
    <a class="btn primary block big" href="#/go/quiz/${id}" style="margin-top:18px">✅ Practise: ${g.quiz.length} questions · Esercitati</a>
    ${wk >= 0 ? `<a class="btn block" href="#/week/${wk}" style="margin-top:10px">🚩 Part of week ${wk + 1}: ${esc(D.path[wk].t)}</a>` : ""}`;
}
function pronPage(id) {
  if (id) {
    const p = P[id]; if (!p) return notFound();
    setTop("Pronunciation", true); addRecent("#/pron/" + id, p.t);
    V.innerHTML = `<div style="margin-top:6px">${pronHTML(p)}</div><div class="stack" style="margin-top:18px">
      ${p.pairs ? `<a class="btn primary block big" href="#/go/ear/${id}">👂 Test your ear · Allena l'orecchio</a>` : ""}
      <a class="btn block" href="#/go/speakpron/${id}">🎤 Practise saying it · Prova a dirlo</a></div>`;
    return;
  }
  setTop("Pronunciation", true);
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Pronunciation</h1>${it("Pronuncia: i suoni più difficili per chi parla italiano")}</div>
    <a class="btn primary block" href="#/go/ear" style="margin-bottom:12px">👂 Ear training (all sounds)</a>
    <div class="list">${D.pron.map(p => `<a class="row" href="#/pron/${p.id}"><span class="ico">👄</span><div class="grow"><b>${esc(p.t)}</b>${it(esc(p.ti))}</div><span class="chev">›</span></a>`).join("")}</div>`;
}
function verbsPage() {
  setTop("Irregular verbs", true); addRecent("#/verbs", "Irregular verbs");
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Irregular verbs</h1>${it("Verbi irregolari: tocca una riga per ascoltare")}
    <p class="small muted">In British English, <i>learnt, dreamt, spelt, smelt</i> are common — <i>learned</i> etc. are also correct.</p></div>
    <a class="btn primary block" href="#/go/verbs">🔁 Test me · Mettimi alla prova</a>
    <input type="search" id="vf" placeholder="Filter… (e.g. buy, comprare)" style="margin-top:12px" autocomplete="off">
    <div class="card" style="margin-top:12px;padding:8px 10px"><table class="vt"><thead><tr><th>Base</th><th>Past</th><th>Participle</th></tr></thead><tbody id="vb"></tbody></table></div>`;
  const draw = f => {
    const ff = fold(f || "");
    $("#vb").innerHTML = D.verbs.filter(v => !ff || fold(v.join(" ")).indexOf(ff) >= 0).map(([b, p, pp, itx]) => `<tr data-say="${esc(`${b}, ${p}, ${pp}`)}"><td class="b">${esc(b)}${it(esc(itx))}</td><td>${esc(p)}</td><td>${esc(pp)}</td></tr>`).join("");
  };
  draw(""); $("#vf").oninput = e => draw(e.target.value);
}
function ffPage() {
  setTop("False friends", true); addRecent("#/ff", "False friends");
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>False friends</h1>${it("Falsi amici: parole che sembrano italiane ma significano altro!")}</div>
    <a class="btn primary block" href="#/go/ff">🎭 Quiz me · Mettimi alla prova</a>
    <div class="list" style="margin-top:12px">${D.falseFriends.map(([en, itx, fit, fen]) => `<div class="row"><div class="grow"><b>${esc(en)}</b><span>= ${esc(itx)}</span>
      <div class="small" style="color:var(--bad)">⚠️ “${esc(fit)}” in Italian = <b>${esc(fen)}</b></div></div>${sayBtn(en)}${starBtn("f|" + en)}</div>`).join("")}</div>`;
}
function confPage(i) {
  setTop("Confusing words", true); addRecent("#/confusing", "Confusing words");
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Confusing words</h1>${it("Parole che si confondono facilmente")}</div>
    ${D.confusing.map((c, n) => `<div class="card" id="c${n}"><h3>${esc(c.w)}</h3>${it(esc(c.it))}<p>${c.rule}</p>${c.ex.map(e => lineHTML(e, "")).join("")}</div>`).join("")}`;
  if (i != null) setTimeout(() => { const e = $("#c" + i); if (e) { e.scrollIntoView({ block: "start" }); e.style.outline = "3px solid var(--coral)"; } }, 50);
}
function wordsPage(id) {
  if (id) {
    const t = VT[id]; if (!t) return notFound();
    setTop(t.t, true); addRecent("#/words/" + id, t.t);
    V.innerHTML = `<div style="padding:6px 0 12px"><div style="font-size:2.2rem">${t.icon}</div><h1>${esc(t.t)}</h1>${it(esc(t.ti))}</div>
      <a class="btn primary block" href="#/go/cards/${id}">🗂️ Study as flashcards · Studia</a>
      <div class="card" style="margin-top:12px">${t.items.map(([en, itx, ex]) => lineHTML(en, itx, "v|" + en, ex ? `<div class="small muted" style="margin-top:2px">“${esc(ex)}” <button class="say slow" style="width:30px;height:30px;font-size:.8rem;vertical-align:middle" data-say="${esc(ex)}" aria-label="Listen to example">${SPK}</button></div>` : "")).join("")}</div>`;
    return;
  }
  setTop("Vocabulary", true);
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Vocabulary</h1>${it("Vocaboli per argomento (inglese britannico)")}</div>
    <div class="list">${D.vocab.map(t => `<a class="row" href="#/words/${t.id}"><span class="ico">${t.icon}</span><div class="grow"><b>${esc(t.t)}</b>${it(esc(t.ti))}</div><span class="small muted">${t.items.length}</span><span class="chev">›</span></a>`).join("")}</div>`;
}

/* ---------- settings ---------- */
function settingsPage() {
  setTop("Settings", true);
  const vs = enVoices();
  V.innerHTML = `<div style="padding:6px 0 12px"><h1>Settings</h1>${it("Impostazioni")}</div>
    <div class="card">
      <div class="setting"><label for="nm"><b>Your name</b>${it("Il tuo nome")}</label><input type="text" id="nm" value="${esc(S.name)}" style="max-width:50%"></div>
      <div class="setting"><div><b>Italian help</b>${it("Mostra l'aiuto in italiano", "reveal-on")}</div><label class="switch"><input type="checkbox" id="itS" ${S.set.it ? "checked" : ""}><span></span></label></div>
      <div class="setting" style="display:block"><b>Daily session</b>${it("Durata della pratica quotidiana")}<div class="seg" style="margin-top:8px"><button data-len="5" class="${S.set.len === 5 ? "on" : ""}">5 min</button><button data-len="10" class="${S.set.len === 10 ? "on" : ""}">10 min</button></div></div>
      <div class="setting" style="display:block"><b>Text size</b>${it("Dimensione del testo")}<div class="seg" style="margin-top:8px">${[[1, "A"], [1.12, "A+"], [1.25, "A++"]].map(([v, l]) => `<button data-size="${v}" class="${S.set.size === v ? "on" : ""}" style="font-size:${v}rem">${l}</button>`).join("")}</div></div>
      <div class="setting" style="display:block"><b>Theme</b>${it("Tema")}<div class="seg" style="margin-top:8px">${[["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<button data-theme="${v}" class="${S.set.theme === v ? "on" : ""}">${l}</button>`).join("")}</div></div>
    </div>
    <div class="section-title"><h2>Voice</h2><span class="small muted">Voce</span></div>
    <div class="card">
      ${TTS.ok ? `<label for="vo"><b>English voice</b></label>${it("Scegli una voce britannica (en-GB) se possibile.")}
        <select id="vo" style="width:100%;margin-top:8px"><option value="">Automatic (British if available)</option>${vs.map(v => `<option value="${esc(v.name)}" ${S.set.voice === v.name ? "selected" : ""}>${esc(v.name)} · ${esc(v.lang)}</option>`).join("")}</select>
        <label for="rt" style="display:block;margin-top:14px"><b>Speed</b> <span id="rtv" class="muted">${S.set.rate.toFixed(2)}×</span></label>
        <input type="range" id="rt" min="0.7" max="1.15" step="0.05" value="${S.set.rate}">
        <button class="btn block" id="test" style="margin-top:8px">${SPK.replace("<svg", '<svg width="20" height="20"')} Test the voice</button>
        <p class="small muted">On iPhone you can download better voices: Settings → Accessibility → Spoken Content → Voices → English (UK).</p>`
        : `<p>Audio isn't available in this browser. Try Safari or Chrome.</p>`}
    </div>
    <div class="section-title"><h2>Put it on your home screen</h2></div>
    <div class="card small"><p><b>iPhone (Safari):</b> tap Share <span aria-hidden="true">⬆️</span> → <b>Add to Home Screen</b>.</p><p><b>Android (Chrome):</b> tap ⋮ → <b>Add to Home screen</b>.</p>
      ${it("Aggiungila alla schermata Home: si aprirà come un'app.")}</div>
    <div class="section-title"><h2>Your progress</h2><span class="small muted">I tuoi progressi</span></div>
    <div class="card"><p class="small">Your progress is saved on this phone only. To move it to another device, copy the backup code and paste it there.</p>${it("I progressi sono salvati solo su questo telefono. Copia il codice per spostarli.")}
      <div class="btn-row" style="margin-top:10px"><button class="btn" id="exp">📋 Copy backup code</button><button class="btn" id="imp">📥 Restore</button></div>
      <button class="btn ghost block" id="reset" style="margin-top:10px;color:var(--bad)">Reset everything</button></div>
    <div class="section-title"><h2>How this works</h2></div>
    <div class="card small"><p><b>Little and often.</b> Five minutes every day works better than one hour once a week. Flashcards use <i>spaced repetition</i>: words come back just before you forget them.</p>
      <p><b>British English.</b> Words, phrases, spelling and situations are for life in the UK.</p>
      <p><b>Made for Italian speakers.</b> The rules, tips and diary hints focus on the mistakes Italians often make.</p>
      ${it("Poco ma spesso. Le flashcard ripetono le parole al momento giusto. Tutto è pensato per chi parla italiano e vive nel Regno Unito.")}</div>`;
  $("#nm").onchange = e => { S.name = e.target.value.trim().slice(0, 30); save(); };
  $("#itS").onchange = e => { S.set.it = e.target.checked; save(); applySettings(); };
  $$("[data-len]").forEach(b => b.onclick = () => { S.set.len = +b.dataset.len; save(); settingsPage(); });
  $$("[data-size]").forEach(b => b.onclick = () => { S.set.size = +b.dataset.size; save(); applySettings(); settingsPage(); });
  $$("[data-theme]").forEach(b => b.onclick = () => { S.set.theme = b.dataset.theme; save(); applySettings(); settingsPage(); });
  if (TTS.ok) {
    $("#vo").onchange = e => { S.set.voice = e.target.value; save(); say("Hello! Would you like a cup of tea?"); };
    $("#rt").oninput = e => { S.set.rate = +e.target.value; $("#rtv").textContent = S.set.rate.toFixed(2) + "×"; save(); };
    $("#test").onclick = () => say("Hello! Would you like a cup of tea?", { btn: $("#test") });
  }
  $("#exp").onclick = async () => {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
    try { await navigator.clipboard.writeText(code); toast("Backup code copied ✓"); } catch (e) { prompt("Copy this code:", code); }
  };
  $("#imp").onclick = () => {
    const code = prompt("Paste your backup code: · Incolla il codice:");
    if (!code) return;
    try { const o = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!o || typeof o !== "object" || !o.set) throw 0; S = Object.assign(defaults(), o); save(); applySettings(); toast("Progress restored ✓"); route(); }
    catch (e) { alert("Sorry, that code doesn't work."); }
  };
  $("#reset").onclick = () => { if (confirm("Delete all progress? This can't be undone.\nCancellare tutti i progressi?")) { S = defaults(); save(); applySettings(); location.hash = "#/"; route(); } };
}

function notFound() { setTop("Not found", true); V.innerHTML = `<div class="card empty" style="margin-top:20px"><p>Page not found.</p><a class="btn primary" href="#/">Go to Today</a></div>`; }

/* =========================================================
   ROUTER
   ========================================================= */
function goSession(parts) {
  const [kind, a, b] = parts;
  const def = { title: "Practice", back: "#/practice" };
  if (kind === "daily") Object.assign(def, { title: "Today's 5 minutes", steps: buildDaily(), back: "#/", again: "#/go/daily" });
  else if (kind === "week") {
    const wi = +a, d = +b; if (!D.path[wi] || !(d >= 0 && d < 5)) return notFound();
    Object.assign(def, { title: `Week ${wi + 1} · Day ${d + 1}`, steps: buildWeekDay(wi, d), back: "#/week/" + wi,
      onDone: () => { S.path[wi + "-" + d] = 1; },
      after: d < 4 ? `<a class="btn navy block big" href="#/go/week/${wi}/${d + 1}">Next: Day ${d + 2} · ${DAY_NAMES[d + 1][0]}</a>` : (wi < 11 ? `<a class="btn navy block big" href="#/week/${wi + 1}">Start week ${wi + 2} 🚩</a>` : "") });
  }
  else if (kind === "cards") return cardsSession(a || "due");
  else if (kind === "quiz") {
    let steps;
    if (a === "mix") steps = quizSteps(D.grammar.map(g => g.id), 10);
    else if (a === "weak") steps = quizSteps(weakGrammar(), 10);
    else if (G[a]) steps = quizSteps([a]);
    else return notFound();
    Object.assign(def, { title: a === "mix" ? "Mixed quiz" : a === "weak" ? "Difficult topics" : G[a].t, steps, back: G[a] ? "#/g/" + a : "#/quiz", again: "#/go/quiz/" + a });
  }
  else if (kind === "listen") { const pool = shuffle(listenPool(a === "hard" ? "hard" : "easy")).slice(0, 6); Object.assign(def, { title: "Listening", steps: pool.map(([t, i]) => ({ type: "listen", text: t, it: i })), back: "#/listen", again: "#/go/listen/" + a }); }
  else if (kind === "speak") {
    const pool = a === "sounds" ? shuffle(D.pron.reduce((acc, p) => acc.concat(p.sents.map(s => [s, ""])), [])).slice(0, 6) : shuffle(speakPool()).slice(0, 6);
    Object.assign(def, { title: "Speaking coach", steps: pool.map(([t, i]) => ({ type: "speak", text: t, it: i })), back: "#/speak", again: "#/go/speak/" + a });
  }
  else if (kind === "speaklife") { const l = L[a]; if (!l) return notFound(); Object.assign(def, { title: l.t, steps: l.phrases.map(([t, i]) => ({ type: "speak", text: t, it: i })), back: "#/life/" + a }); }
  else if (kind === "speakpron") { const p = P[a]; if (!p) return notFound(); Object.assign(def, { title: p.t, steps: p.sents.map(t => ({ type: "speak", text: t, it: "" })), back: "#/pron/" + a }); }
  else if (kind === "role") {
    const l = L[a]; if (!l) return notFound();
    const steps = l.dlg.map(([who, en, itx], i) => who === "Y" ? { type: "speak", hide: true, text: en, it: itx, prev: i > 0 && l.dlg[i - 1][0] !== "Y" ? l.dlg[i - 1][1] : "" } : { type: "hear", who: l.who[who] || who, text: en, it: itx });
    Object.assign(def, { title: "Role-play: " + l.t, steps, back: "#/life/" + a, again: "#/go/role/" + a, onDone: () => { S.life[a] = 1; } });
  }
  else if (kind === "ear") { Object.assign(def, { title: "Ear training", steps: [{ type: "ear", pron: a && P[a] ? a : null, rounds: 8 }], back: a ? "#/pron/" + a : "#/practice", again: "#/go/ear" + (a ? "/" + a : "") }); }
  else if (kind === "verbs") { Object.assign(def, { title: "Irregular verbs", steps: shuffle(D.verbs).slice(0, 8).map(v => ({ type: "verb", v })), back: "#/verbs", again: "#/go/verbs" }); }
  else if (kind === "ff") {
    const steps = shuffle(D.falseFriends).slice(0, 8).map(f => {
      const others = shuffle(D.falseFriends.filter(x => x !== f)).slice(0, 2).map(x => x[1]);
      const opts = shuffle([f[1]].concat(others));
      return { type: "quiz", custom: { q: `What does “${f[0]}” mean?`, opts, ans: opts.indexOf(f[1]), why: `“${f[0]}” = ${f[1]}. Not “${f[2]}” — that's “${f[3]}”.`, whyIt: "", title: "False friends" } };
    });
    Object.assign(def, { title: "False friends", steps, back: "#/ff", again: "#/go/ff" });
  }
  else return notFound();
  if (!def.steps || !def.steps.length) { setTop(def.title, true); V.innerHTML = `<div class="card empty" style="margin-top:20px"><p>Nothing here yet.</p><a class="btn primary" href="${def.back}">Back</a></div>`; return; }
  startSession(def);
}

const ROUTES = [
  [/^$/, todayPage], [/^path$/, pathPage], [/^week\/(\d+)$/, weekPage],
  [/^life$/, lifeList], [/^life\/([\w-]+)$/, lifeDetail],
  [/^practice$/, practicePage], [/^cards$/, cardsPage], [/^speak$/, speakPage], [/^listen$/, listenPage], [/^quiz$/, quizPage],
  [/^diary$/, diaryPage], [/^diary\/write\/(\w+)$/, diaryWrite], [/^diary\/entry\/(\d+)$/, diaryEntry],
  [/^check(?:\/(.*))?$/, checkPage], [/^grammar$/, grammarList], [/^g\/([\w-]+)$/, grammarCard],
  [/^pron(?:\/([\w-]+))?$/, pronPage], [/^verbs$/, verbsPage], [/^ff$/, ffPage], [/^confusing(?:\/(\d+))?$/, confPage],
  [/^words(?:\/([\w-]+))?$/, wordsPage], [/^settings$/, settingsPage],
  [/^go\/(.+)$/, p => goSession(p.split("/"))]
];
const TAB_OF = p => /^(|go\/daily)$/.test(p) ? "today" : /^(path|week|go\/week)/.test(p) ? "path" : /^(life|go\/role|go\/speaklife)/.test(p) ? "life"
  : /^(check|grammar|g\/|pron|verbs|ff|confusing|words|go\/speakpron)/.test(p) ? "check" : /^settings/.test(p) ? "" : "practice";
const PARENT = p => /^week/.test(p) ? "#/path" : /^life\//.test(p) ? "#/life" : /^(cards|speak|listen|quiz|diary$)/.test(p) ? "#/practice" : /^diary\//.test(p) ? "#/diary"
  : /^(grammar|pron|verbs|ff|confusing|words)/.test(p) ? "#/check" : /^g\//.test(p) ? "#/grammar" : "#/";
let navDepth = 0;
function route() {
  stopSpeech();
  if (SES && !/^#\/go\//.test(location.hash)) SES = null;
  const path = location.hash.replace(/^#\/?/, "");
  const tab = TAB_OF(path);
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  for (const [re, fn] of ROUTES) { const m = path.match(re); if (m) { fn(m[1], m[2]); window.scrollTo(0, 0); return; } }
  notFound();
}
window.addEventListener("hashchange", () => { navDepth++; route(); });
$("#back").onclick = () => { if (navDepth > 0) { navDepth -= 2; history.back(); } else location.hash = PARENT(location.hash.replace(/^#\/?/, "")); };

/* ---------- global delegated clicks ---------- */
document.addEventListener("click", e => {
  const s = e.target.closest("[data-say]");
  if (s) { e.preventDefault(); const btn = s.classList.contains("say") ? s : null; if (btn && btn.classList.contains("playing")) { stopSpeech(); return; } say(s.dataset.say, { slow: !!s.dataset.slow, btn }); return; }
  const st = e.target.closest("[data-star]");
  if (st) { e.preventDefault(); const on = toggleStar(st.dataset.star); $$(`[data-star="${CSS.escape(st.dataset.star)}"]`).forEach(b => { b.classList.toggle("on", on); b.textContent = on ? "⭐" : "☆"; }); toast(on ? "Saved to your flashcards ⭐ · Salvata" : "Removed · Rimossa"); return; }
  const pa = e.target.closest("[data-playall]");
  if (pa) { e.preventDefault(); playAll(pa.dataset.playall, pa); }
});

/* ---------- settings application ---------- */
function applySettings() {
  document.body.classList.toggle("no-it", !S.set.it);
  const b = $("#itToggle"); b.classList.toggle("on", S.set.it); b.setAttribute("aria-pressed", S.set.it ? "true" : "false");
  b.textContent = S.set.it ? "🇮🇹 IT" : "🇮🇹 off";
  document.documentElement.style.setProperty("--fs", (18 * S.set.size) + "px");
  if (S.set.theme === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", S.set.theme);
}
$("#itToggle").onclick = () => { S.set.it = !S.set.it; save(); applySettings(); toast(S.set.it ? "Italian help on · Aiuto in italiano attivo" : "Italian help off — challenge mode! 💪"); };
window.addEventListener("scroll", () => $("#top").classList.toggle("scrolled", window.scrollY > 4), { passive: true });

applySettings();
route();
})();
