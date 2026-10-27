(async function(){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { errs: [] };
  try {
    GB.startGame('lines');
    await sleep(300);
    const api = GB.getState().api;
    const b = Array.from({length:9}, () => Array(9).fill(-1));
    // шар на (x=5, y=0), четыре нуля на (0..3, 0)
    b[0][0]=0; b[0][1]=0; b[0][2]=0; b[0][3]=0;
    b[0][5]=0;
    api._debug.setBoard(b);
    // select: click(gx=5, gy=0) → board[0][5]
    api._debug.click(5, 0);
    await sleep(50);
    // move: click(gx=4, gy=0) → board[0][4]
    api._debug.click(4, 0);
    await sleep(300);
    const nb = api._debug.board();
    out.b0_4 = nb[0][4];
    out.b0_5 = nb[0][5];
    out.score = api.getScore();
    out.cleared = nb[0][0] === -1 && nb[0][1] === -1 && nb[0][2] === -1 && nb[0][3] === -1 && nb[0][4] === -1;
  } catch (e) { out.errs.push(e.message); }
  return out;
})()