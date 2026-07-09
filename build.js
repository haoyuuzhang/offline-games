// build.js - concatenate src/ modules into a single arcade.js
//
// Usage:  node build.js
// Output: arcade.js (overwritten)

"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = __dirname;

// Files in load order (each upstream of registry.js)
var modules = [
  "src/shared/rng.js",
  "src/shared/render.js",
  "src/games/snake.js",
  "src/games/twenty48.js",
  "src/games/shooter.js",
  "src/games/breakout.js",
  "src/games/dodger.js",
  "src/registry.js"
];

// ---- helpers ----

function readFile(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

// Extract the implementation body between "## IMPLEMENTATION ##" and "## EXPORT ##".
function extractImpl(source, fileLabel) {
  var implStart = source.indexOf("## IMPLEMENTATION ##");
  var exportStart = source.indexOf("## EXPORT ##");

  if (implStart === -1 || exportStart === -1) {
    throw new Error("Missing markers in " + fileLabel);
  }

  // Advance past the marker line
  implStart = source.indexOf("\n", implStart) + 1;

  var body = source.slice(implStart, exportStart).trim();

  return "\n  // ====== " + fileLabel + " ======\n" + body;
}

// ---- main ----

var impls = modules.map(function (rel) {
  return extractImpl(readFile(rel), rel);
}).join("\n");

var output = [
  '(function (root, factory) {',
  '  var api = factory();',
  '  if (typeof module === "object" && module.exports) {',
  '    module.exports = api;',
  '  }',
  '  root.Arcade = api;',
  '})(typeof window !== "undefined" ? window : globalThis, function () {',
  '  "use strict";',
  '',
  impls,
  '',
  '  // ## EXPORT ##',
  '  return {',
  '    normalizeKeyAction: normalizeKeyAction,',
  '    computeUpgradeCardRects: computeUpgradeCardRects,',
  '    createGameRegistry: createGameRegistry,',
  '    createSnakeGame: createSnakeGame,',
  '    create2048Game: create2048Game,',
  '    createShooterGame: createShooterGame,',
  '    createBreakoutGame: createBreakoutGame,',
  '    createDodgerGame: createDodgerGame,',
  '    bootArcade: bootArcade',
  '  };',
  '});',
  '',
  'if (typeof window !== "undefined") {',
  '  window.addEventListener("DOMContentLoaded", function () {',
  '    window.Arcade.bootArcade();',
  '  });',
  '}',
  ''
].join("\n");

fs.writeFileSync(path.join(ROOT, "arcade.js"), output, "utf8");
console.log("✔ arcade.js built from " + modules.length + " source modules");
