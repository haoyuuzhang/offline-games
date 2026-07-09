// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var createSnakeGame, create2048Game, createShooterGame, createBreakoutGame, createDodgerGame;
  var computeUpgradeCardRects;
  var getLeaderboardConfig, createSessionStore, createLeaderboardClient, createLeaderboardPanel;

  if (typeof module !== "undefined" && module.exports) {
    createSnakeGame = require("./games/snake").createSnakeGame;
    create2048Game = require("./games/twenty48").create2048Game;
    createShooterGame = require("./games/shooter").createShooterGame;
    createBreakoutGame = require("./games/breakout").createBreakoutGame;
    createDodgerGame = require("./games/dodger").createDodgerGame;
    computeUpgradeCardRects = require("./games/shooter").computeUpgradeCardRects;
    getLeaderboardConfig = require("./leaderboard/config").getLeaderboardConfig;
    createSessionStore = require("./leaderboard/session").createSessionStore;
    createLeaderboardClient = require("./leaderboard/client").createLeaderboardClient;
    createLeaderboardPanel = require("./leaderboard/ui").createLeaderboardPanel;
  } else {
    var A = window.Arcade || {};
    createSnakeGame = A.createSnakeGame;
    create2048Game = A.create2048Game;
    createShooterGame = A.createShooterGame;
    createBreakoutGame = A.createBreakoutGame;
    createDodgerGame = A.createDodgerGame;
    computeUpgradeCardRects = A.computeUpgradeCardRects;
    getLeaderboardConfig = A.getLeaderboardConfig;
    createSessionStore = A.createSessionStore;
    createLeaderboardClient = A.createLeaderboardClient;
    createLeaderboardPanel = A.createLeaderboardPanel;
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

  function createScoreFinalizer(options) {
    var store = options.store;
    var client = options.client;
    var config = options.config || { apiUrl: "", scoreLimits: {} };
    var now = options.now || function () { return new Date().toISOString(); };

    async function finalize(gameId, score) {
      var cleanScore = Math.max(0, Math.floor(Number(score) || 0));
      var limit = config.scoreLimits && config.scoreLimits[gameId] ? config.scoreLimits[gameId] : Number.MAX_SAFE_INTEGER;
      var session = store.getSession();
      var best = store.getBestScore(gameId);
      if (!config.apiUrl) return { ok: false, error: "offline", message: "\u79bb\u7ebf\u6e38\u73a9\u4e2d" };
      if (!session) return { ok: false, error: "not_logged_in", message: "\u767b\u5f55\u540e\u53c2\u52a0\u6392\u884c" };
      if (cleanScore <= best) return { ok: false, error: "not_improved", message: "\u672a\u8d85\u8fc7\u4e2a\u4eba\u6700\u597d" };
      if (cleanScore > limit) return { ok: false, error: "score_limit", message: "\u5206\u6570\u8d85\u51fa\u9650\u5236" };

      var result = await client.submitScore(session.token, gameId, cleanScore);
      if (result.ok) {
        store.setBestScore(gameId, cleanScore);
        return { ok: true, data: result.data };
      }
      store.enqueuePending({ gameId: gameId, score: cleanScore, createdAt: now() });
      return result;
    }

    async function flushPending() {
      var session = store.getSession();
      if (!session || !config.apiUrl) return;
      var remaining = [];
      var pending = store.listPending();
      for (var i = 0; i < pending.length; i += 1) {
        var item = pending[i];
        var result = await client.submitScore(session.token, item.gameId, item.score);
        if (result.ok) {
          store.setBestScore(item.gameId, item.score);
        } else {
          remaining.push(item);
        }
      }
      store.replacePending(remaining);
    }

    return { finalize: finalize, flushPending: flushPending };
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
    var leaderboardConfig = getLeaderboardConfig(window);
    var sessionStore = createSessionStore();
    var leaderboardClient = createLeaderboardClient({ apiUrl: leaderboardConfig.apiUrl });
    var scoreFinalizer = createScoreFinalizer({ store: sessionStore, client: leaderboardClient, config: leaderboardConfig });
    var leaderboardPanel = createLeaderboardPanel({
      onLogin: handleLeaderboardLogin,
      onLogout: handleLeaderboardLogout,
      onRefresh: refreshLeaderboard
    });
    var leaderboardEl = document.getElementById("leaderboardPanel");
    var hasSelectedGame = false;
    if (leaderboardEl) leaderboardPanel.mount(leaderboardEl);

    function currentScore() {
      var status = currentGame.getStatus();
      return Math.max(0, Math.floor(Number(status.score) || 0));
    }

    function updatePanelState(partial) {
      if (!leaderboardPanel) return;
      leaderboardPanel.setState(partial);
    }

    async function refreshLeaderboard() {
      var session = sessionStore.getSession();
      if (!leaderboardClient.isConfigured()) {
        updatePanelState({ mode: "offline", message: "\u79bb\u7ebf\u6e38\u73a9\u4e2d", bestScore: sessionStore.getBestScore(currentInfo.id), leaderboard: [] });
        return;
      }
      updatePanelState({ loading: true });
      var board = await leaderboardClient.getLeaderboard(currentInfo.id, 10);
      var mine = session ? await leaderboardClient.getMyScore(session.token, currentInfo.id) : { ok: false };
      updatePanelState({
        mode: session ? "ready" : "offline",
        nickname: session ? session.nickname : "",
        message: session ? "\u5df2\u767b\u5f55" : "\u767b\u5f55\u53c2\u52a0\u6392\u884c\u699c",
        bestScore: mine.ok && mine.data.score ? mine.data.score : sessionStore.getBestScore(currentInfo.id),
        leaderboard: board.ok && Array.isArray(board.data.rows) ? board.data.rows : [],
        loading: false
      });
    }

    async function handleLeaderboardLogin(nickname, passphrase) {
      var result = await leaderboardClient.registerOrLogin(nickname, passphrase);
      if (!result.ok) {
        updatePanelState({ mode: "offline", message: result.message, loading: false });
        return;
      }
      sessionStore.setSession({
        token: result.data.token,
        nickname: result.data.user.nickname,
        expiresAt: result.data.expiresAt || ""
      });
      await scoreFinalizer.flushPending();
      await refreshLeaderboard();
    }

    function handleLeaderboardLogout() {
      sessionStore.clearSession();
      updatePanelState({ mode: "offline", nickname: "", message: "\u79bb\u7ebf\u6e38\u73a9\u4e2d", bestScore: sessionStore.getBestScore(currentInfo.id), leaderboard: [] });
    }

    async function finalizeCurrentScore() {
      var result = await scoreFinalizer.finalize(currentInfo.id, currentScore());
      if (!result.ok && result.error === "network_unavailable") {
        updatePanelState({ message: "\u7f51\u7edc\u4e0d\u53ef\u7528\uff0c\u6210\u7ee9\u6682\u672a\u4e0a\u4f20" });
      }
    }

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * scale));
      canvas.height = Math.max(260, Math.floor(rect.height * scale));
      ctx.imageSmoothingEnabled = false;
    }

    function selectGame(id) {
      if (hasSelectedGame) {
        finalizeCurrentScore().catch(function () {});
      }
      currentInfo = games.find(function (game) { return game.id === id; }) || games[0];
      currentGame = currentInfo.factory();
      paused = false;
      titleEl.textContent = currentInfo.title;
      Array.from(gameList.children).forEach(function (button) {
        button.classList.toggle("active", button.dataset.game === id);
      });
      hasSelectedGame = true;
      refreshLeaderboard().catch(function () {});
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
      finalizeCurrentScore().catch(function () {});
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
    refreshLeaderboard().catch(function () {});
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
    createScoreFinalizer: createScoreFinalizer,
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