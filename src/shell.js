// GameBox shell — меню, роутинг, HUD, лидерборд, контракт игр.
(() => {
  const GAMES = [];   // заполняется GB.register()
  let current = null; // {id, api, cleanup}
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // ======= Регистрация игр =======
  window.GB = {
    register(def) {
      if (!def || !def.id) throw new Error('GB.register: no id');
      GAMES.push(def);
    },
    list: () => GAMES.slice(),
    startGame: (id) => launchGame(id),
    goMenu: () => showMenu(),
    getState: () => current ? { id: current.id, api: current.api } : null,
  };

  // ======= Меню =======
  function buildMenu() {
    const grid = $('#screen-menu');
    grid.innerHTML = '';
    for (const g of GAMES) {
      const best = QA.bestScore(g.id);
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.id = g.id;
      tile.innerHTML =
        '<span class="icon">' + (g.icon || '◆') + '</span>' +
        '<div class="name">' + escapeHtml(g.name) + '</div>' +
        '<div class="best">' + (best ? 'рекорд: <b>' + best + '</b>' : '—') + '</div>';
      tile.addEventListener('click', () => { QA.sfx.click(); launchGame(g.id); });
      grid.appendChild(tile);
    }
    $('#qa-mute').textContent = QA.isMuted() ? '🔇' : '🔊';
  }
  function escapeHtml(s) { return String(s).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  function showMenu() {
    if (current) { try { current.cleanup && current.cleanup(); } catch(_) {} current = null; }
    $('#screen-game').classList.remove('on');
    $('#screen-menu').classList.remove('hidden');
    $('#overlay').classList.remove('on');
    buildMenu();
    document.body.classList.remove('paused');
  }

  // ======= Игра =======
  function launchGame(id) {
    const def = GAMES.find(g => g.id === id);
    if (!def) { console.warn('no game', id); return; }
    if (current) { try { current.cleanup && current.cleanup(); } catch(_) {} current = null; }

    $('#screen-menu').classList.add('hidden');
    $('#screen-game').classList.add('on');
    $('#overlay').classList.remove('on');
    $('#game-title').textContent = def.name;
    $('#game-hud').innerHTML = '';
    const stage = $('#game-stage');
    stage.innerHTML = '';

    const api = def.create(stage, {
      onHud(html) { $('#game-hud').innerHTML = html; },
      onScore(score) { api._score = score; },
      onEnd(score, meta) { endGame(def, score, meta); },
    });
    current = { id, api, cleanup: api.destroy };
    try { api.start(); } catch (e) { console.error(e); }
    // вписать canvas в viewport
    const cv = stage.querySelector('canvas');
    if (cv) QA.fitCanvas(cv);
    document.body.classList.remove('paused');
  }

  function endGame(def, score, meta) {
    const res = QA.submitScore(def.id, score, meta);
    QA.sfx.win();
    showBoard(def.id, res.rank, score);
  }

  function showBoard(gameId, rank, score) {
    const board = QA.getBoard(gameId);
    const ov = $('#overlay');
    let rows = '';
    for (let i = 0; i < Math.min(10, board.length); i++) {
      const e = board[i];
      const isMe = rank === i + 1 && Math.abs(e.score - Math.round(score)) === 0;
      rows += '<tr' + (isMe ? ' class="me"' : '') + '>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + e.score + '</td>' +
        '<td>' + new Date(e.date).toLocaleDateString() + '</td>' +
        '</tr>';
    }
    if (!rows) rows = '<tr><td colspan="3" style="text-align:center;color:var(--dim)">—</td></tr>';
    ov.innerHTML =
      '<div class="box">' +
        '<h2>РЕКОРДЫ</h2>' +
        '<div style="text-align:center;margin-bottom:10px">Твой счёт: <b style="color:var(--phos)">' + Math.round(score) + '</b>' +
        (rank ? '  ·  место: <b style="color:var(--acc)">' + rank + '</b>' : '') + '</div>' +
        '<table><tr><th>#</th><th>Счёт</th><th>Дата</th></tr>' + rows + '</table>' +
        '<div class="actions">' +
          '<button id="ov-again">Ещё раз</button>' +
          '<button id="ov-menu">В меню</button>' +
        '</div>' +
      '</div>';
    ov.classList.add('on');
    $('#ov-again').onclick = () => { QA.sfx.click(); ov.classList.remove('on'); launchGame(gameId); };
    $('#ov-menu').onclick = () => { QA.sfx.click(); showMenu(); };
  }

  // ======= Кнопки шапки =======
  $('#qa-menu').addEventListener('click', () => showMenu());
  $('#qa-mute').addEventListener('click', () => QA.toggleMute());
  $('#qa-pause').addEventListener('click', () => QA.togglePause());
  $('#qa-board').addEventListener('click', () => {
    if (!current) return;
    const def = GAMES.find(g => g.id === current.id);
    const api = current.api;
    const score = api && typeof api.getScore === 'function' ? api.getScore() : (api._score || 0);
    showBoard(current.id, null, score);
  });

  // ======= Старт =======
  document.addEventListener('DOMContentLoaded', () => {
    buildMenu();
    $('#qa-mute').textContent = QA.isMuted() ? '🔇' : '🔊';
    // при изменении размера — fit canvas текущей игры
    window.addEventListener('resize', () => {
      const cv = document.querySelector('#game-stage canvas');
      if (cv) QA.fitCanvas(cv);
    });
  });
})();