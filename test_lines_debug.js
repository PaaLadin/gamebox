(async function(){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { errs: [], steps: [] };
  try {
    GB.startGame('lines');
    await sleep(300);
    const api = GB.getState().api;
    const b = Array.from({length:9}, () => Array(9).fill(-1));
    b[0][0]=0; b[0][1]=0; b[0][2]=0; b[0][3]=0;
    b[0][5]=0;
    api._debug.setBoard(b);
    out.before = api._debug.board().slice(0, 2);

    // первый клик: select (0,5)
    api._debug.click(0, 5);
    await sleep(50);
    out.after_select = { b0_5: api._debug.board()[0][5], score: api.getScore() };

    // второй клик: move to (0,4)
    api._debug.click(0, 4);
    await sleep(200);
    out.after_move = { b0_4: api._debug.board()[0][4], b0_5: api._debug.board()[0][5], score: api.getScore() };

    // а если переместить 0,5 на 1,5 (свободно)?
    api._debug.click(1, 5);
    await sleep(50);
    api._debug.click(2, 5);
    await sleep(200);
    out.after_move2 = { b2_5: api._debug.board()[2][5] };
  } catch (e) { out.errs.push(e.message); }
  return out;
})()