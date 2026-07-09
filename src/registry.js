// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var createSnakeGame, create2048Game, createShooterGame, createBreakoutGame, createDodgerGame;
  var computeUpgradeCardRects;

  if (typeof module !== "undefined" && module.exports) {
    createSnakeGame = require("./games/snake").createSnakeGame;
    create2048Game = require("./games/twenty48").create2048Game;
    createShooterGame = require("./games/shooter").createShooterGame;
    createBreakoutGame = require("./games/breakout").createBreakoutGame;
    createDodgerGame = require("./games/dodger").createDodgerGame;
    computeUpgradeCardRects = require("./games/shooter").computeUpgradeCardRects;
  } else {
    var A = window.Arcade || {};
    createSnakeGame = A.createSnakeGame;
    create2048Game = A.create2048Game;
    createShooterGame = A.createShooterGame;
    createBreakoutGame = A.createBreakoutGame;
    createDodgerGame = A.createDodgerGame;
    computeUpgradeCardRects = A.computeUpgradeCardRects;
  }

  // ## IMPLEMENTATION ##

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
      { id: "snake", title: "\u8d2a\u5403\u86c7", factory: createSnakeGame, controls: "WASD / \u65b9\u5411\u952e" },
      { id: "twenty48", title: "2048", factory: create2048Game, controls: "WASD / \u65b9\u5411\u952e" },
      { id: "breakout", title: "\u6253\u7816\u5757", factory: createBreakoutGame, controls: "\u5de6\u53f3\u79fb\u52a8" },
      { id: "dodger", title: "\u50cf\u7d20\u95ea\u907f", factory: createDodgerGame, controls: "WASD / \u65b9\u5411\u952e" },
      { id: "shooter", title: "\u98de\u673a\u5927\u6218", factory: createShooterGame, controls: "\u81ea\u52a8\u5c04\u51fb / WASD\u79fb\u52a8" }
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
      hintEl.textContent = paused ? "\u5df2\u6682\u505c" : status.hint;
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    selectGame("snake");
    requestAnimationFrame(loop);
  }

  // ## EXPORT ##

  var api = {
    normalizeKeyAction: normalizeKeyAction,
    computeUpgradeCardRects: computeUpgradeCardRects,
    createGameRegistry: createGameRegistry,
    createSnakeGame: createSnakeGame,
    create2048Game: create2048Game,
    createShooterGame: createShooterGame,
    createBreakoutGame: createBreakoutGame,
    createDodgerGame: createDodgerGame,
    bootArcade: bootArcade
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
