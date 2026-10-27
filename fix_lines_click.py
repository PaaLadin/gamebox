import io, os, shutil
p = os.path.join(os.path.dirname(__file__), "src", "game_lines.js")
s = io.open(p, encoding="utf-8").read()
old = """      function click(gx, gy) {
        if (over) return;
        const c = board[gy][gx];
        if (c < 0) return;
        if (!selected) {
          selected = [gx, gy];
          QA.sfx.click();
          draw();
          return;
        }"""
new = """      function click(gx, gy) {
        if (over) return;
        const c = board[gy][gx];
        // пустая клетка допустима как ЦЕЛЬ (если что-то выбрано)
        if (c < 0 && !selected) return;
        if (!selected) {
          selected = [gx, gy];
          QA.sfx.click();
          draw();
          return;
        }"""
if old not in s:
    print("MISS pattern")
else:
    s2 = s.replace(old, new, 1)
    shutil.copy2(p, p + ".bak_click")
    io.open(p, "w", encoding="utf-8").write(s2)
    print("OK patched", len(s2))