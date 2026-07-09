# Task 3 Review Package After Fixes

No Git repository is available in this workspace, so this package contains full contents of files touched by Task 3 and its fixes.

## src\leaderboard\ui.js
```text
// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizePanelState(state) {
    state = state || {};

    return {
      mode: state.mode ? String(state.mode) : "offline",
      nickname: state.nickname ? String(state.nickname) : "",
      message: state.message ? String(state.message) : "\u79bb\u7ebf\u6e38\u73a9\u4e2d",
      bestScore: Number.isFinite(Number(state.bestScore)) ? Math.max(0, Math.floor(Number(state.bestScore))) : 0,
      leaderboard: Array.isArray(state.leaderboard) ? state.leaderboard.slice() : [],
      loading: Boolean(state.loading)
    };
  }

  function renderRows(rows) {
    if (!rows.length) {
      return '<li class="leaderboard-empty">\u6682\u65e0\u6210\u7ee9</li>';
    }

    return rows.map(function (row, index) {
      var rank = Number.isFinite(Number(row && row.rank)) ? Math.max(1, Math.floor(Number(row.rank))) : index + 1;
      var nickname = escapeHtml(row && row.nickname);
      var score = Number.isFinite(Number(row && row.score)) ? Math.max(0, Math.floor(Number(row.score))) : 0;

      return [
        '<li>',
        '<span>#' + rank + '</span>',
        '<strong>' + nickname + '</strong>',
        '<em>' + score + '</em>',
        '</li>'
      ].join('');
    }).join('');
  }

  function renderLeaderboardPanelHtml(state) {
    var safe = normalizePanelState(state);
    var statusText = safe.loading ? '\u52a0\u8f7d\u4e2d' : safe.message;
    var body = safe.mode === 'ready'
      ? [
          '<div class="player-line">',
          '<strong>' + escapeHtml(safe.nickname || '\u73a9\u5bb6') + '</strong>',
          '<button type="button" data-leaderboard-action="logout">\u9000\u51fa</button>',
          '</div>'
        ].join('')
      : [
          '<div class="login-grid">',
          '<label>\u6635\u79f0<input data-leaderboard-field="nickname" maxlength="20" autocomplete="nickname"></label>',
          '<label>\u53e3\u4ee4<input data-leaderboard-field="passphrase" maxlength="40" type="password" autocomplete="current-password"></label>',
          '<button type="button" data-leaderboard-action="login">\u767b\u5f55\u53c2\u52a0\u6392\u884c</button>',
          '</div>'
        ].join('');

    return [
      '<section class="leaderboard-card" aria-label="\u73a9\u5bb6\u6392\u884c">',
      '<h3>\u73a9\u5bb6\u6392\u884c</h3>',
      '<p class="leaderboard-message">' + escapeHtml(statusText) + '</p>',
      body,
      '<div class="best-score">\u4e2a\u4eba\u6700\u597d <strong>' + safe.bestScore + '</strong></div>',
      '<ol class="leaderboard-list">',
      renderRows(safe.leaderboard),
      '</ol>',
      '<button type="button" data-leaderboard-action="refresh">\u5237\u65b0\u6392\u884c</button>',
      '</section>'
    ].join('');
  }

  function createLeaderboardPanel(options) {
    options = options || {};

    var container = null;
    var currentState = normalizePanelState({});

    function getFieldValue(selector) {
      if (!container) {
        return "";
      }
      var el = container.querySelector(selector);
      return el ? String(el.value || "") : "";
    }

    function bindEvents() {
      if (!container) {
        return;
      }

      var login = container.querySelector('[data-leaderboard-action="login"]');
      var logout = container.querySelector('[data-leaderboard-action="logout"]');
      var refresh = container.querySelector('[data-leaderboard-action="refresh"]');

      if (login) {
        login.addEventListener("click", function () {
          if (typeof options.onLogin === "function") {
            options.onLogin(
              getFieldValue('[data-leaderboard-field="nickname"]'),
              getFieldValue('[data-leaderboard-field="passphrase"]')
            );
          }
        });
      }

      if (logout) {
        logout.addEventListener("click", function () {
          if (typeof options.onLogout === "function") {
            options.onLogout();
          }
        });
      }

      if (refresh) {
        refresh.addEventListener("click", function () {
          if (typeof options.onRefresh === "function") {
            options.onRefresh();
          }
        });
      }
    }

    function render() {
      if (!container) {
        return;
      }
      container.innerHTML = renderLeaderboardPanelHtml(currentState);
      bindEvents();
    }

    return {
      mount: function (target) {
        container = target || null;
        render();
      },
      setState: function (state) {
        currentState = normalizePanelState(Object.assign({}, currentState, state || {}));
        render();
      },
      getState: function () {
        return normalizePanelState(currentState);
      }
    };
  }

  // ## EXPORT ##

  var api = {
    renderLeaderboardPanelHtml: renderLeaderboardPanelHtml,
    createLeaderboardPanel: createLeaderboardPanel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
```

## index.html
```text
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>离线街机合集</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #070b14;
        --panel: #101827;
        --panel-2: #162238;
        --line: #28415f;
        --text: #f8fbff;
        --muted: #9db0c9;
        --cyan: #70e3ff;
        --green: #74f08a;
        --pink: #ff5fa2;
        --yellow: #ffd166;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Courier New", Consolas, monospace;
        background:
          linear-gradient(rgba(112, 227, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(112, 227, 255, 0.04) 1px, transparent 1px),
          radial-gradient(circle at top left, rgba(255, 95, 162, 0.16), transparent 32rem),
          var(--bg);
        background-size: 24px 24px, 24px 24px, auto, auto;
        color: var(--text);
      }

      .app {
        width: min(1180px, calc(100% - 24px));
        min-height: 100vh;
        margin: 0 auto;
        padding: 18px 0;
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
        gap: 16px;
        align-items: stretch;
      }

      .sidebar,
      .playfield,
      .controls {
        border: 2px solid var(--line);
        background: rgba(16, 24, 39, 0.92);
        box-shadow: 0 0 0 4px rgba(112, 227, 255, 0.04), 0 18px 50px rgba(0, 0, 0, 0.3);
      }

      .sidebar {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .brand {
        border-bottom: 2px solid var(--line);
        padding-bottom: 14px;
      }

      h1 {
        margin: 0;
        font-size: 30px;
        line-height: 1;
        color: var(--cyan);
        text-shadow: 3px 3px 0 rgba(255, 95, 162, 0.35);
      }

      .subtitle {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 13px;
      }

      .game-list {
        display: grid;
        gap: 8px;
      }

      .leaderboard-panel {
        border-top: 2px solid var(--line);
        padding-top: 12px;
      }

      .leaderboard-card {
        display: grid;
        gap: 8px;
      }

      .leaderboard-card h3 {
        margin: 0;
        color: var(--yellow);
        font-size: 16px;
      }

      .leaderboard-message,
      .best-score,
      .leaderboard-empty {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
      }

      .login-grid {
        display: grid;
        gap: 6px;
      }

      .login-grid input {
        min-height: 36px;
        border: 2px solid var(--line);
        background: #09111f;
        color: var(--text);
        padding: 0 8px;
        font: inherit;
      }

      .player-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .leaderboard-list {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .leaderboard-list li {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
      }

      .leaderboard-list strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
      }

      button {
        font: inherit;
        color: var(--text);
        background: var(--panel-2);
        border: 2px solid var(--line);
        min-height: 44px;
        cursor: pointer;
      }

      button:hover,
      button.active {
        border-color: var(--cyan);
        color: var(--cyan);
        box-shadow: inset 0 0 0 2px rgba(112, 227, 255, 0.14);
      }

      .game-list button {
        width: 100%;
        padding: 10px;
        text-align: left;
        display: grid;
        gap: 4px;
      }

      .game-list span {
        font-size: 16px;
        font-weight: 700;
      }

      .game-list small {
        color: var(--muted);
        font-size: 11px;
      }

      .playfield {
        min-width: 0;
        padding: 14px;
        display: grid;
        grid-template-rows: auto minmax(320px, 1fr) auto;
        gap: 12px;
      }

      .topbar,
      .stats,
      .button-row,
      .touch-pad {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .topbar {
        justify-content: space-between;
        border-bottom: 2px solid var(--line);
        padding-bottom: 12px;
      }

      h2 {
        margin: 0;
        font-size: 22px;
        color: var(--yellow);
      }

      .stats {
        color: var(--muted);
        font-size: 14px;
      }

      .stats strong {
        color: var(--green);
      }

      .screen {
        position: relative;
        min-height: 320px;
        border: 2px solid #36577c;
        background: #050913;
        overflow: hidden;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 320px;
      }

      .controls {
        padding: 12px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
      }

      .button-row button,
      .touch-pad button {
        width: 72px;
        height: 44px;
        padding: 0;
        text-align: center;
      }

      .touch-pad {
        display: grid;
        grid-template-columns: repeat(3, 48px);
        grid-template-rows: repeat(3, 40px);
        gap: 6px;
      }

      .touch-pad button {
        width: 48px;
        height: 40px;
      }

      .touch-pad [data-action="up"] {
        grid-column: 2;
      }

      .touch-pad [data-action="left"] {
        grid-column: 1;
        grid-row: 2;
      }

      .touch-pad [data-action="rotate"] {
        grid-column: 2;
        grid-row: 2;
      }

      .touch-pad [data-action="right"] {
        grid-column: 3;
        grid-row: 2;
      }

      .touch-pad [data-action="down"] {
        grid-column: 2;
        grid-row: 3;
      }

      .hint {
        color: var(--muted);
        font-size: 13px;
      }

      @media (max-width: 820px) {
        .app {
          grid-template-columns: 1fr;
          padding: 12px 0;
        }

        .sidebar {
          gap: 12px;
        }

        .game-list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .controls {
          grid-template-columns: 1fr;
        }

        .touch-pad {
          justify-self: center;
        }
      }

      @media (max-width: 520px) {
        h1 {
          font-size: 24px;
        }

        .game-list {
          grid-template-columns: 1fr;
        }

        .button-row button {
          flex: 1 1 86px;
        }
      }
    </style>
  </head>
  <body>
    <main class="app">
      <aside class="sidebar">
        <div class="brand">
          <h1>离线<br>街机合集</h1>
          <p class="subtitle">随时开一局的本地像素街机</p>
        </div>
        <nav id="gameList" class="game-list" aria-label="游戏列表"></nav>
        <div id="leaderboardPanel" class="leaderboard-panel"></div>
      </aside>

      <section class="playfield" aria-label="游戏画面">
        <header class="topbar">
          <h2 id="gameTitle">默认游戏</h2>
          <div class="stats">
            <span>分数<strong id="scoreValue">0</strong></span>
            <span>关卡<strong id="levelValue">1</strong></span>
            <span id="hintValue">准备开始</span>
          </div>
        </header>

        <div class="screen">
          <canvas id="gameCanvas" width="960" height="640" aria-label="游戏画布"></canvas>
        </div>

        <footer class="controls">
          <div>
            <div class="button-row">
              <button id="startButton" type="button">开始</button>
              <button id="pauseButton" type="button">暂停</button>
              <button id="resetButton" type="button">重开</button>
            </div>
            <p class="hint">键盘：方向键 / WASD 移动，1 / 2 / 3 选卡，R 重开，P 暂停，Z 旋转或交互</p>
          </div>

          <div id="touchPad" class="touch-pad" aria-label="触摸控制">
            <button type="button" data-action="up">&uarr;</button>
            <button type="button" data-action="left">&larr;</button>
            <button type="button" data-action="rotate">Z</button>
            <button type="button" data-action="right">&rarr;</button>
            <button type="button" data-action="down">&darr;</button>
          </div>
        </footer>
      </section>
    </main>

    <script>
      window.ArcadeConfig = {
        leaderboardApiUrl: ""
      };
    </script>
    <script src="src/shared/rng.js"></script>
    <script src="src/shared/render.js"></script>
    <script src="src/games/snake.js"></script>
    <script src="src/games/twenty48.js"></script>
    <script src="src/games/shooter.js"></script>
    <script src="src/games/breakout.js"></script>
    <script src="src/games/dodger.js"></script>
    <script src="src/leaderboard/config.js"></script>
    <script src="src/leaderboard/session.js"></script>
    <script src="src/leaderboard/client.js"></script>
    <script src="src/leaderboard/ui.js"></script>
    <script src="src/registry.js"></script>
    <script>
      window.addEventListener("DOMContentLoaded", function () {
        window.Arcade.bootArcade();
      });
    </script>
  </body>
</html>




```

