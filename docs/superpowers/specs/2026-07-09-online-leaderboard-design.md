# Online Leaderboard Design

## Goal

Extend the offline pixel arcade into a website that remains fully playable offline while optionally supporting logged-in score rankings when a network connection and leaderboard backend are available.

The static game must continue to work from local files without uploading scores. Players who log in with an exhibition-friendly nickname and passphrase can submit scores to per-game leaderboards through a Cloudflare Worker backed by D1/SQLite.

## Current Project Context

The project is currently a static browser arcade. `index.html` owns the layout and loads game scripts, while `src/registry.js` boots the arcade, switches games, dispatches input, updates the canvas, and synchronizes score/status UI. `build.js` can concatenate source modules into `arcade.js` for a small offline package.

The game registry currently exposes these independent games:

- `snake`
- `twenty48`
- `breakout`
- `dodger`
- `shooter`

Existing constraints remain in force:

- No network is required for normal play.
- Local `file://` usage must keep working.
- Static hosting must keep working.
- Core game logic should remain testable without a browser.
- Online ranking must degrade gracefully when unavailable.

## Recommended Approach

Use a static frontend plus a separate Cloudflare Worker API with D1.

The frontend remains the primary product. The online leaderboard is an optional enhancement controlled by configuration. If no API URL is configured, if the network fails, or if the player is not logged in, the game runs in offline mode and never uploads scores.

This approach keeps the current offline package simple while allowing the same static files to be deployed as a public website. The Worker handles account sessions, score submission, and leaderboard reads.

## User Experience

The first screen remains the playable arcade, not a marketing page.

The existing sidebar keeps the game list. A compact player and leaderboard area is added below it:

- Logged out state: show "offline play" status and a "join leaderboard" action.
- Login/register state: ask for nickname and passphrase.
- Logged in state: show nickname, logout action, the current game's personal best, and the current game's Top 10 leaderboard.
- Offline or backend unavailable state: show a calm offline message and keep the game playable.

The login flow uses nickname plus passphrase. If the nickname does not exist, the backend creates it. If it exists, the passphrase must match. This keeps exhibition sign-in fast without requiring email verification or third-party OAuth.

Leaderboards are independent per game. Switching games refreshes the leaderboard for the selected game.

## Score Submission Flow

Scores are only submitted when all of these are true:

- A leaderboard API URL is configured.
- The player is logged in.
- The current score is a non-negative integer.
- The current score is higher than the locally known best score for that game.

The frontend should attempt submission at stable moments:

- Game over.
- Reset before clearing the current run.
- Game switch before replacing the current game instance.

If submission fails, the game continues. The UI reports that the network is unavailable or the score has not been uploaded. The frontend may keep a small local pending queue for logged-in users and retry when the API becomes reachable.

## Frontend Components

### Configuration

Add a small configuration surface for the leaderboard API URL. This can be an inline global such as:

```js
window.ArcadeConfig = {
  leaderboardApiUrl: ""
};
```

An empty URL means offline-only mode. A deployed website can set the Worker URL without changing game logic.

### API Client

Add a focused leaderboard client responsible for:

- Registering or logging in.
- Loading the current session.
- Reading a game leaderboard.
- Reading the player's best score for a game.
- Submitting a score.
- Handling offline and error responses without throwing into the game loop.

The client should be written so it can be tested in Node with a fake `fetch` implementation.

### Session Store

Persist only the minimum frontend session data in `localStorage`:

- token
- nickname
- session expiration if provided
- per-game local best score cache
- optional pending submissions

Logout clears these values.

### UI Integration

`bootArcade()` should continue to own the game loop, but leaderboard concerns should be isolated behind small helpers. The game loop should not directly know HTTP details.

The registry should expose a clear hook for score finalization. At minimum, the arcade controller can compare the previous status to the current status and detect game-over-like states where games already report them through `getStatus()` or `getState()`. If needed, games can later expose a small `isFinished` or `runId` state, but the first implementation should avoid broad game rewrites.

## Worker API

All endpoints use JSON and return JSON. CORS must support the deployed static site and local exhibition use. For local `file://` requests, browsers may send a null or missing Origin; the Worker should handle that explicitly.

Endpoints:

```text
POST /api/auth/register-or-login
GET  /api/auth/me
GET  /api/leaderboards/:gameId?limit=10
GET  /api/scores/me/:gameId
POST /api/scores
```

### `POST /api/auth/register-or-login`

