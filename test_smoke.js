(async function(){
  const out = { errs: [], games: [] };
  try {
    await new Promise(r => setTimeout(r, 600));
    out.QA = typeof window.QA;
    out.GB = typeof window.GB;
    out.list = (window.GB && GB.list()) ? GB.list().map(g => ({id:g.id, name:g.name})) : 'no';
    out.tiles = document.querySelectorAll('.tile').length;
    const ids = ['tetris','arkanoid','lines','chess','checkers','battleship','snake','2048'];
    for (const id of ids) {
      try {
        GB.startGame(id);
        await new Promise(r => setTimeout(r, 400));
        const cv = document.querySelector('#game-stage canvas');
        const st = GB.getState();
        out.games.push({
          id,
          canvas: !!cv,
          cv_w: cv ? cv.width : 0,
          api: st ? Object.keys(st.api || {}) : null,
          dbg: st && st.api && st.api._debug ? Object.keys(st.api._debug) : null,
        });
        GB.goMenu();
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        out.errs.push(id + ': ' + e.message);
      }
    }
  } catch (e) {
    out.errs.push('outer: ' + e.message);
  }
  return out;
})()