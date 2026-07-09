(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.Arcade = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";


  // ====== src/shared/rng.js ======
function createRng(seed) {
    let value = seed || 1234567;
    return function random() {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  //

  // ====== src/shared/render.js ======
var COLORS = {
    bg: "#09111f",
    grid: "rgba(137, 220, 235, 0.08)",
    cyan: "#70e3ff",
    green: "#74f08a",
    pink: "#ff5fa2",
    yellow: "#ffd166",
    orange: "#ff9f1c",
    purple: "#b78cff",
    red: "#ff4d6d",
    white: "#f8fbff"
  };

  function cloneGrid(grid) {
    return grid.map(function (row) { return row.slice(); });
  }

  function drawPixelRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(Math.round(x + 2), Math.round(y + 2), Math.max(1, Math.round(w - 4)), 2);
  }

  function drawGrid(ctx, width, height, unit) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (var x = 0; x <= width; x += unit) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (var y = 0; y <= height; y += unit) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  function drawOverlay(ctx, canvas, text) {
    ctx.fillStyle = "rgba(3, 7, 18, 0.72)";
    ctx.fillRect(0, canvas.height / 2 - 44, canvas.width, 88);
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
  }

  //

  // ====== src/games/snake.js ======
function createSnakeGame(options) {
    if (options === undefined) options = {};

    var width = options.width || 24;
    var height = options.height || 18;
    var rng = createRng(options.seed || 8);
    var foodSequence = (options.foodSequence || []).slice();
    var snake;
    var direction;
    var nextDirection;
    var food;
    var score;
    var gameOver;
    var accumulator;

    function occupied(point, body) {
      if (body === undefined) body = snake;
      for (var i = 0; i < body.length; i++) {
        if (body[i].x === point.x && body[i].y === point.y) return true;
      }
      return false;
    }

    function randomFood() {
      if (foodSequence.length) return foodSequence.shift();
      var point;
      do {
        point = {
          x: Math.floor(rng() * width),
          y: Math.floor(rng() * height)
        };
      } while (occupied(point));
      return point;
    }

    function reset() {
      snake = (options.initialSnake || [
        { x: 8, y: 8 },
        { x: 7, y: 8 },
        { x: 6, y: 8 }
      ]).map(function (part) { return { x: part.x, y: part.y }; });
      direction = { x: (options.initialDirection || { x: 1, y: 0 }).x, y: (options.initialDirection || { x: 1, y: 0 }).y };
      nextDirection = { x: direction.x, y: direction.y };
      foodSequence = (options.foodSequence || []).slice();
      food = options.initialFood ? { x: options.initialFood.x, y: options.initialFood.y } : randomFood();
      score = 0;
      gameOver = false;
      accumulator = 0;
    }

    function input(action) {
      var vectors = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
      };
      var desired = vectors[action];
      if (!desired) return;
      if (desired.x + direction.x === 0 && desired.y + direction.y === 0) return;
      nextDirection = desired;
    }

    function step() {
      if (gameOver) return;
      direction = nextDirection;
      var head = snake[0];
      var next = { x: head.x + direction.x, y: head.y + direction.y };
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height || occupied(next)) {
        gameOver = true;
        return;
      }
      snake.unshift(next);
      if (next.x === food.x && next.y === food.y) {
        score += 10;
        food = randomFood();
      } else {
        snake.pop();
      }
    }

    function update(dt) {
      accumulator += dt;
      if (accumulator >= Math.max(70, 150 - score * 0.7)) {
        accumulator = 0;
        step();
      }
    }

    function draw(ctx, canvas) {
      var unit = Math.min(canvas.width / width, canvas.height / height);
      drawGrid(ctx, canvas.width, canvas.height, unit);
      drawPixelRect(ctx, food.x * unit, food.y * unit, unit, unit, COLORS.pink);
      snake.forEach(function (part, index) {
        drawPixelRect(ctx, part.x * unit, part.y * unit, unit, unit, index === 0 ? COLORS.green : COLORS.cyan);
      });
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function getState() {
      return {
        snake: snake.map(function (part) { return { x: part.x, y: part.y }; }),
        direction: { x: direction.x, y: direction.y },
        food: { x: food.x, y: food.y },
        score: score,
        gameOver: gameOver
      };
    }

    function getStatus() {
      return { score: score, level: Math.floor(score / 50) + 1, hint: "方向键 / WASD" };
    }

    reset();
    return { id: "snake", title: "贪吃蛇", reset: reset, input: input, update: update, draw: draw, step: step, getState: getState, getStatus: getStatus };
  }

  //

  // ====== src/games/twenty48.js ======
function create2048Game(options) {
    if (options === undefined) options = {};

    var size = 4;
    var rng = createRng(options.seed || 48);
    var spawnSequence = (options.spawnSequence || []).slice();
    var board;
    var score;
    var gameOver;

    function reset() {
      board = options.initialBoard ? cloneGrid(options.initialBoard) : Array.from({ length: size }, function () { return Array(size).fill(0); });
      spawnSequence = (options.spawnSequence || []).slice();
      score = 0;
      gameOver = false;
      if (!options.initialBoard) {
        spawnTile();
        spawnTile();
      }
    }

    function emptyCells() {
      var cells = [];
      for (var y = 0; y < size; y += 1) {
        for (var x = 0; x < size; x += 1) {
          if (!board[y][x]) cells.push({ x: x, y: y });
        }
      }
      return cells;
    }

    function spawnTile() {
      var empty = emptyCells();
      if (!empty.length) return;
      var next = spawnSequence.length ? spawnSequence.shift() : empty[Math.floor(rng() * empty.length)];
      if (board[next.y] && board[next.y][next.x] === 0) {
        board[next.y][next.x] = next.value || (rng() > 0.86 ? 4 : 2);
      }
    }

    function mergeLine(line) {
      var compact = line.filter(Boolean);
      var merged = [];
      var gained = 0;
      for (var index = 0; index < compact.length; index += 1) {
        if (compact[index] === compact[index + 1]) {
          var value = compact[index] * 2;
          merged.push(value);
          gained += value;
          index += 1;
        } else {
          merged.push(compact[index]);
        }
      }
      while (merged.length < size) merged.push(0);
      return { line: merged, gained: gained };
    }

    function hasMoves() {
      if (emptyCells().length) return true;
      for (var y = 0; y < size; y += 1) {
        for (var x = 0; x < size; x += 1) {
          if (board[y][x] === board[y][x + 1] || (board[y + 1] && board[y][x] === board[y + 1][x])) return true;
        }
      }
      return false;
    }

    function slide(action) {
      var before = JSON.stringify(board);
      var gained = 0;
      if (action === "left" || action === "right") {
        board = board.map(function (row) {
          var source = action === "left" ? row : row.slice().reverse();
          var result = mergeLine(source);
          gained += result.gained;
          return action === "left" ? result.line : result.line.reverse();
        });
      }
      if (action === "up" || action === "down") {
        for (var x = 0; x < size; x += 1) {
          var column = board.map(function (row) { return row[x]; });
          var source = action === "up" ? column : column.slice().reverse();
          var result = mergeLine(source);
          gained += result.gained;
          var merged = action === "up" ? result.line : result.line.reverse();
          for (var y = 0; y < size; y += 1) board[y][x] = merged[y];
        }
      }
      if (JSON.stringify(board) !== before) {
        score += gained;
        spawnTile();
        gameOver = !hasMoves();
      }
    }

    function input(action) {
      if (gameOver) return;
      if (["up", "down", "left", "right"].indexOf(action) !== -1) slide(action);
    }

    function update() { }

    function draw(ctx, canvas) {
      drawGrid(ctx, canvas.width, canvas.height, Math.min(canvas.width, canvas.height) / size);
      var boardSize = Math.min(canvas.width, canvas.height) * 0.86;
      var unit = boardSize / size;
      var startX = (canvas.width - boardSize) / 2;
      var startY = (canvas.height - boardSize) / 2;
      var palette = {
        2: COLORS.cyan,
        4: COLORS.green,
        8: COLORS.yellow,
        16: COLORS.orange,
        32: COLORS.pink,
        64: COLORS.red,
        128: COLORS.purple
      };
      ctx.fillStyle = "rgba(22, 34, 56, 0.92)";
      ctx.fillRect(startX - 8, startY - 8, boardSize + 16, boardSize + 16);
      board.forEach(function (row, y) {
        row.forEach(function (value, x) {
          var px = startX + x * unit + 5;
          var py = startY + y * unit + 5;
          drawPixelRect(ctx, px, py, unit - 10, unit - 10, value ? palette[value] || COLORS.white : "#1b2941");
          if (value) {
            ctx.fillStyle = "#07101d";
            ctx.font = "bold " + Math.max(18, unit * 0.28) + "px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(value), px + (unit - 10) / 2, py + (unit - 10) / 2);
          }
        });
      });
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function getState() {
      return { board: cloneGrid(board), score: score, gameOver: gameOver };
    }

    function getStatus() {
      var maxTile = Math.max.apply(null, board.flat());
      return { score: score, level: maxTile || 2, hint: "方向键 / WASD 滑动方块" };
    }

    reset();
    return { id: "twenty48", title: "2048", reset: reset, input: input, update: update, draw: draw, getState: getState, getStatus: getStatus };
  }

  //

  // ====== src/games/shooter.js ======
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

  //

  // ====== src/games/breakout.js ======
function createBreakoutGame() {
    var paddle;
    var ball;
    var bricks;
    var score;

    function reset() {
      paddle = { x: 190, y: 292, w: 100, h: 12, vx: 0 };
      ball = { x: 240, y: 250, vx: 160, vy: -180, size: 10 };
      score = 0;
      bricks = [];
      for (var y = 0; y < 5; y += 1) {
        for (var x = 0; x < 9; x += 1) {
          bricks.push({
            x: 18 + x * 50, y: 28 + y * 22, w: 40, h: 14, alive: true,
            color: [COLORS.pink, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.cyan][y]
          });
        }
      }
    }

    function input(action, active) {
      if (active === undefined) active = true;
      if (action === "left") paddle.vx = active ? -300 : 0;
      if (action === "right") paddle.vx = active ? 300 : 0;
    }

    function update(dtMs) {
      var dt = dtMs / 1000;
      paddle.x = Math.max(0, Math.min(480 - paddle.w, paddle.x + paddle.vx * dt));
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      if (ball.x <= 0 || ball.x >= 480 - ball.size) ball.vx *= -1;
      if (ball.y <= 0) ball.vy *= -1;
      if (ball.y > 330) {
        ball.x = 240;
        ball.y = 250;
        ball.vy = -180;
      }
      if (ball.x < paddle.x + paddle.w && ball.x + ball.size > paddle.x && ball.y < paddle.y + paddle.h && ball.y + ball.size > paddle.y) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - (paddle.x + paddle.w / 2)) * 3;
      }
      bricks.forEach(function (brick) {
        if (!brick.alive) return;
        if (ball.x < brick.x + brick.w && ball.x + ball.size > brick.x && ball.y < brick.y + brick.h && ball.y + ball.size > brick.y) {
          brick.alive = false;
          ball.vy *= -1;
          score += 10;
        }
      });
      if (bricks.every(function (brick) { return !brick.alive; })) reset();
    }

    function draw(ctx, canvas) {
      var sx = canvas.width / 480;
      var sy = canvas.height / 320;
      drawGrid(ctx, canvas.width, canvas.height, 20);
      bricks.forEach(function (brick) { if (brick.alive) drawPixelRect(ctx, brick.x * sx, brick.y * sy, brick.w * sx, brick.h * sy, brick.color); });
      drawPixelRect(ctx, paddle.x * sx, paddle.y * sy, paddle.w * sx, paddle.h * sy, COLORS.cyan);
      drawPixelRect(ctx, ball.x * sx, ball.y * sy, ball.size * sx, ball.size * sy, COLORS.yellow);
    }

    function getStatus() {
      return { score: score, level: Math.floor(score / 100) + 1, hint: "左右移动" };
    }

    reset();
    return { id: "breakout", title: "打砖块", reset: reset, input: input, update: update, draw: draw, getStatus: getStatus };
  }

  //

  // ====== src/games/dodger.js ======
