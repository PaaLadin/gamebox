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
    } catch (e) { out.errs.push(id + ': ' + e.message); }
  };

  // Lines: 4 в ряд + двинуть белый
  await tryGame('lines', async (api) => {
    const b = Array.from({length:9}, () => Array(9).fill(-1));
    b[0][0]=0; b[0][1]=0; b[0][2]=0; b[0][3]=0;
    b[8][8]=1;
    api._debug.setBoard(b);
    api._debug.click(8, 8);
    api._debug.click(0, 4);
    await sleep(250);
    const sc = api.getScore();
    const nb = api._debug.board();
    return { score: sc, cleared: sc > 0, b0_4: nb[0][4] };
  });

  // Chess: back-rank mate (Ra1-a8#)
  await tryGame('chess', async (api) => {
    const b = [
      ['.','.','.','.','k','.','.','.'],
      ['.','.','.','.','.','p','p','p'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.'],
      ['R','.','.','.','K','.','.','.'],
    ];
    api._debug.setBoard(b);
    const moves0 = api._debug.moves();
    const ok = api._debug.makeMove([0,7],[0,0]); // a1 -> a8
    await sleep(600);
    const ov = document.getElementById('overlay');
    return { moves0, played: ok, ov: ov.classList.contains('on'), score: api.getScore() };
  });

  // Checkers: белые двигаются вверх (dy=-1)
  await tryGame('checkers', async (api) => {
    const m0 = api._debug.moves();
    const c0 = api._debug.captures();
    // белая пешка на a3 (0,5) может пойти на b4 (1,4)
    const ok = api._debug.apply([0,5],[1,4]);
    await sleep(400);
    const nb = api._debug.board();
    return { moves0: m0, captures0: c0, played: ok, a3: nb[5][0], b4: nb[4][1] };
  });

  // Leaderboard
  out.lb_count = QA.getBoard('lines').length;
  out.lb_chess = QA.getBoard('chess').length;
  return out;
})()