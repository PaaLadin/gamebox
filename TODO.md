# GameBox — сборник игр (11D, 2026-10-27)

**Задача оператора:** 1 файл — сборник игр (Тетрис, Арканоид, Лайнс,
Шахматы, Шашки, Морской бой + бонусы), лидерборд, звук, интерфейс.
Win10 + APK, git.

## Архитектура

- `src/` — модули (по файлу на игру + shell + qa).
- `build.py` — склеивает всё в `games.html` (1 файл, самодостаточный).
- `dist/` — Win10 portable (Electron), APK (Capacitor).
- `git` — https://github.com/PaaLadin/gamebox (создать).

## Игры

- [ ] Tetris — классика, 10×20.
- [ ] Arkanoid — платформа, мяч, кирпичи.
- [ ] Lines — 9×9, 5+ в линию.
- [ ] Chess — полные правила, простой ИИ (minimax depth 2).
- [ ] Checkers — русские шашки, дамки, обязательное взятие.
- [ ] Battleship — 10×10, ИИ.
- [ ] Snake — бонус.
- [ ] 2048 — бонус.

## Shell

- [ ] Меню-сетка 8 игр.
- [ ] Лидерборд на игру (localStorage).
- [ ] Звук WebAudio (click/win/lose/step).
- [ ] CRT-палитра (#0a0a12 / #2ecc71 / #58a6ff).
- [ ] Пауза, mute, в меню.

## Пакеты

- [ ] Electron (Win10 portable zip).
- [ ] Capacitor APK.
- [ ] Git push.

## Тесты

- [ ] Каждая игра: start → ход → win/over через debug API.
- [ ] Лидерборд: score сохраняется и читается.
- [ ] Звук: AudioContext running, RMS > 0.
- [ ] Мобильный viewport 375×667: canvas вписан.