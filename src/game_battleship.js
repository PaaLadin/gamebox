// Морской бой — 10×10, 4+3+3+2+2+2+1+1+1+1, ИИ (hunt/target).
(function () {
  const N = 10, CELL = 38;
  const W = N * CELL * 2 + 30, H = N * CELL + 60;
  const SHIPS = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

  function blank() { return Array.from({ length: N }, () => Array(N).fill(0)); } // 0 empty,1 ship,2 hit,3 miss

  function canPlace(b, x, y, len, horiz) {
    for (let i = 0; i < len; i++) {
      const nx = horiz ? x + i : x, ny = horiz ? y : y + i;
      if (nx < 0 || nx >= N || ny < 0 || ny >= N) return false;
      // запрет соседства
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const ax = nx + dx, ay = ny + dy;
        if (ax < 0 || ax >= N || ay < 0 || ay >= N) continue;
        if (b[ay][ax]) return false;
      }
    }
    return true;
  }

  function randomPlace(b, len) {
    for (let t = 0; t < 200; t++) {
      const horiz = Math.random() < 0.5;
      const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
      if (!canPlace(b, x, y, len, horiz)) continue;
      for (let i = 0; i < len; i++) {
        const nx = horiz ? x + i : x, ny = horiz ? y : y + i;
        b[ny][nx] = 1;
      }
      return true;
    }
    return false;
  }

  function placeAll(b) {
    for (const len of SHIPS) randomPlace(b, len);
  }

  function alive(b, hits) {
    // клетка корабля жива, пока она === 1 и по ней ещё не попали (hits != 2)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (b[y][x] === 1 && (!hits || hits[y][x] !== 2)) return true;
    }
    return false;
  }

  GB.register({
    id: 'battleship',
    name: 'Морской бой',
    icon: '⚓',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let my = blank(), enemy = blank();
      let myHits = blank(), enemyHits = blank(); // мои выстрелы по врагу, выстрелы врага по мне
      let enemyQueue = [];
      let over = false;
      let shots = 0, hits = 0;

      function updateHud() {
        host.onHud(
          'Выстрелов: <b>' + shots + '</b> · Попаданий: <b>' + hits + '</b>' +
          ' · Врагов: <b>' + countAlive(enemy, enemyHits) + '</b>' +
          ' · Моих: <b>' + countAlive(my, myHits) + '</b>'
        );
      }

      function countAlive(b, hits) {
        let n = 0;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if (b[y][x] === 1 && (!hits || hits[y][x] !== 2)) n++;
        }
        return n;
      }

      function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, W, H);
        // заголовки
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 13px Consolas';
        ctx.textAlign = 'center';
        ctx.fillText('ВАШ ФЛОТ', CELL*N/2 + 10, 22);
        ctx.fillStyle = '#58a6ff';
        ctx.fillText('ФЛОТ ВРАГА', CELL*N + CELL*N/2 + 20, 22);

        drawGrid(10, 30, myHits, false);
        drawGrid(CELL*N + 20, 30, enemyHits, true);

        // мой флот: показываем корабли + попадания врага
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const px = 10 + x*CELL, py = 30 + y*CELL;
          if (my[y][x] === 1) {
            ctx.fillStyle = 'rgba(46,204,113,.4)';
            ctx.fillRect(px+3, py+3, CELL-6, CELL-6);
          }
          if (myHits[y][x] === 2) { // hit
            ctx.fillStyle = '#e04040';
            ctx.beginPath(); ctx.arc(px+CELL/2, py+CELL/2, CELL*0.25, 0, 7); ctx.fill();
          } else if (myHits[y][x] === 3) {
            ctx.fillStyle = '#58a6ff';
            ctx.beginPath(); ctx.arc(px+CELL/2, py+CELL/2, CELL*0.12, 0, 7); ctx.fill();
          }
        }
        // поле врага
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const px = CELL*N + 20 + x*CELL, py = 30 + y*CELL;
          if (enemyHits[y][x] === 2) {
            ctx.fillStyle = '#e04040';
            ctx.beginPath(); ctx.arc(px+CELL/2, py+CELL/2, CELL*0.25, 0, 7); ctx.fill();
          } else if (enemyHits[y][x] === 3) {
            ctx.fillStyle = '#8b949e';
            ctx.beginPath(); ctx.arc(px+CELL/2, py+CELL/2, CELL*0.12, 0, 7); ctx.fill();
          }
        }
      }

      function drawGrid(ox, oy, hits, isEnemy) {
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const px = ox + x*CELL, py = oy + y*CELL;
          ctx.strokeStyle = '#30363d';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, CELL, CELL);
        }
      }

      function shoot(x, y) {
        if (over) return;
        if (enemyHits[y][x] !== 0) { QA.sfx.bad(); return; }
        shots++;
        if (enemy[y][x] === 1) {
          enemyHits[y][x] = 2; hits++;
          QA.sfx.step();
          if (!alive(enemy, enemyHits)) {
            over = true;
            updateHud();
            draw();
            QA.sfx.win();
            host.onEnd(scoreFromBoard(), {});
            return;
          }
        } else {
          enemyHits[y][x] = 3;
          QA.sfx.move();
        }
        updateHud();
        setTimeout(enemyTurn, 350);
        draw();
      }

      function enemyTurn() {
        if (over) return;
        let target = null;
        // hunt: если есть очередь — стреляем рядом
        while (enemyQueue.length && !target) {
          const [qx, qy] = enemyQueue.shift();
          if (qx < 0 || qx >= N || qy < 0 || qy >= N) continue;
          if (myHits[qy][qx] !== 0) continue;
          target = [qx, qy];
        }
        // иначе случайно
        if (!target) {
          const free = [];
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (myHits[y][x] === 0) free.push([x, y]);
          if (!free.length) return;
          target = free[Math.floor(Math.random() * free.length)];
        }
        const [tx, ty] = target;
        if (my[ty][tx] === 1) {
          myHits[ty][tx] = 2;
          // в очередь — соседи
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) enemyQueue.push([tx+dx, ty+dy]);
          QA.sfx.bad();
          if (!alive(my, myHits)) {
            over = true;
            updateHud();
            draw();
            QA.sfx.lose();
            host.onEnd(scoreFromBoard(), {});
            return;
          }
        } else {
          myHits[ty][tx] = 3;
          QA.sfx.move();
        }
        updateHud();
        draw();
      }

      function scoreFromBoard() {
        return hits * 10 + (over && !alive(enemy, enemyHits) ? 100 : 0);
      }

      function reset() {
        my = blank(); enemy = blank();
        myHits = blank(); enemyHits = blank();
        enemyQueue = []; over = false; shots = 0; hits = 0;
        placeAll(my);
        placeAll(enemy);
        updateHud();
        draw();
      }

      function clickHandler(e) {
        if (over) return;
        const rect = cv.getBoundingClientRect();
        const cx = (e.clientX - rect.left) * (W / rect.width);
        const cy = (e.clientY - rect.top) * (H / rect.height);
        const gridX = CELL*N + 20;
        if (cx < gridX || cx >= gridX + CELL*N) return;
        if (cy < 30 || cy >= 30 + CELL*N) return;
        const x = Math.floor((cx - gridX) / CELL);
        const y = Math.floor((cy - 30) / CELL);
        if (x >= 0 && x < N && y >= 0 && y < N) shoot(x, y);
      }

      return {
        start() {
          reset();
          cv.addEventListener('pointerdown', clickHandler);
        },
        getScore: () => scoreFromBoard(),
        destroy() {
          cv.removeEventListener('pointerdown', clickHandler);
        },
        _debug: {
          shoot, reset, getScore: () => scoreFromBoard(),
          enemy: () => enemy.map(r => r.slice()),
          my: () => my.map(r => r.slice()),
          autoWin: () => {
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
              if (enemy[y][x] === 1) { enemyHits[y][x] = 2; hits++; }
            }
            over = true; updateHud(); draw(); host.onEnd(scoreFromBoard(), {});
          },
          // Честный путь поражения: все корабли подбиты, кроме последнего;
          // ставим последний в очередь ИИ → enemyTurn() попадает → alive(my,myHits)=false.
          forceLose: () => {
            let lastCell = null;
            for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
              if (my[y][x] === 1) {
                if (lastCell === null) { lastCell = [x, y]; }
                else { myHits[y][x] = 2; }
              }
            }
            if (!lastCell) return false;
            enemyQueue.length = 0;
            enemyQueue.push(lastCell);
            enemyTurn();
            return over;
          },
        },
      };
    }
  });
})();