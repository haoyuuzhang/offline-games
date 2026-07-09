// ---- WRAPPER ----
(function () {
  "use strict";

  // ## IMPLEMENTATION ##

  function createRng(seed) {
    let value = seed || 1234567;
    return function random() {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  // ## EXPORT ##

  var api = { createRng: createRng };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Arcade = window.Arcade || {};
    Object.assign(window.Arcade, api);
  }
})();
