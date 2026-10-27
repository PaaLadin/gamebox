import os, shutil, subprocess, io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
NODE_DIR = os.path.join(ROOT, "runtime", "node", "node-v24.21.0-win-x64")
NODE = os.path.join(NODE_DIR, "node.exe")
NPM_CLI = os.path.join(NODE_DIR, "node_modules", "npm", "bin", "npm-cli.js")
ELECTRON_BUILDER = os.path.join(HERE, "node_modules", "electron-builder", "cli.js")

# 1) app/
app_dir = os.path.join(HERE, "app")
if os.path.isdir(app_dir): shutil.rmtree(app_dir)
os.makedirs(app_dir)
shutil.copy2(os.path.join(HERE, "..", "games.html"), os.path.join(app_dir, "games.html"))
print("app/games.html", os.path.getsize(os.path.join(app_dir, "games.html")))

# 2) node_modules — симлинк на hexxagon (быстро, без сети)
nm = os.path.join(HERE, "node_modules")
if not os.path.isdir(nm):
    src = os.path.join(ROOT, "projects", "hexxagon_music_v6", "build", "node_modules")
    if os.path.isdir(src):
        subprocess.run(["cmd", "/c", "mklink", "/J", nm, src], check=True, capture_output=True)
        print("junction node_modules ->", src)
    else:
        print("NO node_modules, run npm install manually")
        raise SystemExit(1)

# 3) electron-builder --win dir
env = os.environ.copy()
env["ELECTRON_BUILDER_CACHE"] = os.path.join(ROOT, "runtime", "eb_cache")
env["npm_config_cache"] = os.path.join(ROOT, "runtime", "npm_cache")
r = subprocess.run([NODE, ELECTRON_BUILDER, "--win", "dir", "--x64"], cwd=HERE, env=env,
                   capture_output=True, text=True, timeout=600)
print("rc", r.returncode)
tail = ((r.stdout or "") + (r.stderr or ""))[-800:]
print(tail)