### Task 2: Frontend Leaderboard API Client

**Files:**
- Create: `src/leaderboard/client.js`
- Modify: `build.js`
- Modify: `tests/arcade.test.js`

**Interfaces:**
- Consumes: `normalizeApiUrl(value)`
- Produces: `createLeaderboardClient(options): LeaderboardClient`
- Produces: `client.isConfigured(): boolean`
- Produces: `client.registerOrLogin(nickname, passphrase): Promise<Result>`
- Produces: `client.getMe(token): Promise<Result>`
- Produces: `client.getLeaderboard(gameId, limit): Promise<Result>`
- Produces: `client.getMyScore(token, gameId): Promise<Result>`
- Produces: `client.submitScore(token, gameId, score): Promise<Result>`
- `Result` shape: `{ ok: true, data: object }` or `{ ok: false, error: string, message: string }`

- [ ] **Step 1: Write API client tests**

Add these tests to `tests/arcade.test.js`:

```js
test("leaderboard client stays offline when no api url is configured", async () => {
  const { createLeaderboardClient } = require("../src/leaderboard/client");
  const client = createLeaderboardClient({ apiUrl: "", fetchImpl: async () => { throw new Error("should not fetch"); } });

  assert.strictEqual(client.isConfigured(), false);
  assert.deepStrictEqual(await client.getLeaderboard("snake", 10), {
    ok: false,
    error: "offline",
    message: "排行榜未配置"
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
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node tests/arcade.test.js`

Expected: FAIL with `Cannot find module '../src/leaderboard/client'`.

- [ ] **Step 3: Implement `src/leaderboard/client.js`**

```js
// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var normalizeApiUrl;

  if (typeof module !== "undefined" && module.exports) {
    normalizeApiUrl = require("./config").normalizeApiUrl;
  } else {
    normalizeApiUrl = window.Arcade.normalizeApiUrl;
  }

  // ## IMPLEMENTATION ##

  function offlineResult() {
    return { ok: false, error: "offline", message: "排行榜未配置" };
  }

  function errorResult(error, message) {
    return { ok: false, error: error || "request_failed", message: message || "请求失败" };
  }

  function createLeaderboardClient(options) {
    if (options === undefined) options = {};
    var apiUrl = normalizeApiUrl(options.apiUrl || "");
    var fetchImpl = options.fetchImpl || (typeof fetch !== "undefined" ? fetch.bind(globalThis) : null);

    function isConfigured() {
      return Boolean(apiUrl && fetchImpl);
    }

    async function request(path, requestOptions) {
      if (!isConfigured()) return offlineResult();
      try {
        var response = await fetchImpl(apiUrl + path, requestOptions);
        var payload = await response.json().catch(function () { return {}; });
        if (!response.ok || payload.ok === false) {
          return errorResult(payload.error || "http_" + response.status, payload.message || "请求失败");
        }
        return { ok: true, data: payload };
      } catch (error) {
        return errorResult("network_unavailable", "网络不可用");
      }
    }

    function jsonRequest(path, token, body) {
      var headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = "Bearer " + token;
      return request(path, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body || {})
      });
    }

    function authRequest(path, token) {
      return request(path, {
        method: "GET",
        headers: { Authorization: "Bearer " + token }
      });
    }

    function registerOrLogin(nickname, passphrase) {
      return jsonRequest("/api/auth/register-or-login", "", { nickname: nickname, passphrase: passphrase });
    }

    function getMe(token) {
      return authRequest("/api/auth/me", token);
    }

    function getLeaderboard(gameId, limit) {
      var safeLimit = Math.max(1, Math.min(50, Math.floor(Number(limit) || 10)));
      return request("/api/leaderboards/" + encodeURIComponent(gameId) + "?limit=" + safeLimit, { method: "GET" });
    }

    function getMyScore(token, gameId) {
      return authRequest("/api/scores/me/" + encodeURIComponent(gameId), token);
    }

    function submitScore(token, gameId, score) {
      return jsonRequest("/api/scores", token, { gameId: gameId, score: Math.max(0, Math.floor(Number(score) || 0)) });
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

  // ## EXPORT ##

  var api = { createLeaderboardClient: createLeaderboardClient };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
```

- [ ] **Step 4: Add module to `build.js`**

Insert this module path after `src/leaderboard/session.js` and before `src/registry.js`:

```js
  "src/leaderboard/client.js",
```

- [ ] **Step 5: Run tests**

Run: `node tests/arcade.test.js`

Expected: all tests PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/leaderboard/client.js build.js tests/arcade.test.js
git commit -m "feat: add leaderboard api client"
```

Expected in a normal Git checkout: commit succeeds. In the current non-Git workspace: skip this command and record the changed files.

---

