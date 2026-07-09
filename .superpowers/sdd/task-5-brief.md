### Task 5: Cloudflare Worker Schema And Core API

**Files:**
- Create: `worker/schema.sql`
- Create: `worker/src/worker.js`
- Create: `worker/tests/worker.test.js`
- Create: `worker/wrangler.toml.example`

**Interfaces:**
- Produces: Worker default export `{ fetch(request, env): Promise<Response> }`
- Produces: `createWorkerApp(deps): { fetch(request, env): Promise<Response> }`
- Produces endpoints:
  - `POST /api/auth/register-or-login`
  - `GET /api/auth/me`
  - `GET /api/leaderboards/:gameId?limit=10`
  - `GET /api/scores/me/:gameId`
  - `POST /api/scores`
- D1 binding name: `DB`

- [ ] **Step 1: Write D1 schema**

Create `worker/schema.sql`:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL UNIQUE,
  nickname_normalized TEXT NOT NULL UNIQUE,
  passphrase_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  submitted_at TEXT NOT NULL,
  UNIQUE (user_id, game_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_scores_game_score
  ON scores(game_id, score DESC, submitted_at ASC);

CREATE INDEX idx_sessions_token
  ON sessions(token_hash);

CREATE INDEX idx_users_nickname_normalized
  ON users(nickname_normalized);
```

- [ ] **Step 2: Write Worker tests**

Create `worker/tests/worker.test.js`:

```js
const assert = require("assert");
const { createWorkerApp } = require("../src/worker");

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => console.log(`PASS ${name}`))
    .catch((error) => {
      console.error(`FAIL ${name}`);
      console.error(error);
      process.exitCode = 1;
    });
}

function createMemoryDb() {
  const users = [];
  const sessions = [];
  const scores = [];
  return {
    users,
    sessions,
    scores,
    prepare(sql) {
      const command = { sql, values: [] };
      return {
        bind(...values) {
          command.values = values;
          return this;
        },
        async first() {
          return runFirst(command, users, sessions, scores);
        },
        async all() {
          return { results: runAll(command, users, sessions, scores) };
        },
        async run() {
          runMutation(command, users, sessions, scores);
          return { success: true };
        }
      };
    }
  };
}

function runFirst(command, users, sessions, scores) {
  if (command.sql.includes("FROM users WHERE nickname_normalized")) {
    return users.find((user) => user.nickname_normalized === command.values[0]) || null;
  }
  if (command.sql.includes("FROM sessions")) {
    const session = sessions.find((item) => item.token_hash === command.values[0] && item.expires_at > command.values[1]);
    if (!session) return null;
    const user = users.find((item) => item.id === session.user_id);
    return user ? { user_id: user.id, nickname: user.nickname } : null;
  }
  if (command.sql.includes("FROM scores WHERE user_id")) {
    return scores.find((score) => score.user_id === command.values[0] && score.game_id === command.values[1]) || null;
  }
  return null;
}

function runAll(command, users, sessions, scores) {
  if (command.sql.includes("FROM scores JOIN users")) {
    const gameId = command.values[0];
    const limit = command.values[1];
    return scores
      .filter((score) => score.game_id === gameId)
      .sort((a, b) => b.score - a.score || a.submitted_at.localeCompare(b.submitted_at))
      .slice(0, limit)
      .map((score, index) => ({
        rank: index + 1,
        nickname: users.find((user) => user.id === score.user_id).nickname,
        score: score.score,
        submittedAt: score.submitted_at
      }));
  }
  return [];
}

function runMutation(command, users, sessions, scores) {
  if (command.sql.startsWith("INSERT INTO users")) {
    users.push({
      id: command.values[0],
      nickname: command.values[1],
      nickname_normalized: command.values[2],
      passphrase_hash: command.values[3],
      created_at: command.values[4],
      updated_at: command.values[5]
    });
  }
  if (command.sql.startsWith("INSERT INTO sessions")) {
    sessions.push({
      id: command.values[0],
      user_id: command.values[1],
      token_hash: command.values[2],
      expires_at: command.values[3],
      created_at: command.values[4]
    });
  }
  if (command.sql.startsWith("INSERT INTO scores")) {
    const existing = scores.find((score) => score.user_id === command.values[1] && score.game_id === command.values[2]);
    if (!existing) {
      scores.push({ id: command.values[0], user_id: command.values[1], game_id: command.values[2], score: command.values[3], submitted_at: command.values[4] });
    } else if (command.values[3] > existing.score) {
      existing.score = command.values[3];
      existing.submitted_at = command.values[4];
    }
  }
}

function createEnv() {
  return { DB: createMemoryDb(), ALLOWED_ORIGINS: "null,http://localhost:8787" };
}

async function json(response) {
  return JSON.parse(await response.text());
}

