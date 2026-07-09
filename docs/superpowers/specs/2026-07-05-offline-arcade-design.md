# Offline Arcade Design

## Goal

Build a self-contained offline retro arcade page that opens directly in a browser and includes Snake, Tetris, Pong, Breakout, and a pixel dodger game.

## Architecture

The app uses a single browser page, `index.html`, backed by `arcade.js`. The page owns layout, controls, and the canvas surface. `arcade.js` exposes a small set of game factories and pure logic helpers that can run in both the browser and Node tests.

## Experience

The first screen is the actual arcade, not a landing page. A compact game rail lets the player switch games. The center canvas renders pixel-style games. A status strip shows score, level, and control hints. Start, pause, and reset controls are always visible.

## Games

Snake supports grid movement, food pickup, self collision, and wall collision.
Tetris supports piece movement, rotation, locking, line clears, score, and game over.
Pong supports player paddle movement, a simple CPU paddle, scoring, and ball reset.
Breakout supports paddle movement, brick collision, score, and board reset.
Pixel Dodger supports player movement, falling hazards, score gain over time, and collision game over.

## Constraints

- No network access or external dependencies.
- Must work from local files.
- Must include keyboard controls and touch buttons.
- Keep visuals retro, readable, and responsive.
- Keep core game logic testable without a browser.

## Verification

Run the no-dependency Node test file for core logic. Also perform a static sanity check that the HTML references the script and expected UI hooks.
