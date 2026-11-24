/* ============================================================================
   js/app.js
   Application Entry Point:
   Initializes UdaipurEngine on #renderCanvas and connects GameControls.
   ============================================================================ */

(function (global) {
  "use strict";

  function bootUdaipurVoxelGame() {
    const statusEl = global.document.getElementById("loading-status");

    if (typeof global.BABYLON === "undefined") {
      if (statusEl) {
        statusEl.textContent = "Failed to load Babylon.js CDN. Check your internet connection and reload.";
      }
      return;
    }

    try {
      const engine = new global.UdaipurEngine("renderCanvas");
      engine.start();

      const controls = new global.GameControls(engine);

      // Expose instances for debugging & inspection
      global.udaipurEngine = engine;
      global.gameControls = controls;

      global.showToast(
        "WELCOME TO UDAIPUR! EXPLORE LAKE PICHOLA, CITY PALACE & JAG MANDIR",
        "info",
        3400
      );
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "Startup error: " + (err && err.message ? err.message : String(err));
      }
      console.error("[UdaipurVoxel] Boot failed:", err);
    }
  }

  if (global.document.readyState === "loading") {
    global.document.addEventListener("DOMContentLoaded", bootUdaipurVoxelGame);
  } else {
    bootUdaipurVoxelGame();
  }
})(window);
