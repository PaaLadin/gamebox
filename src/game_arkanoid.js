// Arkanoid — платформа, мяч, кирпичи, 3 жизни.
(function () {
  const W = 480, H = 420;
  const BRICK_W = 48, BRICK_H = 18, BRICK_GAP = 2;
  const COLS = 8, ROWS = 5;
  const PADDLE_W = 80, PADDLE_H = 12, PADDLE_Y = H - 30;
  const BALL_R = 7;

  GB.register({
    id: 'arkanoid',
    name: 'Арканоид',
    icon: '◉',
    create(stage, host) {
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      stage.appendChild(cv);
      const ctx = cv.getContext('2d');

      let bricks = [];
      let paddleX = (W - PADDLE_W) / 2;
      let ball = { x: W/2, y: H/2, vx: 160, vy: -260 };
      let lives = 3;
      let score = 0;
      let raf = null;
      let lastTs = 0;
      let paused = false;
      let over = false;
      let win = false;

      const BRICK_COLORS = ['#e04040','#e08040','#e0e040','#40e040','#40a0e0'];

      function resetBricks() {
        bricks = [];
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            bricks.push({
              x: 20 + c * (BRICK_W + BRICK_GAP),
              y: 30 + r * (BRICK_H + BRICK_GAP),
              w: BRICK_W, h: BRICK_H,
              hp: 1 + (r < 2 ? 1 : 0),
              color: BRICK_COLORS[r],
              alive: true,
            });
          }
        }
      }

      function resetBall() {
        ball = { x: paddleX + PADDLE_W/2, y: PADDLE_Y - BALL_R - 2, vx: (Math.random() > 0.5 ? 1 : -1) * 160, vy: -260 };
      }

      function restart() {
        resetBricks();
        lives = 3; score = 0; over = false; win = false;
        paddleX = (W - PADDLE_W) / 2;
        resetBall();
        lastTs = 0;
        updateHud();
      }

      function updateHud() {
        host.onHud('Очки: <b>' + score + '</b> · Жизни: <b>' + lives + '</b>');
      }

      function tick(ts) {
        raf = requestAnimationFrame(tick);
        if (over) return;
        if (!lastTs) lastTs = ts;
        const dt = Math.min(40, ts - lastTs) / 1000; lastTs = ts;
        if (!paused) {
          physics(dt);
          draw();
        }
      }

      function physics(dt) {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        // стены
        if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); QA.sfx.step(); }
        if (ball.x > W - BALL_R) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); QA.sfx.step(); }
        if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); QA.sfx.step(); }
        if (ball.y > H + 30) {
          lives--; QA.sfx.bad();
          updateHud();
          if (lives <= 0) { over = true; QA.sfx.lose(); host.onEnd(score, {}); return; }
          resetBall();
          return;
        }
        // платформа
        if (ball.y + BALL_R >= PADDLE_Y && ball.y - BALL_R <= PADDLE_Y + PADDLE_H &&
            ball.x >= paddleX - BALL_R && ball.x <= paddleX + PADDLE_W + BALL_R && ball.vy > 0) {
          const hit = (ball.x - paddleX) / PADDLE_W - 0.5;
          ball.vx = hit * 400;
          ball.vy = -Math.abs(ball.vy);
          ball.y = PADDLE_Y - BALL_R;
          QA.sfx.good();
        }
        // кирпичи
        for (const b of bricks) {
          if (!b.alive) continue;
          if (ball.x + BALL_R < b.x || ball.x - BALL_R > b.x + b.w) continue;
          if (ball.y + BALL_R < b.y || ball.y - BALL_R > b.y + b.h) continue;
          b.hp--;
          if (b.hp <= 0) { b.alive = false; score += 10; QA.sfx.step(); }
          else { score += 5; QA.sfx.step(); }
          // отскок по ближайшей грани
          const overlapX = Math.min(ball.x + BALL_R - b.x, b.x + b.w - ball.x + BALL_R);
          const overlapY = Math.min(ball.y + BALL_R - b.y, b.y + b.h - ball.y + BALL_R);
          if (overlapX < overlapY) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;
          break;
        }
        updateHud();
        // win?
        if (bricks.every(b => !b.alive)) { over = true; win = true; QA.sfx.win(); host.onEnd(score, { win: true }); }
      }

      function draw() {
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, W, H);
        // bricks
        for (const b of bricks) {
          if (!b.alive) continue;
          ctx.fillStyle = b.color;
          ctx.globalAlpha = b.hp > 1 ? 1 : 0.65;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          ctx.globalAlpha = 1;
        }
        // paddle
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);
        ctx.fillStyle = 'rgba(255,255,255,.3)';
        ctx.fillRect(paddleX + 2, PADDLE_Y + 2, PADDLE_W - 4, 2);
        // ball
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, 7);
        ctx.fillStyle = '#58a6ff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(88,166,255,.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const keyHandler = (e) => {
        if (over) return;
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a' || k === 'ф') { paddleX = Math.max(0, paddleX - 32); e.preventDefault(); }
        else if (k === 'arrowright' || k === 'd' || k === 'в') { paddleX = Math.min(W - PADDLE_W, paddleX + 32); e.preventDefault(); }
      };

      const moveHandler = (e) => {
        if (over) return;
        const rect = cv.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (W / rect.width);
        paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W/2));
      };

      return {
        start() {
          restart();
          document.addEventListener('keydown', keyHandler);
          cv.addEventListener('pointermove', moveHandler);
          QA.onPause((p) => { paused = p; lastTs = 0; });
          raf = requestAnimationFrame(tick);
        },
        getScore: () => score,
        destroy() {
          if (raf) cancelAnimationFrame(raf);
          document.removeEventListener('keydown', keyHandler);
          cv.removeEventListener('pointermove', moveHandler);
        },
        _debug: { endGame: () => { over = true; host.onEnd(score, {}); }, getScore: () => score, restart, killAllBricks: () => { bricks.forEach(b => b.alive = false); physics(0); } },
      };
    }
  });
})();