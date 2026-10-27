// Tetris — 10×20, 7 фигур (SRS-lite), мягкое/жёсткое падение.
(function () {
  const COLS = 10, ROWS = 20, BLOCK = 26;
  const COLORS = [
    null,
    '#00e0e0', // I
    '#e0e000', // O
    '#a000e0', // T
    '#00e000', // S
    '#e00000', // Z
    '#0000e0', // J
    '#e08000', // L
  ];
  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[2,2],[2,2]],
    T: [[0,3,0],[3,3,3],[0,0,0]],
    S: [[0,4,4],[4,4,0],[0,0,0]],
    Z: [[5,5,0],[0,5,5],[0,0,0]],
    J: [[6,0,0],[6,6,6],[0,0,0]],
    L: [[0,0,7],[7,7,7],[0,0,0]],
  };
  const KEYS = Object.keys(SHAPES);

  function blankBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  GB.register({
    id: 'tetris',
    name: 'Тетрис',
    icon: '▦',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = COLS * BLOCK + 2;
      cv.height = ROWS * BLOCK + 2;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let board = blankBoard();
      let cur = null;      // {shape, color, x, y}
      let next = null;
      let score = 0;
      let lines = 0;
      let level = 1;
      let dropTimer = 0;
      let dropInterval = 500;   // ms
      let lastTs = 0;
      let over = false;
      let raf = null;
      let paused = false;

      function spawn() {
        const k = next || KEYS[Math.floor(Math.random() * KEYS.length)];
        next = KEYS[Math.floor(Math.random() * KEYS.length)];
        const shape = SHAPES[k].map(r => r.slice());
        const color = 1 + KEYS.indexOf(k);
        cur = {
          shape,
          color,
          x: Math.floor((COLS - shape[0].length) / 2),
          y: 0,
        };
        if (collides(cur.shape, cur.x, cur.y)) {
          endGame();
        }
      }

      function collides(shape, px, py) {
        for (let y = 0; y < shape.length; y++) {
          for (let x = 0; x < shape[y].length; x++) {
            if (!shape[y][x]) continue;
            const bx = px + x, by = py + y;
            if (bx < 0 || bx >= COLS || by >= ROWS) return true;
            if (by >= 0 && board[by][bx]) return true;
          }
        }
        return false;
      }

      function merge() {
        for (let y = 0; y < cur.shape.length; y++) {
          for (let x = 0; x < cur.shape[y].length; x++) {
            if (!cur.shape[y][x]) continue;
            const bx = cur.x + x, by = cur.y + y;
            if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
              board[by][bx] = cur.color;
            }
          }
        }
      }

      function clearLines() {
        let n = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
          if (board[y].every(c => c)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            n++; y++;
          }
        }
        if (n > 0) {
          score += [0, 100, 300, 500, 800][n] * level;
          lines += n;
          level = 1 + Math.floor(lines / 10);
          dropInterval = Math.max(80, 500 - (level - 1) * 45);
          QA.sfx.good();
          updateHud();
        }
      }

      function rotate(dir) {
        const shape = cur.shape;
        const N = shape.length;
        const rot = Array.from({ length: N }, () => Array(N).fill(0));
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if (dir > 0) rot[x][N - 1 - y] = shape[y][x];
          else          rot[N - 1 - x][y] = shape[y][x];
        }
        // wall kick: сдвиг если вылезли
        const kicks = [0, -1, 1, -2, 2];
        for (const k of kicks) {
          if (!collides(rot, cur.x + k, cur.y)) {
            cur.shape = rot; cur.x += k;
            QA.sfx.move();
            return;
          }
        }
      }

      function tick(ts) {
        raf = requestAnimationFrame(tick);
        if (over) return;
        if (!paused) {
          if (!lastTs) lastTs = ts;
          const dt = ts - lastTs; lastTs = ts;
          dropTimer += dt;
          if (dropTimer >= dropInterval) {
            dropTimer = 0;
            stepDown();
          }
          draw();
        }
      }

      function stepDown() {
        if (!cur) return;
        if (!collides(cur.shape, cur.x, cur.y + 1)) {
          cur.y++;
        } else {
          merge();
          clearLines();
          spawn();
        }
      }

      function hardDrop() {
        while (!collides(cur.shape, cur.x, cur.y + 1)) cur.y++;
        QA.sfx.step();
        stepDown();
      }

      function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, cv.width, cv.height);
        // сетка
        ctx.strokeStyle = 'rgba(48,54,61,.35)';
        ctx.lineWidth = 1;
        for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x*BLOCK+1, 1); ctx.lineTo(x*BLOCK+1, ROWS*BLOCK+1); ctx.stroke(); }
        for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(1, y*BLOCK+1); ctx.lineTo(COLS*BLOCK+1, y*BLOCK+1); ctx.stroke(); }
        // board
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          if (board[y][x]) block(x, y, COLORS[board[y][x]]);
        }
        // текущая
        if (cur) {
          for (let y = 0; y < cur.shape.length; y++) for (let x = 0; x < cur.shape[y].length; x++) {
            if (cur.shape[y][x]) block(cur.x + x, cur.y + y, COLORS[cur.color]);
          }
        }
      }

      function block(gx, gy, color) {
        ctx.fillStyle = color;
        ctx.fillRect(gx*BLOCK+1, gy*BLOCK+1, BLOCK-2, BLOCK-2);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.fillRect(gx*BLOCK+2, gy*BLOCK+2, BLOCK-4, 2);
      }

      function updateHud() {
        host.onHud(
          'Очки: <b>' + score + '</b> · ' +
          'Линии: <b>' + lines + '</b> · ' +
          'Уровень: <b>' + level + '</b>'
        );
      }

      function endGame() {
        over = true;
        QA.sfx.lose();
        host.onEnd(score, { lines, level });
      }

      function restart() {
        board = blankBoard();
        score = 0; lines = 0; level = 1;
        dropInterval = 500; dropTimer = 0; lastTs = 0;
        over = false;
        spawn();
        updateHud();
      }

      const keyHandler = (e) => {
        if (over) return;
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a' || k === 'ф')  { if (!collides(cur.shape, cur.x-1, cur.y)) { cur.x--; QA.sfx.move(); } e.preventDefault(); }
        else if (k === 'arrowright' || k === 'd' || k === 'в') { if (!collides(cur.shape, cur.x+1, cur.y)) { cur.x++; QA.sfx.move(); } e.preventDefault(); }
        else if (k === 'arrowdown' || k === 's' || k === 'ы')  { if (!collides(cur.shape, cur.x, cur.y+1)) { cur.y++; } e.preventDefault(); }
        else if (k === 'arrowup' || k === 'w' || k === 'ц')    { rotate(1); e.preventDefault(); }
        else if (k === 'z' || k === 'я')                        { rotate(-1); e.preventDefault(); }
        else if (k === ' ')                                     { hardDrop(); e.preventDefault(); }
      };

      return {
        start() {
          restart();
          document.addEventListener('keydown', keyHandler);
          QA.onPause((p) => { paused = p; lastTs = 0; });
          raf = requestAnimationFrame(tick);
        },
        getScore: () => score,
        destroy() {
          if (raf) cancelAnimationFrame(raf);
          document.removeEventListener('keydown', keyHandler);
        },
        _debug: { endGame: () => endGame(), getScore: () => score, restart: () => restart() },
      };
    }
  });
})();