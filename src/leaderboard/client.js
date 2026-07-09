// ---- WRAPPER ----
(function () {
  "use strict";

  // ---- DEPS ----
  var normalizeApiUrl;

  if (typeof module !== "undefined" && module.exports) {
    normalizeApiUrl = require("./config").normalizeApiUrl;
  } else {
    normalizeApiUrl = window.Arcade.normalizeApiUrl;
  }

  // ## IMPLEMENTATION ##

  function offlineResult() {
    return { ok: false, error: "offline", message: "\u6392\u884c\u699c\u672a\u914d\u7f6e" };
  }

  function errorResult(error, message) {
    return { ok: false, error: error || "request_failed", message: message || "\u8bf7\u6c42\u5931\u8d25" };
  }

  function createLeaderboardClient(options) {
    options = options || {};

    var apiUrl = normalizeApiUrl(options.apiUrl || "");
    var fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);

    function isConfigured() {
      return Boolean(apiUrl && fetchImpl);
    }

    async function request(path, requestOptions) {
      if (!isConfigured()) {
        return offlineResult();
      }

      try {
        var response = await fetchImpl(apiUrl + path, requestOptions);
        var payload = {};

        if (response && typeof response.json === "function") {
          try {
            payload = await response.json();
          } catch (jsonError) {
            payload = {};
          }
        }

        if (!response || !response.ok || (payload && payload.ok === false)) {
          var statusCode = response && typeof response.status === "number" ? response.status : 0;
          return errorResult(payload && payload.error || (statusCode ? "http_" + statusCode : "request_failed"), payload && payload.message || "\u8bf7\u6c42\u5931\u8d25");
        }

        return { ok: true, data: payload };
      } catch (error) {
        return errorResult("network_unavailable", "\u7f51\u7edc\u4e0d\u53ef\u7528");
      }
    }

    function getRequest(path, token) {
      var headers = {};
      if (token) {
        headers.Authorization = "Bearer " + token;
      }
      return request(path, { method: "GET", headers: headers });
    }

    function jsonRequest(path, token, body) {
      var headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = "Bearer " + token;
      }
      return request(path, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body || {})
      });
    }

    function registerOrLogin(nickname, passphrase) {
      return jsonRequest("/api/auth/register-or-login", "", {
        nickname: nickname,
        passphrase: passphrase
      });
    }

    function getMe(token) {
      return getRequest("/api/auth/me", token);
    }

    function getLeaderboard(gameId, limit) {
      var safeLimit = Math.max(1, Math.min(50, Math.floor(Number(limit) || 10)));
      return getRequest("/api/leaderboards/" + encodeURIComponent(String(gameId || "")) + "?limit=" + safeLimit);
    }

    function getMyScore(token, gameId) {
      return getRequest("/api/scores/me/" + encodeURIComponent(String(gameId || "")), token);
    }

    function submitScore(token, gameId, score) {
      return jsonRequest("/api/scores", token, {
        gameId: String(gameId || ""),
        score: Math.max(0, Math.floor(Number(score) || 0))
      });
    }

    return {
      isConfigured: isConfigured,
      registerOrLogin: registerOrLogin,
      getMe: getMe,
      getLeaderboard: getLeaderboard,
      getMyScore: getMyScore,
      submitScore: submitScore
    };
  }

  // ## EXPORT ##

  var api = { createLeaderboardClient: createLeaderboardClient };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();