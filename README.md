# GameBox — сборник из 8 игр

Один HTML-файл. 8 игр. Локальный лидерборд. Звук. CRT-интерфейс.
Win10 portable + Android APK + веб.

## Игры

| Игра | Механика |
|------|----------|
| **Тетрис** | 10×20, 7 фигур, wall-kick, уровни (ускорение) |
| **Арканоид** | платформа, мяч, 40 кирпичей (часть двухслойные), 3 жизни |
| **Линии** | 9×9, 5+ в линию (гориз./верт./диаг.), поиск пути BFS |
| **Шахматы** | полные правила (рокировка, en passant, превращение), ИИ minimax depth 2 |
| **Шашки** | русские правила, дамки, обязательное взятие, цепочки, ИИ depth 3 |
| **Морской бой** | 10×10, 10 кораблей, ИИ hunt/target |
| **Змейка** | 20×20, рост, ускорение |
| **2048** | 4×4, свайпы/стрелки |

## Фичи

- **Лидерборд** — локальный (localStorage), топ-10 на игру.
- **Звук** — WebAudio-синт без сэмплов: click/move/good/bad/win/lose/step.
- **CRT-интерфейс** — фон `#0a0a12`, фосфор `#2ecc71`, акцент `#58a6ff`, Consolas.
- **Пауза** (Space / кнопка), **mute** (M / кнопка).
- **Адаптив** — canvas вписывается в viewport (мобильный 375×667 проверен).
- **Debug API** — `window.GB`, `window.QA`, у каждой игры `api._debug`.

## Запуск

- **Win10:** распаковать `GameBox_win10_portable.zip`, двойной клик `GameBox.exe`.
- **Android:** установить `GameBox.apk` (разрешить установку из неизвестных источников).
- **Веб:** открыть `games.html` в браузере.

## Сборка

- **Веб:** `python build.py` → `games.html` (1 файл, ~88 КБ).
- **Win10:** `python build/build_win.py` (Electron 33, electron-builder).
- **Android:** `python android/setup.py` (Capacitor 6, JDK 17, Android SDK).

## Тесты

- Desktop smoke: 8/8 игр запускаются, 0 ошибок.
- Gameplay: 8/8 (победа/счёт в каждой).
- Mobile 375×667: 8/8 canvas вписан, overflow_x=false.
- Звук: WebAudio tone, 7 sfx.
- Артефакты: `test_smoke.js`, `test_final.js`, `test_mobile_audio.js`.

## Структура

    gamebox/
    ├── games.html          ← финальный 1-файл
    ├── build.py            ← склейка src → games.html
    ├── src/
    │   ├── index.template.html
    │   ├── style.css
    │   ├── qa.js           ← звук + лидерборд + пауза
    │   ├── shell.js        ← меню, роутинг, HUD, оверлей
    │   ├── game_tetris.js
    │   ├── game_arkanoid.js
    │   ├── game_lines.js
    │   ├── game_chess.js
    │   ├── game_checkers.js
    │   ├── game_battleship.js
    │   ├── game_snake.js
    │   └── game_2048.js
    ├── build/              ← Electron (Win10)
    ├── android/            ← Capacitor (APK)
    └── test_*.js           ← тесты (CDP)

## Лицензия

MIT.