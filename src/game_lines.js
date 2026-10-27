// Lines — 9×9, 5+ в линию по горизонтали/вертикали/диагонали.
(function () {
  const N = 9, CELL = 44;
  const COLORS = ['#e04040', '#40a0e0', '#40d060', '#e0c040', '#c040e0'];
  const RANDOM_COLORS = 3;

  GB.register({
    id: 'lines',
    name: 'Линии',
    icon: '●●',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = N * CELL + 2; cv.height = N * CELL + 2;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let board = Array.from({ length: N }, () => Array(N).fill(-1));
      let selected = null;
      let score = 0;
      let over = false;
      let raf = null;

      function randColor() { return Math.floor(Math.random() * RANDOM_COLORS); }

      function spawnRandom() {
        for (let k = 0; k < 3; k++) {
          for (let tries = 0; tries < 100; tries++) {
            const y = Math.floor(Math.random() * N), x = Math.floor(Math.random() * N);
            if (board[y][x] === -1) { board[y][x] = randColor(); break; }
          }
        }
      }

      function findLines() {
        const dirs = [[1,0],[0,1],[1,1],[1,-1]];
        const mark = Array.from({ length: N }, () => Array(N).fill(false));
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const c = board[y][x]; if (c < 0) continue;
          for (const [dx, dy] of dirs) {
            let n = 1;
            while (true) {
              const nx = x + dx*n, ny = y + dy*n;
              if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
              if (board[ny][nx] !== c) break;
              n++;
            }
            if (n >= 5) for (let i = 0; i < n; i++) mark[y + dy*i][x + dx*i] = true;
          }
        }
        return mark;
      }

      function clearLines() {
        const mark = findLines();
        let n = 0;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (mark[y][x]) { board[y][x] = -1; n++; }
        if (n > 0) {
          score += n * 2;
          QA.sfx.good();
          // bonus за размер
          if (n >= 7) score += 5;
          updateHud();
        }
        return n;
      }

      function bfs(sx, sy, color) {
        const seen = Array.from({ length: N }, () => Array(N).fill(false));
        const q = [[sx, sy]];
        const result = [];
        seen[sy][sx] = true;
        while (q.length) {
          const [x, y] = q.shift();
          result.push([x, y]);
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
            if (seen[ny][nx]) continue;
            if (board[ny][nx] !== color) continue;
            seen[ny][nx] = true;
            q.push([nx, ny]);
          }
        }
        return result;
      }

      function pathFind(sx, sy, tx, ty) {
        const open = [[sx, sy]];
        const prev = {};
        const key = (x, y) => x + ',' + y;
        const seen = { [key(sx, sy)]: true };
        while (open.length) {
          const [x, y] = open.shift();
          if (x === tx && y === ty) {
            // собрать путь
            const path = [];
            let k = key(tx, ty);
            while (prev[k]) {
              path.unshift(k.split(',').map(Number));
              k = prev[k];
            }
            return path;
          }
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue;
            if (board[ny][nx] !== -1 && !(nx === tx && ny === ty)) continue;
            const k2 = key(nx, ny);
            if (seen[k2]) continue;
            seen[k2] = true;
            prev[k2] = key(x, y);
            open.push([nx, ny]);
          }
        }
        return null;
      }

      function click(gx, gy) {
        if (over) return;
        const c = board[gy][gx];
        // пустая клетка допустима как ЦЕЛЬ (если что-то выбрано)
        if (c < 0 && !selected) return;
        if (!selected) {
          selected = [gx, gy];
          QA.sfx.click();
          draw();
          return;
        }
        if (selected[0] === gx && selected[1] === gy) {
          selected = null;
          QA.sfx.click();
          draw();
          return;
        }
        const path = pathFind(selected[0], selected[1], gx, gy);
        if (!path || path.length > 200) {
          QA.sfx.bad();
          selected = [gx, gy];
          draw();
          return;
        }
        board[gy][gx] = board[selected[1]][selected[0]];
        board[selected[1]][selected[0]] = -1;
        QA.sfx.move();
        selected = null;
        const cleared = clearLines();
        if (cleared === 0) {
          spawnRandom();
          const cl2 = clearLines();
          if (cl2 > 0) updateHud();
        }
        if (board.every(row => row.every(v => v === -1))) { /* no more */ }
        // check if no moves (basic): если все поля заняты — game over
        if (board.every(row => row.every(v => v >= 0))) {
          // попробуем линии
          if (clearLines() === 0) {
            over = true;
            QA.sfx.lose();
            host.onEnd(score, {});
          }
        }
        draw();
      }

      function updateHud() {
        host.onHud('Очки: <b>' + score + '</b> · Ходов: <b>' + countMoves() + '</b>');
      }

      function countMoves() {
        // очень грубо: количество пустых клеток
        let n = 0;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (board[y][x] === -1) n++;
        return n;
      }

      function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, cv.width, cv.height);
        // grid
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const c = board[y][x];
          const px = x * CELL + 1, py = y * CELL + 1;
          ctx.fillStyle = (x + y) % 2 ? '#0d1117' : '#161b22';
          ctx.fillRect(px, py, CELL, CELL);
          if (c >= 0) {
            const cx = px + CELL/2, cy = py + CELL/2;
            ctx.beginPath();
            ctx.arc(cx, cy, CELL * 0.36, 0, 7);
            ctx.fillStyle = COLORS[c];
            ctx.fill();
            // блик
            ctx.beginPath();
            ctx.arc(cx - CELL * 0.10, cy - CELL * 0.10, CELL * 0.12, 0, 7);
            ctx.fillStyle = 'rgba(255,255,255,.4)';
            ctx.fill();
            // selected подсветка
            if (selected && selected[0] === x && selected[1] === y) {
              ctx.strokeStyle = '#58a6ff';
              ctx.lineWidth = 3;
              ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
            }
          }
        }
      }

      const clickHandler = (e) => {
        const rect = cv.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (N * CELL / rect.width) / CELL);
        const y = Math.floor((e.clientY - rect.top) * (N * CELL / rect.height) / CELL);
        if (x >= 0 && x < N && y >= 0 && y < N) click(x, y);
      };

      function start() {
        board = Array.from({ length: N }, () => Array(N).fill(-1));
        score = 0; selected = null; over = false;
        for (let i = 0; i < 5; i++) spawnRandom();
        // убрать случайные совпадения
        clearLines();
        cv.addEventListener('pointerdown', clickHandler);
        updateHud();
        draw();
        raf = requestAnimationFrame(function loop() { raf = requestAnimationFrame(loop); });
      }

      return {
        start,
        getScore: () => score,
        destroy() {
          if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener('pointerdown', clickHandler);
        },
        _debug: {
          getScore: () => score,
          board: () => board.map(r => r.slice()),
          setBoard: (b) => { board = b.map(r => r.slice()); draw(); },
          spawn: (x, y, c) => { board[y][x] = c; draw(); },
          endGame: () => { over = true; host.onEnd(score, {}); },
          click,
        },
      };
    }
  });
})();