// Русские шашки — 8×8, дамки, обязательное взятие, цепочки, ИИ.
(function () {
  const SQ = 56, BOARD = 8;
  const W = SQ * BOARD, H = SQ * BOARD;

  function startBoard() {
    const b = Array.from({ length: 8 }, () => Array(8).fill('.'));
    for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) {
      if ((x + y) % 2) b[y][x] = 'b';
    }
    for (let y = 5; y < 8; y++) for (let x = 0; x < 8; x++) {
      if ((x + y) % 2) b[y][x] = 'w';
    }
    return b;
  }

  function isWhite(p) { return p === 'w' || p === 'W'; }
  function isBlack(p) { return p === 'b' || p === 'B'; }
  function isMine(p, white) { return white ? isWhite(p) : isBlack(p); }
  function isOpp(p, white) { return white ? isBlack(p) : isWhite(p); }

  // Все взятия для фигуры (x,y). Русские: дамка бьёт по всей диагонали, приземляется на любую клетку за побитой.
  function capturesFor(b, x, y) {
    const p = b[y][x];
    if (p === '.') return [];
    const white = isWhite(p);
    const isKing = p === 'W' || p === 'B';
    const res = [];

    if (!isKing) {
      for (const [dx, dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        const mx = x + dx, my = y + dy;
        const tx = x + 2*dx, ty = y + 2*dy;
        if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) continue;
        if (b[my][mx] === '.' || !isOpp(b[my][mx], white)) continue;
        if (b[ty][tx] !== '.') continue;
        res.push({ from:[x,y], to:[tx,ty], captured:[[mx,my]] });
      }
    } else {
      // дамка: по каждой диагонали ищем первую встречную фигуру (свою/чужую)
      for (const [dx, dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let cx = x + dx, cy = y + dy;
        let cap = null;
        while (cx >= 0 && cx < 8 && cy >= 0 && cy < 8) {
          const t = b[cy][cx];
          if (cap === null) {
            if (t === '.') { cx += dx; cy += dy; continue; }
            if (!isOpp(t, white)) break;
            cap = [cx, cy];
            cx += dx; cy += dy;
            continue;
          } else {
            if (t !== '.') break;
            res.push({ from:[x,y], to:[cx,cy], captured:[cap.slice()] });
            cx += dx; cy += dy;
          }
        }
      }
    }
    return res;
  }

  function simpleMovesFor(b, x, y) {
    const p = b[y][x]; if (p === '.') return [];
    const white = isWhite(p);
    const isKing = p === 'W' || p === 'B';
    const res = [];
    if (!isKing) {
      const dirs = white ? [[-1,-1],[1,-1]] : [[-1,1],[1,1]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
        if (b[ny][nx] === '.') res.push({ from:[x,y], to:[nx,ny], captured:[] });
      }
    } else {
      for (const [dx, dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let cx = x + dx, cy = y + dy;
        while (cx >= 0 && cx < 8 && cy >= 0 && cy < 8) {
          if (b[cy][cx] !== '.') break;
          res.push({ from:[x,y], to:[cx,cy], captured:[] });
          cx += dx; cy += dy;
        }
      }
    }
    return res;
  }

  function allCaptures(b, white) {
    const res = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      if (!isMine(b[y][x], white)) continue;
      res.push(...capturesFor(b, x, y));
    }
    return res;
  }

  function allMoves(b, white) {
    const caps = allCaptures(b, white);
    if (caps.length) return caps;   // обязательное взятие
    const res = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      if (!isMine(b[y][x], white)) continue;
      res.push(...simpleMovesFor(b, x, y));
    }
    return res;
  }

  function apply(b, m) {
    const nb = b.map(r => r.slice());
    const p = nb[m.from[1]][m.from[0]];
    nb[m.from[1]][m.from[0]] = '.';
    nb[m.to[1]][m.to[0]] = p;
    for (const [cx, cy] of m.captured) nb[cy][cx] = '.';
    // превращение
    if (p === 'w' && m.to[1] === 0) nb[m.to[1]][m.to[0]] = 'W';
    if (p === 'b' && m.to[1] === 7) nb[m.to[1]][m.to[0]] = 'B';
    return nb;
  }

  // цепочки: после взятия — если есть ещё взятия этой фигурой, играем дальше (реализуем в UI)
  function evalBoard(b) {
    let s = 0;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const p = b[y][x]; if (p === '.') continue;
      if (p === 'w') s -= 100;
      if (p === 'b') s += 100;
      if (p === 'W') s -= 350;
      if (p === 'B') s += 350;
      // продвижение
      if (p === 'w') s -= (7 - y) * 2;
      if (p === 'b') s += y * 2;
    }
    return s;
  }

  function minimax(b, white, depth, alpha, beta) {
    if (depth === 0) return evalBoard(b);
    const ms = allMoves(b, white);
    if (!ms.length) return white ? 99999 : -99999;
    let best = white ? -Infinity : Infinity;
    for (const m of ms) {
      const nb = apply(b, m);
      const v = minimax(nb, !white, depth - 1, alpha, beta);
      if (white) { if (v > best) best = v; if (best > alpha) alpha = best; }
      else       { if (v < best) best = v; if (best < beta) beta = best; }
      if (beta <= alpha) break;
    }
    return best;
  }

  GB.register({
    id: 'checkers',
    name: 'Шашки',
    icon: '⛁',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let board = startBoard();
      let whiteToMove = true;
      let selected = null;
      let legalForSelected = [];
      let lastMove = null;
      let over = false;
      let aiThinking = false;
      let moves = 0;

      function updateHud() {
        const caps = allCaptures(board, whiteToMove);
        host.onHud(
          (whiteToMove ? 'Ход: <b>белые</b>' : 'Ход: <b>чёрные</b>') +
          ' · Ходов: <b>' + moves + '</b>' +
          (caps.length ? ' · <b style="color:#d29922">ВЗЯТИЕ</b>' : '') +
          ' · Белые: <b>' + countSide(true) + '</b> · Чёрные: <b>' + countSide(false) + '</b>'
        );
        const ms = allMoves(board, whiteToMove);
        if (ms.length === 0) {
          over = true;
          QA.sfx.lose();
          host.onEnd(scoreFromBoard(), { winner: whiteToMove ? 'black' : 'white' });
        }
      }

      function countSide(white) {
        let n = 0;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          if (isMine(board[y][x], white)) n++;
        }
        return n;
      }

      function scoreFromBoard() {
        return (12 - countSide(false)) * 10 + (over ? 20 : 0);
      }

      function draw() {
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#3a2a1a' : '#e8d8b8';
          ctx.fillRect(x*SQ, y*SQ, SQ, SQ);
        }
        if (lastMove) {
          ctx.strokeStyle = 'rgba(46,204,113,.7)';
          ctx.lineWidth = 3;
          ctx.strokeRect(lastMove.from[0]*SQ + 2, lastMove.from[1]*SQ + 2, SQ-4, SQ-4);
          ctx.strokeRect(lastMove.to[0]*SQ + 2, lastMove.to[1]*SQ + 2, SQ-4, SQ-4);
        }
        for (const m of legalForSelected) {
          ctx.beginPath();
          ctx.arc(m.to[0]*SQ + SQ/2, m.to[1]*SQ + SQ/2, m.captured.length ? SQ*0.30 : SQ*0.18, 0, 7);
          ctx.fillStyle = m.captured.length ? 'rgba(248,81,73,.6)' : 'rgba(88,166,255,.6)';
          ctx.fill();
        }
        if (selected) {
          ctx.strokeStyle = '#58a6ff';
          ctx.lineWidth = 4;
          ctx.strokeRect(selected[0]*SQ + 2, selected[1]*SQ + 2, SQ - 4, SQ - 4);
        }
        // pieces
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          const p = board[y][x]; if (p === '.') continue;
          const cx = x*SQ + SQ/2, cy = y*SQ + SQ/2;
          const r = SQ * 0.38;
          const white = isWhite(p);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, 7);
          ctx.fillStyle = white ? '#fafafa' : '#111';
          ctx.strokeStyle = white ? '#222' : '#ccc';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
          if (p === 'W' || p === 'B') {
            // дамка: звезда
            ctx.fillStyle = white ? '#d29922' : '#e0c040';
            ctx.font = 'bold 24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', cx, cy + 1);
          }
        }
      }

      function tryClick(gx, gy) {
        if (over || aiThinking) return;
        if (selected) {
          const m = legalForSelected.find(mm => mm.to[0] === gx && mm.to[1] === gy);
          if (m) { applyUIMove(m); return; }
          selected = null; legalForSelected = [];
        }
        const p = board[gy][gx];
        if (p === '.' || !isMine(p, whiteToMove)) return;
        selected = [gx, gy];
        const caps = allCaptures(board, whiteToMove);
        if (caps.length) {
          legalForSelected = caps.filter(m => m.from[0] === gx && m.from[1] === gy);
        } else {
          legalForSelected = simpleMovesFor(board, gx, gy);
        }
        QA.sfx.click();
        draw();
      }

      function applyUIMove(m) {
        board = apply(board, m);
        lastMove = m;
        moves++;
        QA.sfx.move();
        if (m.captured.length) QA.sfx.step();
        selected = null; legalForSelected = [];
        // цепочка: если после взятия у этой же фигуры есть ещё взятия — продолжаем
        if (m.captured.length) {
          const next = capturesFor(board, m.to[0], m.to[1]);
          if (next.length) {
            selected = [m.to[0], m.to[1]];
            legalForSelected = next;
            draw();
            updateHud();
            return;
          }
        }
        whiteToMove = !whiteToMove;
        draw();
        updateHud();
        if (!over) {
          aiThinking = true;
          setTimeout(aiMove, 150);
        }
      }

      function aiMove() {
        if (over) return;
        const ms = allMoves(board, false);
        if (!ms.length) { aiThinking = false; updateHud(); return; }
        let bestVal = Infinity, bestM = ms[0];
        for (const m of ms) {
          const nb = apply(board, m);
          const v = minimax(nb, true, 3, -Infinity, Infinity);
          if (v < bestVal) { bestVal = v; bestM = m; }
        }
        // цепочка ИИ
        let cur = board;
        let mv = bestM;
        let chain = false;
        do {
          cur = apply(cur, mv);
          chain = false;
          if (mv.captured.length) {
            const next = capturesFor(cur, mv.to[0], mv.to[1]);
            if (next.length) { mv = next[0]; chain = true; }
          }
        } while (chain);
        board = cur;
        lastMove = mv;
        QA.sfx.move();
        whiteToMove = true;
        aiThinking = false;
        draw();
        updateHud();
      }

      function clickHandler(e) {
        const rect = cv.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (8*SQ / rect.width) / SQ);
        const y = Math.floor((e.clientY - rect.top) * (8*SQ / rect.height) / SQ);
        if (x >= 0 && x < 8 && y >= 0 && y < 8) tryClick(x, y);
      }

      return {
        start() {
          board = startBoard();
          whiteToMove = true;
          moves = 0; over = false; aiThinking = false;
          selected = null; legalForSelected = []; lastMove = null;
          cv.addEventListener('pointerdown', clickHandler);
          draw();
          updateHud();
        },
        getScore: () => scoreFromBoard(),
        destroy() {
          cv.removeEventListener('pointerdown', clickHandler);
        },
        _debug: {
          board: () => board.map(r => r.slice()),
          setBoard: (b) => { board = b.map(r => r.slice()); draw(); },
          moves: () => allMoves(board, whiteToMove).length,
          captures: () => allCaptures(board, whiteToMove).length,
          forceEnd: () => { over = true; host.onEnd(scoreFromBoard(), { forced: true }); },
          whiteToMove: () => whiteToMove,
          apply: (from, to) => {
            const caps = allCaptures(board, whiteToMove);
            const pool = caps.length ? caps : allMoves(board, whiteToMove);
            const m = pool.find(x => x.from[0] === from[0] && x.from[1] === from[1] && x.to[0] === to[0] && x.to[1] === to[1]);
            if (m) applyUIMove(m);
            return !!m;
          },
        },
      };
    }
  });
})();