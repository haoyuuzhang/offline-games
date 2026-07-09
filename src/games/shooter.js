// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var createRng, COLORS, drawGrid, drawPixelRect, drawOverlay;

  if (typeof module !== "undefined" && module.exports) {
    var rng = require("../shared/rng");
    var render = require("../shared/render");
    createRng = rng.createRng;
    COLORS = render.COLORS;
    drawGrid = render.drawGrid;
    drawPixelRect = render.drawPixelRect;
    drawOverlay = render.drawOverlay;
  } else {
    var A = window.Arcade || {};
    createRng = A.createRng;
    COLORS = A.COLORS;
    drawGrid = A.drawGrid;
    drawPixelRect = A.drawPixelRect;
    drawOverlay = A.drawOverlay;
  }

  // ## IMPLEMENTATION ##

  var SHOOTER_UPGRADES = [
    { id: "doubleShot", title: "双发弹幕", desc: "+1 条弹道" },
    { id: "damage", title: "穿甲弹", desc: "伤害+1 子弹变宽" },
    { id: "rapidFire", title: "高速射击", desc: "射速提升" },
    { id: "moveSpeed", title: "推进器", desc: "移动更快" },
    { id: "maxLife", title: "装甲板", desc: "最大生命 +1" },
    { id: "vampire", title: "维修无人机", desc: "击杀可能回血" },
    { id: "slowEnemies", title: "干扰器", desc: "敌潮变慢" }
  ];

  function computeUpgradeCardRects(canvasWidth, canvasHeight) {
    var cardW = canvasWidth * 0.25;
    var cardH = canvasHeight * 0.28;
    var gap = canvasWidth * 0.045;
    var totalW = cardW * 3 + gap * 2;
    var startX = (canvasWidth - totalW) / 2;
    var y = canvasHeight * 0.38;
    return [0, 1, 2].map(function (index) {
      return {
        x: startX + index * (cardW + gap),
        y: y,
        w: cardW,
        h: cardH
      };
    });
  }

  function createShooterGame(options) {
    if (options === undefined) options = {};

    var rng = createRng(options.seed || 86);
    var upgradeSequence = (options.upgradeSequence || []).slice();
    var player;
    var bullets;
    var enemies;
    var score;
    var gameOver;
    var spawnTimer;
    var fireTimer;
    var elapsed;
    var level;
    var exp;
    var expToLevel;
    var levelUpPending;
    var upgradeChoices;
    var stats;
    var heldInput;

    function reset() {
      heldInput = { left: false, right: false, up: false, down: false };
      stats = {
        shots: 1,
        damage: 1,
        fireDelay: 400,
        moveSpeed: 240,
        maxLife: 3,
        bulletWidth: 4,
        healChance: 0,
        enemySlow: 1
      };
      player = options.initialPlayer ? {
        x: options.initialPlayer.x, y: options.initialPlayer.y,
        w: options.initialPlayer.w, h: options.initialPlayer.h,
        vx: options.initialPlayer.vx || 0, vy: options.initialPlayer.vy || 0
      } : { x: 226, y: 274, w: 28, h: 26, vx: 0, vy: 0 };
      player.life = player.life || stats.maxLife;
      bullets = (options.initialBullets || []).map(function (bullet) {
        var b = { damage: stats.damage, x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h, vy: bullet.vy };
        return b;
      });
      enemies = (options.initialEnemies || []).map(function (enemy) {
        return { hp: 1, maxHp: enemy.hp || 1, x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h, vy: enemy.vy };
      });
      score = 0;
      gameOver = false;
      spawnTimer = 0;
      fireTimer = (options.initialBullets || []).length ? stats.fireDelay : 0;
      elapsed = options.initialElapsed || 0;
      level = options.initialLevel || 1;
      exp = options.initialExp || 0;
      expToLevel = options.expToLevel || 4;
      levelUpPending = false;
      upgradeChoices = [];
      upgradeSequence = (options.upgradeSequence || []).slice();
    }

    function intersects(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function pickUpgradeChoices() {
      var choices = [];
      while (choices.length < 3) {
        var nextId = upgradeSequence.length ? upgradeSequence.shift() : SHOOTER_UPGRADES[Math.floor(rng() * SHOOTER_UPGRADES.length)].id;
        var upgrade = SHOOTER_UPGRADES.find(function (item) { return item.id === nextId; }) || SHOOTER_UPGRADES[0];
        if (!choices.some(function (choice) { return choice.id === upgrade.id; })) choices.push({ id: upgrade.id, title: upgrade.title, desc: upgrade.desc });
      }
      return choices;
    }

    function gainExp(amount) {
      exp += amount;
      while (exp >= expToLevel) {
        exp -= expToLevel;
        level += 1;
        expToLevel += 2;
        levelUpPending = true;
        upgradeChoices = pickUpgradeChoices();
      }
    }

    function applyUpgrade(upgrade) {
      if (!upgrade) return;
      if (upgrade.id === "doubleShot") stats.shots += 1;
      if (upgrade.id === "damage") { stats.damage += 1; stats.bulletWidth += 2; }
      if (upgrade.id === "rapidFire") stats.fireDelay = Math.max(55, stats.fireDelay - 25);
      if (upgrade.id === "moveSpeed") stats.moveSpeed += 35;
      if (upgrade.id === "maxLife") {
        stats.maxLife += 1;
        player.life = Math.min(stats.maxLife, player.life + 1);
      }
      if (upgrade.id === "vampire") stats.healChance = Math.min(0.45, stats.healChance + 0.16);
      if (upgrade.id === "slowEnemies") stats.enemySlow = Math.max(0.68, stats.enemySlow - 0.08);
      levelUpPending = false;
      upgradeChoices = [];
      fireTimer = 0;
    }

    function chooseUpgrade(index) {
      if (!levelUpPending) return false;
      applyUpgrade(upgradeChoices[index]);
      return true;
    }

    function fire() {
      if (fireTimer > 0 || gameOver || levelUpPending) return;
      var spread = 9;
      var total = stats.shots;
      for (var index = 0; index < total; index += 1) {
        var offset = (index - (total - 1) / 2) * spread;
        bullets.push({
          x: player.x + player.w / 2 - stats.bulletWidth / 2 + offset,
          y: player.y - 8,
          w: stats.bulletWidth,
          h: 12,
          vy: -320,
          damage: stats.damage
        });
      }
      fireTimer = stats.fireDelay;
    }

    function updateVelocity() {
      player.vx = (heldInput.right ? stats.moveSpeed : 0) - (heldInput.left ? stats.moveSpeed : 0);
      player.vy = (heldInput.down ? stats.moveSpeed : 0) - (heldInput.up ? stats.moveSpeed : 0);
    }

    function input(action, active) {
      if (active === undefined) active = true;
      if (levelUpPending) {
        if (active && action === "choice1") chooseUpgrade(0);
        if (active && action === "choice2") chooseUpgrade(1);
        if (active && action === "choice3") chooseUpgrade(2);
        return;
      }
      if (["left", "right", "up", "down"].indexOf(action) !== -1) {
        heldInput[action] = active;
        updateVelocity();
      }
      if ((action === "rotate" || action === "drop" || action === "fire") && active) fire();
    }

    function spawnEnemy() {
      var pressure = level + elapsed / 30;
      var large = pressure > 7 && rng() > 0.68;
      var size = (large ? 34 : 22) + Math.floor(rng() * 14);
      var hp = Math.max(1, 1 + Math.floor((level - 1) / 2) + (large ? 2 : 0) + Math.floor(elapsed / 55));
      enemies.push({
        x: rng() * (480 - size),
        y: -size,
        w: size,
        h: size,
        hp: hp,
        maxHp: hp,
        vy: (40 + rng() * 80 + level * 8 + elapsed * 0.8) * stats.enemySlow,
        value: large ? 2 : 1
      });
    }

    function damagePlayer() {
      player.life -= 1;
      if (player.life <= 0) gameOver = true;
    }

    function update(dtMs) {
      if (gameOver || levelUpPending) return;
      var dt = dtMs / 1000;
      elapsed += dt;
      fireTimer = Math.max(0, fireTimer - dtMs);
      fire();
      spawnTimer += dtMs;
      var spawnDelay = Math.max(150, 820 - level * 45 - elapsed * 5);
      if (spawnTimer > spawnDelay) {
        spawnTimer = 0;
        spawnEnemy();
      }
      player.x = Math.max(0, Math.min(480 - player.w, player.x + player.vx * dt));
      player.y = Math.max(0, Math.min(320 - player.h, player.y + player.vy * dt));
      bullets.forEach(function (bullet) {
        bullet.y += bullet.vy * dt;
      });
      enemies.forEach(function (enemy) {
        enemy.y += enemy.vy * dt;
        if (!enemy.hitPlayer && intersects(player, enemy)) {
          enemy.hitPlayer = true;
          enemy.hit = true;
          damagePlayer();
        }
      });
      bullets.forEach(function (bullet) {
        enemies.forEach(function (enemy) {
          if (!bullet.hit && !enemy.hit && intersects(bullet, enemy)) {
            bullet.hit = true;
            enemy.hp -= bullet.damage || stats.damage;
            if (enemy.hp <= 0) {
              enemy.hit = true;
              score += 25 * (enemy.value || 1);
              if (stats.healChance && rng() < stats.healChance) player.life = Math.min(stats.maxLife, player.life + 1);
              gainExp(enemy.value || 1);
            }
          }
        });
      });
      bullets = bullets.filter(function (bullet) { return bullet.y > -20 && !bullet.hit; });
      enemies = enemies.filter(function (enemy) { return enemy.y < 350 && !enemy.hit; });
    }

    function drawUpgradeCards(ctx, canvas) {
      ctx.fillStyle = "rgba(3, 7, 18, 0.82)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = COLORS.white;
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText("升级：", canvas.width / 2, canvas.height * 0.26);
      var rects = computeUpgradeCardRects(canvas.width, canvas.height);
      upgradeChoices.forEach(function (choice, index) {
        var rect = rects[index];
        drawPixelRect(ctx, rect.x, rect.y, rect.w, rect.h, [COLORS.cyan, COLORS.yellow, COLORS.pink][index]);
        ctx.fillStyle = "#07101d";
        ctx.font = "bold 18px monospace";
        ctx.fillText(String(index + 1), rect.x + rect.w / 2, rect.y + 30);
        ctx.font = "bold 15px monospace";
        ctx.fillText(choice.title, rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.font = "12px monospace";
        ctx.fillText(choice.desc, rect.x + rect.w / 2, rect.y + rect.h - 28);
      });
    }

    function draw(ctx, canvas) {
      var sx = canvas.width / 480;
      var sy = canvas.height / 320;
      drawGrid(ctx, canvas.width, canvas.height, 20);
      bullets.forEach(function (bullet) { drawPixelRect(ctx, bullet.x * sx, bullet.y * sy, bullet.w * sx, bullet.h * sy, COLORS.yellow); });
      enemies.forEach(function (enemy) {
        drawPixelRect(ctx, enemy.x * sx, enemy.y * sy, enemy.w * sx, enemy.h * sy, enemy.maxHp > 2 ? COLORS.purple : COLORS.red);
        if (enemy.maxHp > 1) {
          ctx.fillStyle = COLORS.green;
          ctx.fillRect(enemy.x * sx, (enemy.y - 5) * sy, enemy.w * sx * Math.max(0, enemy.hp / enemy.maxHp), 3 * sy);
        }
      });
      drawPixelRect(ctx, player.x * sx, player.y * sy, player.w * sx, player.h * sy, COLORS.cyan);
      drawPixelRect(ctx, (player.x + 8) * sx, (player.y - 8) * sy, 12 * sx, 10 * sy, COLORS.green);
      ctx.fillStyle = COLORS.white;
      ctx.font = "14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("生命 " + player.life + "/" + stats.maxLife + "  经验 " + exp + "/" + expToLevel, 12, 22);
      if (levelUpPending) drawUpgradeCards(ctx, canvas);
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function pickUpgradeAt(clientX, rect) {
      if (!levelUpPending || !rect) return false;
      var x = clientX - rect.left;
      var y = rect.height * 0.5;
      var cards = computeUpgradeCardRects(rect.width, rect.height);
      var index = cards.findIndex(function (card) { return x >= card.x && x <= card.x + card.w && y >= card.y && y <= card.y + card.h; });
      return index >= 0 ? chooseUpgrade(index) : false;
    }

    function getState() {
      return {
        player: { x: player.x, y: player.y, w: player.w, h: player.h, vx: player.vx, vy: player.vy, life: player.life },
        bullets: bullets.map(function (bullet) { return { x: bullet.x, y: bullet.y, w: bullet.w, h: bullet.h, vy: bullet.vy, damage: bullet.damage }; }),
        enemies: enemies.map(function (enemy) { return { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h, vy: enemy.vy, hp: enemy.hp, maxHp: enemy.maxHp, value: enemy.value }; }),
        score: score,
        level: level,
        exp: exp,
        expToLevel: expToLevel,
        elapsed: elapsed,
        stats: { shots: stats.shots, damage: stats.damage, fireDelay: stats.fireDelay, moveSpeed: stats.moveSpeed, maxLife: stats.maxLife, bulletWidth: stats.bulletWidth, healChance: stats.healChance, enemySlow: stats.enemySlow },
        levelUpPending: levelUpPending,
        upgradeChoices: upgradeChoices.map(function (choice) { return { id: choice.id, title: choice.title, desc: choice.desc }; }),
        gameOver: gameOver
      };
    }

    function getStatus() {
      return {
        score: score,
        level: level,
        hint: levelUpPending ? "选择升级：1 / 2 / 3" : "自动射击 生命 " + player.life + "/" + stats.maxLife + " 经验 " + exp + "/" + expToLevel
      };
    }

    reset();
    return { id: "shooter", title: "飞机大战", reset: reset, input: input, update: update, draw: draw, getState: getState, getStatus: getStatus, chooseUpgrade: chooseUpgrade, pickUpgradeAt: pickUpgradeAt };
  }

  // ## EXPORT ##

  var api = {
    computeUpgradeCardRects: computeUpgradeCardRects,
    createShooterGame: createShooterGame
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
