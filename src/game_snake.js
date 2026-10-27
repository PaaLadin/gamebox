// Snake — классика, 20×20, еда, рост, ускорение.
(function () {
  const N = 20, CELL = 24;
  const W = N * CELL, H = N * CELL;

  GB.register({
    id: 'snake',
    name: 'Змейка',
    icon: '≈',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let snake = [];
      let dir = [1, 0];
      let nextDir = [1, 0];
      let food = [10, 10];
      let score = 0;
      let over = false;
      let raf = null;
      let acc = 0, lastTs = 0;
      let stepInterval = 130;
      let paused = false;

      function reset() {
        snake = [[10, 10], [9, 10], [8, 10]];
        dir = [1, 0]; nextDir = [1, 0];
        score = 0; over = false; stepInterval = 130;
        placeFood();
        updateHud();
        draw();
      }

      function placeFood() {
        for (let t = 0; t < 500; t++) {
          const x = Math.floor(Math.random() * N), y = Math.floor(Math.random() * N);
          if (!snake.some(([sx, sy]) => sx === x && sy === y)) { food = [x, y]; return; }
        }
      }

      function step() {
        dir = nextDir;
        const [hx, hy] = snake[0];
        const nx = hx + dir[0], ny = hy + dir[1];
        if (nx < 0 || nx >= N || ny < 0 || ny >= N) return endGame();
        if (snake.some(([sx, sy]) => sx === nx && sy === ny)) return endGame();
        snake.unshift([nx, ny]);
        if (nx === food[0] && ny === food[1]) {
          score += 10;
          QA.sfx.good();
          placeFood();
          if (stepInterval > 60) stepInterval -= 3;
          updateHud();
        } else {
          snake.pop();
        }
      }

      function endGame() {
        over = true;
        QA.sfx.lose();
        host.onEnd(score, { length: snake.length });
      }

      function updateHud() {
        host.onHud('Очки: <b>' + score + '</b> · Длина: <b>' + snake.length + '</b>');
      }

      function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, W, H);
        // сетка
        ctx.strokeStyle = 'rgba(48,54,61,.25)';
        for (let i = 1; i < N; i++) {
          ctx.beginPath(); ctx.moveTo(i*CELL, 0); ctx.lineTo(i*CELL, H); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i*CELL); ctx.lineTo(W, i*CELL); ctx.stroke();
        }
        // еда
        ctx.fillStyle = '#e04040';
        ctx.beginPath();
        ctx.arc(food[0]*CELL + CELL/2, food[1]*CELL + CELL/2, CELL*0.35, 0, 7);
        ctx.fill();
        // змейка
        for (let i = 0; i < snake.length; i++) {
          const [x, y] = snake[i];
          ctx.fillStyle = i === 0 ? '#2ecc71' : '#1a8a4a';
          ctx.fillRect(x*CELL + 1, y*CELL + 1, CELL - 2, CELL - 2);
          if (i === 0) {
            ctx.fillStyle = 'rgba(255,255,255,.4)';
            ctx.fillRect(x*CELL + 4, y*CELL + 4, 4, 4);
          }
        }
      }

      function tick(ts) {
        raf = requestAnimationFrame(tick);
        if (over) return;
        if (!lastTs) lastTs = ts;
        const dt = ts - lastTs; lastTs = ts;
        if (paused) return;
        acc += dt;
        while (acc >= stepInterval) {
          acc -= stepInterval;
          step();
          if (over) return;
        }
        draw();
      }

      const keyHandler = (e) => {
        if (over) return;
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a' || k === 'ф') { if (dir[0] !== 1) nextDir = [-1, 0]; }
        else if (k === 'arrowright' || k === 'd' || k === 'в') { if (dir[0] !== -1) nextDir = [1, 0]; }
        else if (k === 'arrowup' || k === 'w' || k === 'ц') { if (dir[1] !== 1) nextDir = [0, -1]; }
        else if (k === 'arrowdown' || k === 's' || k === 'ы') { if (dir[1] !== -1) nextDir = [0, 1]; }
        else return;
        e.preventDefault();
      };

      return {
        start() {
          reset();
          document.addEventListener('keydown', keyHandler);
          QA.onPause((p) => { paused = p; lastTs = 0; });
          raf = requestAnimationFrame(tick);
        },
        getScore: () => score,
        destroy() {
          if (raf) cancelAnimationFrame(raf);
          document.removeEventListener('keydown', keyHandler);
        },
        _debug: { getScore: () => score, state: () => ({ snake: snake.map(x=>x.slice()), food: food.slice(), dir: dir.slice() }), endGame: () => endGame(), setDir: (d) => { nextDir = d; } },
      };
    }
  });
})();