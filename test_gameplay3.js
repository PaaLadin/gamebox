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

  // Lines: 4 нуля + 0-шар на (0,5) → двинуть на (0,4)
  await tryGame('lines', async (api) => {
    const b = Array.from({length:9}, () => Array(9).fill(-1));
    b[0][0]=0; b[0][1]=0; b[0][2]=0; b[0][3]=0;
    b[0][5]=0;
    api._debug.setBoard(b);
    api._debug.click(0, 5);
    api._debug.click(0, 4);
    await sleep(300);
    const sc = api.getScore();
    const nb = api._debug.board();
    return { score: sc, cleared: sc > 0, b0_4: nb[0][4], b0_5: nb[0][5] };
  });

  // Chess: Qg7# — мат в 1
  await tryGame('chess', async (api) => {
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
    const ok = api._debug.makeMove([6,2],[6,1]); // Qg6 -> Qg7
    await sleep(700);
    const ov = document.getElementById('overlay');
    return { played: ok, ov: ov.classList.contains('on'), score: api.getScore() };
  });

  out.lb = {
    lines: QA.getBoard('lines').length,
    chess: QA.getBoard('chess').length,
    tetris: QA.getBoard('tetris').length,
    ark: QA.getBoard('arkanoid').length,
    bat: QA.getBoard('battleship').length,
    snake: QA.getBoard('snake').length,
    g2048: QA.getBoard('2048').length,
  };
  return out;
})()