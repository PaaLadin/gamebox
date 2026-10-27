// Chess — полные правила + ИИ (minimax depth 2, альфа-бета).
(function () {
  const SQ = 56, BOARD = 8;
  const W = SQ * BOARD, H = SQ * BOARD;
  const GLYPH = {
    'P':'♙','N':'♘','B':'♗','R':'♖','Q':'♕','K':'♔',
    'p':'♟','n':'♞','b':'♝','r':'♜','q':'♛','k':'♚',
  };
  const VALUES = { p:100, n:320, b:330, r:500, q:900, k:20000, P:100, N:320, B:330, R:500, Q:900, K:20000 };

  function startBoard() {
    return [
      ['r','n','b','q','k','b','n','r'],
      ['p','p','p','p','p','p','p','p'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['P','P','P','P','P','P','P','P'],
      ['R','N','B','Q','K','B','N','R'],
    ];
  }

  function isWhite(c) { return c !== '.' && c === c.toUpperCase(); }
  function isBlack(c) { return c !== '.' && c === c.toLowerCase(); }
  function sameSide(a, b) { if (a === '.' || b === '.') return false; return isWhite(a) === isWhite(b); }

  function findKing(b, white) {
    const k = white ? 'K' : 'k';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (b[y][x] === k) return [x, y];
    return null;
  }

  function pseudoMoves(b, x, y, state) {
    const p = b[y][x]; if (p === '.') return [];
    const white = isWhite(p);
    const moves = [];
    const add = (nx, ny, opts) => {
      if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) return false;
      const t = b[ny][nx];
      if (sameSide(p, t)) return false;
      moves.push(Object.assign({ from: [x, y], to: [nx, ny], capture: t !== '.' }, opts || {}));
      return t === '.';
    };
    const typ = p.toLowerCase();
    if (typ === 'p') {
      const dir = white ? -1 : 1;
      const startY = white ? 6 : 1;
      // forward 1
      if (y + dir >= 0 && y + dir < 8 && b[y + dir][x] === '.') {
        moves.push({ from:[x,y], to:[x,y+dir], capture:false });
        if (y === startY && b[y + 2*dir][x] === '.') {
          moves.push({ from:[x,y], to:[x,y+2*dir], capture:false, double:true });
        }
      }
      // captures
      for (const dx of [-1, 1]) {
        const nx = x + dx, ny = y + dir;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
        if (b[ny][nx] !== '.' && !sameSide(p, b[ny][nx])) {
          moves.push({ from:[x,y], to:[nx,ny], capture:true });
        }
        // en passant
        if (state && state.ep && state.ep[0] === nx && state.ep[1] === ny) {
          moves.push({ from:[x,y], to:[nx,ny], capture:true, ep:true });
        }
      }
    } else if (typ === 'n') {
      for (const [dx, dy] of [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]]) add(x+dx, y+dy);
    } else if (typ === 'b') {
      for (const [dx, dy] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
        let nx = x+dx, ny = y+dy;
        while (add(nx, ny)) { nx += dx; ny += dy; }
      }
    } else if (typ === 'r') {
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        let nx = x+dx, ny = y+dy;
        while (add(nx, ny)) { nx += dx; ny += dy; }
      }
    } else if (typ === 'q') {
      for (const [dx, dy] of [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]) {
        let nx = x+dx, ny = y+dy;
        while (add(nx, ny)) { nx += dx; ny += dy; }
      }
    } else if (typ === 'k') {
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) add(x+dx, y+dy);
      // castling
      if (state) {
        const row = white ? 7 : 0;
        if (y === row && x === 4 && !state.kingMoved[white ? 'w' : 'b']) {
          // kingside
          if (!state.rookMoved[white?'wR':'bR'] && b[row][5]==='.' && b[row][6]==='.' &&
              b[row][7]===(white?'R':'r')) {
            moves.push({ from:[4,row], to:[6,row], capture:false, castle:'K' });
          }
          // queenside
          if (!state.rookMoved[white?'wL':'bL'] && b[row][1]==='.' && b[row][2]==='.' && b[row][3]==='.' &&
              b[row][0]===(white?'R':'r')) {
            moves.push({ from:[4,row], to:[2,row], capture:false, castle:'Q' });
          }
        }
      }
    }
    return moves;
  }

  function attacked(b, x, y, byWhite) {
    // атакована ли клетка (x,y) стороной byWhite
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) {
      const p = b[yy][xx]; if (p === '.') continue;
      if (isWhite(p) !== byWhite) continue;
      const ms = pseudoMoves(b, xx, yy, null);
      for (const m of ms) if (m.to[0] === x && m.to[1] === y) return true;
    }
    return false;
  }

  function applyMove(b, m, state) {
    const nb = b.map(r => r.slice());
    const piece = nb[m.from[1]][m.from[0]];
    nb[m.to[1]][m.to[0]] = piece;
    nb[m.from[1]][m.from[0]] = '.';
    if (m.ep) nb[m.from[1]][m.to[0]] = '.';
    if (m.castle === 'K') { const row = m.from[1]; nb[row][5] = nb[row][7]; nb[row][7] = '.'; }
    if (m.castle === 'Q') { const row = m.from[1]; nb[row][3] = nb[row][0]; nb[row][0] = '.'; }
    // promotion (auto Q)
    const toRow = m.to[1];
    if (piece === 'P' && toRow === 0) nb[toRow][m.to[0]] = 'Q';
    if (piece === 'p' && toRow === 7) nb[toRow][m.to[0]] = 'q';
    return nb;
  }

  function legalMoves(b, x, y, state, sideWhite) {
    const ms = pseudoMoves(b, x, y, state);
    const res = [];
    for (const m of ms) {
      const nb = applyMove(b, m, state);
      const k = findKing(nb, sideWhite);
      if (!k) continue;
      if (!attacked(nb, k[0], k[1], !sideWhite)) res.push(m);
    }
    return res;
  }

  function allLegalMoves(b, white, state) {
    const res = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const p = b[y][x]; if (p === '.') continue;
      if (isWhite(p) !== white) continue;
      res.push(...legalMoves(b, x, y, state, white));
    }
    return res;
  }

  function inCheck(b, white) {
    const k = findKing(b, white); if (!k) return true;
    return attacked(b, k[0], k[1], !white);
  }

  function minimax(b, white, depth, alpha, beta, state) {
    if (depth === 0) return evalBoard(b);
    const ms = allLegalMoves(b, white, state);
    if (ms.length === 0) return inCheck(b, white) ? (white ? -99999 : 99999) : 0;
    let best = white ? -Infinity : Infinity;
    for (const m of ms) {
      const nb = applyMove(b, m, state);
      // very rough castle/ep state not propagated for eval
      const val = minimax(nb, !white, depth - 1, alpha, beta, state);
      if (white) { if (val > best) best = val; if (best > alpha) alpha = best; }
      else       { if (val < best) best = val; if (best < beta) beta = best; }
      if (beta <= alpha) break;
    }
    return best;
  }

  function evalBoard(b) {
    let s = 0;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const p = b[y][x]; if (p === '.') continue;
      const v = VALUES[p] || 0;
      s += isWhite(p) ? v : -v;
    }
    return s;
  }

  GB.register({
    id: 'chess',
    name: 'Шахматы',
    icon: '♞',
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
      let moves = 0;
      let over = false;
      let aiThinking = false;
      let raf = null;
      let state = {
        kingMoved: { w: false, b: false },
        rookMoved: { wL: false, wR: false, bL: false, bR: false },
        ep: null,
      };

      function updateHud() {
        const ms = allLegalMoves(board, whiteToMove, state);
        const check = inCheck(board, whiteToMove);
        host.onHud(
          (whiteToMove ? 'Ход: <b>белые</b>' : 'Ход: <b>чёрные</b>') +
          ' · Ходов: <b>' + moves + '</b>' +
          (check ? ' · <b style="color:#f85149">ШАХ</b>' : '') +
          ' · Фигур: <b>' + countPieces() + '</b>'
        );
        if (ms.length === 0) {
          over = true;
          if (check) { QA.sfx.win(); host.onEnd(scoreFromBoard(), { mate: true, winner: whiteToMove ? 'black' : 'white' }); }
          else { QA.sfx.lose(); host.onEnd(scoreFromBoard(), { stalemate: true }); }
        }
      }

      function countPieces() {
        let n = 0;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (board[y][x] !== '.') n++;
        return n;
      }
      function scoreFromBoard() {
        // для лидерборда: мат = 100, каждый съеденный материал = 1 очко
        const initPieces = 32;
        const eaten = initPieces - countPieces();
        return eaten * 5 + (over ? 20 : 0);
      }

      function draw() {
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          ctx.fillStyle = (x + y) % 2 ? '#5a3a24' : '#e8d8b8';
          ctx.fillRect(x*SQ, y*SQ, SQ, SQ);
        }
        // last move highlight
        if (lastMove) {
          ctx.strokeStyle = 'rgba(46,204,113,.7)';
          ctx.lineWidth = 3;
          ctx.strokeRect(lastMove.from[0]*SQ + 2, lastMove.from[1]*SQ + 2, SQ-4, SQ-4);
          ctx.strokeRect(lastMove.to[0]*SQ + 2, lastMove.to[1]*SQ + 2, SQ-4, SQ-4);
        }
        // legal moves
        for (const m of legalForSelected) {
          ctx.beginPath();
          ctx.arc(m.to[0]*SQ + SQ/2, m.to[1]*SQ + SQ/2, m.capture ? SQ*0.35 : SQ*0.15, 0, 7);
          ctx.fillStyle = m.capture ? 'rgba(248,81,73,.6)' : 'rgba(88,166,255,.6)';
          ctx.fill();
        }
        // selected
        if (selected) {
          ctx.strokeStyle = '#58a6ff';
          ctx.lineWidth = 4;
          ctx.strokeRect(selected[0]*SQ + 2, selected[1]*SQ + 2, SQ - 4, SQ - 4);
        }
        // pieces
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
          const p = board[y][x]; if (p === '.') continue;
          ctx.font = 'bold 40px "Segoe UI Symbol", serif';
          ctx.fillStyle = isWhite(p) ? '#fafafa' : '#111';
          ctx.strokeStyle = isWhite(p) ? '#222' : '#ccc';
          ctx.lineWidth = 2;
          ctx.strokeText(GLYPH[p], x*SQ + SQ/2, y*SQ + SQ/2);
          ctx.fillText(GLYPH[p], x*SQ + SQ/2, y*SQ + SQ/2);
        }
      }

      function tryClick(gx, gy) {
        if (over || aiThinking) return;
        if (selected) {
          const m = legalForSelected.find(mm => mm.to[0] === gx && mm.to[1] === gy);
          if (m) {
            applyMoveUI(m);
            return;
          }
          // пере-выбор
          selected = null;
          legalForSelected = [];
        }
        const p = board[gy][gx];
        if (p === '.') return;
        if (isWhite(p) !== whiteToMove) return;
        selected = [gx, gy];
        legalForSelected = legalMoves(board, gx, gy, state, whiteToMove);
        QA.sfx.click();
        draw();
      }

      function applyMoveUI(m) {
        const piece = board[m.from[1]][m.from[0]];
        // state updates
        const white = isWhite(piece);
        if (piece.toLowerCase() === 'k') state.kingMoved[white?'w':'b'] = true;
        if (piece === 'R') {
          if (m.from[0] === 0 && m.from[1] === 7) state.rookMoved.wL = true;
          if (m.from[0] === 7 && m.from[1] === 7) state.rookMoved.wR = true;
        }
        if (piece === 'r') {
          if (m.from[0] === 0 && m.from[1] === 0) state.rookMoved.bL = true;
          if (m.from[0] === 7 && m.from[1] === 0) state.rookMoved.bR = true;
        }
        state.ep = null;
        if (m.double) state.ep = [(m.from[0] + m.to[0]) / 2, (m.from[1] + m.to[1]) / 2];

        board = applyMove(board, m, state);
        lastMove = m;
        moves++;
        QA.sfx.move();
        if (m.capture) QA.sfx.step();

        selected = null;
        legalForSelected = [];
        whiteToMove = !whiteToMove;
        draw();
        updateHud();
        if (!over) {
          aiThinking = true;
          setTimeout(aiMove, 120);
        }
      }

      function aiMove() {
        if (over) return;
        const ms = allLegalMoves(board, false, state);
        if (ms.length === 0) { aiThinking = false; updateHud(); return; }
        let bestVal = Infinity, bestM = ms[0];
        for (const m of ms) {
          const nb = applyMove(board, m, state);
          const v = minimax(nb, true, 2, -Infinity, Infinity, state);
          if (v < bestVal) { bestVal = v; bestM = m; }
        }
        const piece = board[bestM.from[1]][bestM.from[0]];
        if (piece === 'r') {
          if (bestM.from[0] === 0 && bestM.from[1] === 0) state.rookMoved.bL = true;
          if (bestM.from[0] === 7 && bestM.from[1] === 0) state.rookMoved.bR = true;
        }
        if (piece === 'k') state.kingMoved.b = true;
        state.ep = null;
        if (bestM.double) state.ep = [(bestM.from[0] + bestM.to[0]) / 2, (bestM.from[1] + bestM.to[1]) / 2];

        board = applyMove(board, bestM, state);
        lastMove = bestM;
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
          state = { kingMoved: { w: false, b: false }, rookMoved: { wL: false, wR: false, bL: false, bR: false }, ep: null };
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
          moves: () => allLegalMoves(board, whiteToMove, state).length,
          forceEnd: () => { over = true; host.onEnd(scoreFromBoard(), { forced: true }); },
          whiteToMove: () => whiteToMove,
          makeMove: (from, to) => {
            const ms = legalMoves(board, from[0], from[1], state, whiteToMove);
            const m = ms.find(x => x.to[0] === to[0] && x.to[1] === to[1]);
            if (m) applyMoveUI(m);
            return !!m;
          },
          check: () => inCheck(board, whiteToMove),
        },
      };
    }
  });
})();