Request:

```json
{
  "nickname": "PlayerName",
  "passphrase": "simple secret"
}
```

Behavior:

- If nickname is new, create the user.
- If nickname exists, verify the passphrase.
- Return a bearer token and public user profile.

### `GET /api/auth/me`

Requires `Authorization: Bearer <token>`.

Returns the current session user if the token is valid and not expired.

### `GET /api/leaderboards/:gameId`

Returns the leaderboard for one game. Default limit is 10; maximum limit should be capped, for example at 50.

Rows contain:

- rank
- nickname
- score
- submittedAt

### `GET /api/scores/me/:gameId`

Requires login. Returns the current user's best score for one game.

### `POST /api/scores`

Requires login.

Request:

```json
{
  "gameId": "snake",
  "score": 120
}
```

Behavior:

- Validate token.
- Validate game ID against the known game list.
- Validate score as a non-negative integer.
- Validate score does not exceed the configured maximum for that game.
- Insert or update only when the submitted score is higher than the user's previous best for that game.
- Return whether the score was accepted and whether it became a new personal best.

## D1 Schema

Use three tables.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL UNIQUE,
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
```

The leaderboard query orders by `score DESC` and then `submitted_at ASC` so earlier submissions win ties.

## Security And Abuse Controls

This is an exhibition and portfolio leaderboard, not a high-stakes competitive system. The frontend score can be manipulated by a technical user, so the system should make ordinary misuse harder without claiming strong anti-cheat.

Required controls:

- Store passphrase hashes, not plaintext passphrases.
- Store token hashes, not plaintext tokens.
- Expire sessions.
- Clean and length-limit nicknames.
- Enforce game ID allowlist.
- Enforce integer score validation.
- Enforce per-game maximum score limits.
- Rate-limit login and score submission by account and IP where Cloudflare facilities allow it.
- Return generic auth errors to avoid leaking which nicknames exist.

The initial score maximums should be conservative and easy to adjust in Worker configuration. They are guardrails, not proof of fair play.

## Error Handling

Frontend failures must not interrupt play.

Expected degraded states:

- No API configured: show offline mode.
- API unreachable: show network unavailable and keep local play.
- Login failed: show short validation feedback.
- Session expired: clear token and return to logged-out state.
- Score submit failed: preserve local best and optionally queue retry.
- Leaderboard load failed: show a small unavailable message for the current game only.

Worker errors should return stable JSON shapes with `ok: false`, a short error code, and a user-safe message.

## Deployment

Static frontend deployment can use any static host, including Cloudflare Pages, GitHub Pages, or copying files to a web server. The offline package remains usable from USB or local disk.

Worker deployment requires:

- Cloudflare Worker project.
- D1 database.
- SQL migration for the tables and indexes.
- Environment binding for D1.
- Session/token secret configuration if needed.
- CORS allowed origins for the production static site and exhibition setup.

The README should document both modes:

- Offline package: no account, no upload, local play only.
- Website mode: optional login and per-game leaderboards.

## Testing Plan

Keep the existing arcade tests.

Add frontend tests for:

- Offline mode when no API URL is configured.
- Login success and token persistence.
- Login failure state.
- Leaderboard fetch for the selected game.
- Score submission only when logged in and score improves.
- Submission failure does not stop the game.
- Logout clears stored session data.

Add Worker tests for:

- New nickname creates a user.
- Existing nickname requires matching passphrase.
- Valid token returns `/api/auth/me`.
- Expired or invalid token is rejected.
- Score submission creates a personal best.
- Lower score does not overwrite a higher personal best.
- Leaderboard is independent per game.
- Invalid game IDs and invalid scores are rejected.
- Leaderboard limit is capped.

Manual verification:

- Open `index.html` through `file://` with no API URL and play normally.
- Deploy or run Worker locally and confirm login/ranking works.
- Disconnect network during play and confirm the game remains usable.
- Switch games and confirm each leaderboard is independent.

## Implementation Boundaries

This design does not require rewriting the games themselves. Most work should be limited to:

- A small frontend config.
- A leaderboard API client.
- Session/local storage helpers.
- A sidebar ranking UI.
- Score finalization hooks in the arcade controller.
- A new Cloudflare Worker directory with D1 schema and tests.
- Documentation for offline and website deployment.

Avoid adding a frontend framework unless a later requirement makes it necessary. The current no-dependency style is a strength for offline exhibition use.