test("register login submit and leaderboard work per game", async () => {
  const app = createWorkerApp({ now: () => "2026-07-09T00:00:00.000Z", randomId: () => "fixed-id" });
  const env = createEnv();

  const loginResponse = await app.fetch(new Request("https://api.test/api/auth/register-or-login", {
    method: "POST",
    body: JSON.stringify({ nickname: "Ada", passphrase: "secret" })
  }), env);
  const login = await json(loginResponse);

  assert.strictEqual(login.ok, true);
  assert.strictEqual(login.user.nickname, "Ada");

  const scoreResponse = await app.fetch(new Request("https://api.test/api/scores", {
    method: "POST",
    headers: { Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ gameId: "snake", score: 120 })
  }), env);
  assert.strictEqual((await json(scoreResponse)).personalBest, true);

  const lowerResponse = await app.fetch(new Request("https://api.test/api/scores", {
    method: "POST",
    headers: { Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ gameId: "snake", score: 80 })
  }), env);
  assert.strictEqual((await json(lowerResponse)).personalBest, false);

  const boardResponse = await app.fetch(new Request("https://api.test/api/leaderboards/snake?limit=10"), env);
  const board = await json(boardResponse);
  assert.deepStrictEqual(board.rows.map((row) => row.score), [120]);

  const otherBoardResponse = await app.fetch(new Request("https://api.test/api/leaderboards/twenty48?limit=10"), env);
  assert.deepStrictEqual((await json(otherBoardResponse)).rows, []);
});

test("worker rejects invalid game id and score", async () => {
  const app = createWorkerApp({ now: () => "2026-07-09T00:00:00.000Z", randomId: () => "fixed-id" });
  const env = createEnv();
  const login = await json(await app.fetch(new Request("https://api.test/api/auth/register-or-login", {
    method: "POST",
    body: JSON.stringify({ nickname: "Ada", passphrase: "secret" })
  }), env));

  const badGame = await json(await app.fetch(new Request("https://api.test/api/scores", {
    method: "POST",
    headers: { Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ gameId: "missing", score: 120 })
  }), env));
  const badScore = await json(await app.fetch(new Request("https://api.test/api/scores", {
    method: "POST",
    headers: { Authorization: `Bearer ${login.token}` },
    body: JSON.stringify({ gameId: "snake", score: -1 })
  }), env));

  assert.strictEqual(badGame.ok, false);
  assert.strictEqual(badScore.ok, false);
});
```

- [ ] **Step 3: Run Worker tests and verify failure**

Run: `node worker/tests/worker.test.js`

Expected: FAIL with `Cannot find module '../src/worker'`.

- [ ] **Step 4: Implement `worker/src/worker.js`**

Create the Worker module with CommonJS compatibility for tests:

```js
const GAMES = ["snake", "twenty48", "breakout", "dodger", "shooter"];
const SCORE_LIMITS = { snake: 100000, twenty48: 1000000, breakout: 100000, dodger: 100000, shooter: 1000000 };

function allowedOrigin(env, origin) {
  const configured = String(env.ALLOWED_ORIGINS || "null").split(",").map((item) => item.trim()).filter(Boolean);
  if (configured.includes(origin)) return origin;
  if (!origin && configured.includes("null")) return "null";
  return configured[0] || "null";
}

function json(data, status, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(data), { status: status || 200, headers });
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cleanNickname(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 20);
}

function normalizeNickname(value) {
  return cleanNickname(value).toLowerCase();
}

function addDays(iso, days) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function bearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

