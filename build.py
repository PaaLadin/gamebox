import io, os, sys
SRC = os.path.join(os.path.dirname(__file__), "src")
OUT = os.path.join(os.path.dirname(__file__), "games.html")

def read(name):
    with io.open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()

tpl   = read("index.template.html")
style = read("style.css")
qa    = read("qa.js")
shell = read("shell.js")
games = "\n".join(read(f) for f in (
    "game_tetris.js", "game_arkanoid.js", "game_lines.js",
    "game_chess.js", "game_checkers.js", "game_battleship.js",
    "game_snake.js", "game_2048.js",
))

out = tpl.replace("/*__STYLE__*/", style)\
         .replace("/*__QA__*/", qa)\
         .replace("/*__SHELL__*/", shell)\
         .replace("/*__GAMES__*/", games)

with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(out)
print("built", OUT, os.path.getsize(OUT), "bytes", len(out), "chars")