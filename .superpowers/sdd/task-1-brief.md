### Task 1: Frontend Leaderboard Configuration And Session Store

**Files:**
- Create: `src/leaderboard/config.js`
- Create: `src/leaderboard/session.js`
- Modify: `build.js`
- Modify: `tests/arcade.test.js`

**Interfaces:**
- Produces: `normalizeApiUrl(value: string): string`
- Produces: `getLeaderboardConfig(root?: object): { apiUrl: string, games: string[], scoreLimits: object }`
- Produces: `createSessionStore(storage?: StorageLike): SessionStore`
- Produces: `SessionStore#getSession(): { token: string, nickname: string, expiresAt: string } | null`
- Produces: `SessionStore#setSession(session): void`
- Produces: `SessionStore#clearSession(): void`
- Produces: `SessionStore#getBestScore(gameId: string): number`
- Produces: `SessionStore#setBestScore(gameId: string, score: number): void`
- Produces: `SessionStore#enqueuePending(submission): void`
- Produces: `SessionStore#listPending(): Array<{ gameId: string, score: number, createdAt: string }>`
- Produces: `SessionStore#replacePending(items): void`

- [ ] **Step 1: Write config and session tests**

Add these tests near the bottom of `tests/arcade.test.js`:

```js
test("leaderboard config treats missing api url as offline mode", () => {
  const { getLeaderboardConfig, normalizeApiUrl } = require("../src/leaderboard/config");

  assert.strictEqual(normalizeApiUrl(" https://example.workers.dev/ "), "https://example.workers.dev");
  assert.strictEqual(normalizeApiUrl(""), "");
  assert.deepStrictEqual(getLeaderboardConfig({ ArcadeConfig: {} }).games, ["snake", "twenty48", "breakout", "dodger", "shooter"]);
  assert.strictEqual(getLeaderboardConfig({ ArcadeConfig: {} }).apiUrl, "");
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
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node tests/arcade.test.js`

Expected: FAIL with `Cannot find module '../src/leaderboard/config'`.

- [ ] **Step 3: Implement `src/leaderboard/config.js`**

```js
// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

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

  // ## EXPORT ##

  var api = {
    LEADERBOARD_GAMES: LEADERBOARD_GAMES,
    SCORE_LIMITS: SCORE_LIMITS,
    normalizeApiUrl: normalizeApiUrl,
    getLeaderboardConfig: getLeaderboardConfig
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

- [ ] **Step 4: Implement `src/leaderboard/session.js`**

```js
// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  var SESSION_KEY = "offlineArcade.session";
  var BESTS_KEY = "offlineArcade.bestScores";
  var PENDING_KEY = "offlineArcade.pendingScores";

  function readJson(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    storage.setItem(key, JSON.stringify(value));
  }

  function createSessionStore(storage) {
    var target = storage || (typeof window !== "undefined" ? window.localStorage : null);
    if (!target) {
      var memory = {};
      target = {
        getItem: function (key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
        setItem: function (key, value) { memory[key] = String(value); },
        removeItem: function (key) { delete memory[key]; }
      };
    }

    function getSession() {
      var session = readJson(target, SESSION_KEY, null);
      if (!session || !session.token || !session.nickname) return null;
      return {
        token: String(session.token),
        nickname: String(session.nickname),
        expiresAt: session.expiresAt ? String(session.expiresAt) : ""
      };
    }

    function setSession(session) {
      writeJson(target, SESSION_KEY, {
        token: String(session.token || ""),
        nickname: String(session.nickname || ""),
        expiresAt: session.expiresAt ? String(session.expiresAt) : ""
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
      pending.push({
        gameId: String(submission.gameId || ""),
        score: Math.max(0, Math.floor(Number(submission.score) || 0)),
        createdAt: String(submission.createdAt || new Date().toISOString())
      });
      writeJson(target, PENDING_KEY, pending.slice(-20));
    }

    function listPending() {
      return readJson(target, PENDING_KEY, []).filter(function (item) {
        return item && item.gameId && Number.isFinite(Number(item.score));
      });
    }

    function replacePending(items) {
      writeJson(target, PENDING_KEY, items || []);
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

  // ## EXPORT ##

  var api = { createSessionStore: createSessionStore };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
```

- [ ] **Step 5: Add modules to `build.js`**

Insert these module paths before `src/registry.js`:

```js
  "src/leaderboard/config.js",
  "src/leaderboard/session.js",
```

- [ ] **Step 6: Run tests**

Run: `node tests/arcade.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/leaderboard/config.js src/leaderboard/session.js build.js tests/arcade.test.js
git commit -m "feat: add leaderboard config and session store"
```

Expected in a normal Git checkout: commit succeeds. In the current non-Git workspace: skip this command and record the changed files.

---