async function readBody(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

async function currentUser(env, token, now) {
  if (!token) return null;
  const tokenHash = await sha256(token);
  return env.DB.prepare(
    "SELECT users.id AS user_id, users.nickname AS nickname FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?"
  ).bind(tokenHash, now).first();
}

function createWorkerApp(deps) {
  const now = deps && deps.now ? deps.now : () => new Date().toISOString();
  const randomId = deps && deps.randomId ? deps.randomId : () => crypto.randomUUID();

  async function handleRegisterOrLogin(request, env, origin) {
    const body = await readBody(request);
    const nickname = cleanNickname(body.nickname);
    const normalized = normalizeNickname(nickname);
    const passphrase = String(body.passphrase || "");
    if (nickname.length < 2 || passphrase.length < 3) {
      return json({ ok: false, error: "invalid_credentials", message: "昵称或口令无效" }, 400, origin);
    }

    const existing = await env.DB.prepare("SELECT * FROM users WHERE nickname_normalized = ?").bind(normalized).first();
    const passphraseHash = await sha256(normalized + ":" + passphrase);
    const timestamp = now();
    let user = existing;
    if (!user) {
      user = { id: randomId(), nickname, nickname_normalized: normalized, passphrase_hash: passphraseHash };
      await env.DB.prepare(
        "INSERT INTO users (id, nickname, nickname_normalized, passphrase_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(user.id, user.nickname, user.nickname_normalized, user.passphrase_hash, timestamp, timestamp).run();
    } else if (user.passphrase_hash !== passphraseHash) {
      return json({ ok: false, error: "invalid_credentials", message: "昵称或口令无效" }, 401, origin);
    }

    const token = randomId() + "." + randomId();
    const tokenHash = await sha256(token);
    const expiresAt = addDays(timestamp, 30);
    await env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(randomId(), user.id, tokenHash, expiresAt, timestamp).run();
    return json({ ok: true, token, expiresAt, user: { id: user.id, nickname: user.nickname } }, 200, origin);
  }

  async function handleMe(request, env, origin) {
    const user = await currentUser(env, bearerToken(request), now());
    if (!user) return json({ ok: false, error: "unauthorized", message: "请先登录" }, 401, origin);
    return json({ ok: true, user: { id: user.user_id, nickname: user.nickname } }, 200, origin);
  }

  async function handleLeaderboard(url, env, origin) {
    const gameId = decodeURIComponent(url.pathname.split("/").pop());
    if (!GAMES.includes(gameId)) return json({ ok: false, error: "invalid_game", message: "游戏不存在" }, 400, origin);
    const limit = Math.max(1, Math.min(50, Math.floor(Number(url.searchParams.get("limit")) || 10)));
    const result = await env.DB.prepare(
      "SELECT users.nickname AS nickname, scores.score AS score, scores.submitted_at AS submittedAt FROM scores JOIN users ON users.id = scores.user_id WHERE scores.game_id = ? ORDER BY scores.score DESC, scores.submitted_at ASC LIMIT ?"
    ).bind(gameId, limit).all();
    const rows = (result.results || []).map((row, index) => ({
      rank: index + 1,
      nickname: row.nickname,
      score: row.score,
      submittedAt: row.submittedAt
    }));
    return json({ ok: true, rows }, 200, origin);
  }

  async function handleMyScore(request, env, origin, gameId) {
    if (!GAMES.includes(gameId)) return json({ ok: false, error: "invalid_game", message: "游戏不存在" }, 400, origin);
    const user = await currentUser(env, bearerToken(request), now());
    if (!user) return json({ ok: false, error: "unauthorized", message: "请先登录" }, 401, origin);
    const row = await env.DB.prepare("SELECT score, submitted_at AS submittedAt FROM scores WHERE user_id = ? AND game_id = ?")
      .bind(user.user_id, gameId).first();
    return json({ ok: true, score: row ? row.score : 0, submittedAt: row ? row.submittedAt : "" }, 200, origin);
  }

  async function handleSubmitScore(request, env, origin) {
    const user = await currentUser(env, bearerToken(request), now());
    if (!user) return json({ ok: false, error: "unauthorized", message: "请先登录" }, 401, origin);
    const body = await readBody(request);
    const gameId = String(body.gameId || "");
    const score = Number(body.score);
    if (!GAMES.includes(gameId)) return json({ ok: false, error: "invalid_game", message: "游戏不存在" }, 400, origin);
    if (!Number.isInteger(score) || score < 0 || score > SCORE_LIMITS[gameId]) {
      return json({ ok: false, error: "invalid_score", message: "分数无效" }, 400, origin);
    }
    const previous = await env.DB.prepare("SELECT score FROM scores WHERE user_id = ? AND game_id = ?").bind(user.user_id, gameId).first();
    const personalBest = !previous || score > previous.score;
    if (personalBest) {
      await env.DB.prepare(
        "INSERT INTO scores (id, user_id, game_id, score, submitted_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, game_id) DO UPDATE SET score = excluded.score, submitted_at = excluded.submitted_at WHERE excluded.score > scores.score"
      ).bind(randomId(), user.user_id, gameId, score, now()).run();
    }
    return json({ ok: true, accepted: true, personalBest, score: personalBest ? score : previous.score }, 200, origin);
  }

  async function fetch(request, env) {
    const url = new URL(request.url);
    const origin = allowedOrigin(env, request.headers.get("Origin") || "null");
    if (request.method === "OPTIONS") return json({ ok: true }, 200, origin);
    if (request.method === "POST" && url.pathname === "/api/auth/register-or-login") return handleRegisterOrLogin(request, env, origin);
    if (request.method === "GET" && url.pathname === "/api/auth/me") return handleMe(request, env, origin);
    if (request.method === "GET" && url.pathname.startsWith("/api/leaderboards/")) return handleLeaderboard(url, env, origin);
    if (request.method === "GET" && url.pathname.startsWith("/api/scores/me/")) return handleMyScore(request, env, origin, decodeURIComponent(url.pathname.split("/").pop()));
    if (request.method === "POST" && url.pathname === "/api/scores") return handleSubmitScore(request, env, origin);
    return json({ ok: false, error: "not_found", message: "接口不存在" }, 404, origin);
  }

  return { fetch };
}

const app = createWorkerApp();

module.exports = { createWorkerApp, fetch: app.fetch };
```

- [ ] **Step 5: Create `worker/wrangler.toml.example`**

```toml
name = "offline-arcade-leaderboard"
main = "src/worker.js"
compatibility_date = "2026-07-09"

[[d1_databases]]
binding = "DB"
database_name = "offline-arcade-leaderboard"
database_id = "replace-with-cloudflare-d1-database-id"

[vars]
ALLOWED_ORIGINS = "https://example.com,null"
```

- [ ] **Step 6: Run Worker tests**

Run: `node worker/tests/worker.test.js`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add worker/schema.sql worker/src/worker.js worker/tests/worker.test.js worker/wrangler.toml.example
git commit -m "feat: add worker leaderboard api"
```

Expected in a normal Git checkout: commit succeeds. In the current non-Git workspace: skip this command and record the changed files.

---

