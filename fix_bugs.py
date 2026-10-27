import io, os, shutil

SRC = os.path.join(os.path.dirname(__file__), "src")

def patch(name, old, new, label):
    p = os.path.join(SRC, name)
    s = io.open(p, encoding="utf-8").read()
    if old not in s:
        print("MISS", label); return False
    s2 = s.replace(old, new, 1)
    shutil.copy2(p, p + ".bak_fix")
    io.open(p, "w", encoding="utf-8").write(s2)
    print("OK", label, len(s2))
    return True

# 1) Checkers: белые dx только -1 → исправить на [-1,-1],[1,-1]
patch("game_checkers.js",
      "const dirs = white ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]];",
      "const dirs = white ? [[-1,-1],[1,-1]] : [[-1,1],[1,1]];",
      "checkers dirs")

# 2) Lines: path.length > 64 → > 200
patch("game_lines.js",
      "if (!path || path.length > 64) {",
      "if (!path || path.length > 200) {",
      "lines path length")