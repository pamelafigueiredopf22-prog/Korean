/* 한국어 두 길 — main app */
(function () {
  'use strict';
  const H = window.Hangul, S = window.Speech, BOOK = window.BOOK, SCENES = window.SCENES;

  // ===========================================================================
  // Storage
  const KEY = 'korean-two-paths-v1';
  const DEFAULT = {
    lessons: {}, srs: {}, best: {}, scenes: {},
    settings: { nameKo: '', countryKo: '', romaji: 'show', rate: 0.9, unlockAll: false, mic: true },
    streak: { last: null, count: 0 },
  };
  let state;
  try { state = Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { state = JSON.parse(JSON.stringify(DEFAULT)); }
  state.settings = Object.assign({}, DEFAULT.settings, state.settings || {});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  S.rate = state.settings.rate;

  const todayStr = () => new Date().toISOString().slice(0, 10);
  function bumpStreak() {
    const t = todayStr(), s = state.streak;
    if (s.last === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.count = s.last === y ? s.count + 1 : 1;
    s.last = t; save();
  }

  // ===========================================================================
  // Helpers
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const view = () => $('#view');

  function romClass() { return 'rom rom-' + state.settings.romaji; }
  function rom(ko, explicit) {
    if (state.settings.romaji === 'hide') return '';
    return `<span class="${romClass()}">${esc(explicit || H.romanize(ko))}</span>`;
  }
  function rich(html) {
    return html.replace(/\[\[(.+?)\]\]/g, (m, k) => `<span class="kw" data-say="${esc(k)}" title="${esc(H.romanize(k))}">${esc(k)}</span>`);
  }
  const speakBtn = (ko, extra) => `<button class="speak ${extra || ''}" data-say="${esc(ko)}" aria-label="Listen">${ICON.sound}</button>`;

  const ICON = {
    sound: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>',
    send: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3 20.5 21 12 3 3.5v6.6l12 1.9-12 1.9z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M9 21h6v-1H9v1zm3-19a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m9 16.2-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5-2.2-1.6zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
  };

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // global: tap anything with data-say to hear it
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-say]');
    if (el && !el.disabled) { S.speak(el.dataset.say, { rate: el.dataset.rate ? +el.dataset.rate : 1 }); }
    const r = e.target.closest('.rom-tap');
    if (r) r.classList.add('revealed');
  });

  // ===========================================================================
  // Progress
  const chapterById = id => BOOK.find(c => c.id === id);
  const lessonDone = id => !!state.lessons[id];
  const chapterDone = ch => ch.lessons.every(l => lessonDone(l.id));
  function chapterUnlocked(ch) {
    if (state.settings.unlockAll) return true;
    const i = BOOK.indexOf(ch);
    return i === 0 || chapterDone(BOOK[i - 1]);
  }
  function lessonUnlocked(ch, idx) {
    if (state.settings.unlockAll) return true;
    if (!chapterUnlocked(ch)) return false;
    return idx === 0 || lessonDone(ch.lessons[idx - 1].id);
  }
  const reviewUnlocked = ch => state.settings.unlockAll || chapterDone(ch);
  const sceneUnlocked = sc => state.settings.unlockAll || sc.requires.every(id => chapterDone(chapterById(id)));
  function nextLesson() {
    for (const ch of BOOK) for (let i = 0; i < ch.lessons.length; i++) {
      if (!lessonDone(ch.lessons[i].id) && lessonUnlocked(ch, i)) return { ch, i };
    }
    return null;
  }
  const mastered = ch => (state.best[ch.id] || 0) >= 0.8;

  // spaced repetition (Leitner boxes)
  const INTERVALS = [0, 1, 2, 4, 8, 16, 32].map(d => d * 864e5);
  function grade(id, ok) {
    const r = state.srs[id] || { b: 0, due: 0, r: 0, w: 0 };
    if (ok) { r.b = Math.min(r.b + 1, INTERVALS.length - 1); r.r++; }
    else { r.b = 0; r.w++; }
    r.due = Date.now() + (ok ? INTERVALS[r.b] : 0);
    state.srs[id] = r; save();
  }
  function poolFor(chapters) {
    const out = [];
    chapters.forEach(ch => {
      ch.items.forEach(it => out.push(Object.assign({ ch: ch.id }, it)));
      (ch.quizzes || []).forEach(q => out.push(Object.assign({ ch: ch.id, kind: 'quiz' }, q)));
    });
    return out;
  }
  const isDue = id => { const r = state.srs[id]; return r && r.due <= Date.now(); };
  function dueCount() {
    const chs = BOOK.filter(chapterDone);
    return poolFor(chs).filter(it => isDue(it.id) && state.srs[it.id].b < 6).length;
  }

  // ===========================================================================
  // Router
  const routes = {};
  function go(hash) { location.hash = hash; }
  function render() {
    S.stopListening();
    Keyboard.hide();
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, ...args] = h.split('/');
    const fn = routes[name] || routes.home;
    window.scrollTo(0, 0);
    $$('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === (TAB_OF[name] || 'home')));
    fn(...args);
  }
  const TAB_OF = { home: 'home', book: 'book', chapter: 'book', lesson: 'book', review: 'review', live: 'live', scene: 'live', settings: 'settings' };
  window.addEventListener('hashchange', render);

  function topbar(title, backHash, opts) {
    opts = opts || {};
    return `<header class="topbar">
      ${backHash ? `<a class="iconbtn" href="#/${backHash}" aria-label="Back">${ICON.back}</a>` : '<span class="brand">한국어 <b>두 길</b></span>'}
      <div class="tb-title">${title || ''}</div>
      ${opts.right || `<a class="iconbtn" href="#/settings" aria-label="Settings">${ICON.gear}</a>`}
    </header>`;
  }

  // ===========================================================================
  // HOME
  routes.home = function () {
    const nl = nextLesson();
    const due = dueCount();
    const name = state.settings.nameKo;
    const doneLessons = Object.keys(state.lessons).length;
    const totalLessons = BOOK.reduce((n, c) => n + c.lessons.length, 0);
    const scenesDone = SCENES.filter(s => state.scenes[s.id]).length;
    view().innerHTML = topbar('', null) + `
      <section class="hero">
        <p class="eyebrow">${state.streak.count ? `🔥 ${state.streak.count}-day streak` : 'Welcome'}</p>
        <h1><span class="kw" data-say="안녕하세요">안녕하세요</span>${name ? `, <span class="kw" data-say="${esc(name)} 씨">${esc(name)} 씨</span>` : ''}!</h1>
        <p class="lede">Two ways to learn: study it like a book, then live it in real situations.</p>
      </section>
      ${nl ? `<a class="continue" href="#/lesson/${nl.ch.id}/${nl.i}">
          <span class="c-label">Continue · Chapter ${nl.ch.n}</span>
          <span class="c-title">${esc(nl.ch.lessons[nl.i].title)} <span class="c-ko">${esc(nl.ch.lessons[nl.i].ko)}</span></span>
          <span class="c-go">→</span></a>` : ''}
      <div class="paths">
        <a class="path path-book" href="#/book">
          <span class="p-glyph">책</span>
          <span class="p-name">The Book</span>
          <span class="p-desc">Grammar & pronunciation, chapter by chapter — with a Review Room at the end of each.</span>
          <span class="p-meter"><span style="width:${Math.round(100 * doneLessons / totalLessons)}%"></span></span>
          <span class="p-stat">${doneLessons} / ${totalLessons} lessons</span>
        </a>
        <a class="path path-live" href="#/live">
          <span class="p-glyph">말</span>
          <span class="p-name">Live It</span>
          <span class="p-desc">Role-play real situations. Type, tap a suggestion, or speak.</span>
          <span class="p-meter"><span style="width:${Math.round(100 * scenesDone / SCENES.length)}%"></span></span>
          <span class="p-stat">${scenesDone} / ${SCENES.length} scenes</span>
        </a>
      </div>
      <a class="daily ${due ? '' : 'quiet'}" href="#/review/all">
        <span class="d-num">${due}</span>
        <span class="d-text"><b>Daily review</b><br>${due ? `${due} card${due > 1 ? 's' : ''} ready to refresh` : 'Nothing due — practice anyway'}</span>
      </a>
      ${!S.hasKoreanVoice ? `<p class="warn">No Korean voice was found on this device, so audio may not play. See <a href="#/settings">Settings</a> for how to add one.</p>` : ''}
    `;
  };

  // ===========================================================================
  // BOOK
  routes.book = function () {
    view().innerHTML = topbar('The Book', 'home') + `
      <section class="pagehead"><p class="eyebrow">책 · The Book</p><h1>Chapters</h1>
      <p class="lede">Read each chapter in order, then practise in its Review Room as often as you like.</p></section>
      <ol class="chapters">${BOOK.map(ch => {
        const un = chapterUnlocked(ch);
        const done = ch.lessons.filter(l => lessonDone(l.id)).length;
        return `<li><a class="chapter ${un ? '' : 'locked'}" href="${un ? `#/chapter/${ch.id}` : 'javascript:void 0'}">
          <span class="ch-n">${ch.n}</span>
          <span class="ch-body"><span class="ch-title">${esc(ch.title)} <span class="ch-ko">${esc(ch.ko)}</span></span>
          <span class="ch-blurb">${esc(ch.blurb)}</span>
          <span class="ch-prog"><span class="bar"><span style="width:${100 * done / ch.lessons.length}%"></span></span>
          ${done}/${ch.lessons.length}${mastered(ch) ? ' · <b class="star">★ mastered</b>' : ''}</span></span>
          ${un ? '' : `<span class="lockic">${ICON.lock}</span>`}
        </a></li>`;
      }).join('')}
      <li class="soon">More chapters coming: particles, verbs & the polite present, past tense, numbers, negation…</li></ol>`;
  };

  routes.chapter = function (id) {
    const ch = chapterById(id);
    if (!ch) return go('#/book');
    const rv = reviewUnlocked(ch);
    view().innerHTML = topbar(`Chapter ${ch.n}`, 'book') + `
      <section class="pagehead"><p class="eyebrow">Chapter ${ch.n} · ${esc(ch.ko)}</p><h1>${esc(ch.title)}</h1><p class="lede">${esc(ch.blurb)}</p></section>
      <ol class="lessons">${ch.lessons.map((l, i) => {
        const un = lessonUnlocked(ch, i), dn = lessonDone(l.id);
        return `<li><a class="lesson ${un ? '' : 'locked'} ${dn ? 'done' : ''}" href="${un ? `#/lesson/${ch.id}/${i}` : 'javascript:void 0'}">
          <span class="ls-i">${dn ? ICON.check : i + 1}</span>
          <span class="ls-t">${esc(l.title)}<span class="ls-ko">${esc(l.ko)}</span></span>
          <span class="ls-p">${un ? `${l.pages.length} pages` : ICON.lock}</span></a></li>`;
      }).join('')}</ol>
      <a class="reviewroom ${rv ? '' : 'locked'}" href="${rv ? `#/review/${ch.id}` : 'javascript:void 0'}">
        <span class="rr-icon">복습</span>
        <span class="rr-body"><b>Review Room</b><br>
        ${rv ? `Practise this chapter as much as you want.${state.best[ch.id] != null ? ` Best: ${Math.round(state.best[ch.id] * 100)}%` : ''}` : 'Finish the lessons to open the Review Room.'}</span>
        ${rv ? '<span class="c-go">→</span>' : `<span class="lockic">${ICON.lock}</span>`}
      </a>`;
  };

  // ---------------------------------------------------------------------------
  // Lesson
  routes.lesson = function (id, idx, page) {
    const ch = chapterById(id); idx = +idx || 0; page = +page || 0;
    const lesson = ch && ch.lessons[idx];
    if (!lesson) return go('#/book');
    if (!lessonUnlocked(ch, idx)) return go(`#/chapter/${ch.id}`);
    const pg = lesson.pages[page];
    const last = page === lesson.pages.length - 1;
    view().innerHTML = topbar(`${ch.n}.${idx + 1} ${esc(lesson.title)}`, `chapter/${ch.id}`) + `
      <div class="pagebar">${lesson.pages.map((_, i) => `<span class="${i <= page ? 'on' : ''}"></span>`).join('')}</div>
      <article class="page">
        <h2>${esc(pg.title)}</h2>
        ${pg.blocks.map(renderBlock).join('')}
      </article>
      <nav class="pagenav">
        ${page > 0 ? `<a class="btn ghost" href="#/lesson/${ch.id}/${idx}/${page - 1}">← Back</a>` : '<span></span>'}
        ${last ? `<button class="btn primary" id="finish">Finish lesson ✓</button>` : `<a class="btn primary" href="#/lesson/${ch.id}/${idx}/${page + 1}">Next →</a>`}
      </nav>`;
    bindChecks(view());
    const f = $('#finish');
    if (f) f.onclick = () => {
      state.lessons[lesson.id] = true; bumpStreak(); save();
      const nextIdx = idx + 1 < ch.lessons.length ? idx + 1 : null;
      view().innerHTML = topbar('', `chapter/${ch.id}`) + `
        <section class="celebrate"><div class="big">잘했어요!</div><p class="rom-under">jalhaesseoyo — well done!</p>
        <p>You finished <b>${esc(lesson.title)}</b>.</p>
        <div class="stack">
          ${nextIdx != null ? `<a class="btn primary" href="#/lesson/${ch.id}/${nextIdx}">Next lesson: ${esc(ch.lessons[nextIdx].title)} →</a>`
            : `<a class="btn primary" href="#/review/${ch.id}">Chapter done — open the Review Room →</a>`}
          <a class="btn ghost" href="#/chapter/${ch.id}">Back to chapter</a>
        </div></section>`;
      S.speak('잘했어요');
    };
  };

  function renderBlock(b) {
    switch (b.t) {
      case 'p': return `<p>${rich(b.html)}</p>`;
      case 'tip': return `<aside class="tip">${rich(b.html)}</aside>`;
      case 'letters': return `<div class="letters">${b.items.map(l => `
        <button class="letter" data-say="${esc(l.say)}">
          <span class="lg">${esc(l.ko)}</span>
          ${state.settings.romaji === 'hide' ? '' : `<span class="lr">${esc(l.rom)}</span>`}
          ${l.name ? `<span class="ln">${esc(l.name)}</span>` : ''}
          ${l.note ? `<span class="lnote">${esc(l.note)}</span>` : ''}
        </button>`).join('')}</div>`;
      case 'words': return `<ul class="words">${b.items.map(w => `
        <li data-say="${esc(w.ko)}"><span class="wk">${esc(w.ko)}</span>${w.pron ? `<span class="pron">[${esc(w.pron)}]</span>` : ''}
        ${rom(w.ko)}<span class="we">${esc(w.en)}</span>${speakBtn(w.ko, 'mini')}</li>`).join('')}</ul>`;
      case 'phrases': return `<ul class="phrases">${b.items.map(w => `
        <li data-say="${esc(w.ko)}"><div><span class="wk">${esc(w.ko)}</span>${rom(w.ko)}</div><span class="we">${esc(w.en)}</span>${speakBtn(w.ko, 'mini')}</li>`).join('')}</ul>`;
      case 'change': return `<ul class="changes">${b.items.map(w => `
        <li data-say="${esc(w.ko)}"><span class="wk">${esc(w.ko)}</span><span class="arrow">→</span><span class="pron big">[${esc(w.pron)}]</span>
        ${rom(w.ko)}<span class="we">${esc(w.note || '')}</span>${speakBtn(w.ko, 'mini')}</li>`).join('')}</ul>`;
      case 'blocks': return `<div class="anatomy">${b.items.map(x => `
        <div class="anat" data-say="${esc(x.ko)}"><span class="ag">${esc(x.ko)}</span>
        <span class="ap">${x.parts.map(p => `<span>${esc(p)}</span>`).join('<i>+</i>')}</span></div>`).join('')}</div>`;
      case 'table': return `<div class="tablewrap"><table><thead><tr>${b.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${rich(esc(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'triples': return `<div class="triples"><div class="tr-head"><span>plain</span><span>aspirated</span><span>tense</span></div>${b.items.map(row => `
        <div class="tr-row">${row.map(w => w ? `<button class="tr-cell" data-say="${esc(w.ko)}"><b>${esc(w.ko)}</b><small>${esc(w.en)}</small></button>` : '<span class="tr-cell empty">—</span>').join('')}</div>`).join('')}</div>`;
      case 'check': return `<div class="check" data-answer="${b.answer}" data-explain="${esc(b.explain || '')}">
        <p class="cq">✏️ ${rich(esc(b.q))}</p>
        <div class="opts">${b.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>
        <p class="cfb"></p></div>`;
      default: return '';
    }
  }
  function bindChecks(root) {
    $$('.check', root).forEach(c => {
      const ans = +c.dataset.answer;
      $$('.opt', c).forEach(b => b.onclick = () => {
        const ok = +b.dataset.i === ans;
        $$('.opt', c).forEach(x => { x.disabled = true; if (+x.dataset.i === ans) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        $('.cfb', c).innerHTML = `<b>${ok ? 'Correct!' : 'Not quite.'}</b> ${esc(c.dataset.explain)}`;
      });
    });
  }

  // ===========================================================================
  // REVIEW
  routes.review = function (id) {
    if (!id) {
      // review tab: choose
      view().innerHTML = topbar('Review', 'home') + `
        <section class="pagehead"><p class="eyebrow">복습 · Review</p><h1>Review Rooms</h1>
        <p class="lede">The Daily review mixes cards from every finished chapter, focusing on what you’re due to forget.</p></section>
        <a class="daily" href="#/review/all"><span class="d-num">${dueCount()}</span><span class="d-text"><b>Daily review</b><br>Mixed, spaced repetition</span></a>
        <ol class="lessons">${BOOK.map(ch => {
          const un = reviewUnlocked(ch);
          return `<li><a class="lesson ${un ? '' : 'locked'}" href="${un ? `#/review/${ch.id}` : 'javascript:void 0'}">
            <span class="ls-i">${ch.n}</span><span class="ls-t">${esc(ch.title)}<span class="ls-ko">${esc(ch.ko)}</span></span>
            <span class="ls-p">${un ? (state.best[ch.id] != null ? `${Math.round(state.best[ch.id] * 100)}%${mastered(ch) ? ' ★' : ''}` : 'Start') : ICON.lock}</span></a></li>`;
        }).join('')}</ol>`;
      return;
    }
    let chapters, title, back;
    if (id === 'all') {
      chapters = BOOK.filter(chapterDone);
      if (!chapters.length) chapters = BOOK.filter(c => c.lessons.some(l => lessonDone(l.id)));
      if (!chapters.length && state.settings.unlockAll) chapters = BOOK.slice();
      if (!chapters.length) {
        view().innerHTML = topbar('Daily review', 'home') + `<section class="pagehead"><h1>Nothing to review yet</h1>
          <p class="lede">Finish your first chapter in the Book and its cards will appear here.</p><a class="btn primary" href="#/book">Open the Book →</a></section>`;
        return;
      }
      title = 'Daily review'; back = 'home';
    } else {
      const ch = chapterById(id);
      if (!ch || !reviewUnlocked(ch)) return go('#/book');
      chapters = [ch]; title = `Review · Ch. ${ch.n}`; back = `chapter/${ch.id}`;
    }
    runSession(buildSession(chapters, id === 'all'), { title, back, chapterId: id === 'all' ? null : id });
  };

  function buildSession(chapters, dailyMode, size) {
    size = size || 10;
    const pool = poolFor(chapters);
    const due = shuffle(pool.filter(it => isDue(it.id))).sort((a, b) => state.srs[a.id].b - state.srs[b.id].b);
    const unseen = shuffle(pool.filter(it => !state.srs[it.id]));
    const rest = shuffle(pool.filter(it => state.srs[it.id] && !isDue(it.id)));
    const order = dailyMode ? [...due, ...rest, ...unseen] : [...due, ...unseen, ...rest];
    const chosen = order.slice(0, size);
    return shuffle(chosen).map(it => makeQuestion(it, pool)).filter(Boolean);
  }

  // --- question factory
  function distract(pool, item, n, keyFn) {
    const key = keyFn(item);
    // letters like ㄱ (g/k) and ㅋ (k) share a romanization: never offer an ambiguous distractor
    const clash = x => item.kind === 'letter' && ((x.accept || [x.rom]).includes(item.rom) || (item.accept || [item.rom]).includes(x.rom));
    const same = pool.filter(x => x.kind === item.kind && x.id !== item.id && keyFn(x) !== key && !clash(x));
    const seen = new Set([key]); const out = [];
    for (const x of shuffle(same)) { const k = keyFn(x); if (!seen.has(k)) { seen.add(k); out.push(x); } if (out.length >= n) break; }
    return out;
  }
  function mc(prompt, correct, wrongs, extra) {
    const options = shuffle([correct, ...wrongs]);
    return Object.assign({ type: 'mc', prompt, options, answer: options.indexOf(correct) }, extra);
  }
  function makeQuestion(it, pool) {
    const typesFor = {
      letter: ['listen-letter', 'letter-rom', 'rom-letter', 'type-letter'],
      word: ['listen-word', 'word-meaning', 'meaning-word', 'type-heard', 'read-rom'],
      sound: ['pron-pick', 'pron-pick', 'listen-word'],
      phrase: ['phrase-meaning', 'meaning-phrase', 'build', 'type-phrase'].concat(S.canListen && state.settings.mic ? ['say'] : []),
      quiz: ['quiz'],
    };
    const t = pick(typesFor[it.kind] || ['quiz']);
    const base = { id: it.id, item: it };
    switch (t) {
      case 'listen-letter': {
        const w = distract(pool, it, 3, x => x.ko);
        return mc('Which letter do you hear?', it.ko, w.map(x => x.ko), Object.assign(base, { audio: it.say, big: true, reveal: it.ko }));
      }
      case 'letter-rom': {
        const w = distract(pool, it, 3, x => x.rom);
        return mc(`<span class="qbig">${esc(it.ko)}</span>How is this letter romanized?`, it.rom, w.map(x => x.rom), Object.assign(base, { audioAfter: it.say }));
      }
      case 'rom-letter': {
        const w = distract(pool, it, 3, x => x.ko);
        return mc(`Which letter is romanized <b>${esc(it.rom)}</b>?`, it.ko, w.map(x => x.ko), Object.assign(base, { big: true, audioAfter: it.say }));
      }
      case 'type-letter':
        return Object.assign(base, { type: 'type-rom', prompt: `<span class="qbig">${esc(it.ko)}</span>Type its romanization`, accept: it.accept || [it.rom], show: it.rom, audioAfter: it.say });
      case 'listen-word': {
        const w = distract(pool, it, 3, x => x.ko);
        return mc('Which word do you hear?', it.ko, w.map(x => x.ko), Object.assign(base, { audio: it.ko }));
      }
      case 'word-meaning': case 'phrase-meaning': {
        const w = distract(pool, it, 3, x => x.en);
        return mc(`<span class="qko" data-say="${esc(it.ko)}">${esc(it.ko)}</span>${rom(it.ko)}What does it mean?`, it.en, w.map(x => x.en), Object.assign(base, { audioAfter: it.ko }));
      }
      case 'meaning-word': case 'meaning-phrase': {
        const w = distract(pool, it, 3, x => x.ko);
        return mc(`How do you say <b>“${esc(it.en)}”</b>?`, it.ko, w.map(x => x.ko), Object.assign(base, { audioAfter: it.ko }));
      }
      case 'read-rom': {
        const w = distract(pool, it, 3, x => H.romanize(x.ko));
        return mc(`<span class="qko">${esc(it.ko)}</span>How is it read?`, H.romanize(it.ko), w.map(x => H.romanize(x.ko)), Object.assign(base, { audioAfter: it.ko }));
      }
      case 'type-heard':
        return Object.assign(base, { type: 'type-ko', prompt: `Type what you hear <small>(${esc(it.en)})</small>`, audio: it.ko, accept: [it.ko], strict: true });
      case 'type-phrase':
        return Object.assign(base, { type: 'type-ko', prompt: `Write in Korean: <b>“${esc(it.en)}”</b>`, accept: [it.ko], strict: false, audioAfter: it.ko });
      case 'say':
        return Object.assign(base, { type: 'say', prompt: `Say it out loud: <span class="qko">${esc(it.ko)}</span>${rom(it.ko)}<small>${esc(it.en)}</small>`, accept: [it.ko] });
      case 'build': {
        const words = it.ko.replace(/[?.!,]/g, '').split(' ');
        if (words.length < 2) { const w = distract(pool, it, 3, x => x.ko); return mc(`How do you say <b>“${esc(it.en)}”</b>?`, it.ko, w.map(x => x.ko), Object.assign(base, { audioAfter: it.ko })); }
        const extras = shuffle(pool.filter(x => x.kind === 'phrase' && x.id !== it.id).flatMap(x => x.ko.replace(/[?.!,]/g, '').split(' ')).filter(w => !words.includes(w))).slice(0, 2);
        return Object.assign(base, { type: 'build', prompt: `Build: <b>“${esc(it.en)}”</b>`, words, tiles: shuffle([...words, ...extras]), audioAfter: it.ko });
      }
      case 'pron-pick': {
        const opts = [it.pron, ...it.wrong.filter(w => w !== it.pron)].slice(0, 3);
        return mc(`<span class="qko">${esc(it.ko)}</span>${it.en ? `<small>${esc(it.en)}</small>` : ''}How is it pronounced?`, `[${it.pron}]`, opts.slice(1).map(o => `[${o}]`), Object.assign(base, { audioAfter: it.ko }));
      }
      case 'quiz': {
        const correct = it.options[it.answer];
        return Object.assign(mc(esc(it.q), correct, it.options.filter((_, i) => i !== it.answer)), base, { explain: it.explain });
      }
    }
    return null;
  }

  // --- session runner
  function runSession(questions, opts) {
    let i = 0, score = 0; const mistakes = [];
    const next = () => {
      if (i >= questions.length) return finish();
      showQuestion(questions[i], i, questions.length, (ok, q) => {
        grade(q.id, ok);
        if (ok) score++; else mistakes.push(q);
        i++; next();
      }, opts);
    };
    const finish = () => {
      const pct = questions.length ? score / questions.length : 0;
      if (opts.chapterId) state.best[opts.chapterId] = Math.max(state.best[opts.chapterId] || 0, pct);
      bumpStreak(); save();
      view().innerHTML = topbar(opts.title, opts.back) + `
        <section class="celebrate">
          <div class="score"><b>${score}</b>/${questions.length}</div>
          <p class="big2">${pct >= 0.9 ? '완벽해요! Perfect!' : pct >= 0.7 ? '잘했어요! Well done!' : '괜찮아요 — keep going!'}</p>
          ${mistakes.length ? `<div class="mistakes"><h3>To look at again</h3><ul>${mistakes.map(q => {
            const it = q.item; return `<li data-say="${esc(it.say || it.ko || '')}"><b>${esc(it.ko || '')}</b> ${it.ko ? rom(it.ko, it.rom) : ''} <span>${esc(it.en || it.q || '')}</span></li>`;
          }).join('')}</ul></div>` : ''}
          <div class="stack"><button class="btn primary" id="again">Practise again</button>
          <a class="btn ghost" href="#/${opts.back}">Done</a></div></section>`;
      $('#again').onclick = () => render();
    };
    next();
  }

  function showQuestion(q, idx, total, done, opts) {
    view().innerHTML = topbar(opts.title, opts.back) + `
      <div class="qprogress"><span style="width:${100 * idx / total}%"></span></div>
      <section class="question">
        ${q.audio ? `<button class="bigplay" data-say="${esc(q.audio)}">${ICON.sound}<span>Play</span></button>
          <button class="slowplay" data-say="${esc(q.audio)}" data-rate="0.6">🐢 slower</button>` : ''}
        <div class="qprompt ${q.big ? 'bigopts' : ''}">${q.prompt}</div>
        <div class="qbody"></div>
        <div class="feedback"></div>
      </section>`;
    if (q.audio) setTimeout(() => S.speak(q.audio), 250);
    const body = $('.qbody'), fb = $('.feedback');
    let answered = false;
    const reveal = (ok, html) => {
      answered = true;
      fb.className = 'feedback show ' + (ok === true ? 'ok' : ok === 'close' ? 'close' : 'bad');
      const it = q.item;
      const korean = it.ko && it.kind !== 'quiz' ? `<div class="fb-ko" data-say="${esc(it.say || it.ko)}">${esc(it.ko)} ${it.pron ? `<span class="pron">[${esc(it.pron)}]</span>` : ''} ${rom(it.ko, it.kind === 'letter' ? it.rom : null)} ${speakBtn(it.say || it.ko, 'mini')}</div>` : '';
      fb.innerHTML = `<p class="fb-title">${ok === true ? 'Correct! 맞아요' : ok === 'close' ? 'Almost!' : 'Not quite'}</p>${html || ''}${korean}
        ${q.explain ? `<p class="fb-ex">${esc(q.explain)}</p>` : ''}<button class="btn primary" id="cont">Continue</button>`;
      if (q.audioAfter) S.speak(q.audioAfter);
      $('#cont').onclick = () => done(ok === true, q);
      $('#cont').focus();
    };
    if (q.type === 'mc') {
      body.innerHTML = `<div class="opts ${q.big ? 'big' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      $$('.opt', body).forEach(b => b.onclick = () => {
        if (answered) return;
        const ok = +b.dataset.i === q.answer;
        $$('.opt', body).forEach(x => { x.disabled = true; if (+x.dataset.i === q.answer) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        reveal(ok);
      });
    } else if (q.type === 'type-rom') {
      body.innerHTML = `<form class="plain"><input class="txt" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. eo"><button class="btn primary">Check</button></form>`;
      const f = $('form', body), inp = $('input', body); inp.focus();
      f.onsubmit = e => {
        e.preventDefault(); if (answered || !inp.value.trim()) return;
        const ok = q.accept.includes(H.normRoman(inp.value));
        reveal(ok, ok ? '' : `<p>Answer: <b>${esc(q.show)}</b></p>`);
      };
    } else if (q.type === 'type-ko') {
      const ki = KoInput({ expected: q.accept, mic: false, placeholder: 'Type in Hangul or romanization…', onSubmit: (val) => {
        if (answered) return;
        const r = H.check(val, q.accept);
        if (r.result === 'exact') reveal(true);
        else if (r.result === 'close' && !q.strict) reveal(true, `<p>Accepted. Exact spelling: <b>${esc(q.accept[0])}</b> · ${esc(H.romanize(q.accept[0]))}</p>`);
        else if (r.result === 'close') reveal('close', `<p>Very close — check the consonants. It’s <b>${esc(q.accept[0])}</b> (${esc(H.romanize(q.accept[0]))}).</p>`);
        else reveal(false, `<p>You wrote: ${esc(H.hasLatin(val) ? H.romanToHangul(val) : val)}</p><p>Answer: <b>${esc(q.accept[0])}</b></p>`);
      } });
      body.appendChild(ki.el); ki.focus();
    } else if (q.type === 'build') {
      body.innerHTML = `<div class="buildzone" aria-live="polite"></div><div class="tiles">${q.tiles.map((t, i) => `<button class="tile" data-i="${i}">${esc(t)}</button>`).join('')}</div>
        <div class="row"><button class="btn ghost" id="clr">Clear</button><button class="btn primary" id="chk">Check</button></div>`;
      const zone = $('.buildzone', body); const chosen = [];
      const draw = () => { zone.innerHTML = chosen.map(c => `<button class="tile in" data-c="${c}">${esc(q.tiles[c])}</button>`).join('') || '<span class="ph">Tap the words in order</span>'; };
      draw();
      body.onclick = e => {
        if (answered) return;
        const t = e.target.closest('.tile');
        if (!t) return;
        if (t.classList.contains('in')) { chosen.splice(chosen.indexOf(+t.dataset.c), 1); $(`.tile[data-i="${t.dataset.c}"]`, body).disabled = false; }
        else { chosen.push(+t.dataset.i); t.disabled = true; S.speak(q.tiles[+t.dataset.i]); }
        draw();
      };
      $('#clr', body).onclick = () => { chosen.length = 0; $$('.tiles .tile', body).forEach(t => t.disabled = false); draw(); };
      $('#chk', body).onclick = () => {
        if (answered) return;
        const ok = chosen.map(c => q.tiles[c]).join(' ') === q.words.join(' ');
        reveal(ok, ok ? '' : `<p>Order: <b>${esc(q.words.join(' '))}</b></p>`);
      };
    } else if (q.type === 'say') {
      body.innerHTML = `<button class="micbig">${ICON.mic}<span>Tap and speak</span></button><p class="heard"></p><button class="linkbtn" id="skipmic">Can’t speak now — skip</button>`;
      const btn = $('.micbig', body), heard = $('.heard', body);
      btn.onclick = async () => {
        if (answered) return;
        btn.classList.add('listening'); heard.textContent = 'Listening…';
        try {
          const alts = await S.listen();
          btn.classList.remove('listening');
          if (!alts.length) { heard.textContent = 'I didn’t catch anything. Try again.'; return; }
          const hit = alts.find(a => H.check(a, q.accept).result !== 'wrong');
          heard.innerHTML = `I heard: <b>${esc(hit || alts[0])}</b>`;
          if (hit) reveal(true); else reveal(false, `<p>Listen to the model and try again next time.</p>`);
        } catch (err) {
          btn.classList.remove('listening');
          heard.textContent = err.message === 'not-allowed' ? 'Microphone permission was blocked.' : 'Speech recognition isn’t available here.';
        }
      };
      $('#skipmic', body).onclick = () => { if (!answered) { answered = true; done(true, Object.assign({}, q, { id: q.id })); } };
    }
  }

  // ===========================================================================
  // Typing component: romanization → Hangul preview, on-screen keyboard, mic
  function KoInput(o) {
    const el = document.createElement('div');
    el.className = 'koinput';
    el.innerHTML = `<form class="ki-row">
        <input class="ki-text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(o.placeholder || '')}">
        ${o.mic !== false && S.canListen && state.settings.mic ? `<button type="button" class="ki-btn ki-mic" aria-label="Speak">${ICON.mic}</button>` : ''}
        <button type="button" class="ki-btn ki-kbd" aria-label="Hangul keyboard">한</button>
        <button class="ki-btn ki-send" aria-label="Send">${ICON.send}</button>
      </form>
      <div class="ki-preview" aria-live="polite"></div>`;
    const inp = $('.ki-text', el), prev = $('.ki-preview', el);
    let expected = o.expected || [];
    const update = () => {
      const v = inp.value;
      if (H.hasLatin(v)) { prev.innerHTML = `<span class="arrow">→</span> <b>${esc(H.romanToHangul(v, expected))}</b> <span class="hint">tip: type “-” to split syllables, e.g. han-guk</span>`; prev.classList.add('on'); }
      else { prev.textContent = ''; prev.classList.remove('on'); }
    };
    inp.addEventListener('input', () => { Keyboard.sync(inp); update(); });
    $('form', el).onsubmit = e => {
      e.preventDefault();
      const v = inp.value.trim(); if (!v) return;
      Keyboard.hide();
      o.onSubmit(v, H.hasLatin(v) ? H.romanToHangul(v, expected) : v, { via: 'type' });
    };
    $('.ki-kbd', el).onclick = () => Keyboard.toggle(inp, () => update(), () => $('form', el).requestSubmit());
    const mic = $('.ki-mic', el);
    if (mic) mic.onclick = async () => {
      mic.classList.add('listening'); prev.classList.add('on'); prev.textContent = '🎤 Listening… speak now';
      try {
        const alts = await S.listen();
        mic.classList.remove('listening');
        if (!alts.length) { prev.textContent = 'I didn’t catch that — try again, or type.'; return; }
        prev.textContent = '';
        o.onSubmit(alts[0], alts[0], { via: 'mic', alts });
      } catch (err) {
        mic.classList.remove('listening');
        prev.textContent = err.message === 'not-allowed' ? 'Microphone permission was blocked — check your browser settings.' : 'Speech recognition isn’t available in this browser (try Chrome or Safari).';
      }
    };
    return {
      el, focus: () => { if (!matchMedia('(pointer:coarse)').matches) inp.focus(); },
      set: v => { inp.value = v; Keyboard.sync(inp); update(); },
      clear: () => { inp.value = ''; Keyboard.sync(inp); update(); },
      setExpected: e => { expected = e || []; update(); },
      input: inp,
    };
  }

  // On-screen 2-beolsik keyboard
  const Keyboard = (function () {
    const ROWS = [
      ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
      ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
      ['⇧', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', '⌫'],
    ];
    const SHIFT = { 'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ', 'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ' };
    let target = null, prefix = '', buf = [], shift = false, onChange = null, onEnter = null, internal = false;
    const el = () => $('#kbd');
    function draw() {
      el().innerHTML = ROWS.map(r => `<div class="krow">${r.map(k => {
        const label = shift && SHIFT[k] ? SHIFT[k] : k;
        const cls = k === '⇧' ? 'kk wide' + (shift ? ' on' : '') : k === '⌫' ? 'kk wide' : 'kk';
        return `<button type="button" class="${cls}" data-k="${k}">${label}</button>`;
      }).join('')}</div>`).join('') + `<div class="krow"><button type="button" class="kk wide" data-k="close">ABC ⌄</button>
        <button type="button" class="kk space" data-k=" ">space</button><button type="button" class="kk wide go" data-k="enter">↵</button></div>`;
    }
    function apply() {
      internal = true;
      target.value = prefix + H.composeJamo(buf);
      target.dispatchEvent(new Event('input'));
      internal = false;
      if (onChange) onChange();
    }
    function press(k) {
      if (!target) return;
      if (k === 'close') return hide();
      if (k === 'enter') { prefix = target.value; buf = []; if (onEnter) onEnter(); return; }
      if (k === '⇧') { shift = !shift; draw(); return; }
      if (k === '⌫') {
        if (buf.length) buf.pop(); else prefix = prefix.slice(0, -1);
        apply(); return;
      }
      if (k === ' ') { prefix = target.value + ' '; buf = []; apply(); return; }
      const j = shift && SHIFT[k] ? SHIFT[k] : k;
      buf.push(j);
      if (shift) { shift = false; draw(); }
      apply();
    }
    document.addEventListener('pointerdown', e => {
      const b = e.target.closest('#kbd .kk'); if (!b) return;
      e.preventDefault(); press(b.dataset.k);
    });
    function show(inp, change, enter) {
      target = inp; onChange = change; onEnter = enter; prefix = inp.value; buf = [];
      inp.setAttribute('inputmode', 'none'); inp.blur();
      draw(); el().classList.add('show'); document.body.classList.add('kbd-open');
      document.documentElement.style.setProperty('--kbd-h', el().offsetHeight + 'px');
      setTimeout(() => inp.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
      const t = inp.closest('.koinput'); if (t) $('.ki-kbd', t).classList.add('on');
    }
    function hide() {
      if (target) { target.removeAttribute('inputmode'); const t = target.closest('.koinput'); if (t) $('.ki-kbd', t).classList.remove('on'); }
      target = null; el() && el().classList.remove('show'); document.body.classList.remove('kbd-open');
    }
    return {
      toggle(inp, change, enter) { if (target === inp) hide(); else show(inp, change, enter); },
      hide,
      sync(inp) { if (!internal && target === inp) { prefix = inp.value; buf = []; } },
    };
  })();

  // ===========================================================================
  // LIVE IT
  routes.live = function () {
    view().innerHTML = topbar('Live It', 'home') + `
      <section class="pagehead"><p class="eyebrow">말 · Live It</p><h1>Role-play</h1>
      <p class="lede">Jump into real situations and use what you’ve learned. Type in Hangul or romanization, tap a suggestion, or speak. Stuck? Tap the 💡 for help.</p></section>
      <div class="scenes">${SCENES.map(sc => {
        const un = sceneUnlocked(sc), st = state.scenes[sc.id];
        const req = sc.requires.map(id => `Ch. ${chapterById(id).n}`).join(', ');
        return `<a class="scene ${un ? '' : 'locked'}" href="${un ? `#/scene/${sc.id}` : 'javascript:void 0'}">
          <span class="sc-emoji">${sc.emoji}</span>
          <span class="sc-body"><span class="sc-title">${esc(sc.title)} <span class="sc-ko">${esc(sc.ko)}</span></span>
          <span class="sc-set">${esc(sc.setting)}</span>
          <span class="sc-meta">${'●'.repeat(sc.level)}${'○'.repeat(3 - sc.level)} ${un ? (st ? `<b class="star">${'★'.repeat(st.stars)}${'☆'.repeat(3 - st.stars)}</b>` : 'New') : `${ICON.lock} Finish ${req}`}</span></span>
        </a>`;
      }).join('')}
      <p class="soon">More scenes coming as new chapters arrive: taxi, restaurant, asking for directions, shopping…</p></div>`;
  };

  function fill(str) {
    const name = state.settings.nameKo || '마리아';
    return String(str).replace(/\{name\}/g, name).replace(/\{이에요\}/g, H.copula(name)).replace(/\{country\}/g, state.settings.countryKo || '브라질');
  }
  function expandSay(list) {
    if (list === '@countries') {
      return COUNTRIES.flatMap(([c]) => [`저는 ${c} 사람이에요`, `${c} 사람이에요`, `저는 ${c} 사람입니다`, `저는 ${c}에서 왔어요`, `${c}에서 왔어요`]);
    }
    return list.map(fill);
  }

  function sceneSetup(sc, then) {
    const s = state.settings;
    view().innerHTML = topbar(sc.title, 'live') + `
      <section class="pagehead"><p class="eyebrow">Before we start</p><h1>Who are you?</h1>
      <p class="lede">Your name in Hangul, so the characters can use it. Type it in romanization and adjust — e.g. Pamela → 파멜라, John → 존, Maria → 마리아.</p></section>
      <div class="setup">
        <label>Your name in Korean</label><div id="nameIn"></div>
        <p class="namecheck"></p>
        <label for="ctry">Where are you from?</label>
        <select id="ctry">${COUNTRIES.map(([k, e]) => `<option value="${k}" ${s.countryKo === k ? 'selected' : ''}>${e} · ${k}</option>`).join('')}</select>
        <button class="btn primary" id="go">Start the scene →</button>
      </div>`;
    let nameVal = s.nameKo;
    const ki = KoInput({ mic: false, placeholder: 'e.g. pamella', onSubmit: () => $('#go').click() });
    $('#nameIn').appendChild(ki.el);
    if (s.nameKo) ki.set(s.nameKo);
    const nc = $('.namecheck');
    const upd = () => {
      const v = ki.input.value.trim();
      nameVal = H.hasLatin(v) ? H.romanToHangul(v) : v;
      nc.innerHTML = nameVal && H.isSyllable(nameVal.slice(-1)) ? `You’ll be <b class="kw" data-say="${esc(nameVal)}">${esc(nameVal)}</b> — “I’m ${esc(nameVal)}” = <b>저는 ${esc(nameVal)}${H.copula(nameVal)}</b>` : '';
    };
    ki.input.addEventListener('input', upd); upd();
    $('#go').onclick = () => {
      const clean = H.normHangul(nameVal);
      if (!clean || !H.isSyllable(clean.slice(-1))) { toast('Please type your name (it should end up in Hangul).'); return; }
      s.nameKo = clean; s.countryKo = $('#ctry').value; save();
      H.addToDictionary([clean]);
      then();
    };
  }

  routes.scene = function (id) {
    const sc = SCENES.find(x => x.id === id);
    if (!sc || !sceneUnlocked(sc)) return go('#/live');
    if (sc.needsName && !state.settings.nameKo) return sceneSetup(sc, () => playScene(sc));
    playScene(sc);
  };

  function playScene(sc) {
    let stepId = sc.start, hints = 0, mistakes = 0, hintLevel = 0, chipsUsed = 0, currentAccept = [];
    view().innerHTML = topbar(`${sc.emoji} ${esc(sc.title)}`, 'live') + `
      <details class="mission" open><summary>Mission card</summary><p>${esc(sc.setting)}</p>
        <ul>${sc.mission.map(m => `<li>${esc(m)}</li>`).join('')}</ul></details>
      <div class="chat" aria-live="polite"></div>
      <div class="composer">
        <p class="goal"></p>
        <div class="helpbox"></div>
        <div class="chips"></div>
        <div class="kiwrap"></div>
        <div class="tools"><button class="hintbtn">${ICON.bulb} Help</button><button class="linkbtn showchips">Suggestions</button></div>
      </div>`;
    const chat = $('.chat'), goal = $('.goal'), help = $('.helpbox'), chipsEl = $('.chips');
    const ki = KoInput({ placeholder: 'Type your answer (Hangul or romanization)…', onSubmit: (val, hangul, meta) => answer(val, hangul, meta) });
    $('.kiwrap').appendChild(ki.el);
    setTimeout(() => { const m = $('.mission'); if (m) m.open = false; }, 6000);

    const scroll = () => setTimeout(() => { const last = chat.lastElementChild; if (last) last.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 30);
    function npcSay(line, opts) {
      if (!line) return;
      opts = opts || {};
      const ko = fill(line.ko), en = fill(line.en);
      const rate = line.fast ? 1.5 : line.slow ? 0.6 : 1;
      const b = document.createElement('div');
      b.className = 'bubble npc';
      b.innerHTML = `<span class="avatar">${sc.npc.emoji}</span><div class="bb">
        <span class="who">${esc(sc.npc.name)} · ${esc(sc.npc.en)}</span>
        <p class="bko" data-say="${esc(ko)}" data-rate="${rate}">${esc(ko)}</p>
        ${line.fast ? '' : rom(ko)}
        <div class="bactions">${speakBtn(ko, 'mini')}<button class="mini slow" data-say="${esc(ko)}" data-rate="0.6">🐢</button>
        <button class="mini entoggle">EN</button></div>
        <p class="ben">${esc(en)}</p></div>`;
      $('.speak', b).dataset.rate = rate;
      $('.entoggle', b).onclick = () => b.classList.toggle('show-en');
      chat.appendChild(b); scroll();
      if (!opts.silent) S.speak(ko, { rate });
    }
    function meSay(text, note) {
      const b = document.createElement('div'); b.className = 'bubble me';
      b.innerHTML = `<div class="bb"><p class="bko" data-say="${esc(text)}">${esc(text)}</p>${rom(text)}${note ? `<p class="bnote">${esc(note)}</p>` : ''}</div>`;
      chat.appendChild(b); scroll();
    }
    function sys(html, cls) {
      const b = document.createElement('div'); b.className = 'sysmsg ' + (cls || ''); b.innerHTML = html;
      chat.appendChild(b); scroll();
    }

    function enter(id, delay) {
      stepId = id; hintLevel = 0;
      const st = sc.steps[id];
      help.innerHTML = ''; chipsEl.innerHTML = ''; goal.textContent = '';
      setTimeout(() => {
        if (st.kind === 'end') return finish(st);
        npcSay(st.npc);
        if (st.kind === 'listen') return askListen(st);
        $('.composer').classList.remove('hidden');
        ki.el.style.display = '';
        $('.tools').style.display = '';
        goal.innerHTML = `🎯 ${esc(fill(st.goal))}`;
        currentAccept = st.responses.flatMap(r => expandSay(r.say));
        ki.setExpected(currentAccept);
        H.addToDictionary(currentAccept);
        ki.clear();
        if (sc.level === 1) showChips(st);
        ki.focus();
      }, delay || 0);
    }
    function showChips(st) {
      chipsEl.innerHTML = shuffle(st.chips.map(fill)).map(c => `<button class="chip">${esc(c)}</button>`).join('');
      $$('.chip', chipsEl).forEach(b => b.onclick = () => { chipsUsed++; answer(b.textContent, b.textContent, { via: 'chip' }); });
    }
    $('.showchips').onclick = () => showChips(sc.steps[stepId]);
    $('.hintbtn').onclick = () => {
      const st = sc.steps[stepId]; if (!st.hint) return;
      hintLevel = Math.min(hintLevel + 1, 3); hints++;
      const h = st.hint;
      let html = `<div class="wordbank">${h.words.map(([k, e]) => `<span class="wb" data-say="${esc(fill(k))}"><b>${esc(fill(k))}</b> ${esc(e)}</span>`).join('')}</div>`;
      if (hintLevel >= 2) html += `<p class="partial">Starts with: <b>${esc(fill(h.partial))}</b></p>`;
      if (hintLevel >= 3) html += `<p class="fullans">Say: <b class="kw" data-say="${esc(fill(h.answer))}">${esc(fill(h.answer))}</b> ${rom(fill(h.answer))}</p><p class="why">${esc(fill(h.why))}</p>`;
      help.innerHTML = html + (hintLevel < 3 ? `<p class="more">Tap Help again for more.</p>` : '');
      if (hintLevel >= 3) showChips(st);
    };

    function askListen(st) {
      goal.innerHTML = `👂 ${esc(st.question)}`;
      ki.el.style.display = 'none'; $('.tools').style.display = 'none';
      help.innerHTML = '';
      chipsEl.innerHTML = st.options.map((o, i) => `<button class="chip" data-i="${i}">${esc(o)}</button>`).join('');
      $$('.chip', chipsEl).forEach(b => b.onclick = () => {
        if (+b.dataset.i === st.answer) {
          sys(`✓ ${esc(st.options[st.answer])} — ${esc(st.explain)}`, 'ok');
          chipsEl.innerHTML = '';
          enter(st.next, 600);
        } else {
          mistakes++; b.disabled = true; b.classList.add('wrong');
          sys('Not that one — tap the bubble to listen again (🐢 for slow).', 'bad');
        }
      });
    }

    function matchPattern(r, input) {
      if (!r.pattern) return false;
      if (H.hasHangul(input) && !H.hasLatin(input)) return r.pattern.ko.test(H.normHangul(input));
      return r.pattern.rom.test(H.normRoman(input));
    }
    function answer(val, hangul, meta) {
      const st = sc.steps[stepId];
      if (!st || st.kind !== 'say') return;
      const inputs = meta && meta.alts ? meta.alts : [val];
      // 1) accepted responses
      for (const inp of inputs) for (const r of st.responses) {
        const res = H.check(inp, expandSay(r.say));
        if (res.result !== 'wrong') {
          const shown = res.match;
          let note = '';
          if (res.result === 'close') note = `Understood! Exact spelling: ${shown} (${H.romanize(shown)})`;
          if (meta && meta.via === 'mic') note = `🎤 heard “${inp}”`;
          return success(r, shown, [note, r.note].filter(Boolean).join(' · '));
        }
      }
      // 2) known mistakes
      for (const inp of inputs) for (const w of (st.wrong || [])) {
        if (H.check(inp, expandSay(w.say)).result === 'exact') {
          mistakes++;
          meSay(H.hasLatin(inp) ? H.romanToHangul(inp) : inp);
          sys(`🤔 ${esc(fill(w.tip))}`, 'bad'); ki.clear(); return;
        }
      }
      // 3) flexible patterns (e.g. any name)
      for (const inp of inputs) for (const r of st.responses) {
        if (matchPattern(r, inp)) return success(r, H.hasLatin(inp) ? H.romanToHangul(inp) : inp, 'Understood!');
      }
      // 4) not understood
      mistakes++;
      meSay(meta && meta.via === 'mic' ? inputs[0] : hangul || val, meta && meta.via === 'mic' ? '🎤 what I heard' : '');
      sys(`${esc(sc.npc.name)} looks a little confused… Try again, or tap <b>💡 Help</b>.`, 'bad');
      if (sc.level > 1 && !chipsEl.children.length) showChips(st);
      ki.clear();
    }
    function success(r, text, note) {
      meSay(text.replace(/\s+([?.!,])/g, '$1'), note);
      ki.clear(); help.innerHTML = ''; chipsEl.innerHTML = ''; goal.textContent = '';
      Keyboard.hide();
      if (r.react) setTimeout(() => npcSay(r.react), 500);
      enter(r.next, r.react ? 1900 : 700);
    }
    function finish(st) {
      if (st.npc) npcSay(st.npc);
      $('.composer').classList.add('hidden');
      const stars = (hints + mistakes <= 1 && chipsUsed <= 2) ? 3 : (hints + mistakes <= 5) ? 2 : 1;
      const prev = state.scenes[sc.id];
      state.scenes[sc.id] = { stars: Math.max(stars, prev ? prev.stars : 0), plays: (prev ? prev.plays : 0) + 1 };
      bumpStreak(); save();
      setTimeout(() => {
        sys(`<div class="endcard"><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          <p><b>Scene complete!</b> ${hints ? `${hints} hint${hints > 1 ? 's' : ''}` : 'No hints'} · ${mistakes} slip${mistakes === 1 ? '' : 's'} · ${chipsUsed} suggestion${chipsUsed === 1 ? '' : 's'} used</p>
          <p class="small">For 3 stars: type or speak your answers yourself, with little help.</p>
          <div class="row"><button class="btn primary" id="replay">Play again</button><a class="btn ghost" href="#/live">All scenes</a></div></div>`, 'end');
        $('#replay').onclick = () => playScene(sc);
      }, st.npc ? 1200 : 200);
    }
    enter(sc.start, 300);
  }

  // ===========================================================================
  // SETTINGS
  routes.settings = function () {
    const s = state.settings;
    view().innerHTML = topbar('Settings', 'home', { right: '<span></span>' }) + `
      <section class="pagehead"><h1>Settings</h1></section>
      <div class="settings">
        <div class="set"><label>Your name in Korean</label><div id="nameIn"></div><p class="small">Used in role-plays. Type romanization and it converts — or tap 한 for the Hangul keyboard.</p></div>
        <div class="set"><label for="ctry">Country</label><select id="ctry"><option value="">—</option>${COUNTRIES.map(([k, e]) => `<option value="${k}" ${s.countryKo === k ? 'selected' : ''}>${e} · ${k}</option>`).join('')}</select></div>
        <div class="set"><label>Romanization</label><div class="seg" id="romaji">
          ${[['show', 'Show'], ['tap', 'Tap to reveal'], ['hide', 'Hide']].map(([v, l]) => `<button data-v="${v}" class="${s.romaji === v ? 'on' : ''}">${l}</button>`).join('')}</div>
          <p class="small">Romanization follows the official Revised Romanization of Korean, based on how words are pronounced.</p></div>
        <div class="set"><label for="rate">Speech speed <span id="rateV">${s.rate.toFixed(1)}×</span></label>
          <input type="range" id="rate" min="0.5" max="1.2" step="0.1" value="${s.rate}">
          <button class="btn ghost small" data-say="안녕하세요. 만나서 반가워요.">Test voice</button>
          <p class="small">${S.hasKoreanVoice ? `Voice: ${esc(S.voiceName)}` : `<b>No Korean voice found.</b> iPhone/iPad: Settings → Accessibility → Spoken Content → Voices → Korean. Android: install “Speech Services by Google” and add Korean. Windows: Settings → Time & language → Speech → add Korean. Then reload.`}</p></div>
        <div class="set"><label><input type="checkbox" id="mic" ${s.mic ? 'checked' : ''}> Microphone practice</label>
          <p class="small">${S.canListen ? 'Speech recognition is available in this browser.' : 'Speech recognition isn’t available in this browser — Chrome (desktop/Android) or Safari works best.'}</p></div>
        <div class="set"><label><input type="checkbox" id="unlock" ${s.unlockAll ? 'checked' : ''}> Unlock everything</label><p class="small">Skip ahead if you already know some Korean.</p></div>
        <div class="set"><button class="btn danger" id="reset">Reset all progress</button></div>
        <div class="set about"><h3>About the content</h3>
          <p class="small">Pronunciation rules follow the <i>Standard Pronunciation</i> rules (표준 발음법) and romanization follows the <i>Revised Romanization of Korean</i> (국어의 로마자 표기법), both published by the National Institute of Korean Language (국립국어원). Chapter order follows standard beginner courses (e.g. King Sejong Institute). Audio uses your device’s Korean voice.</p></div>
      </div>`;
    const ki = KoInput({ mic: false, placeholder: 'e.g. pamella', onSubmit: () => {} });
    $('#nameIn').appendChild(ki.el); if (s.nameKo) ki.set(s.nameKo);
    ki.input.addEventListener('change', () => {
      const v = ki.input.value.trim(); const k = H.normHangul(H.hasLatin(v) ? H.romanToHangul(v) : v);
      s.nameKo = k; save(); if (k) { ki.set(k); toast(`Saved: ${k}`); }
    });
    ki.input.addEventListener('blur', () => ki.input.dispatchEvent(new Event('change')));
    $('#ctry').onchange = e => { s.countryKo = e.target.value; save(); };
    $$('#romaji button').forEach(b => b.onclick = () => { s.romaji = b.dataset.v; save(); routes.settings(); });
    $('#rate').oninput = e => { s.rate = +e.target.value; S.rate = s.rate; $('#rateV').textContent = s.rate.toFixed(1) + '×'; save(); };
    $('#mic').onchange = e => { s.mic = e.target.checked; save(); };
    $('#unlock').onchange = e => { s.unlockAll = e.target.checked; save(); };
    $('#reset').onclick = () => {
      if (!confirm('Reset all lessons, reviews and scenes? Your settings are kept.')) return;
      Object.assign(state, { lessons: {}, srs: {}, best: {}, scenes: {}, streak: { last: null, count: 0 } }); save(); toast('Progress reset'); go('#/home');
    };
  };

  // ===========================================================================
  // Boot
  const dictWords = [];
  BOOK.forEach(ch => ch.items.forEach(it => { if (it.kind !== 'letter') dictWords.push(it.ko); }));
  SCENES.forEach(sc => Object.values(sc.steps).forEach(st => (st.responses || []).forEach(r => { if (Array.isArray(r.say)) dictWords.push(...r.say.filter(x => !x.includes('{'))); })));
  COUNTRIES.forEach(([c]) => dictWords.push(c));
  dictWords.push('저는', '사람이에요', '주세요', '있어요', '이에요', '예요', '씨');
  H.addToDictionary(dictWords);
  if (state.settings.nameKo) H.addToDictionary([state.settings.nameKo]);
  render();
  // expose for debugging / tests
  window.__app = { state, buildSession, makeQuestion, poolFor };
})();
