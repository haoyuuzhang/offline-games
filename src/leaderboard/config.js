// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  var LEADERBOARD_GAMES = ["snake", "twenty48", "breakout", "dodger", "shooter"];

  var SCORE_LIMITS = {
    snake: 100000,
    twenty48: 1000000,
    breakout: 100000,
    dodger: 100000,
    shooter: 1000000
  };

  function normalizeApiUrl(value) {
    var text = String(value || "").trim();
    while (text.endsWith("/")) text = text.slice(0, -1);
    return text;
  }

  function getLeaderboardConfig(root) {
    var source = root || (typeof window !== "undefined" ? window : {});
    var config = source.ArcadeConfig || {};
    return {
      apiUrl: normalizeApiUrl(config.leaderboardApiUrl || ""),
      games: LEADERBOARD_GAMES.slice(),
      scoreLimits: Object.assign({}, SCORE_LIMITS)
    };
  }

  // ## EXPORT ##

  var api = {
    LEADERBOARD_GAMES: LEADERBOARD_GAMES,
    SCORE_LIMITS: SCORE_LIMITS,
    normalizeApiUrl: normalizeApiUrl,
    getLeaderboardConfig: getLeaderboardConfig
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();