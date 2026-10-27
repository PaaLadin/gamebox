(async function(){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { errs: [], results: [] };
  const tryGame = async (id, fn) => {
    try {
      GB.startGame(id);
      await sleep(300);
      const api = GB.getState().api;
      const r = await fn(api);
      out.results.push({ id, ...r });
      GB.goMenu();
      await sleep(80);
    } catch (e) {
      out.errs.push(id + ': ' + e.message);
    }
  };

  // Tetris: endGame через _debug
  await tryGame('tetris', async (api) => {
    api._debug.restart();
    api._debug.endGame();
    await sleep(200);
    const ov = document.getElementById('overlay');
    return { win: ov.classList.contains('on'), score: api.getScore() };
  });

  // Arkanoid: killAllBricks
  await tryGame('arkanoid', async (api) => {
    api._debug.killAllBricks();
    await sleep(300);
    const ov = document.getElementById('overlay');
    return { win: ov.classList.contains('on'), score: api.getScore() };
  });

  // Lines: собрать 5 в линию
  await tryGame('lines', async (api) => {
    const b = Array.from({length:9}, () => Array(9).fill(-1));
    // 5 красных в ряд + белый шарик, чтобы двинуть
    for (let x = 0; x < 5; x++) b[0][x] = 0;
    b[8][8] = 1;
    api._debug.setBoard(b);
    // двинуть 0-й из (8,8) на (5,0)
    api._debug.click(8, 8);
    api._debug.click(5, 0);
    await sleep(200);
    const sc = api.getScore();
    return { score_after_line: sc, cleared: sc > 0 };
  });

  // Chess: мат в 1 (back rank)
  await tryGame('chess', async (api) => {
    // белые: король e1, ферзь h1, чёрные: король e8, пешки f7 g7 h7
    const b = [
      ['.','.','.','.','k','.','.','.'],
      ['.','.','.','.','.','p','p','p'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','K','.','.','Q'],
    ];
    api._debug.setBoard(b);
    const moves0 = api._debug.moves();
    // Qh1-h8# — но ферзь на h1, король e8, пешки f7g7h7 — h8 доступен
    const ok = api._debug.makeMove([7,7],[7,0]); // h1 -> h8
    await sleep(500);
    return { moves0, played: ok, check: api._debug.check(), score: api.getScore() };
  });

  // Checkers: стартовые ходы
  await tryGame('checkers', async (api) => {
    const m0 = api._debug.moves();
    const c0 = api._debug.captures();
    // ход пешкой a3-b4 (или c3-b4)
    const ok = api._debug.apply([0,5],[1,4]);
    await sleep(400);
    return { moves0: m0, captures0: c0, played: ok };
  });

  // Battleship: autoWin
  await tryGame('battleship', async (api) => {
    api._debug.autoWin();
    await sleep(200);
    const ov = document.getElementById('overlay');
    return { win: ov.classList.contains('on'), score: api.getScore() };
  });

  // Snake: endGame
  await tryGame('snake', async (api) => {
    api._debug.endGame();
    await sleep(200);
    const ov = document.getElementById('overlay');
    return { win: ov.classList.contains('on') };
  });

  // 2048: слить 2+2
  await tryGame('2048', async (api) => {
    const g = [[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    api._debug.setGrid(g);
    api._debug.move('L');
    await sleep(200);
    const grid = api._debug.grid();
    return { score: api.getScore(), top_left: grid[0][0], merged: grid[0][0] === 4 };
  });

  // Leaderboard
  out.lb = QA.getBoard('tetris').slice(0, 3);
  out.lb_count = QA.getBoard('tetris').length;
  return out;
})()