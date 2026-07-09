// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var createRng, COLORS, cloneGrid, drawGrid, drawPixelRect, drawOverlay;

  if (typeof module !== "undefined" && module.exports) {
    var rng = require("../shared/rng");
    var render = require("../shared/render");
    createRng = rng.createRng;
    COLORS = render.COLORS;
    cloneGrid = render.cloneGrid;
    drawGrid = render.drawGrid;
    drawPixelRect = render.drawPixelRect;
    drawOverlay = render.drawOverlay;
  } else {
    var A = window.Arcade || {};
    createRng = A.createRng;
    COLORS = A.COLORS;
    cloneGrid = A.cloneGrid;
    drawGrid = A.drawGrid;
    drawPixelRect = A.drawPixelRect;
    drawOverlay = A.drawOverlay;
  }

  // ## IMPLEMENTATION ##

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

  // ## EXPORT ##

  var api = { create2048Game: create2048Game };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
