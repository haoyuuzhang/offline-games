// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

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

  // ## EXPORT ##

  var api = {
    COLORS: COLORS,
    cloneGrid: cloneGrid,
    drawPixelRect: drawPixelRect,
    drawGrid: drawGrid,
    drawOverlay: drawOverlay
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
