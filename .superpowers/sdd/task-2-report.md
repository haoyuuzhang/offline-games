# Task 2 Report: Frontend Leaderboard API Client

## Implemented
- Added `src/leaderboard/client.js` with `createLeaderboardClient(options)`.
- The client consumes `normalizeApiUrl`, supports injected `fetchImpl`, and exposes:
  - `isConfigured()`
  - `registerOrLogin(nickname, passphrase)`
  - `getMe(token)`
  - `getLeaderboard(gameId, limit)`
  - `getMyScore(token, gameId)`
  - `submitScore(token, gameId, score)`
- Offline behavior returns `{ ok: false, error: "offline", message: "排行榜未配置" }`.
- Network / HTTP failures return the required `Result` shape with stable error and message fields.
- Updated `build.js` so the concatenated bundle includes `src/leaderboard/client.js` and exports `createLeaderboardClient`.
- Updated `tests/arcade.test.js` with the two required leaderboard-client tests, made the runner await async tests, and added a bundle export assertion for the new client.
- Regenerated `arcade.js` from the updated source modules.

## TDD Evidence
- RED: `node tests/arcade.test.js` failed with `Cannot find module '../src/leaderboard/client'` when the new client tests ran.
- GREEN: after adding the client and wiring the bundle, `node build.js` succeeded and `node tests/arcade.test.js` passed with all tests green.

## Verification
- `node build.js` -> `✔ arcade.js built from 11 source modules`
- `node tests/arcade.test.js` -> all tests passed

## Files Changed
- `src/leaderboard/client.js`
- `build.js`
- `tests/arcade.test.js`
- `arcade.js`

## Self-Review
- The client is small, dependency-light, and browser-safe.
- The build pipeline now exposes the new client in the generated bundle.
- The async test harness change is localized to the test file and does not affect production code.

## Concerns
- `getMe`, `getLeaderboard`, and `getMyScore` endpoint semantics are inferred from the task brief and not validated against a live backend.

## Commits
- Unavailable: this workspace does not have a `.git` repository.