function createDodgerGame() {
    var rng = createRng(33);
    var player;
    var hazards;
    var score;
    var gameOver;
    var spawnTimer;

    function reset() {
      player = { x: 220, y: 270, w: 24, h: 24, vx: 0, vy: 0 };
      hazards = [];
      score = 0;
      gameOver = false;
      spawnTimer = 0;
    }

    function input(action, active) {
      if (active === undefined) active = true;
      var speed = active ? 210 : 0;
      if (action === "left") player.vx = -speed;
      if (action === "right") player.vx = speed;
      if (action === "up") player.vy = -speed;
      if (action === "down") player.vy = speed;
    }

    function intersects(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function update(dtMs) {
      if (gameOver) return;
      var dt = dtMs / 1000;
      score += dt * 8;
      player.x = Math.max(0, Math.min(480 - player.w, player.x + player.vx * dt));
      player.y = Math.max(0, Math.min(320 - player.h, player.y + player.vy * dt));
      spawnTimer += dtMs;
      if (spawnTimer > Math.max(180, 620 - score * 2)) {
        spawnTimer = 0;
        var size = 12 + Math.floor(rng() * 20);
        hazards.push({
          x: rng() * (480 - size), y: -size, w: size, h: size,
          vy: 90 + rng() * 180,
          color: rng() > 0.5 ? COLORS.red : COLORS.orange
        });
      }
      hazards.forEach(function (hazard) {
        hazard.y += hazard.vy * dt;
        if (intersects(player, hazard)) gameOver = true;
      });
      hazards = hazards.filter(function (hazard) { return hazard.y < 350; });
    }

    function draw(ctx, canvas) {
      var sx = canvas.width / 480;
      var sy = canvas.height / 320;
      drawGrid(ctx, canvas.width, canvas.height, 20);
      hazards.forEach(function (hazard) { drawPixelRect(ctx, hazard.x * sx, hazard.y * sy, hazard.w * sx, hazard.h * sy, hazard.color); });
      drawPixelRect(ctx, player.x * sx, player.y * sy, player.w * sx, player.h * sy, COLORS.green);
      if (gameOver) drawOverlay(ctx, canvas, "被击落");
    }

    function getStatus() {
      return { score: Math.floor(score), level: Math.floor(score / 80) + 1, hint: "自由移动" };
    }

    reset();
    return { id: "dodger", title: "像素躲避", reset: reset, input: input, update: update, draw: draw, getStatus: getStatus };
  }

  //

  // ====== src/registry.js ======
function normalizeKeyAction(key) {
    var normalized = String(key || "").toLowerCase();
    if (normalized === "arrowup" || normalized === "w") return "up";
    if (normalized === "arrowdown" || normalized === "s") return "down";
    if (normalized === "arrowleft" || normalized === "a") return "left";
    if (normalized === "arrowright" || normalized === "d") return "right";
    if (normalized === "z" || normalized === "x") return "rotate";
    if (normalized === " ") return "drop";
    if (normalized === "1") return "choice1";
    if (normalized === "2") return "choice2";
    if (normalized === "3") return "choice3";
    if (normalized === "r") return "reset";
    if (normalized === "p") return "pause";
    return "";
  }

  function createGameRegistry() {
    return [
      { id: "snake", title: "\u8d2a\u5403\u86c7", factory: createSnakeGame, controls: "WASD / \u65b9\u5411\u952e" },
      { id: "twenty48", title: "2048", factory: create2048Game, controls: "WASD / \u65b9\u5411\u952e" },
      { id: "breakout", title: "\u6253\u7816\u5757", factory: createBreakoutGame, controls: "\u5de6\u53f3\u79fb\u52a8" },
      { id: "dodger", title: "\u50cf\u7d20\u95ea\u907f", factory: createDodgerGame, controls: "WASD / \u65b9\u5411\u952e" },
      { id: "shooter", title: "\u98de\u673a\u5927\u6218", factory: createShooterGame, controls: "\u81ea\u52a8\u5c04\u51fb / WASD\u79fb\u52a8" }
    ];
  }

  function bootArcade() {
    var canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var games = createGameRegistry();
    var gameList = document.getElementById("gameList");
    var scoreEl = document.getElementById("scoreValue");
    var levelEl = document.getElementById("levelValue");
    var hintEl = document.getElementById("hintValue");
    var titleEl = document.getElementById("gameTitle");
    var currentInfo = games[0];
    var currentGame = currentInfo.factory();
    var paused = true;
    var lastTime = performance.now();

    function resizeCanvas() {
      var rect = canvas.getBoundingClientRect();
      var scale = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * scale));
      canvas.height = Math.max(260, Math.floor(rect.height * scale));
      ctx.imageSmoothingEnabled = false;
    }

    function selectGame(id) {
      currentInfo = games.find(function (game) { return game.id === id; }) || games[0];
      currentGame = currentInfo.factory();
      paused = false;
      titleEl.textContent = currentInfo.title;
      Array.from(gameList.children).forEach(function (button) {
        button.classList.toggle("active", button.dataset.game === id);
      });
    }

    games.forEach(function (game) {
      var button = document.createElement("button");
      button.type = "button";
      button.dataset.game = game.id;
      button.innerHTML = "<span>" + game.title + "</span><small>" + game.controls + "</small>";
      button.addEventListener("click", function () { selectGame(game.id); });
      gameList.appendChild(button);
    });

    function resetCurrentGame() {
      currentGame.reset();
      paused = false;
    }

    function usesContinuousInput() {
      return ["breakout", "dodger", "shooter"].indexOf(currentInfo.id) !== -1;
    }

    window.addEventListener("keydown", function (event) {
      var action = normalizeKeyAction(event.key);
      if (!action) return;
      event.preventDefault();
      if (action === "pause") {
        paused = !paused;
        return;
      }
      if (action === "reset") {
        resetCurrentGame();
        return;
      }
      currentGame.input(action, true);
    });
    window.addEventListener("keyup", function (event) {
      var action = normalizeKeyAction(event.key);
      if (action && usesContinuousInput()) currentGame.input(action, false);
    });

    document.getElementById("startButton").addEventListener("click", function () {
      paused = false;
    });
    document.getElementById("pauseButton").addEventListener("click", function () {
      paused = !paused;
    });
    document.getElementById("resetButton").addEventListener("click", resetCurrentGame);

    canvas.addEventListener("pointerdown", function (event) {
      if (currentGame.pickUpgradeAt && currentGame.pickUpgradeAt(event.clientX, canvas.getBoundingClientRect())) {
        event.preventDefault();
      }
    });

    document.querySelectorAll("[data-action]").forEach(function (button) {
      var action = button.dataset.action;
      button.addEventListener("pointerdown", function () { currentGame.input(action, true); });
      button.addEventListener("pointerup", function () {
        if (usesContinuousInput()) currentGame.input(action, false);
      });
      button.addEventListener("pointerleave", function () {
        if (usesContinuousInput()) currentGame.input(action, false);
      });
    });

    function loop(time) {
      var dt = Math.min(48, time - lastTime);
      lastTime = time;
      if (!paused) currentGame.update(dt);
      currentGame.draw(ctx, canvas);
      var status = currentGame.getStatus();
      scoreEl.textContent = status.score;
      levelEl.textContent = status.level;
      hintEl.textContent = paused ? "\u5df2\u6682\u505c" : status.hint;
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    selectGame("snake");
    requestAnimationFrame(loop);
  }

  //

  // ## EXPORT ##
  return {
    normalizeKeyAction: normalizeKeyAction,
    computeUpgradeCardRects: computeUpgradeCardRects,
    createGameRegistry: createGameRegistry,
    createSnakeGame: createSnakeGame,
    create2048Game: create2048Game,
    createShooterGame: createShooterGame,
    createBreakoutGame: createBreakoutGame,
    createDodgerGame: createDodgerGame,
    bootArcade: bootArcade
  };
});

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", function () {
    window.Arcade.bootArcade();
  });
}
