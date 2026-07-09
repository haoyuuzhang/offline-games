### Task 6: Documentation And End-To-End Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-09-online-leaderboard-design.md` only if implementation choices require a spec correction

**Interfaces:**
- Consumes: frontend static files and Worker files from previous tasks.
- Produces: documented offline mode and website leaderboard mode.

- [ ] **Step 1: Update README offline and website sections**

Add this section after the existing browser deployment section:

```markdown
## 在线排行榜模式

游戏仍然可以完全离线游玩。只有配置了排行榜 API 并且玩家使用昵称和口令登录后，成绩才会上传。

推荐部署方式：

1. 把静态前端部署到 Cloudflare Pages、GitHub Pages 或任意静态文件服务器。
2. 创建 Cloudflare D1 数据库。
3. 使用 `worker/schema.sql` 初始化数据库。
4. 复制 `worker/wrangler.toml.example` 为 `worker/wrangler.toml`，填入 D1 database_id 和允许的站点域名。
5. 部署 Worker。
6. 在 `index.html` 的 `window.ArcadeConfig.leaderboardApiUrl` 中填入 Worker 地址。

未配置 `leaderboardApiUrl` 时，页面显示离线游玩状态，不上传成绩。
```

- [ ] **Step 2: Run build**

Run: `node build.js`

Expected: `arcade.js built from 11 source modules`.

- [ ] **Step 3: Run frontend tests**

Run: `node tests/arcade.test.js`

Expected: all tests PASS.

- [ ] **Step 4: Run Worker tests**

Run: `node worker/tests/worker.test.js`

Expected: all tests PASS.

- [ ] **Step 5: Static offline sanity check**

Run: `Select-String -Path 'index.html' -Pattern 'leaderboardApiUrl: ""'`

Expected: output shows the empty default API URL, confirming offline mode is the default.

- [ ] **Step 6: Commit**

Run:

```bash
git add README.md arcade.js
git commit -m "docs: document leaderboard deployment"
```

Expected in a normal Git checkout: commit succeeds. In the current non-Git workspace: skip this command and record the changed files.

---

## Final Verification Checklist

- [ ] `node tests/arcade.test.js` passes.
- [ ] `node worker/tests/worker.test.js` passes.
- [ ] `node build.js` regenerates `arcade.js` from the source modules.
- [ ] `index.html` has `window.ArcadeConfig.leaderboardApiUrl` defaulting to an empty string.
- [ ] `index.html` has `#leaderboardPanel`.
- [ ] Offline local open remains possible with no Worker URL.
- [ ] Worker tests prove per-game leaderboards are independent.
- [ ] README documents both offline package mode and website leaderboard mode.


