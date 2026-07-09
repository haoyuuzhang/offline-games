// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var COLORS, drawGrid, drawPixelRect;

  if (typeof module !== "undefined" && module.exports) {
    var render = require("../shared/render");
    COLORS = render.COLORS;
    drawGrid = render.drawGrid;
    drawPixelRect = render.drawPixelRect;
  } else {
    var A = window.Arcade || {};
    COLORS = A.COLORS;
    drawGrid = A.drawGrid;
    drawPixelRect = A.drawPixelRect;
  }

  // ## IMPLEMENTATION ##

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

  // ## EXPORT ##

  var api = { createBreakoutGame: createBreakoutGame };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
