### Task 3: Sidebar Player And Leaderboard UI

**Files:**
- Create: `src/leaderboard/ui.js`
- Modify: `index.html`
- Modify: `build.js`
- Modify: `tests/arcade.test.js`

**Interfaces:**
- Produces: `createLeaderboardPanel(options): LeaderboardPanel`
- Produces: `panel.mount(container): void`
- Produces: `panel.setState(state): void`
- Produces: `panel.getState(): object`
- `state` shape: `{ mode, nickname, message, bestScore, leaderboard, loading }`
- `options` callbacks: `{ onLogin(nickname, passphrase), onLogout(), onRefresh() }`

- [ ] **Step 1: Write UI tests**

Add these tests to `tests/arcade.test.js`:

```js
test("leaderboard ui module renders offline and logged in states as html", () => {
  const { renderLeaderboardPanelHtml } = require("../src/leaderboard/ui");

  const offline = renderLeaderboardPanelHtml({
    mode: "offline",
    nickname: "",
    message: "离线游玩中",
    bestScore: 0,
    leaderboard: [],
    loading: false
  });
  const online = renderLeaderboardPanelHtml({
    mode: "ready",
    nickname: "Ada",
    message: "已登录",
    bestScore: 120,
    leaderboard: [{ rank: 1, nickname: "Ada", score: 120, submittedAt: "2026-07-09T00:00:00.000Z" }],
    loading: false
  });

  assert.ok(offline.includes("离线游玩中"));
  assert.ok(offline.includes("登录参加排行"));
  assert.ok(online.includes("Ada"));
  assert.ok(online.includes("120"));
});

test("index contains leaderboard panel mount point and config", () => {
  const html = require("fs").readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
  assert.ok(html.includes("window.ArcadeConfig"));
  assert.ok(html.includes('id="leaderboardPanel"'));
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node tests/arcade.test.js`

Expected: FAIL with `Cannot find module '../src/leaderboard/ui'` or missing `leaderboardPanel`.

- [ ] **Step 3: Implement `src/leaderboard/ui.js`**

```js
// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizePanelState(state) {
    return {
      mode: state && state.mode ? state.mode : "offline",
      nickname: state && state.nickname ? state.nickname : "",
      message: state && state.message ? state.message : "离线游玩中",
      bestScore: state && Number.isFinite(Number(state.bestScore)) ? Math.floor(Number(state.bestScore)) : 0,
      leaderboard: state && Array.isArray(state.leaderboard) ? state.leaderboard : [],
      loading: Boolean(state && state.loading)
    };
  }

  function renderRows(rows) {
    if (!rows.length) return '<li class="leaderboard-empty">暂无成绩</li>';
    return rows.map(function (row, index) {
      var rank = row.rank || index + 1;
      return '<li><span>#' + rank + '</span><strong>' + escapeHtml(row.nickname) + '</strong><em>' + Math.floor(Number(row.score) || 0) + '</em></li>';
    }).join("");
  }

  function renderLeaderboardPanelHtml(state) {
    var safe = normalizePanelState(state);
    var loggedIn = safe.mode === "ready";
    var form = loggedIn
      ? '<div class="player-line"><strong>' + escapeHtml(safe.nickname) + '</strong><button type="button" data-leaderboard-action="logout">退出</button></div>'
      : '<div class="login-grid"><label>昵称<input data-leaderboard-field="nickname" maxlength="20"></label><label>口令<input data-leaderboard-field="passphrase" maxlength="40" type="password"></label><button type="button" data-leaderboard-action="login">登录参加排行</button></div>';
    return [
      '<section class="leaderboard-card" aria-label="玩家排行">',
      '<h3>玩家排行</h3>',
      '<p class="leaderboard-message">' + escapeHtml(safe.loading ? "加载中" : safe.message) + '</p>',
      form,
      '<div class="best-score">个人最好 <strong>' + safe.bestScore + '</strong></div>',
      '<ol class="leaderboard-list">',
      renderRows(safe.leaderboard),
      '</ol>',
      '<button type="button" data-leaderboard-action="refresh">刷新排行</button>',
      '</section>'
    ].join("");
  }

  function createLeaderboardPanel(options) {
    var callbacks = options || {};
    var container = null;
    var currentState = normalizePanelState({});

    function bindEvents() {
      if (!container) return;
      var login = container.querySelector('[data-leaderboard-action="login"]');
      var logout = container.querySelector('[data-leaderboard-action="logout"]');
      var refresh = container.querySelector('[data-leaderboard-action="refresh"]');
      if (login) {
        login.addEventListener("click", function () {
          var nickname = container.querySelector('[data-leaderboard-field="nickname"]');
          var passphrase = container.querySelector('[data-leaderboard-field="passphrase"]');
          if (callbacks.onLogin) callbacks.onLogin(nickname ? nickname.value : "", passphrase ? passphrase.value : "");
        });
      }
      if (logout) logout.addEventListener("click", function () { if (callbacks.onLogout) callbacks.onLogout(); });
      if (refresh) refresh.addEventListener("click", function () { if (callbacks.onRefresh) callbacks.onRefresh(); });
    }

    function render() {
      if (!container) return;
      container.innerHTML = renderLeaderboardPanelHtml(currentState);
      bindEvents();
    }

    return {
      mount: function (target) {
        container = target;
        render();
      },
      setState: function (state) {
        currentState = normalizePanelState(Object.assign({}, currentState, state || {}));
        render();
      },
      getState: function () {
        return Object.assign({}, currentState, { leaderboard: currentState.leaderboard.slice() });
      }
    };
  }

  // ## EXPORT ##

  var api = {
    renderLeaderboardPanelHtml: renderLeaderboardPanelHtml,
    createLeaderboardPanel: createLeaderboardPanel
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

- [ ] **Step 4: Modify `index.html`**

Add this script before the game scripts:

```html
    <script>
      window.ArcadeConfig = {
        leaderboardApiUrl: ""
      };
    </script>
```

Add this container below `<nav id="gameList" class="game-list" aria-label="..."></nav>`:

```html
        <div id="leaderboardPanel" class="leaderboard-panel"></div>
```

Add CSS near the sidebar styles:

```css
      .leaderboard-panel {
        border-top: 2px solid var(--line);
        padding-top: 12px;
      }

      .leaderboard-card {
        display: grid;
        gap: 8px;
      }

      .leaderboard-card h3 {
        margin: 0;
        color: var(--yellow);
        font-size: 16px;
      }

      .leaderboard-message,
      .best-score,
      .leaderboard-empty {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
      }

      .login-grid {
        display: grid;
        gap: 6px;
      }

      .login-grid input {
        min-height: 36px;
        border: 2px solid var(--line);
        background: #09111f;
        color: var(--text);
        padding: 0 8px;
        font: inherit;
      }

      .player-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .leaderboard-list {
        display: grid;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .leaderboard-list li {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
      }

      .leaderboard-list strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text);
      }
```

- [ ] **Step 5: Add module to `build.js`**

Insert this module path after `src/leaderboard/client.js` and before `src/registry.js`:

```js
  "src/leaderboard/ui.js",
```

- [ ] **Step 6: Run tests**

Run: `node tests/arcade.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/leaderboard/ui.js index.html build.js tests/arcade.test.js
git commit -m "feat: add leaderboard sidebar ui"
```

Expected in a normal Git checkout: commit succeeds. In the current non-Git workspace: skip this command and record the changed files.

---