## build.js
```text
// build.js - concatenate src/ modules into a single arcade.js
//
// Usage:  node build.js
// Output: arcade.js (overwritten)

"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = __dirname;

// Files in load order (each upstream of registry.js)
var modules = [
  "src/shared/rng.js",
  "src/shared/render.js",
  "src/games/snake.js",
  "src/games/twenty48.js",
  "src/games/shooter.js",
  "src/games/breakout.js",
  "src/games/dodger.js",
  "src/leaderboard/config.js",
  "src/leaderboard/session.js",
  "src/leaderboard/client.js",
  "src/leaderboard/ui.js",
  "src/registry.js"
];

// ---- helpers ----

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

// Extract the implementation body between "## IMPLEMENTATION ##" and "## EXPORT ##".
// For registry.js we also grab normalizeKeyAction / createGameRegistry / bootArcade.
function extractImpl(source, fileLabel) {
  // Registry has a special marker section that *also* includes the dep section
  // but its impl block is still between ## IMPLEMENTATION ## and ## EXPORT ##.
  var implStart = source.indexOf("## IMPLEMENTATION ##");
  var exportStart = source.indexOf("## EXPORT ##");

  if (implStart === -1 || exportStart === -1) {
    throw new Error("Missing markers in " + fileLabel);
  }

  // Advance past the marker line
  implStart = source.indexOf("\n", implStart) + 1;

  var body = source.slice(implStart, exportStart).trim();

  // Remove trailing whitespace / blank lines
  return "\n  // ====== " + fileLabel + " ======\n" + body;
}

// ---- main ----

var impls = modules.map(function (rel) {
  return extractImpl(readFile(rel), rel);
}).join("\n");

var output = [
  '(function (root, factory) {',
  '  var api = factory();',
  '  if (typeof module === "object" && module.exports) {',
  '    module.exports = api;',
  '  }',
  '  root.Arcade = api;',
  '})(typeof window !== "undefined" ? window : globalThis, function () {',
  '  "use strict";',
  '',
  impls,
  '',
  '  // ## EXPORT ##',
  '  return {',
  '    normalizeKeyAction: normalizeKeyAction,',
  '    computeUpgradeCardRects: computeUpgradeCardRects,',
  '    createGameRegistry: createGameRegistry,',
  '    createSnakeGame: createSnakeGame,',
  '    create2048Game: create2048Game,',
  '    createShooterGame: createShooterGame,',
  '    createBreakoutGame: createBreakoutGame,',
  '    createDodgerGame: createDodgerGame,',
  '    createLeaderboardPanel: createLeaderboardPanel,',
  '    renderLeaderboardPanelHtml: renderLeaderboardPanelHtml,',
  '    normalizeApiUrl: normalizeApiUrl,',
  '    getLeaderboardConfig: getLeaderboardConfig,',
  '    createSessionStore: createSessionStore,',
  '    createLeaderboardClient: createLeaderboardClient,',
  '    bootArcade: bootArcade',
  '  };',
  '});',
  '',
  'if (typeof window !== "undefined") {',
  '  window.addEventListener("DOMContentLoaded", function () {',
  '    window.Arcade.bootArcade();',
  '  });',
  '}',
  ''
].join("\n");

fs.writeFileSync(path.join(ROOT, "arcade.js"), output, "utf8");
console.log("\u2714 arcade.js built from " + modules.length + " source modules");

```

