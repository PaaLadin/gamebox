import io, os, shutil
SRC = os.path.join(os.path.dirname(__file__), "src")

# 1) shell.js: вызвать fitCanvas после создания и на resize
p = os.path.join(SRC, "shell.js")
s = io.open(p, encoding="utf-8").read()
old = """    current = { id, api, cleanup: api.destroy };
    try { api.start(); } catch (e) { console.error(e); }
    document.body.classList.remove('paused');"""
new = """    current = { id, api, cleanup: api.destroy };
    try { api.start(); } catch (e) { console.error(e); }
    // вписать canvas в viewport
    const cv = stage.querySelector('canvas');
    if (cv) QA.fitCanvas(cv);
    document.body.classList.remove('paused');"""
if old in s:
    s = s.replace(old, new, 1)
    shutil.copy2(p, p + ".bak_mobile")
    io.open(p, "w", encoding="utf-8").write(s)
    print("OK shell fitCanvas")
else:
    print("MISS shell")

# 2) style.css: max-width на canvas
p2 = os.path.join(SRC, "style.css")
s2 = io.open(p2, encoding="utf-8").read()
if "max-width: 100%" not in s2:
    s2 = s2.replace("#game-stage canvas {",
                    "#game-stage canvas {\n  max-width: 100%;\n  max-height: 100%;")
    shutil.copy2(p2, p2 + ".bak_mobile")
    io.open(p2, "w", encoding="utf-8").write(s2)
    print("OK css max-width")
else:
    print("skip css")