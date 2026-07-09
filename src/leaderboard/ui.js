// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizePanelState(state) {
    state = state || {};

    return {
      mode: state.mode ? String(state.mode) : "offline",
      nickname: state.nickname ? String(state.nickname) : "",
      message: state.message ? String(state.message) : "\u79bb\u7ebf\u6e38\u73a9\u4e2d",
      bestScore: Number.isFinite(Number(state.bestScore)) ? Math.max(0, Math.floor(Number(state.bestScore))) : 0,
      leaderboard: Array.isArray(state.leaderboard) ? state.leaderboard.slice() : [],
      loading: Boolean(state.loading)
    };
  }

  function renderRows(rows) {
    if (!rows.length) {
      return '<li class="leaderboard-empty">\u6682\u65e0\u6210\u7ee9</li>';
    }

    return rows.map(function (row, index) {
      var rank = Number.isFinite(Number(row && row.rank)) ? Math.max(1, Math.floor(Number(row.rank))) : index + 1;
      var nickname = escapeHtml(row && row.nickname);
      var score = Number.isFinite(Number(row && row.score)) ? Math.max(0, Math.floor(Number(row.score))) : 0;

      return [
        '<li>',
        '<span>#' + rank + '</span>',
        '<strong>' + nickname + '</strong>',
        '<em>' + score + '</em>',
        '</li>'
      ].join('');
    }).join('');
  }

  function renderLeaderboardPanelHtml(state) {
    var safe = normalizePanelState(state);
    var statusText = safe.loading ? '\u52a0\u8f7d\u4e2d' : safe.message;
    var body = safe.mode === 'ready'
      ? [
          '<div class="player-line">',
          '<strong>' + escapeHtml(safe.nickname || '\u73a9\u5bb6') + '</strong>',
          '<button type="button" data-leaderboard-action="logout">\u9000\u51fa</button>',
          '</div>'
        ].join('')
      : [
          '<div class="login-grid">',
          '<label>\u6635\u79f0<input data-leaderboard-field="nickname" maxlength="20" autocomplete="nickname"></label>',
          '<label>\u53e3\u4ee4<input data-leaderboard-field="passphrase" maxlength="40" type="password" autocomplete="current-password"></label>',
          '<button type="button" data-leaderboard-action="login">\u767b\u5f55\u53c2\u52a0\u6392\u884c</button>',
          '</div>'
        ].join('');

    return [
      '<section class="leaderboard-card" aria-label="\u73a9\u5bb6\u6392\u884c">',
      '<h3>\u73a9\u5bb6\u6392\u884c</h3>',
      '<p class="leaderboard-message">' + escapeHtml(statusText) + '</p>',
      body,
      '<div class="best-score">\u4e2a\u4eba\u6700\u597d <strong>' + safe.bestScore + '</strong></div>',
      '<ol class="leaderboard-list">',
      renderRows(safe.leaderboard),
      '</ol>',
      '<button type="button" data-leaderboard-action="refresh">\u5237\u65b0\u6392\u884c</button>',
      '</section>'
    ].join('');
  }

  function createLeaderboardPanel(options) {
    options = options || {};

    var container = null;
    var currentState = normalizePanelState({});

    function getFieldValue(selector) {
      if (!container) {
        return "";
      }
      var el = container.querySelector(selector);
      return el ? String(el.value || "") : "";
    }

    function bindEvents() {
      if (!container) {
        return;
      }

      var login = container.querySelector('[data-leaderboard-action="login"]');
      var logout = container.querySelector('[data-leaderboard-action="logout"]');
      var refresh = container.querySelector('[data-leaderboard-action="refresh"]');

      if (login) {
        login.addEventListener("click", function () {
          if (typeof options.onLogin === "function") {
            options.onLogin(
              getFieldValue('[data-leaderboard-field="nickname"]'),
              getFieldValue('[data-leaderboard-field="passphrase"]')
            );
          }
        });
      }

      if (logout) {
        logout.addEventListener("click", function () {
          if (typeof options.onLogout === "function") {
            options.onLogout();
          }
        });
      }

      if (refresh) {
        refresh.addEventListener("click", function () {
          if (typeof options.onRefresh === "function") {
            options.onRefresh();
          }
        });
      }
    }

    function render() {
      if (!container) {
        return;
      }
      container.innerHTML = renderLeaderboardPanelHtml(currentState);
      bindEvents();
    }

    return {
      mount: function (target) {
        container = target || null;
        render();
      },
      setState: function (state) {
        currentState = normalizePanelState(Object.assign({}, currentState, state || {}));
        render();
      },
      getState: function () {
        return normalizePanelState(currentState);
      }
    };
  }

  // ## EXPORT ##

  var api = {
    renderLeaderboardPanelHtml: renderLeaderboardPanelHtml,
    createLeaderboardPanel: createLeaderboardPanel
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();