## arcade.js
```text
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.Arcade = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";


  // ====== src/shared/rng.js ======
function createRng(seed) {
    let value = seed || 1234567;
    return function random() {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  //

  // ====== src/shared/render.js ======
var COLORS = {
    bg: "#09111f",
    grid: "rgba(137, 220, 235, 0.08)",
    cyan: "#70e3ff",
    green: "#74f08a",
    pink: "#ff5fa2",
    yellow: "#ffd166",
    orange: "#ff9f1c",
    purple: "#b78cff",
    red: "#ff4d6d",
    white: "#f8fbff"
  };

  function cloneGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  function drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(Math.round(x + 2), Math.round(y + 2), Math.max(1, Math.round(w - 4)), 2);
  }

  function drawGrid(ctx, width, height, unit) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (var x = 0; x <= width; x += unit) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (var y = 0; y <= height; y += unit) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawOverlay(ctx, canvas, text) {
    ctx.fillStyle = "rgba(3, 7, 18, 0.72)";
    ctx.fillRect(0, canvas.height / 2 - 44, canvas.width, 88);
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }

  //

  // ====== src/games/snake.js ======
function createSnakeGame(options) {
    if (options === undefined) options = {};

    var width = options.width || 24;
    var height = options.height || 18;
    var rng = createRng(options.seed || 8);
    var foodSequence = (options.foodSequence || []).slice();
    var snake;
    var direction;
    var nextDirection;
    var food;
    var score;
    var gameOver;
    var accumulator;

    function occupied(point, body) {
      if (body === undefined) body = snake;
      for (var i = 0; i < body.length; i++) {
        if (body[i].x === point.x && body[i].y === point.y) return true;
      }
      return false;
    }

    function randomFood() {
      if (foodSequence.length) return foodSequence.shift();
      var point;
      do {
        point = {
          x: Math.floor(rng() * width),
          y: Math.floor(rng() * height)
        };
      } while (occupied(point));
      return point;
    }

    function reset() {
      snake = (options.initialSnake || [
        { x: 8, y: 8 },
        { x: 7, y: 8 },
        { x: 6, y: 8 }
      ]).map(function (part) { return { x: part.x, y: part.y }; });
      direction = { x: (options.initialDirection || { x: 1, y: 0 }).x, y: (options.initialDirection || { x: 1, y: 0 }).y };
      nextDirection = { x: direction.x, y: direction.y };
      foodSequence = (options.foodSequence || []).slice();
      food = options.initialFood ? { x: options.initialFood.x, y: options.initialFood.y } : randomFood();
      score = 0;
      gameOver = false;
      accumulator = 0;
    }

    function input(action) {
      var vectors = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };
      var desired = vectors[action];
      if (!desired) return;
      if (desired.x + direction.x === 0 && desired.y + direction.y === 0) return;
      nextDirection = desired;
    }

    function step() {
      if (gameOver) return;
      direction = nextDirection;
      var head = snake[0];
      var next = { x: head.x + direction.x, y: head.y + direction.y };
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height || occupied(next)) {
        gameOver = true;
        return;
      }
      snake.unshift(next);
      if (next.x === food.x && next.y === food.y) {
        score += 10;
        food = randomFood();
      } else {
        snake.pop();
      }
    }

    function update(dt) {
      accumulator += dt;
      if (accumulator >= Math.max(70, 150 - score * 0.7)) {
        accumulator = 0;
        step();
      }
    }

    function draw(ctx, canvas) {
      var unit = Math.min(canvas.width / width, canvas.height / height);
      drawGrid(ctx, canvas.width, canvas.height, unit);
      drawPixelRect(ctx, food.x * unit, food.y * unit, unit, unit, COLORS.pink);
      snake.forEach(function (part, index) {
        drawPixelRect(ctx, part.x * unit, part.y * unit, unit, unit, index === 0 ? COLORS.green : COLORS.cyan);
      });
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function getState() {
      return {
        snake: snake.map(function (part) { return { x: part.x, y: part.y }; }),
        direction: { x: direction.x, y: direction.y },
        food: { x: food.x, y: food.y },
        score: score,
        gameOver: gameOver
      };
    }

    function getStatus() {
      return { score: score, level: Math.floor(score / 50) + 1, hint: "方向键 / WASD" };
    }

    reset();
    return { id: "snake", title: "贪吃蛇", reset: reset, input: input, update: update, draw: draw, step: step, getState: getState, getStatus: getStatus };
  }

  //

  // ====== src/games/twenty48.js ======
function create2048Game(options) {
    if (options === undefined) options = {};

    var size = 4;
    var rng = createRng(options.seed || 48);
    var spawnSequence = (options.spawnSequence || []).slice();
    var board;
    var score;
    var gameOver;

    function reset() {
      board = options.initialBoard ? cloneGrid(options.initialBoard) : Array.from({ length: size }, function () { return Array(size).fill(0); });
      spawnSequence = (options.spawnSequence || []).slice();
      score = 0;
      gameOver = false;
      if (!options.initialBoard) {
        spawnTile();
        spawnTile();
      }
    }

    function emptyCells() {
      var cells = [];
      for (var y = 0; y < size; y += 1) {
        for (var x = 0; x < size; x += 1) {
          if (!board[y][x]) cells.push({ x: x, y: y });
        }
      }
      return cells;
    }

    function spawnTile() {
      var empty = emptyCells();
      if (!empty.length) return;
      var next = spawnSequence.length ? spawnSequence.shift() : empty[Math.floor(rng() * empty.length)];
      if (board[next.y] && board[next.y][next.x] === 0) {
        board[next.y][next.x] = next.value || (rng() > 0.86 ? 4 : 2);
      }
    }

    function mergeLine(line) {
      var compact = line.filter(Boolean);
      var merged = [];
      var gained = 0;
      for (var index = 0; index < compact.length; index += 1) {
        if (compact[index] === compact[index + 1]) {
          var value = compact[index] * 2;
          merged.push(value);
          gained += value;
          index += 1;
        } else {
          merged.push(compact[index]);
        }
      }
      while (merged.length < size) merged.push(0);
      return { line: merged, gained: gained };
    }

    function hasMoves() {
      if (emptyCells().length) return true;
      for (var y = 0; y < size; y += 1) {
        for (var x = 0; x < size; x += 1) {
          if (board[y][x] === board[y][x + 1] || (board[y + 1] && board[y][x] === board[y + 1][x])) return true;
        }
      }
      return false;
    }

    function slide(action) {
      var before = JSON.stringify(board);
      var gained = 0;
      if (action === "left" || action === "right") {
        board = board.map(function (row) {
          var source = action === "left" ? row : row.slice().reverse();
          var result = mergeLine(source);
          gained += result.gained;
          return action === "left" ? result.line : result.line.reverse();
        });
      }
      if (action === "up" || action === "down") {
        for (var x = 0; x < size; x += 1) {
          var column = board.map(function (row) { return row[x]; });
          var source = action === "up" ? column : column.slice().reverse();
          var result = mergeLine(source);
          gained += result.gained;
          var merged = action === "up" ? result.line : result.line.reverse();
          for (var y = 0; y < size; y += 1) board[y][x] = merged[y];
        }
      }
      if (JSON.stringify(board) !== before) {
        score += gained;
        spawnTile();
        gameOver = !hasMoves();
      }
    }

    function input(action) {
      if (gameOver) return;
      if (["up", "down", "left", "right"].indexOf(action) !== -1) slide(action);
    }

    function update() { }

    function draw(ctx, canvas) {
      drawGrid(ctx, canvas.width, canvas.height, Math.min(canvas.width, canvas.height) / size);
      var boardSize = Math.min(canvas.width, canvas.height) * 0.86;
      var unit = boardSize / size;
      var startX = (canvas.width - boardSize) / 2;
      var startY = (canvas.height - boardSize) / 2;
      var palette = {
        2: COLORS.cyan,
        4: COLORS.green,
        8: COLORS.yellow,
        16: COLORS.orange,
        32: COLORS.pink,
        64: COLORS.red,
        128: COLORS.purple
      };
      ctx.fillStyle = "rgba(22, 34, 56, 0.92)";
      ctx.fillRect(startX - 8, startY - 8, boardSize + 16, boardSize + 16);
      board.forEach(function (row, y) {
        row.forEach(function (value, x) {
          var px = startX + x * unit + 5;
          var py = startY + y * unit + 5;
          drawPixelRect(ctx, px, py, unit - 10, unit - 10, value ? palette[value] || COLORS.white : "#1b2941");
          if (value) {
            ctx.fillStyle = "#07101d";
            ctx.font = "bold " + Math.max(18, unit * 0.28) + "px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(value), px + (unit - 10) / 2, py + (unit - 10) / 2);
          }
        });
      });
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function getState() {
      return { board: cloneGrid(board), score: score, gameOver: gameOver };
    }

    function getStatus() {
      var maxTile = Math.max.apply(null, board.flat());
      return { score: score, level: maxTile || 2, hint: "方向键 / WASD 滑动方块" };
    }

    reset();
    return { id: "twenty48", title: "2048", reset: reset, input: input, update: update, draw: draw, getState: getState, getStatus: getStatus };
  }

  //

  // ====== src/games/shooter.js ======
var SHOOTER_UPGRADES = [
    { id: "doubleShot", title: "双发弹幕", desc: "+1 条弹道" },
    { id: "damage", title: "穿甲弹", desc: "伤害+1 子弹变宽" },
    { id: "rapidFire", title: "高速射击", desc: "射速提升" },
    { id: "moveSpeed", title: "推进器", desc: "移动更快" },
    { id: "maxLife", title: "装甲板", desc: "最大生命 +1" },
    { id: "vampire", title: "维修无人机", desc: "击杀可能回血" },
    { id: "slowEnemies", title: "干扰器", desc: "敌潮变慢" }
  ];

  function computeUpgradeCardRects(canvasWidth, canvasHeight) {
    var cardW = canvasWidth * 0.25;
    var cardH = canvasHeight * 0.28;
    var gap = canvasWidth * 0.045;
    var totalW = cardW * 3 + gap * 2;
    var startX = (canvasWidth - totalW) / 2;
    var y = canvasHeight * 0.38;
    return [0, 1, 2].map(function (index) {
      return {
        x: startX + index * (cardW + gap),
        y: y,
        w: cardW,
        h: cardH
      };
    });
  }

  function createShooterGame(options) {
    if (options === undefined) options = {};

    var rng = createRng(options.seed || 86);
    var upgradeSequence = (options.upgradeSequence || []).slice();
    var player;
    var bullets;
    var enemies;
    var score;
    var gameOver;
    var spawnTimer;
    var fireTimer;
    var elapsed;
    var level;
    var exp;
    var expToLevel;
    var levelUpPending;
    var upgradeChoices;
    var stats;
    var heldInput;

    function reset() {
      heldInput = { left: false, right: false, up: false, down: false };
      stats = {
        shots: 1,
        damage: 1,
        fireDelay: 400,
        moveSpeed: 240,
        maxLife: 3,
        bulletWidth: 4,
        healChance: 0,
        enemySlow: 1
      };
      player = options.initialPlayer ? {
        x: options.initialPlayer.x, y: options.initialPlayer.y,
        w: options.initialPlayer.w, h: options.initialPlayer.h,
        vx: options.initialPlayer.vx || 0, vy: options.initialPlayer.vy || 0
      } : { x: 226, y: 274, w: 28, h: 26, vx: 0, vy: 0 };
      player.life = player.life || stats.maxLife;
      bullets = (options.initialBullets || []).map(function (bullet) {
        var b = { damage: stats.damage, x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h, vy: bullet.vy };
        return b;
      });
      enemies = (options.initialEnemies || []).map(function (enemy) {
        return { hp: 1, maxHp: enemy.hp || 1, x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h, vy: enemy.vy };
      });
      score = 0;
      gameOver = false;
      spawnTimer = 0;
      fireTimer = (options.initialBullets || []).length ? stats.fireDelay : 0;
      elapsed = options.initialElapsed || 0;
      level = options.initialLevel || 1;
      exp = options.initialExp || 0;
      expToLevel = options.expToLevel || 4;
      levelUpPending = false;
      upgradeChoices = [];
      upgradeSequence = (options.upgradeSequence || []).slice();
    }

    function intersects(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function pickUpgradeChoices() {
      var choices = [];
      while (choices.length < 3) {
        var nextId = upgradeSequence.length ? upgradeSequence.shift() : SHOOTER_UPGRADES[Math.floor(rng() * SHOOTER_UPGRADES.length)].id;
        var upgrade = SHOOTER_UPGRADES.find(function (item) { return item.id === nextId; }) || SHOOTER_UPGRADES[0];
        if (!choices.some(function (choice) { return choice.id === upgrade.id; })) choices.push({ id: upgrade.id, title: upgrade.title, desc: upgrade.desc });
      }
      return choices;
    }

    function gainExp(amount) {
      exp += amount;
      while (exp >= expToLevel) {
        exp -= expToLevel;
        level += 1;
        expToLevel += 2;
        levelUpPending = true;
        upgradeChoices = pickUpgradeChoices();
      }
    }

    function applyUpgrade(upgrade) {
      if (!upgrade) return;
      if (upgrade.id === "doubleShot") stats.shots += 1;
      if (upgrade.id === "damage") { stats.damage += 1; stats.bulletWidth += 2; }
      if (upgrade.id === "rapidFire") stats.fireDelay = Math.max(55, stats.fireDelay - 25);
      if (upgrade.id === "moveSpeed") stats.moveSpeed += 35;
      if (upgrade.id === "maxLife") {
        stats.maxLife += 1;
        player.life = Math.min(stats.maxLife, player.life + 1);
      }
      if (upgrade.id === "vampire") stats.healChance = Math.min(0.45, stats.healChance + 0.16);
      if (upgrade.id === "slowEnemies") stats.enemySlow = Math.max(0.68, stats.enemySlow - 0.08);
      levelUpPending = false;
      upgradeChoices = [];
      fireTimer = 0;
    }

    function chooseUpgrade(index) {
      if (!levelUpPending) return false;
      applyUpgrade(upgradeChoices[index]);
      return true;
    }

    function fire() {
      if (fireTimer > 0 || gameOver || levelUpPending) return;
      var spread = 9;
      var total = stats.shots;
      for (var index = 0; index < total; index += 1) {
        var offset = (index - (total - 1) / 2) * spread;
        bullets.push({
          x: player.x + player.w / 2 - stats.bulletWidth / 2 + offset,
          y: player.y - 8,
          w: stats.bulletWidth,
          h: 12,
          vy: -320,
          damage: stats.damage
        });
      }
      fireTimer = stats.fireDelay;
    }

    function updateVelocity() {
      player.vx = (heldInput.right ? stats.moveSpeed : 0) - (heldInput.left ? stats.moveSpeed : 0);
      player.vy = (heldInput.down ? stats.moveSpeed : 0) - (heldInput.up ? stats.moveSpeed : 0);
    }

    function input(action, active) {
      if (active === undefined) active = true;
      if (levelUpPending) {
        if (active && action === "choice1") chooseUpgrade(0);
        if (active && action === "choice2") chooseUpgrade(1);
        if (active && action === "choice3") chooseUpgrade(2);
        return;
      }
      if (["left", "right", "up", "down"].indexOf(action) !== -1) {
        heldInput[action] = active;
        updateVelocity();
      }
      if ((action === "rotate" || action === "drop" || action === "fire") && active) fire();
    }

    function spawnEnemy() {
      var pressure = level + elapsed / 30;
      var large = pressure > 7 && rng() > 0.68;
      var size = (large ? 34 : 22) + Math.floor(rng() * 14);
      var hp = Math.max(1, 1 + Math.floor((level - 1) / 2) + (large ? 2 : 0) + Math.floor(elapsed / 55));
      enemies.push({
        x: rng() * (480 - size),
        y: -size,
        w: size,
        h: size,
        hp: hp,
        maxHp: hp,
        vy: (40 + rng() * 80 + level * 8 + elapsed * 0.8) * stats.enemySlow,
        value: large ? 2 : 1
      });
    }

    function damagePlayer() {
      player.life -= 1;
      if (player.life <= 0) gameOver = true;
    }

    function update(dtMs) {
      if (gameOver || levelUpPending) return;
      var dt = dtMs / 1000;
      elapsed += dt;
      fireTimer = Math.max(0, fireTimer - dtMs);
      fire();
      spawnTimer += dtMs;
      var spawnDelay = Math.max(150, 820 - level * 45 - elapsed * 5);
      if (spawnTimer > spawnDelay) {
        spawnTimer = 0;
        spawnEnemy();
      }
      player.x = Math.max(0, Math.min(480 - player.w, player.x + player.vx * dt));
      player.y = Math.max(0, Math.min(320 - player.h, player.y + player.vy * dt));
      bullets.forEach(function (bullet) {
        bullet.y += bullet.vy * dt;
      });
      enemies.forEach(function (enemy) {
        enemy.y += enemy.vy * dt;
        if (!enemy.hitPlayer && intersects(player, enemy)) {
          enemy.hitPlayer = true;
          enemy.hit = true;
          damagePlayer();
        }
      });
      bullets.forEach(function (bullet) {
        enemies.forEach(function (enemy) {
          if (!bullet.hit && !enemy.hit && intersects(bullet, enemy)) {
            bullet.hit = true;
            enemy.hp -= bullet.damage || stats.damage;
            if (enemy.hp <= 0) {
              enemy.hit = true;
              score += 25 * (enemy.value || 1);
              if (stats.healChance && rng() < stats.healChance) player.life = Math.min(stats.maxLife, player.life + 1);
              gainExp(enemy.value || 1);
            }
          }
        });
      });
      bullets = bullets.filter(function (bullet) { return bullet.y > -20 && !bullet.hit; });
      enemies = enemies.filter(function (enemy) { return enemy.y < 350 && !enemy.hit; });
    }

    function drawUpgradeCards(ctx, canvas) {
      ctx.fillStyle = "rgba(3, 7, 18, 0.82)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.white;
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText("升级：", canvas.width / 2, canvas.height * 0.26);
      var rects = computeUpgradeCardRects(canvas.width, canvas.height);
      upgradeChoices.forEach(function (choice, index) {
        var rect = rects[index];
        drawPixelRect(ctx, rect.x, rect.y, rect.w, rect.h, [COLORS.cyan, COLORS.yellow, COLORS.pink][index]);
        ctx.fillStyle = "#07101d";
        ctx.font = "bold 18px monospace";
        ctx.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + 30);
        ctx.font = "bold 15px monospace";
        ctx.fillText(choice.title, rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.font = "12px monospace";
        ctx.fillText(choice.desc, rect.x + rect.w / 2, rect.y + rect.h - 28);
      });
    }

    function draw(ctx, canvas) {
      var sx = canvas.width / 480;
      var sy = canvas.height / 320;
      drawGrid(ctx, canvas.width, canvas.height, 20);
      bullets.forEach(function (bullet) { drawPixelRect(ctx, bullet.x * sx, bullet.y * sy, bullet.w * sx, bullet.h * sy, COLORS.yellow); });
      enemies.forEach(function (enemy) {
        drawPixelRect(ctx, enemy.x * sx, enemy.y * sy, enemy.w * sx, enemy.h * sy, enemy.maxHp > 2 ? COLORS.purple : COLORS.red);
        if (enemy.maxHp > 1) {
          ctx.fillStyle = COLORS.green;
          ctx.fillRect(enemy.x * sx, (enemy.y - 5) * sy, enemy.w * sx * Math.max(0, enemy.hp / enemy.maxHp), 3 * sy);
        }
      });
      drawPixelRect(ctx, player.x * sx, player.y * sy, player.w * sx, player.h * sy, COLORS.cyan);
      drawPixelRect(ctx, (player.x + 8) * sx, (player.y - 8) * sy, 12 * sx, 10 * sy, COLORS.green);
      ctx.fillStyle = COLORS.white;
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("生命 " + player.life + "/" + stats.maxLife + "  经验 " + exp + "/" + expToLevel, 12, 22);
      if (levelUpPending) drawUpgradeCards(ctx, canvas);
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function pickUpgradeAt(clientX, rect) {
      if (!levelUpPending || !rect) return false;
      var x = clientX - rect.left;
      var y = rect.height * 0.5;
      var cards = computeUpgradeCardRects(rect.width, rect.height);
      var index = cards.findIndex(function (card) { return x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h; });
      return index >= 0 ? chooseUpgrade(index) : false;
    }

    function getState() {
      return {
        player: { x: player.x, y: player.y, w: player.w, h: player.h, vx: player.vx, vy: player.vy, life: player.life },
        bullets: bullets.map(function (bullet) { return { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h, vy: bullet.vy, damage: bullet.damage }; }),
        enemies: enemies.map(function (enemy) { return { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h, vy: enemy.vy, hp: enemy.hp, maxHp: enemy.maxHp, value: enemy.value }; }),
        score: score,
        level: level,
        exp: exp,
        expToLevel: expToLevel,
        elapsed: elapsed,
        stats: { shots: stats.shots, damage: stats.damage, fireDelay: stats.fireDelay, moveSpeed: stats.moveSpeed, maxLife: stats.maxLife, bulletWidth: stats.bulletWidth, healChance: stats.healChance, enemySlow: stats.enemySlow },
        levelUpPending: levelUpPending,
        upgradeChoices: upgradeChoices.map(function (choice) { return { id: choice.id, title: choice.title, desc: choice.desc }; }),
        gameOver: gameOver
      };
    }

    function getStatus() {
      return {
        score: score,
        level: level,
        hint: levelUpPending ? "选择升级：1 / 2 / 3" : "自动射击 生命 " + player.life + "/" + stats.maxLife + " 经验 " + exp + "/" + expToLevel
      };
    }

    reset();
    return { id: "shooter", title: "飞机大战", reset: reset, input: input, update: update, draw: draw, getState: getState, getStatus: getStatus, chooseUpgrade: chooseUpgrade, pickUpgradeAt: pickUpgradeAt };
  }

  //

  // ====== src/games/breakout.js ======
function createBreakoutGame() {
    var paddle;
    var ball;
    var bricks;
    var score;

    function reset() {
      paddle = { x: 190, y: 292, w: 100, h: 12, vx: 0 };
      ball = { x: 240, y: 250, vx: 160, vy: -180, size: 10 };
      score = 0;
      bricks = [];
      for (var y = 0; y < 5; y += 1) {
        for (var x = 0; x < 9; x += 1) {
          bricks.push({
            x: 18 + x * 50, y: 28 + y * 22, w: 40, h: 14, alive: true,
            color: [COLORS.pink, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.cyan][y]
          });
        }
      }
    }

    function input(action, active) {
      if (active === undefined) active = true;
      if (action === "left") paddle.vx = active ? -300 : 0;
      if (action === "right") paddle.vx = active ? 300 : 0;
    }

    function update(dtMs) {
      var dt = dtMs / 1000;
      paddle.x = Math.max(0, Math.min(480 - paddle.w, paddle.x + paddle.vx * dt));
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x <= 0 || ball.x >= 480 - ball.size) ball.vx *= -1;
      if (ball.y <= 0) ball.vy *= -1;
      if (ball.y > 330) {
        ball.x = 240;
        ball.y = 250;
        ball.vy = -180;
      }
      if (ball.x < paddle.x + paddle.w && ball.x + ball.size > paddle.x && ball.y < paddle.y + paddle.h && ball.y + ball.size > paddle.y) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 3;
      }
      bricks.forEach(function (brick) {
        if (!brick.alive) return;
        if (ball.x < brick.x + brick.w && ball.x + ball.size > brick.x && ball.y < brick.y + brick.h && ball.y + ball.size > brick.y) {
          brick.alive = false;
          ball.vy *= -1;
          score += 10;
        }
      });
      if (bricks.every(function (brick) { return !brick.alive; })) reset();
    }

    function draw(ctx, canvas) {
      var sx = canvas.width / 480;
      var sy = canvas.height / 320;
      drawGrid(ctx, canvas.width, canvas.height, 20);
      bricks.forEach(function (brick) { if (brick.alive) drawPixelRect(ctx, brick.x * sx, brick.y * sy, brick.w * sx, brick.h * sy, brick.color); });
      drawPixelRect(ctx, paddle.x * sx, paddle.y * sy, paddle.w * sx, paddle.h * sy, COLORS.cyan);
      drawPixelRect(ctx, ball.x * sx, ball.y * sy, ball.size * sx, ball.size * sy, COLORS.yellow);
    }

    function getStatus() {
      return { score: score, level: Math.floor(score / 100) + 1, hint: "左右移动" };
    }

    reset();
    return { id: "breakout", title: "打砖块", reset: reset, input: input, update: update, draw: draw, getStatus: getStatus };
  }

  //

  // ====== src/games/dodger.js ======
function createDodgerGame() {
    var rng = createRng(33);
    var player;
    var hazards;
    var score;
    var gameOver;
    var spawnTimer;

    function reset() {
      player = { x: 220, y: 270, w: 24, h: 24, vx: 0, vy: 0 };
      hazards = [];
      score = 0;
      gameOver = false;
      spawnTimer = 0;
    }

    function input(action, active) {
      if (active === undefined) active = true;
      var speed = active ? 210 : 0;
      if (action === "left") player.vx = -speed;
      if (action === "right") player.vx = speed;
      if (action === "up") player.vy = -speed;
      if (action === "down") player.vy = speed;
    }

    function intersects(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function update(dtMs) {
      if (gameOver) return;
      var dt = dtMs / 1000;
      score += dt * 8;
      player.x = Math.max(0, Math.min(480 - player.w, player.x + player.vx * dt));
      player.y = Math.max(0, Math.min(320 - player.h, player.y + player.vy * dt));
      spawnTimer += dtMs;
      if (spawnTimer > Math.max(180, 620 - score * 2)) {
        spawnTimer = 0;
        var size = 12 + Math.floor(rng() * 20);
        hazards.push({
          x: rng() * (480 - size), y: -size, w: size, h: size,
          vy: 90 + rng() * 180,
          color: rng() > 0.5 ? COLORS.red : COLORS.orange
        });
      }
      hazards.forEach(function (hazard) {
        hazard.y += hazard.vy * dt;
        if (intersects(player, hazard)) gameOver = true;
      });
      hazards = hazards.filter(function (hazard) { return hazard.y < 350; });
    }

    function draw(ctx, canvas) {
      var sx = canvas.width / 480;
      var sy = canvas.height / 320;
      drawGrid(ctx, canvas.width, canvas.height, 20);
      hazards.forEach(function (hazard) { drawPixelRect(ctx, hazard.x * sx, hazard.y * sy, hazard.w * sx, hazard.h * sy, hazard.color); });
      drawPixelRect(ctx, player.x * sx, player.y * sy, player.w * sx, player.h * sy, COLORS.green);
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function getStatus() {
      return { score: Math.floor(score), level: Math.floor(score / 80) + 1, hint: "自由移动" };
    }

    reset();
    return { id: "dodger", title: "像素躲避", reset: reset, input: input, update: update, draw: draw, getStatus: getStatus };
  }

  //

  // ====== src/leaderboard/config.js ======
var LEADERBOARD_GAMES = ["snake", "twenty48", "breakout", "dodger", "shooter"];

  var SCORE_LIMITS = {
    snake: 100000,
    twenty48: 1000000,
    breakout: 100000,
    dodger: 100000,
    shooter: 1000000
  };

  function normalizeApiUrl(value) {
    var text = String(value || "").trim();
    while (text.endsWith("/")) text = text.slice(0, -1);
    return text;
  }

  function getLeaderboardConfig(root) {
    var source = root || (typeof window !== "undefined" ? window : {});
    var config = source.ArcadeConfig || {};
    return {
      apiUrl: normalizeApiUrl(config.leaderboardApiUrl || ""),
      games: LEADERBOARD_GAMES.slice(),
      scoreLimits: Object.assign({}, SCORE_LIMITS)
    };
  }

  //

  // ====== src/leaderboard/session.js ======
var SESSION_KEY = "offlineArcade.session";
  var BESTS_KEY = "offlineArcade.bestScores";
  var PENDING_KEY = "offlineArcade.pendingScores";

  function createMemoryStorage() {
    var memory = {};

    return {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
      },
      setItem: function (key, value) {
        memory[key] = String(value);
      },
      removeItem: function (key) {
        delete memory[key];
      }
    };
  }

  function resolveStorage(storage) {
    if (storage) {
      return storage;
    }

    if (typeof window !== "undefined") {
      try {
        return window.localStorage;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function createSafeStorage(storage) {
    var fallback = createMemoryStorage();
    var target = resolveStorage(storage) || fallback;

    function withFallback(operation) {
      try {
        return operation(target);
      } catch (error) {
        target = fallback;
        try {
          return operation(target);
        } catch (fallbackError) {
          return null;
        }
      }
    }

    return {
      getItem: function (key) {
        var value = withFallback(function (store) {
          return store.getItem(key);
        });

        return value == null ? null : String(value);
      },
      setItem: function (key, value) {
        withFallback(function (store) {
          store.setItem(key, String(value));
          return true;
        });
      },
      removeItem: function (key) {
        withFallback(function (store) {
          store.removeItem(key);
          return true;
        });
      }
    };
  }

  function readJson(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  }

  function normalizePendingItem(item, defaultCreatedAt) {
    if (!item) {
      return null;
    }

    var gameId = item.gameId == null ? "" : String(item.gameId).trim();
    if (!gameId) {
      return null;
    }

    return {
      gameId: gameId,
      score: Math.max(0, Math.floor(Number(item.score) || 0)),
      createdAt: item.createdAt == null || item.createdAt === "" ? String(defaultCreatedAt || "") : String(item.createdAt)
    };
  }

  function createSessionStore(storage) {
    var target = createSafeStorage(storage);

    function getSession() {
      var session = readJson(target, SESSION_KEY, null);
      if (!session || !session.token || !session.nickname) {
        return null;
      }

      return {
        token: String(session.token),
        nickname: String(session.nickname),
        expiresAt: session.expiresAt ? String(session.expiresAt) : ""
      };
    }

    function setSession(session) {
      writeJson(target, SESSION_KEY, {
        token: String(session && session.token || ""),
        nickname: String(session && session.nickname || ""),
        expiresAt: session && session.expiresAt ? String(session.expiresAt) : ""
      });
    }

    function clearSession() {
      target.removeItem(SESSION_KEY);
    }

    function getBestScore(gameId) {
      var bests = readJson(target, BESTS_KEY, {});
      var value = Number(bests[gameId] || 0);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function setBestScore(gameId, score) {
      var nextScore = Math.max(0, Math.floor(Number(score) || 0));
      var bests = readJson(target, BESTS_KEY, {});
      var current = Math.max(0, Math.floor(Number(bests[gameId]) || 0));
      if (nextScore > current) {
        bests[gameId] = nextScore;
        writeJson(target, BESTS_KEY, bests);
      }
    }

    function enqueuePending(submission) {
      var pending = readJson(target, PENDING_KEY, []);
      if (!Array.isArray(pending)) {
        pending = [];
      }

      var normalized = normalizePendingItem(submission, new Date().toISOString());
      if (!normalized) {
        return;
      }

      pending.push(normalized);
      writeJson(target, PENDING_KEY, pending.slice(-20));
    }

    function listPending() {
      var pending = readJson(target, PENDING_KEY, []);
      if (!Array.isArray(pending)) {
        return [];
      }

      return pending.map(function (item) {
        return normalizePendingItem(item, "");
      }).filter(Boolean);
    }

    function replacePending(items) {
      var next = [];
      if (Array.isArray(items)) {
        items.forEach(function (item) {
          var normalized = normalizePendingItem(item, "");
          if (normalized) {
            next.push(normalized);
          }
        });
      }

      writeJson(target, PENDING_KEY, next);
    }

    return {
      getSession: getSession,
      setSession: setSession,
      clearSession: clearSession,
      getBestScore: getBestScore,
      setBestScore: setBestScore,
      enqueuePending: enqueuePending,
      listPending: listPending,
      replacePending: replacePending
    };
  }

  //

  // ====== src/leaderboard/client.js ======
function offlineResult() {
    return { ok: false, error: "offline", message: "\u6392\u884c\u699c\u672a\u914d\u7f6e" };
  }

  function errorResult(error, message) {
    return { ok: false, error: error || "request_failed", message: message || "\u8bf7\u6c42\u5931\u8d25" };
  }

  function createLeaderboardClient(options) {
    options = options || {};

    var apiUrl = normalizeApiUrl(options.apiUrl || "");
    var fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);

    function isConfigured() {
      return Boolean(apiUrl && fetchImpl);
    }

    async function request(path, requestOptions) {
      if (!isConfigured()) {
        return offlineResult();
      }

      try {
        var response = await fetchImpl(apiUrl + path, requestOptions);
        var payload = {};

        if (response && typeof response.json === "function") {
          try {
            payload = await response.json();
          } catch (jsonError) {
            payload = {};
          }
        }

        if (!response || !response.ok || (payload && payload.ok === false)) {
          var statusCode = response && typeof response.status === "number" ? response.status : 0;
          return errorResult(payload && payload.error || (statusCode ? "http_" + statusCode : "request_failed"), payload && payload.message || "\u8bf7\u6c42\u5931\u8d25");
        }

        return { ok: true, data: payload };
      } catch (error) {
        return errorResult("network_unavailable", "\u7f51\u7edc\u4e0d\u53ef\u7528");
      }
    }

    function getRequest(path, token) {
      var headers = {};
      if (token) {
        headers.Authorization = "Bearer " + token;
      }
      return request(path, { method: "GET", headers: headers });
    }

    function jsonRequest(path, token, body) {
      var headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = "Bearer " + token;
      }
      return request(path, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body || {})
      });
    }

    function registerOrLogin(nickname, passphrase) {
      return jsonRequest("/api/auth/register-or-login", "", {
        nickname: nickname,
        passphrase: passphrase
      });
    }

    function getMe(token) {
      return getRequest("/api/auth/me", token);
    }

    function getLeaderboard(gameId, limit) {
      var safeLimit = Math.max(1, Math.min(50, Math.floor(Number(limit) || 10)));
      return getRequest("/api/leaderboards/" + encodeURIComponent(String(gameId || "")) + "?limit=" + safeLimit);
    }

    function getMyScore(token, gameId) {
      return getRequest("/api/scores/me/" + encodeURIComponent(String(gameId || "")), token);
    }

    function submitScore(token, gameId, score) {
      return jsonRequest("/api/scores", token, {
        gameId: String(gameId || ""),
        score: Math.max(0, Math.floor(Number(score) || 0))
      });
    }

    return {
      isConfigured: isConfigured,
      registerOrLogin: registerOrLogin,
      getMe: getMe,
      getLeaderboard: getLeaderboard,
      getMyScore: getMyScore,
      submitScore: submitScore
    };
  }

  //

  // ====== src/leaderboard/ui.js ======
function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizePanelState(state) {
    state = state || {};

    return {
      mode: state.mode ? String(state.mode) : "offline",
      nickname: state.nickname ? String(state.nickname) : "",
      message: state.message ? String(state.message) : "\u79bb\u7ebf\u6e38\u73a9\u4e2d",
      bestScore: Number.isFinite(Number(state.bestScore)) ? Math.max(0, Math.floor(Number(state.bestScore))) : 0,
      leaderboard: Array.isArray(state.leaderboard) ? state.leaderboard.slice() : [],
      loading: Boolean(state.loading)
    };
  }

  function renderRows(rows) {
    if (!rows.length) {
      return '<li class="leaderboard-empty">\u6682\u65e0\u6210\u7ee9</li>';
    }

    return rows.map(function (row, index) {
      var rank = Number.isFinite(Number(row && row.rank)) ? Math.max(1, Math.floor(Number(row.rank))) : index + 1;
      var nickname = escapeHtml(row && row.nickname);
      var score = Number.isFinite(Number(row && row.score)) ? Math.max(0, Math.floor(Number(row.score))) : 0;

      return [
        '<li>',
        '<span>#' + rank + '</span>',
        '<strong>' + nickname + '</strong>',
        '<em>' + score + '</em>',
        '</li>'
      ].join('');
    }).join('');
  }

  function renderLeaderboardPanelHtml(state) {
    var safe = normalizePanelState(state);
    var statusText = safe.loading ? '\u52a0\u8f7d\u4e2d' : safe.message;
    var body = safe.mode === 'ready'
      ? [
          '<div class="player-line">',
          '<strong>' + escapeHtml(safe.nickname || '\u73a9\u5bb6') + '</strong>',
          '<button type="button" data-leaderboard-action="logout">\u9000\u51fa</button>',
          '</div>'
        ].join('')
      : [
          '<div class="login-grid">',
          '<label>\u6635\u79f0<input data-leaderboard-field="nickname" maxlength="20" autocomplete="nickname"></label>',
          '<label>\u53e3\u4ee4<input data-leaderboard-field="passphrase" maxlength="40" type="password" autocomplete="current-password"></label>',
          '<button type="button" data-leaderboard-action="login">\u767b\u5f55\u53c2\u52a0\u6392\u884c</button>',
          '</div>'
        ].join('');

    return [
      '<section class="leaderboard-card" aria-label="\u73a9\u5bb6\u6392\u884c">',
      '<h3>\u73a9\u5bb6\u6392\u884c</h3>',
      '<p class="leaderboard-message">' + escapeHtml(statusText) + '</p>',
      body,
      '<div class="best-score">\u4e2a\u4eba\u6700\u597d <strong>' + safe.bestScore + '</strong></div>',
      '<ol class="leaderboard-list">',
      renderRows(safe.leaderboard),
      '</ol>',
      '<button type="button" data-leaderboard-action="refresh">\u5237\u65b0\u6392\u884c</button>',
      '</section>'
    ].join('');
  }

  function createLeaderboardPanel(options) {
    options = options || {};

    var container = null;
    var currentState = normalizePanelState({});

    function getFieldValue(selector) {
      if (!container) {
        return "";
      }
      var el = container.querySelector(selector);
      return el ? String(el.value || "") : "";
    }

    function bindEvents() {
      if (!container) {
        return;
      }

      var login = container.querySelector('[data-leaderboard-action="login"]');
      var logout = container.querySelector('[data-leaderboard-action="logout"]');
      var refresh = container.querySelector('[data-leaderboard-action="refresh"]');

      if (login) {
        login.addEventListener("click", function () {
          if (typeof options.onLogin === "function") {
            options.onLogin(
              getFieldValue('[data-leaderboard-field="nickname"]'),
              getFieldValue('[data-leaderboard-field="passphrase"]')
            );
          }
        });
      }

      if (logout) {
        logout.addEventListener("click", function () {
          if (typeof options.onLogout === "function") {
            options.onLogout();
          }
        });
      }

      if (refresh) {
        refresh.addEventListener("click", function () {
          if (typeof options.onRefresh === "function") {
            options.onRefresh();
          }
        });
      }
    }

    function render() {
      if (!container) {
        return;
      }
      container.innerHTML = renderLeaderboardPanelHtml(currentState);
      bindEvents();
    }

    return {
      mount: function (target) {
        container = target || null;
        render();
      },
      setState: function (state) {
        currentState = normalizePanelState(Object.assign({}, currentState, state || {}));
        render();
      },
      getState: function () {
        return normalizePanelState(currentState);
      }
    };
  }

  //

  // ====== src/registry.js ======
function normalizeKeyAction(key) {
    var normalized = String(key || "").toLowerCase();
    if (normalized === "arrowup" || normalized === "w") return "up";
    if (normalized === "arrowdown" || normalized === "s") return "down";
    if (normalized === "arrowleft" || normalized === "a") return "left";
    if (normalized === "arrowright" || normalized === "d") return "right";
    if (normalized === "z" || normalized === "x") return "rotate";
    if (normalized === " ") return "drop";
    if (normalized === "1") return "choice1";
    if (normalized === "2") return "choice2";
    if (normalized === "3") return "choice3";
    if (normalized === "r") return "reset";
    if (normalized === "p") return "pause";
    return "";
  }

  function createGameRegistry() {
    return [
      { id: "snake", title: "贪吃蛇", factory: createSnakeGame, controls: "WASD / 方向键" },
      { id: "twenty48", title: "2048", factory: create2048Game, controls: "WASD / 方向键" },
      { id: "breakout", title: "打砖块", factory: createBreakoutGame, controls: "左右移动" },
      { id: "dodger", title: "像素躲避", factory: createDodgerGame, controls: "WASD / 方向键" },
      { id: "shooter", title: "飞机大战", factory: createShooterGame, controls: "自动射击 / WASD移动" }
    ];
  }

  function bootArcade() {
    var canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var games = createGameRegistry();
    var gameList = document.getElementById("gameList");
    var scoreEl = document.getElementById("scoreValue");
    var levelEl = document.getElementById("levelValue");
    var hintEl = document.getElementById("hintValue");
    var titleEl = document.getElementById("gameTitle");
    var currentInfo = games[0];
    var currentGame = currentInfo.factory();
    var paused = true;
    var lastTime = performance.now();

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * scale));
      canvas.height = Math.max(260, Math.floor(rect.height * scale));
      ctx.imageSmoothingEnabled = false;
    }

    function selectGame(id) {
      currentInfo = games.find(function (game) { return game.id === id; }) || games[0];
      currentGame = currentInfo.factory();
      paused = false;
      titleEl.textContent = currentInfo.title;
      Array.from(gameList.children).forEach(function (button) {
        button.classList.toggle("active", button.dataset.game === id);
      });
    }

    games.forEach(function (game) {
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.game = game.id;
      button.innerHTML = "<span>" + game.title + "</span><small>" + game.controls + "</small>";
      button.addEventListener("click", function () { selectGame(game.id); });
      gameList.appendChild(button);
    });

    function resetCurrentGame() {
      currentGame.reset();
      paused = false;
    }

    function usesContinuousInput() {
      return ["breakout", "dodger", "shooter"].indexOf(currentInfo.id) !== -1;
    }

    window.addEventListener("keydown", function (event) {
      var action = normalizeKeyAction(event.key);
      if (!action) return;
      event.preventDefault();
      if (action === "pause") {
        paused = !paused;
        return;
      }
      if (action === "reset") {
        resetCurrentGame();
        return;
      }
      currentGame.input(action, true);
    });
    window.addEventListener("keyup", function (event) {
      var action = normalizeKeyAction(event.key);
      if (action && usesContinuousInput()) currentGame.input(action, false);
    });

    document.getElementById("startButton").addEventListener("click", function () {
      paused = false;
    });
    document.getElementById("pauseButton").addEventListener("click", function () {
      paused = !paused;
    });
    document.getElementById("resetButton").addEventListener("click", resetCurrentGame);

    canvas.addEventListener("pointerdown", function (event) {
      if (currentGame.pickUpgradeAt && currentGame.pickUpgradeAt(event.clientX, canvas.getBoundingClientRect())) {
        event.preventDefault();
      }
    });

    document.querySelectorAll("[data-action]").forEach(function (button) {
      var action = button.dataset.action;
      button.addEventListener("pointerdown", function () { currentGame.input(action, true); });
      button.addEventListener("pointerup", function () {
        if (usesContinuousInput()) currentGame.input(action, false);
      });
      button.addEventListener("pointerleave", function () {
        if (usesContinuousInput()) currentGame.input(action, false);
      });
    });

    function loop(time) {
      var dt = Math.min(48, time - lastTime);
      lastTime = time;
      if (!paused) currentGame.update(dt);
      currentGame.draw(ctx, canvas);
      var status = currentGame.getStatus();
      scoreEl.textContent = status.score;
      levelEl.textContent = status.level;
      hintEl.textContent = paused ? "已暂停" : status.hint;
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    selectGame("snake");
    requestAnimationFrame(loop);
  }

  //

  // ## EXPORT ##
  return {
    normalizeKeyAction: normalizeKeyAction,
    computeUpgradeCardRects: computeUpgradeCardRects,
    createGameRegistry: createGameRegistry,
    createSnakeGame: createSnakeGame,
    create2048Game: create2048Game,
    createShooterGame: createShooterGame,
    createBreakoutGame: createBreakoutGame,
    createDodgerGame: createDodgerGame,
    createLeaderboardPanel: createLeaderboardPanel,
    renderLeaderboardPanelHtml: renderLeaderboardPanelHtml,
    normalizeApiUrl: normalizeApiUrl,
    getLeaderboardConfig: getLeaderboardConfig,
    createSessionStore: createSessionStore,
    createLeaderboardClient: createLeaderboardClient,
    bootArcade: bootArcade
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", function () {
    window.Arcade.bootArcade();
  });
}

```

