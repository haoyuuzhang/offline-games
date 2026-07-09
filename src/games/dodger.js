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

  // ## EXPORT ##

  var api = { createDodgerGame: createDodgerGame };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
