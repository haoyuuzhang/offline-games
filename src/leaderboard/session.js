// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  var SESSION_KEY = "offlineArcade.session";
  var BESTS_KEY = "offlineArcade.bestScores";
  var PENDING_KEY = "offlineArcade.pendingScores";

  function createMemoryStorage() {
    var memory = {};

    return {
      getItem: function (key) {
        return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
      },
      setItem: function (key, value) {
        memory[key] = String(value);
      },
      removeItem: function (key) {
        delete memory[key];
      }
    };
  }

  function resolveStorage(storage) {
    if (storage) {
      return storage;
    }

    if (typeof window !== "undefined") {
      try {
        return window.localStorage;
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function createSafeStorage(storage) {
    var fallback = createMemoryStorage();
    var target = resolveStorage(storage) || fallback;

    function withFallback(operation) {
      try {
        return operation(target);
      } catch (error) {
        target = fallback;
        try {
          return operation(target);
        } catch (fallbackError) {
          return null;
        }
      }
    }

    return {
      getItem: function (key) {
        var value = withFallback(function (store) {
          return store.getItem(key);
        });

        return value == null ? null : String(value);
      },
      setItem: function (key, value) {
        withFallback(function (store) {
          store.setItem(key, String(value));
          return true;
        });
      },
      removeItem: function (key) {
        withFallback(function (store) {
          store.removeItem(key);
          return true;
        });
      }
    };
  }

  function readJson(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      return;
    }
  }

  function normalizePendingItem(item, defaultCreatedAt) {
    if (!item) {
      return null;
    }

    var gameId = item.gameId == null ? "" : String(item.gameId).trim();
    if (!gameId) {
      return null;
    }

    return {
      gameId: gameId,
      score: Math.max(0, Math.floor(Number(item.score) || 0)),
      createdAt: item.createdAt == null || item.createdAt === "" ? String(defaultCreatedAt || "") : String(item.createdAt)
    };
  }

  function createSessionStore(storage) {
    var target = createSafeStorage(storage);

    function getSession() {
      var session = readJson(target, SESSION_KEY, null);
      if (!session || !session.token || !session.nickname) {
        return null;
      }

      return {
        token: String(session.token),
        nickname: String(session.nickname),
        expiresAt: session.expiresAt ? String(session.expiresAt) : ""
      };
    }

    function setSession(session) {
      writeJson(target, SESSION_KEY, {
        token: String(session && session.token || ""),
        nickname: String(session && session.nickname || ""),
        expiresAt: session && session.expiresAt ? String(session.expiresAt) : ""
      });
    }

    function clearSession() {
      target.removeItem(SESSION_KEY);
    }

    function getBestScore(gameId) {
      var bests = readJson(target, BESTS_KEY, {});
      var value = Number(bests[gameId] || 0);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function setBestScore(gameId, score) {
      var nextScore = Math.max(0, Math.floor(Number(score) || 0));
      var bests = readJson(target, BESTS_KEY, {});
      var current = Math.max(0, Math.floor(Number(bests[gameId]) || 0));
      if (nextScore > current) {
        bests[gameId] = nextScore;
        writeJson(target, BESTS_KEY, bests);
      }
    }

    function enqueuePending(submission) {
      var pending = readJson(target, PENDING_KEY, []);
      if (!Array.isArray(pending)) {
        pending = [];
      }

      var normalized = normalizePendingItem(submission, new Date().toISOString());
      if (!normalized) {
        return;
      }

      pending.push(normalized);
      writeJson(target, PENDING_KEY, pending.slice(-20));
    }

    function listPending() {
      var pending = readJson(target, PENDING_KEY, []);
      if (!Array.isArray(pending)) {
        return [];
      }

      return pending.map(function (item) {
        return normalizePendingItem(item, "");
      }).filter(Boolean);
    }

    function replacePending(items) {
      var next = [];
      if (Array.isArray(items)) {
        items.forEach(function (item) {
          var normalized = normalizePendingItem(item, "");
          if (normalized) {
            next.push(normalized);
          }
        });
      }

      writeJson(target, PENDING_KEY, next);
    }

    return {
      getSession: getSession,
      setSession: setSession,
      clearSession: clearSession,
      getBestScore: getBestScore,
      setBestScore: setBestScore,
      enqueuePending: enqueuePending,
      listPending: listPending,
      replacePending: replacePending
    };
  }

  // ## EXPORT ##

  var api = { createSessionStore: createSessionStore };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();