## tests\arcade.test.js
```text
const assert = require("assert");

const createSnakeGame = require("../src/games/snake").createSnakeGame;
const create2048Game = require("../src/games/twenty48").create2048Game;
const { createShooterGame, computeUpgradeCardRects } = require("../src/games/shooter");
const { createGameRegistry, normalizeKeyAction } = require("../src/registry");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

test("registry exposes the updated five arcade games", () => {
  const registry = createGameRegistry();
  assert.deepStrictEqual(
    registry.map((game) => game.id),
    ["snake", "twenty48", "breakout", "dodger", "shooter"]
  );
});

test("snake grows and scores when it eats food", () => {
  const snake = createSnakeGame({
    width: 6,
    height: 6,
    initialSnake: [{ x: 2, y: 2 }],
    initialDirection: { x: 1, y: 0 },
    initialFood: { x: 3, y: 2 },
    foodSequence: [{ x: 4, y: 4 }]
  });

  snake.step();
  const state = snake.getState();

  assert.strictEqual(state.score, 10);
  assert.strictEqual(state.snake.length, 2);
  assert.deepStrictEqual(state.food, { x: 4, y: 4 });
  assert.strictEqual(state.gameOver, false);
});

test("snake ends when it hits the wall", () => {
  const snake = createSnakeGame({
    width: 4,
    height: 4,
    initialSnake: [{ x: 3, y: 1 }],
    initialDirection: { x: 1, y: 0 },
    initialFood: { x: 0, y: 0 }
  });

  snake.step();

  assert.strictEqual(snake.getState().gameOver, true);
});

test("2048 merges matching tiles and awards score", () => {
  const game = create2048Game({
    initialBoard: [
      [2, 2, 0, 0],
      [4, 0, 4, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    spawnSequence: [{ x: 3, y: 3, value: 2 }]
  });

  game.input("left");
  const state = game.getState();

  assert.strictEqual(state.score, 12);
  assert.deepStrictEqual(state.board[0], [4, 0, 0, 0]);
  assert.deepStrictEqual(state.board[1], [8, 0, 0, 0]);
  assert.strictEqual(state.board[3][3], 2);
});

test("shooter removes an enemy when a bullet hits it", () => {
  const shooter = createShooterGame({
    initialPlayer: { x: 220, y: 270, w: 24, h: 24 },
    initialEnemies: [{ x: 226, y: 210, w: 24, h: 24, vy: 0 }],
    initialBullets: [{ x: 236, y: 220, w: 4, h: 10, vy: -260 }]
  });

  shooter.update(16);
  const state = shooter.getState();

  assert.strictEqual(state.score, 25);
  assert.strictEqual(state.enemies.length, 0);
  assert.strictEqual(state.bullets.length, 0);
});

test("keyboard mapping supports arrow keys and R reset", () => {
  assert.strictEqual(normalizeKeyAction("ArrowUp"), "up");
  assert.strictEqual(normalizeKeyAction("ArrowDown"), "down");
  assert.strictEqual(normalizeKeyAction("ArrowLeft"), "left");
  assert.strictEqual(normalizeKeyAction("ArrowRight"), "right");
  assert.strictEqual(normalizeKeyAction("r"), "reset");
  assert.strictEqual(normalizeKeyAction("R"), "reset");
});

test("touch controls use stable html entities for arrow labels", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
  assert.match(html, /data-action="up">&uarr;<\/button>/);
  assert.match(html, /data-action="left">&larr;<\/button>/);
  assert.match(html, /data-action="right">&rarr;<\/button>/);
  assert.match(html, /data-action="down">&darr;<\/button>/);
});



test("shooter offers three upgrades when experience reaches the threshold", () => {
  const shooter = createShooterGame({
    expToLevel: 1,
    upgradeSequence: ["doubleShot", "rapidFire", "moveSpeed"],
    initialPlayer: { x: 220, y: 270, w: 24, h: 24 },
    initialEnemies: [{ x: 226, y: 210, w: 24, h: 24, vy: 0, hp: 1 }],
    initialBullets: [{ x: 236, y: 220, w: 4, h: 10, vy: -260, damage: 1 }]
  });

  shooter.update(16);
  const state = shooter.getState();

  assert.strictEqual(state.level, 2);
  assert.strictEqual(state.levelUpPending, true);
  assert.strictEqual(state.upgradeChoices.length, 3);
  assert.deepStrictEqual(
    state.upgradeChoices.map((choice) => choice.id),
    ["doubleShot", "rapidFire", "moveSpeed"]
  );
});

test("shooter applies a selected upgrade before combat resumes", () => {
  const shooter = createShooterGame({
    expToLevel: 1,
    upgradeSequence: ["doubleShot", "rapidFire", "moveSpeed"],
    initialPlayer: { x: 220, y: 270, w: 24, h: 24 },
    initialEnemies: [{ x: 226, y: 210, w: 24, h: 24, vy: 0, hp: 1 }],
    initialBullets: [{ x: 236, y: 220, w: 4, h: 10, vy: -260, damage: 1 }]
  });

  shooter.update(16);
  shooter.input("choice1");
  shooter.input("drop", true);
  const state = shooter.getState();

  assert.strictEqual(state.levelUpPending, false);
  assert.strictEqual(state.stats.shots, 2);
  assert.strictEqual(state.bullets.length, 2);
});

test("shooter enemy strength scales with player level and time", () => {
  const easy = createShooterGame({ seed: 5, initialLevel: 1 });
  const hard = createShooterGame({ seed: 5, initialLevel: 5, initialElapsed: 120 });

  easy.update(1000);
  hard.update(1000);

  const easyEnemy = easy.getState().enemies[0];
  const hardEnemy = hard.getState().enemies[0];

  assert.ok(hardEnemy.hp > easyEnemy.hp);
  assert.ok(hardEnemy.vy > easyEnemy.vy);
  assert.ok(hardEnemy.w >= easyEnemy.w);
});

test("visible arcade UI keeps game titles and controls non-English", () => {
  const registry = createGameRegistry();
  assert.deepStrictEqual(
    registry.map((game) => game.id),
    ["snake", "twenty48", "breakout", "dodger", "shooter"]
  );
  assert.strictEqual(registry[1].title, "2048");
  registry.filter((game) => game.id !== "twenty48").forEach((game) => {
    assert.notStrictEqual(game.title, game.id);
  });

  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
  ["Offline", "Start", "Pause", "Reset", "Keyboard", "Score", "Level", "Ready", "Paused", "Game list", "Arcade cabinet", "Touch controls"].forEach((word) => {
    assert.ok(!html.includes(word), `English UI text remains: ${word}`);
  });

  [
    "<title>\u79bb\u7ebf\u8857\u673a\u5408\u96c6</title>",
    "\u968f\u65f6\u5f00\u4e00\u5c40\u7684\u672c\u5730\u50cf\u7d20\u8857\u673a",
    'aria-label="\u6e38\u620f\u5217\u8868"',
    'aria-label="\u6e38\u620f\u753b\u9762"',
    "\u9ed8\u8ba4\u6e38\u620f",
    "\u5206\u6570<strong id=\"scoreValue\">0</strong>",
    "\u5173\u5361<strong id=\"levelValue\">1</strong>",
    "<span id=\"hintValue\">\u51c6\u5907\u5f00\u59cb</span>",
    "<button id=\"startButton\" type=\"button\">\u5f00\u59cb</button>",
    "<button id=\"pauseButton\" type=\"button\">\u6682\u505c</button>",
    "<button id=\"resetButton\" type=\"button\">\u91cd\u5f00</button>",
    "\u952e\u76d8\uff1a\u65b9\u5411\u952e / WASD \u79fb\u52a8\uff0c1 / 2 / 3 \u9009\u5361\uff0cR \u91cd\u5f00\uff0cP \u6682\u505c\uff0cZ \u65cb\u8f6c\u6216\u4ea4\u4e92",
    'aria-label="\u89e6\u6478\u63a7\u5236"'
  ].forEach((snippet) => {
    assert.ok(html.includes(snippet), `Missing readable Chinese UI snippet: ${snippet}`);
  });
});

test("paused hint is not the English fallback", () => {
  const source = require("fs").readFileSync(require("path").join(__dirname, "..", "arcade.js"), "utf8");
  assert.ok(!source.includes('"Paused"'));
});
test("shooter fires automatically without pressing fire", () => {
  const shooter = createShooterGame({
    initialPlayer: { x: 220, y: 270, w: 24, h: 24 }
  });

  shooter.update(16);
  const state = shooter.getState();

  assert.strictEqual(state.bullets.length, 1);
  assert.strictEqual(state.bullets[0].damage, state.stats.damage);
  assert.strictEqual(state.bullets[0].vy, -320);
});
test("upgrade cards are centered and stay inside the canvas", () => {
  const rects = computeUpgradeCardRects(960, 640);
  assert.strictEqual(rects.length, 3);
  assert.ok(rects[0].x >= 0);
  assert.ok(rects[2].x + rects[2].w <= 960);
  assert.ok(Math.abs((rects[1].x + rects[1].w / 2) - 480) < 1);
  assert.ok(Math.abs(rects[0].x - (960 - (rects[2].x + rects[2].w))) < 1);
});

test("shooter keeps moving right when left is released while right is still held", () => {
  const shooter = createShooterGame({ initialPlayer: { x: 220, y: 270, w: 24, h: 24 } });

  shooter.input("left", true);
  shooter.input("right", true);
  shooter.input("left", false);

  assert.ok(shooter.getState().player.vx > 0);

  shooter.input("right", false);
  assert.strictEqual(shooter.getState().player.vx, 0);
});
test("upgrade card clicks use centered card hitboxes", () => {
  const shooter = createShooterGame({
    expToLevel: 1,
    upgradeSequence: ["doubleShot", "rapidFire", "moveSpeed"],
    initialPlayer: { x: 220, y: 270, w: 24, h: 24 },
    initialEnemies: [{ x: 226, y: 210, w: 24, h: 24, vy: 0, hp: 1 }],
    initialBullets: [{ x: 236, y: 220, w: 4, h: 10, vy: -260, damage: 1 }]
  });

  shooter.update(16);
  const rect = { left: 0, width: 960, height: 640 };
  const cards = computeUpgradeCardRects(rect.width, rect.height);
  const gapX = cards[0].x + cards[0].w + (cards[1].x - (cards[0].x + cards[0].w)) / 2;

  assert.strictEqual(shooter.pickUpgradeAt(gapX, rect), false);
  assert.strictEqual(shooter.pickUpgradeAt(cards[0].x + cards[0].w / 2, rect), true);
  assert.strictEqual(shooter.getState().stats.shots, 2);
});
test("upgrade card drawing uses centered layout helper", () => {
  const source = require("fs").readFileSync(require("path").join(__dirname, "..", "arcade.js"), "utf8");
  assert.ok(source.includes("computeUpgradeCardRects(canvas.width, canvas.height)"));
  assert.ok(!source.includes("0.17 + index * 0.33"));
});
test("offline package documents direct Chrome usage", () => {
  const fs = require("fs");
  const path = require("path");
  const readmePath = path.join(__dirname, "..", "README.md");

  assert.ok(fs.existsSync(readmePath), "README.md should exist");

  const readme = fs.readFileSync(readmePath, "utf8");
  assert.ok(readme.includes("open-offline.bat"));
  assert.ok(readme.includes("index.html"));
  assert.ok(readme.includes("Chrome"));
  assert.ok(readme.includes("file://"));
  assert.ok(readme.includes("offline"));
});

test("offline Chrome launcher opens the local html file", () => {
  const fs = require("fs");
  const path = require("path");
  const launcherPath = path.join(__dirname, "..", "open-offline.bat");

  assert.ok(fs.existsSync(launcherPath), "open-offline.bat should exist");

  const launcher = fs.readFileSync(launcherPath, "utf8");
  assert.ok(launcher.includes("chrome.exe"));
  assert.ok(launcher.includes("%~dp0index.html"));
  assert.ok(launcher.includes("file:///"));
});
test("leaderboard config treats missing api url as offline mode", () => {
  const { getLeaderboardConfig, normalizeApiUrl } = require("../src/leaderboard/config");

  assert.strictEqual(normalizeApiUrl(" https://example.workers.dev/ "), "https://example.workers.dev");
  assert.strictEqual(normalizeApiUrl(""), "");
  assert.deepStrictEqual(getLeaderboardConfig({ ArcadeConfig: {} }).games, ["snake", "twenty48", "breakout", "dodger", "shooter"]);
  assert.strictEqual(getLeaderboardConfig({ ArcadeConfig: {} }).apiUrl, "");
});

test("leaderboard ui module renders offline and logged in states as html", () => {
  const { renderLeaderboardPanelHtml } = require("../src/leaderboard/ui");

  const offline = renderLeaderboardPanelHtml({
    mode: "offline",
    nickname: "",
    message: "\u79bb\u7ebf\u6e38\u73a9\u4e2d",
    bestScore: 0,
    leaderboard: [],
    loading: false
  });
  const online = renderLeaderboardPanelHtml({
    mode: "ready",
    nickname: "Ada",
    message: "\u5df2\u767b\u5f55",
    bestScore: 120,
    leaderboard: [{ rank: 1, nickname: "Ada", score: 120, submittedAt: "2026-07-09T00:00:00.000Z" }],
    loading: false
  });

  assert.ok(offline.includes("\u79bb\u7ebf\u6e38\u73a9\u4e2d"));
  assert.ok(offline.includes("\u767b\u5f55\u53c2\u52a0\u6392\u884c"));
  assert.ok(online.includes("Ada"));
  assert.ok(online.includes("120"));
});

test("leaderboard ui escapes nicknames in rendered html", () => {
  const { renderLeaderboardPanelHtml } = require("../src/leaderboard/ui");

  const html = renderLeaderboardPanelHtml({
    mode: "ready",
    nickname: "<Ada & Bob>",
    message: "\u5df2\u767b\u5f55",
    bestScore: 12,
    leaderboard: [{ rank: 1, nickname: '\"><img src=x onerror=alert(1)>', score: 12 }],
    loading: false
  });

  assert.ok(html.includes("&lt;Ada &amp; Bob&gt;"));
  assert.ok(html.includes("&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"));
  assert.ok(!html.includes("<img src=x onerror=alert(1)>"));
});

test("index contains leaderboard panel mount point and config", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
  assert.ok(html.includes("window.ArcadeConfig"));
  assert.ok(html.includes('id="leaderboardPanel"'));
  assert.ok(html.includes('<script src="src/leaderboard/config.js"></script>'));
  assert.ok(html.includes('<script src="src/leaderboard/session.js"></script>'));
  assert.ok(html.includes('<script src="src/leaderboard/client.js"></script>'));
  assert.ok(html.includes('<script src="src/leaderboard/ui.js"></script>'));
  assert.ok(
    html.indexOf('<script src="src/leaderboard/config.js"></script>') < html.indexOf('<script src="src/registry.js"></script>'),
    "leaderboard config script should load before registry"
  );
  assert.ok(
    html.indexOf('<script src="src/leaderboard/ui.js"></script>') < html.indexOf('<script src="src/registry.js"></script>'),
    "leaderboard ui script should load before registry"
  );
});

test("leaderboard client stays offline when no api url is configured", async () => {
  const { createLeaderboardClient } = require("../src/leaderboard/client");
  const client = createLeaderboardClient({
    apiUrl: "",
    fetchImpl: async () => {
      throw new Error("should not fetch");
    }
  });

  assert.strictEqual(client.isConfigured(), false);
  assert.deepStrictEqual(await client.getLeaderboard("snake", 10), {
    ok: false,
    error: "offline",
    message: "\u6392\u884c\u699c\u672a\u914d\u7f6e"
  });
});

test("leaderboard client posts login and score requests", async () => {
  const { createLeaderboardClient } = require("../src/leaderboard/client");
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, token: "tok", user: { nickname: "Ada" }, accepted: true, personalBest: true })
    };
  };
  const client = createLeaderboardClient({ apiUrl: "https://api.example.dev/", fetchImpl });

  const login = await client.registerOrLogin("Ada", "secret");
  const submit = await client.submitScore("tok", "snake", 120);

  assert.strictEqual(login.ok, true);
  assert.strictEqual(submit.ok, true);
  assert.strictEqual(calls[0].url, "https://api.example.dev/api/auth/register-or-login");
  assert.strictEqual(calls[1].url, "https://api.example.dev/api/scores");
  assert.strictEqual(calls[1].options.headers.Authorization, "Bearer tok");
});

test("session store persists session best scores and pending submissions", () => {
  const { createSessionStore } = require("../src/leaderboard/session");
  const memory = {};
  const storage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    },
    setItem(key, value) {
      memory[key] = String(value);
    },
    removeItem(key) {
      delete memory[key];
    }
  };

  const store = createSessionStore(storage);
  store.setSession({ token: "abc", nickname: "Ada", expiresAt: "2026-07-10T00:00:00.000Z" });
  store.setBestScore("snake", 40);
  store.setBestScore("snake", 30);
  store.enqueuePending({ gameId: "snake", score: 50, createdAt: "2026-07-09T00:00:00.000Z" });

  assert.deepStrictEqual(store.getSession(), { token: "abc", nickname: "Ada", expiresAt: "2026-07-10T00:00:00.000Z" });
  assert.strictEqual(store.getBestScore("snake"), 40);
  assert.deepStrictEqual(store.listPending(), [{ gameId: "snake", score: 50, createdAt: "2026-07-09T00:00:00.000Z" }]);

  store.clearSession();
  assert.strictEqual(store.getSession(), null);
});
test("session store falls back when storage access fails", () => {
  const { createSessionStore } = require("../src/leaderboard/session");
  const store = createSessionStore({
    getItem() {
      throw new Error("storage unavailable");
    },
    setItem() {
      throw new Error("storage unavailable");
    },
    removeItem() {
      throw new Error("storage unavailable");
    }
  });

  store.setSession({ token: "abc", nickname: "Ada", expiresAt: "2026-07-10T00:00:00.000Z" });
  store.setBestScore("snake", 40);
  store.enqueuePending({ gameId: "snake", score: 50, createdAt: "2026-07-09T00:00:00.000Z" });

  assert.deepStrictEqual(store.getSession(), { token: "abc", nickname: "Ada", expiresAt: "2026-07-10T00:00:00.000Z" });
  assert.strictEqual(store.getBestScore("snake"), 40);
  assert.deepStrictEqual(store.listPending(), [{ gameId: "snake", score: 50, createdAt: "2026-07-09T00:00:00.000Z" }]);
});

test("bundle exports leaderboard helpers", () => {
  const arcade = require("../arcade.js");

  assert.strictEqual(typeof arcade.normalizeApiUrl, "function");
  assert.strictEqual(typeof arcade.getLeaderboardConfig, "function");
  assert.strictEqual(typeof arcade.createSessionStore, "function");
  assert.strictEqual(typeof arcade.createLeaderboardClient, "function");
});

test("session store normalizes pending items when replacing them", () => {
  const { createSessionStore } = require("../src/leaderboard/session");
  const memory = {};
  const storage = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    },
    setItem(key, value) {
      memory[key] = String(value);
    },
    removeItem(key) {
      delete memory[key];
    }
  };

  const store = createSessionStore(storage);
  store.replacePending([
    { gameId: 123, score: "5", createdAt: 42 },
    null,
    { gameId: "snake", score: 7.9, createdAt: undefined }
  ]);

  assert.deepStrictEqual(store.listPending(), [
    { gameId: "123", score: 5, createdAt: "42" },
    { gameId: "snake", score: 7, createdAt: "" }
  ]);
});

(async () => {
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (error) {
      console.error(`FAIL ${name}`);
      console.error(error);
      process.exitCode = 1;
    }
  }
})();

```
