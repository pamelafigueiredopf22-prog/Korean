/* Text-to-speech (device Korean voice) and speech recognition (microphone). */
(function () {
  'use strict';
  const synth = window.speechSynthesis;
  let voice = null;
  const PREFERRED = ['google', 'natural', 'online', 'yuna', 'sora', 'heami', 'sunhi', 'injoon', 'seoyeon', 'jimin'];

  function pickVoice() {
    if (!synth) return;
    const ko = synth.getVoices().filter(v => /^ko(-|_|$)/i.test(v.lang));
    if (!ko.length) { voice = null; return; }
    ko.sort((a, b) => score(b) - score(a));
    voice = ko[0];
  }
  function score(v) {
    const n = v.name.toLowerCase();
    let s = 0;
    PREFERRED.forEach((p, i) => { if (n.includes(p)) s += 20 - i; });
    if (v.localService) s += 1;
    return s;
  }
  if (synth) {
    pickVoice();
    if (typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = pickVoice;
  }

  const Speech = {
    rate: 0.9,
    get supported() { return !!synth; },
    get hasKoreanVoice() { if (!voice) pickVoice(); return !!voice; },
    get voiceName() { return voice ? voice.name : null; },
    speak(text, opts) {
      opts = opts || {};
      if (!synth || !text) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[\[\]]/g, ''));
      u.lang = 'ko-KR';
      if (!voice) pickVoice();
      if (voice) u.voice = voice;
      u.rate = Math.max(0.4, Math.min(1.6, (opts.rate || 1) * Speech.rate));
      if (opts.onend) u.onend = opts.onend;
      synth.speak(u);
    },
    // --- recognition
    get canListen() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
    listen() {
      return new Promise((resolve, reject) => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return reject(new Error('unsupported'));
        if (synth) synth.cancel();
        const r = new SR();
        r.lang = 'ko-KR';
        r.interimResults = false;
        r.maxAlternatives = 5;
        let done = false;
        r.onresult = e => {
          done = true;
          const alts = [];
          for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
          resolve(alts);
        };
        r.onerror = e => { done = true; reject(new Error(e.error || 'error')); };
        r.onend = () => { if (!done) resolve([]); };
        Speech._current = r;
        r.start();
      });
    },
    stopListening() { if (Speech._current) try { Speech._current.stop(); } catch (e) { /* ignore */ } },
  };
  window.Speech = Speech;
})();
