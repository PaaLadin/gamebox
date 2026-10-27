// 2048 — 4×4, слияния, анимация не нужна, свайпы/стрелки.
(function () {
  const N = 4, CELL = 110, GAP = 8;
  const W = N * CELL + (N + 1) * GAP, H = W;

  const COLORS = {
    0:    '#1a1e28',
    2:    '#3a4a5a',
    4:    '#4a5a6a',
    8:    '#4a6a8a',
    16:   '#5a7a9a',
    32:   '#6a8aaa',
    64:   '#7a9aba',
    128:  '#a0b0c0',
    256:  '#b0c0d0',
    512:  '#c0d0e0',
    1024: '#d0e0f0',
    2048: '#2ecc71',
  };

  GB.register({
    id: '2048',
    name: '2048',
    icon: '⊞',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let grid = Array.from({ length: N }, () => Array(N).fill(0));
      let score = 0;
      let over = false;
      let won = false;

      function spawn() {
        const empties = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x] === 0) empties.push([x, y]);
        if (!empties.length) return false;
        const [x, y] = empties[Math.floor(Math.random() * empties.length)];
        grid[y][x] = Math.random() < 0.9 ? 2 : 4;
        return true;
      }

      function updateHud() {
        host.onHud('Очки: <b>' + score + '</b> · Максимум: <b>' + maxTile() + '</b>');
      }

      function maxTile() {
        let m = 0;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x] > m) m = grid[y][x];
        return m;
      }

      function move(dir) { // 'L','R','U','D'
        let moved = false;
        const merged = Array.from({ length: N }, () => Array(N).fill(false));
        const line = [];
        const newGrid = grid.map(r => r.slice());

        if (dir === 'L' || dir === 'R') {
          for (let y = 0; y < N; y++) {
            const row = [];
            for (let i = 0; i < N; i++) {
              const x = dir === 'L' ? i : N - 1 - i;
              if (grid[y][x]) row.push({ v: grid[y][x], x, y });
            }
            const mergedRow = [];
            for (let i = 0; i < row.length; i++) {
              if (i + 1 < row.length && row[i].v === row[i + 1].v && !mergedRow.merged) {
                mergedRow.push({ v: row[i].v * 2, merged: true });
                score += row[i].v * 2;
                i++;
              } else {
                mergedRow.push({ v: row[i].v, merged: false });
              }
            }
            for (let i = 0; i < N; i++) {
              const x = dir === 'L' ? i : N - 1 - i;
              const v = i < mergedRow.length ? mergedRow[i].v : 0;
              if (newGrid[y][x] !== v) moved = true;
              newGrid[y][x] = v;
            }
          }
        } else {
          for (let x = 0; x < N; x++) {
            const col = [];
            for (let i = 0; i < N; i++) {
              const y = dir === 'U' ? i : N - 1 - i;
              if (grid[y][x]) col.push({ v: grid[y][x], x, y });
            }
            const mergedCol = [];
            for (let i = 0; i < col.length; i++) {
              if (i + 1 < col.length && col[i].v === col[i + 1].v) {
                mergedCol.push({ v: col[i].v * 2 });
                score += col[i].v * 2;
                i++;
              } else {
                mergedCol.push({ v: col[i].v });
              }
            }
            for (let i = 0; i < N; i++) {
              const y = dir === 'U' ? i : N - 1 - i;
              const v = i < mergedCol.length ? mergedCol[i].v : 0;
              if (newGrid[y][x] !== v) moved = true;
              newGrid[y][x] = v;
            }
          }
        }
        if (moved) {
          grid = newGrid;
          QA.sfx.move();
          if (!spawn()) { checkEnd(); }
          if (!won && maxTile() >= 2048) { won = true; QA.sfx.win(); }
          if (!hasMoves()) checkEnd();
          updateHud();
          draw();
        }
      }

      function hasMoves() {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if (grid[y][x] === 0) return true;
          if (x + 1 < N && grid[y][x] === grid[y][x + 1]) return true;
          if (y + 1 < N && grid[y][x] === grid[y + 1][x]) return true;
        }
        return false;
      }

      function checkEnd() {
        if (!hasMoves()) {
          over = true;
          QA.sfx.lose();
          host.onEnd(score, { maxTile: maxTile() });
        }
      }

      function draw() {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const px = GAP + x * (CELL + GAP), py = GAP + y * (CELL + GAP);
          const v = grid[y][x];
          ctx.fillStyle = COLORS[v] || '#2ecc71';
          ctx.fillRect(px, py, CELL, CELL);
          if (v) {
            ctx.fillStyle = v >= 128 ? '#0a0a12' : '#f0f0f0';
            ctx.font = 'bold ' + (v >= 1024 ? 34 : v >= 128 ? 40 : 46) + 'px Consolas';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(v), px + CELL/2, py + CELL/2 + 2);
          }
        }
      }

      const keyHandler = (e) => {
        if (over) return;
        const k = e.key.toLowerCase();
        let d = null;
        if (k === 'arrowleft' || k === 'a' || k === 'ф') d = 'L';
        else if (k === 'arrowright' || k === 'd' || k === 'в') d = 'R';
        else if (k === 'arrowup' || k === 'w' || k === 'ц') d = 'U';
        else if (k === 'arrowdown' || k === 's' || k === 'ы') d = 'D';
        if (d) { e.preventDefault(); move(d); }
      };

      // touch
      let touchStart = null;
      const onDown = (e) => { if (e.touches[0]) touchStart = [e.touches[0].clientX, e.touches[0].clientY]; };
      const onUp = (e) => {
        if (!touchStart || !e.changedTouches[0]) return;
        const [sx, sy] = touchStart;
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'R' : 'L');
        else move(dy > 0 ? 'D' : 'U');
        touchStart = null;
      };

      return {
        start() {
          grid = Array.from({ length: N }, () => Array(N).fill(0));
          score = 0; over = false; won = false;
          spawn(); spawn();
          document.addEventListener('keydown', keyHandler);
          cv.addEventListener('touchstart', onDown, { passive: true });
          cv.addEventListener('touchend', onUp, { passive: true });
          updateHud();
          draw();
        },
        getScore: () => score,
        destroy() {
          document.removeEventListener('keydown', keyHandler);
          cv.removeEventListener('touchstart', onDown);
          cv.removeEventListener('touchend', onUp);
        },
        _debug: {
          getScore: () => score,
          grid: () => grid.map(r => r.slice()),
          setGrid: (g) => { grid = g.map(r => r.slice()); draw(); updateHud(); },
          move: (d) => move(d),
          hasMoves: () => hasMoves(),
          forceEnd: () => { over = true; host.onEnd(score, {}); },
        },
      };
    }
  });
})();