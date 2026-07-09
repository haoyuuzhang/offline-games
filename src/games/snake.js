// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var createRng, COLORS, drawGrid, drawPixelRect, drawOverlay;

  if (typeof module !== "undefined" && module.exports) {
    var rng = require("../shared/rng");
    var render = require("../shared/render");
    createRng = rng.createRng;
    COLORS = render.COLORS;
    drawGrid = render.drawGrid;
    drawPixelRect = render.drawPixelRect;
    drawOverlay = render.drawOverlay;
  } else {
    var A = window.Arcade || {};
    createRng = A.createRng;
    COLORS = A.COLORS;
    drawGrid = A.drawGrid;
    drawPixelRect = A.drawPixelRect;
    drawOverlay = A.drawOverlay;
  }

  // ## IMPLEMENTATION ##

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

  // ## EXPORT ##

  var api = { createSnakeGame: createSnakeGame };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
