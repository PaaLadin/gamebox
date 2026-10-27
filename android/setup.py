import os, subprocess, io, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
NODE_DIR = os.path.join(ROOT, "runtime", "node", "node-v24.21.0-win-x64")
NODE = os.path.join(NODE_DIR, "node.exe")
NPM_CLI = os.path.join(NODE_DIR, "node_modules", "npm", "bin", "npm-cli.js")
LOG = os.path.join(HERE, "setup.log")
io.open(LOG, "w", encoding="utf-8").write("start\n")
env = os.environ.copy()
env["npm_config_cache"] = os.path.join(ROOT, "runtime", "npm_cache")
env["ANDROID_HOME"] = os.path.join(ROOT, "runtime", "android-sdk")
env["ANDROID_SDK_ROOT"] = os.path.join(ROOT, "runtime", "android-sdk")
env["JAVA_HOME"] = os.path.join(ROOT, "runtime", "jdk", "jdk-17.0.13+11")

def run(args, name):
    with io.open(LOG, "a", encoding="utf-8") as f: f.write("\n== " + name + " ==\n")
    r = subprocess.run(args, cwd=HERE, env=env, capture_output=True, text=True, timeout=1200)
    with io.open(LOG, "a", encoding="utf-8") as f:
        f.write("rc=" + str(r.returncode) + "\n")
        f.write(((r.stdout or "") + (r.stderr or ""))[-1500:] + "\n")
    return r.returncode

# npm install
rc = run([NODE, NPM_CLI, "install", "--no-audit", "--no-fund"], "npm_install")
if rc != 0: sys.exit(1)
# npx cap add android
CAP = os.path.join(HERE, "node_modules", "@capacitor", "cli", "bin", "capacitor")
if not os.path.exists(CAP):
    CAP = os.path.join(HERE, "node_modules", ".bin", "cap")
rc = run([NODE, CAP, "add", "android"], "cap_add_android")
if rc != 0: sys.exit(1)
# sync
run([NODE, CAP, "sync", "android"], "cap_sync")
with io.open(LOG, "a", encoding="utf-8") as f: f.write("\nDONE\n")