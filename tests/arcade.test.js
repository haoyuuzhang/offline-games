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

test("score finalizer submits only improving logged in scores", async () => {
  const { createSessionStore } = require("../src/leaderboard/session");
  const { createScoreFinalizer } = require("../src/registry");
  const memory = {};
  const store = createSessionStore({
    getItem: (key) => Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null,
    setItem: (key, value) => { memory[key] = String(value); },
    removeItem: (key) => { delete memory[key]; }
  });
  store.setSession({ token: "tok", nickname: "Ada", expiresAt: "" });
  store.setBestScore("snake", 90);
  const submissions = [];
  const client = {
    submitScore: async (token, gameId, score) => {
      submissions.push({ token, gameId, score });
      return { ok: true, data: { ok: true, accepted: true, personalBest: true, score } };
    }
  };
  const finalizer = createScoreFinalizer({ store, client, config: { apiUrl: "https://api", scoreLimits: { snake: 100000 } } });

  assert.strictEqual((await finalizer.finalize("snake", 80)).ok, false);
  assert.strictEqual((await finalizer.finalize("snake", 120)).ok, true);
  assert.deepStrictEqual(submissions, [{ token: "tok", gameId: "snake", score: 120 }]);
  assert.strictEqual(store.getBestScore("snake"), 120);
});

test("score finalizer queues failed improving submissions", async () => {
  const { createSessionStore } = require("../src/leaderboard/session");
  const { createScoreFinalizer } = require("../src/registry");
  const store = createSessionStore();
  store.setSession({ token: "tok", nickname: "Ada", expiresAt: "" });
  const finalizer = createScoreFinalizer({
    store,
    client: { submitScore: async () => ({ ok: false, error: "network_unavailable", message: "网络不可用" }) },
    config: { apiUrl: "https://api", scoreLimits: { snake: 100000 } },
    now: () => "2026-07-09T00:00:00.000Z"
  });

  const result = await finalizer.finalize("snake", 120);
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(store.listPending(), [{ gameId: "snake", score: 120, createdAt: "2026-07-09T00:00:00.000Z" }]);
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
