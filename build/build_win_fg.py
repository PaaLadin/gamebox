import os, shutil, subprocess, io, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
NODE_DIR = os.path.join(ROOT, "runtime", "node", "node-v24.21.0-win-x64")
NODE = os.path.join(NODE_DIR, "node.exe")
ELECTRON_BUILDER = os.path.join(HERE, "node_modules", "electron-builder", "cli.js")
LOG = os.path.join(HERE, "build_win.log")

def log(msg):
    with io.open(LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

io.open(LOG, "w", encoding="utf-8").write("start\n")
log("here=" + HERE)
log("root=" + ROOT)

# app/
app_dir = os.path.join(HERE, "app")
if os.path.isdir(app_dir): shutil.rmtree(app_dir)
os.makedirs(app_dir)
shutil.copy2(os.path.join(HERE, "..", "games.html"), os.path.join(app_dir, "games.html"))
log("app/games.html " + str(os.path.getsize(os.path.join(app_dir, "games.html"))))

# node_modules junction
nm = os.path.join(HERE, "node_modules")
if not os.path.isdir(nm):
    src = os.path.join(ROOT, "projects", "hexxagon_music_v6", "build", "node_modules")
    if os.path.isdir(src):
        r = subprocess.run(["cmd", "/c", "mklink", "/J", nm, src], capture_output=True, text=True)
        log("mklink rc=" + str(r.returncode) + " " + ((r.stdout or "") + (r.stderr or ""))[:200])
    else:
        log("NO node_modules"); sys.exit(1)

env = os.environ.copy()
env["ELECTRON_BUILDER_CACHE"] = os.path.join(ROOT, "runtime", "eb_cache")
env["npm_config_cache"] = os.path.join(ROOT, "runtime", "npm_cache")
log("start electron-builder")
r = subprocess.run([NODE, ELECTRON_BUILDER, "--win", "dir", "--x64"], cwd=HERE, env=env,
                   capture_output=True, text=True, timeout=1200)
log("rc=" + str(r.returncode))
log(((r.stdout or "") + (r.stderr or ""))[-2000:])
log("done")