### Task 4: Score Finalization Integration In Arcade Controller

**Files:**
- Modify: `src/registry.js`
- Modify: `tests/arcade.test.js`
- Modify: `arcade.js` through `node build.js`

**Interfaces:**
- Consumes: `getLeaderboardConfig`, `createSessionStore`, `createLeaderboardClient`, `createLeaderboardPanel`
- Produces: `createScoreFinalizer(options)`
- Produces: `finalizer.finalize(gameId, score): Promise<Result>`
- Produces: `finalizer.flushPending(): Promise<void>`
- Produces: `bootArcade()` updated with sidebar panel, login/logout handlers, game switch refresh, reset/switch score submission

- [ ] **Step 1: Write score finalizer tests**

Add these tests to `tests/arcade.test.js`:

```js
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
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node tests/arcade.test.js`

Expected: FAIL because `createScoreFinalizer` is not exported.

- [ ] **Step 3: Add dependencies to `src/registry.js`**

Extend the dependency declarations:

```js
  var getLeaderboardConfig, createSessionStore, createLeaderboardClient, createLeaderboardPanel;
```

In the Node branch add:

```js
    getLeaderboardConfig = require("./leaderboard/config").getLeaderboardConfig;
    createSessionStore = require("./leaderboard/session").createSessionStore;
    createLeaderboardClient = require("./leaderboard/client").createLeaderboardClient;
    createLeaderboardPanel = require("./leaderboard/ui").createLeaderboardPanel;
```

In the browser branch add:

```js
    getLeaderboardConfig = A.getLeaderboardConfig;
    createSessionStore = A.createSessionStore;
    createLeaderboardClient = A.createLeaderboardClient;
    createLeaderboardPanel = A.createLeaderboardPanel;
```

- [ ] **Step 4: Implement `createScoreFinalizer` in `src/registry.js`**

Add this function before `bootArcade()`:

```js
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
      if (!config.apiUrl) return { ok: false, error: "offline", message: "离线游玩中" };
      if (!session) return { ok: false, error: "not_logged_in", message: "登录后参加排行" };
      if (cleanScore <= best) return { ok: false, error: "not_improved", message: "未超过个人最好" };
      if (cleanScore > limit) return { ok: false, error: "score_limit", message: "分数超出限制" };

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
```

- [ ] **Step 5: Export `createScoreFinalizer`**

Add it to the `api` object in `src/registry.js`:

```js
    createScoreFinalizer: createScoreFinalizer,
```

- [ ] **Step 6: Wire leaderboard panel into `bootArcade()`**

Inside `bootArcade()`, after `lastTime`, add:

```js
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
    if (leaderboardEl) leaderboardPanel.mount(leaderboardEl);
```

Add these helper functions inside `bootArcade()` before `resizeCanvas()`:

```js
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
        updatePanelState({ mode: "offline", message: "离线游玩中", bestScore: sessionStore.getBestScore(currentInfo.id), leaderboard: [] });
        return;
      }
      updatePanelState({ loading: true });
      var board = await leaderboardClient.getLeaderboard(currentInfo.id, 10);
      var mine = session ? await leaderboardClient.getMyScore(session.token, currentInfo.id) : { ok: false };
      updatePanelState({
        mode: session ? "ready" : "offline",
        nickname: session ? session.nickname : "",
        message: session ? "已登录" : "登录参加排行榜",
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
      updatePanelState({ mode: "offline", nickname: "", message: "离线游玩中", bestScore: sessionStore.getBestScore(currentInfo.id), leaderboard: [] });
    }

    async function finalizeCurrentScore() {
      var result = await scoreFinalizer.finalize(currentInfo.id, currentScore());
      if (!result.ok && result.error === "network_unavailable") {
        updatePanelState({ message: "网络不可用，成绩暂未上传" });
      }
    }
```

- [ ] **Step 7: Submit on reset and game switch**

Change `selectGame(id)` so the first line is:

```js
      finalizeCurrentScore();
```

Change `resetCurrentGame()` so the first line is:

```js
      finalizeCurrentScore();
```

At the end of `selectGame(id)`, add:

```js
      refreshLeaderboard();
```

At the end of `bootArcade()` setup, after `selectGame("snake");`, add:

```js
    refreshLeaderboard();
```

- [ ] **Step 8: Build generated arcade bundle**

Run: `node build.js`

Expected: output says `arcade.js built from 11 source modules` after the new modules are added.

- [ ] **Step 9: Run tests**

Run: `node tests/arcade.test.js`

Expected: all tests PASS.

- [ ] **Step 10: Commit**

Run:

```bash
git add src/registry.js arcade.js tests/arcade.test.js
git commit -m "feat: connect arcade scores to leaderboard flow"
```

Expected in a normal Git checkout: commit succeeds. In the current non-Git workspace: skip this command and record the changed files.

---

