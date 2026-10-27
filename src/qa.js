// GameBox QA — звук, лидерборд, пауза, storage, утилиты.
(() => {
  // --- Storage ---
  const NS = 'gamebox_v1';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(NS + '_' + k); return v === null ? d : JSON.parse(v); } catch(_) { return d; } },
    set(k, v) { try { localStorage.setItem(NS + '_' + k, JSON.stringify(v)); } catch(_) {} },
    del(k) { try { localStorage.removeItem(NS + '_' + k); } catch(_) {} }
  };

  // --- Лидерборд ---
  const LB_KEY = 'leaderboard';
  function getBoard(game) {
    const all = store.get(LB_KEY, {});
    return all[game] || [];
  }
  function submitScore(game, score, meta) {
    const all = store.get(LB_KEY, {});
    const arr = all[game] || [];
    const entry = { score: Math.round(score), date: Date.now(), meta: meta || null };
    arr.push(entry);
    arr.sort((a, b) => b.score - a.score);
    all[game] = arr.slice(0, 10);
    store.set(LB_KEY, all);
    const idx = all[game].findIndex(e => e === entry);
    return { rank: idx >= 0 ? idx + 1 : null, top: all[game] };
  }
  function bestScore(game) {
    const arr = getBoard(game);
    return arr.length ? arr[0].score : 0;
  }

  // --- Аудио (WebAudio, без сэмплов) ---
  const AC = window.AudioContext || window.webkitAudioContext;
  let actx = null, muted = store.get('muted', false);
  function ensure() {
    if (!actx && AC) { try { actx = new AC(); } catch(_) {} }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type, gain, delay) {
    if (muted) return;
    const a = ensure(); if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.value = freq || 440;
    g.gain.value = gain === undefined ? 0.07 : gain;
    o.connect(g); g.connect(a.destination);
    g.gain.setValueAtTime(g.gain.value, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || 0.12));
    o.start(t0); o.stop(t0 + (dur || 0.12) + 0.02);
  }
  const sfx = {
    click: () => tone(660, 0.05, 'square', 0.05),
    move: () => tone(440, 0.06, 'triangle', 0.06),
    good: () => { tone(660, 0.08); tone(880, 0.10, 'sine', 0.07, 0.08); },
    bad: () => tone(180, 0.18, 'sawtooth', 0.08),
    win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'sine', 0.09, i * 0.10)); },
    lose: () => { [440, 330, 220].forEach((f, i) => tone(f, 0.20, 'sawtooth', 0.07, i * 0.12)); },
    step: () => tone(880, 0.03, 'square', 0.03)
  };
  function toggleMute() {
    muted = !muted; store.set('muted', muted);
    const b = document.getElementById('qa-mute');
    if (b) b.textContent = muted ? '🔇' : '🔊';
    if (!muted) sfx.click();
    return muted;
  }

  // --- Пауза ---
  let paused = false;
  const pauseHooks = [];
  function togglePause() {
    paused = !paused;
    document.body.classList.toggle('paused', paused);
    const b = document.getElementById('qa-pause');
    if (b) b.textContent = paused ? '▶' : '⏸';
    for (const f of pauseHooks) try { f(paused); } catch(_) {}
  }
  function onPause(fn) { pauseHooks.push(fn); }

  // --- Мобильный canvas-fit ---
  function fitCanvas(cv) {
    if (!cv) return;
    const stage = cv.parentElement;
    if (!stage) return;
    const maxW = stage.clientWidth - 8;
    const maxH = stage.clientHeight - 8;
    const s = Math.min(maxW / cv.width, maxH / cv.height, 1);
    cv.style.width = Math.round(cv.width * s) + 'px';
    cv.style.height = Math.round(cv.height * s) + 'px';
  }

  // --- Публичный API ---
  window.QA = {
    store, getBoard, submitScore, bestScore,
    sfx, tone, isMuted: () => muted, toggleMute,
    isPaused: () => paused, togglePause, onPause,
    fitCanvas,
  };

  // --- Обработчик клавиш: M — mute, Space — pause (если не в форме) ---
  document.addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') { toggleMute(); }
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePause(); }
  });

  // --- Один жест разрешает AudioContext ---
  document.addEventListener('pointerdown', () => { if (!muted) ensure(); }, { once: true });
})();