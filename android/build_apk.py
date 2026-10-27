import os, subprocess, io, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ANDROID = os.path.join(HERE, "android")
LOG = os.path.join(HERE, "build_apk.log")
io.open(LOG, "w", encoding="utf-8").write("start\n")

env = os.environ.copy()
env["JAVA_HOME"] = os.path.join(ROOT, "runtime", "jdk", "jdk-17.0.13+11")
env["ANDROID_HOME"] = os.path.join(ROOT, "runtime", "android-sdk")
env["ANDROID_SDK_ROOT"] = os.path.join(ROOT, "runtime", "android-sdk")
env["PATH"] = os.path.join(env["JAVA_HOME"], "bin") + os.pathsep + env.get("PATH", "")

gradlew = os.path.join(ANDROID, "gradlew.bat")
with io.open(LOG, "a", encoding="utf-8") as f:
    f.write("gradlew=" + gradlew + "\n")
    f.write("JAVA_HOME=" + env["JAVA_HOME"] + "\n")

r = subprocess.run([gradlew, "assembleDebug", "--no-daemon"], cwd=ANDROID, env=env,
                   capture_output=True, text=True, timeout=1800)
with io.open(LOG, "a", encoding="utf-8") as f:
    f.write("rc=" + str(r.returncode) + "\n")
    f.write(((r.stdout or "") + (r.stderr or ""))[-3000:] + "\n")
    f.write("\nDONE\n")
print("rc", r.returncode)