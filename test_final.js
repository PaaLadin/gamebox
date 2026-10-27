(async function(){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { errs: [], results: [] };
  const run = async (id, fn) => {
    try {
      GB.startGame(id); await sleep(250);
      const api = GB.getState().api;
      const r = await fn(api);
      out.results.push({ id, pass: !!(r && r.pass), ...r });
      GB.goMenu(); await sleep(80);
    } catch (e) { out.errs.push(id + ': ' + e.message); }
  };

  // 1) Tetris
  await run('tetris', async (api) => {
    api._debug.endGame(); await sleep(150);
    return { pass: document.getElementById('overlay').classList.contains('on') };
  });

  // 2) Arkanoid
  await run('arkanoid', async (api) => {
    api._debug.killAllBricks(); await sleep(300);
    return { pass: document.getElementById('overlay').classList.contains('on') };
  });

  // 3) Lines (правильные координаты: click(gx,gy), board[gy][gx])
  await run('lines', async (api) => {
    const b = Array.from({length:9}, () => Array(9).fill(-1));
    b[0][0]=0; b[0][1]=0; b[0][2]=0; b[0][3]=0; b[0][5]=0;
    api._debug.setBoard(b);
    api._debug.click(5,0);   // select шар на (x=5,y=0)
    api._debug.click(4,0);   // move на (x=4,y=0)
    await sleep(200);
    return { pass: api.getScore() > 0, score: api.getScore() };
  });

  // 4) Chess: мат в 1 (Qg7#)
  await run('chess', async (api) => {
    const b = [
      ['.','.','.','.','.','.','.','k'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','K','Q','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
    ];
    api._debug.setBoard(b);
    const ok = api._debug.makeMove([6,2],[6,1]);
    await sleep(600);
    return { pass: ok && document.getElementById('overlay').classList.contains('on'), played: ok };
  });

  // 5) Checkers
  await run('checkers', async (api) => {
    const m0 = api._debug.moves();
    const ok = api._debug.apply([0,5],[1,4]);
    await sleep(400);
    const nb = api._debug.board();
    return { pass: ok && nb[4][1] === 'w' && nb[5][0] === '.', moves0: m0 };
  });

  // 6) Battleship
  await run('battleship', async (api) => {
    api._debug.autoWin(); await sleep(150);
    return { pass: document.getElementById('overlay').classList.contains('on') };
  });

  // 7) Snake
  await run('snake', async (api) => {
    api._debug.endGame(); await sleep(150);
    return { pass: document.getElementById('overlay').classList.contains('on') };
  });

  // 8) 2048
  await run('2048', async (api) => {
    api._debug.setGrid([[2,2,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);
    api._debug.move('L'); await sleep(150);
    const g = api._debug.grid();
    return { pass: g[0][0] === 4 && api.getScore() === 4, score: api.getScore() };
  });

  // Лидерборд
  out.lb = {};
  for (const id of ['tetris','arkanoid','lines','chess','checkers','battleship','snake','2048']) {
    out.lb[id] = QA.getBoard(id).length;
  }
  out.pass_count = out.results.filter(r => r.pass).length;
  return out;
})()