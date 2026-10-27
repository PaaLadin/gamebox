(async function(){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { errs: [], games: [], audio: {} };
  try {
    out.vp = { w: window.innerWidth, h: window.innerHeight };
    out.menu_overflow_x = document.documentElement.scrollWidth > window.innerWidth + 1;
    QA.toggleMute(); QA.toggleMute();
    QA.sfx.win();
    await sleep(150);
    out.audio = { muted: QA.isMuted(), tone: typeof QA.tone === 'function', sfx: Object.keys(QA.sfx).length };
    for (const id of ['tetris','arkanoid','lines','chess','checkers','battleship','snake','2048']) {
      GB.startGame(id);
      await sleep(350);
      const cv = document.querySelector('#game-stage canvas');
      const rect = cv ? cv.getBoundingClientRect() : null;
      out.games.push({
        id, canvas: !!cv,
        rect_w: rect ? Math.round(rect.width) : 0,
        rect_h: rect ? Math.round(rect.height) : 0,
        fits_w: rect ? rect.right <= window.innerWidth + 1 : false,
        overflow_x: document.documentElement.scrollWidth > window.innerWidth + 1,
      });
      GB.goMenu(); await sleep(80);
    }
  } catch (e) { out.errs.push(e.message); }
  return out;
})()