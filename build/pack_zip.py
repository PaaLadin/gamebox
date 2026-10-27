import os, zipfile, io
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "dist", "win-unpacked")
OUT = os.path.join(HERE, "dist", "GameBox_win10_portable.zip")
n = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(SRC):
        for f in files:
            p = os.path.join(root, f)
            rel = os.path.relpath(p, SRC)
            z.write(p, rel)
            n += 1
print("zip", os.path.getsize(OUT), "files", n)