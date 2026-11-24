/* ============================================================================
   js/controls.js
   Multi-touch Pointer Hold Bindings for 4-Way Movement Pad (◀️ ▶️ 🔼 🔽),
   Action Console Buttons (FIRE, CAR, JUMP, GUN), HUD Utility Buttons, and
   Full Keyboard Controls (WASD / Arrows, Space, F / Enter, Q, C, B, Shift).
   ============================================================================ */

(function (global) {
  "use strict";

  class GameControls {
    constructor(engine) {
      this.engine = engine;
      this._dirPointers = {
        up: new Set(),
        down: new Set(),
        left: new Set(),
        right: new Set()
      };
      this._dirKeys = {
        up: new Set(),
        down: new Set(),
        left: new Set(),
        right: new Set()
      };
      this._firePointers = new Set();
      this._fireKeys = new Set();
      this._dirButtons = {};
      this._listeners = [];

      this._bindAll();
    }

    _on(target, event, handler, options) {
      if (!target) return;
      target.addEventListener(event, handler, options);
      this._listeners.push({ target: target, event: event, handler: handler, options: options });
    }

    _bindAll() {
      this._bindMovementPad();
      this._bindActionButtons();
      this._bindUtilityButtons();
      this._bindKeyboard();
      this._bindCanvasQuickFire();
      this._bindSafetyReset();
    }

    // ------------------------------------------------------------------------
    // Sync combined Pointer + Keyboard state for directions & fire
    // ------------------------------------------------------------------------
    _syncDirection(dir) {
      const active = this._dirPointers[dir].size > 0 || this._dirKeys[dir].size > 0;
      this.engine.setInput(dir, active);
      const btn = this._dirButtons[dir];
      if (btn) {
        btn.classList.toggle("pressed", active);
      }
    }

    _syncFire() {
      const active = this._firePointers.size > 0 || this._fireKeys.size > 0;
      this.engine.setInput("fire", active);
      const btn = global.document && global.document.getElementById("btn-fire");
      if (btn) {
        btn.classList.toggle("pressed", active);
      }
    }

    // ------------------------------------------------------------------------
    // 4-Way Movement Pad (◀️ ▶️ 🔼 🔽) — Responsive Multi-Touch & Mouse Hold
    // ------------------------------------------------------------------------
    _bindMovementPad() {
      const doc = global.document;
      if (!doc) return;

      const dirs = ["up", "down", "left", "right"];
      for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];
        const btn = doc.querySelector('.pad-btn[data-dir="' + dir + '"]');
        if (!btn) continue;
        this._dirButtons[dir] = btn;

        const onDown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          global.GameAssets.ensureAudio();
          this._dirPointers[dir].add(e.pointerId);
          if (btn.setPointerCapture) {
            try { btn.setPointerCapture(e.pointerId); } catch (_) {}
          }
          this._syncDirection(dir);
        };

        const onRelease = (e) => {
          if (this._dirPointers[dir].delete(e.pointerId)) {
            this._syncDirection(dir);
          }
        };

        this._on(btn, "pointerdown", onDown, { passive: false });
        this._on(btn, "pointerup", onRelease);
        this._on(btn, "pointercancel", onRelease);
        this._on(btn, "lostpointercapture", onRelease);
        this._on(btn, "contextmenu", (e) => e.preventDefault());
        this._on(btn, "selectstart", (e) => e.preventDefault());
        this._on(btn, "touchstart", (e) => e.preventDefault(), { passive: false });
      }
    }

    // ------------------------------------------------------------------------
    // Right-Side Action Console Buttons (FIRE, CAR, JUMP, GUN)
    // ------------------------------------------------------------------------
    _bindActionButtons() {
      const doc = global.document;
      if (!doc) return;

      // FIRE (Hold for rapid SMG / tap for Pistol)
      const fireBtn = doc.getElementById("btn-fire");
      if (fireBtn) {
        const onFireDown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          global.GameAssets.ensureAudio();
          this._firePointers.add(e.pointerId);
          if (fireBtn.setPointerCapture) {
            try { fireBtn.setPointerCapture(e.pointerId); } catch (_) {}
          }
          this._syncFire();
          this.engine.fireOnce();
        };

        const onFireUp = (e) => {
          if (this._firePointers.delete(e.pointerId)) {
            this._syncFire();
          }
        };

        this._on(fireBtn, "pointerdown", onFireDown, { passive: false });
        this._on(fireBtn, "pointerup", onFireUp);
        this._on(fireBtn, "pointercancel", onFireUp);
        this._on(fireBtn, "lostpointercapture", onFireUp);
        this._on(fireBtn, "contextmenu", (e) => e.preventDefault());
        this._on(fireBtn, "touchstart", (e) => e.preventDefault(), { passive: false });
      }

      // Tap action helper for CAR, JUMP, GUN
      const bindTapAction = (id, fn) => {
        const el = doc.getElementById(id);
        if (!el) return;

        const onDown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          global.GameAssets.ensureAudio();
          el.classList.add("pressed");
          fn();
        };
        const onUp = () => {
          el.classList.remove("pressed");
        };

        this._on(el, "pointerdown", onDown, { passive: false });
        this._on(el, "pointerup", onUp);
        this._on(el, "pointercancel", onUp);
        this._on(el, "pointerleave", onUp);
        this._on(el, "contextmenu", (e) => e.preventDefault());
        this._on(el, "touchstart", (e) => e.preventDefault(), { passive: false });
      };

      bindTapAction("btn-car", () => this.engine.triggerVehicleAction());
      bindTapAction("btn-jump", () => this.engine.triggerJump());
      bindTapAction("btn-gun", () => this.engine.switchWeapon());
    }

    // ------------------------------------------------------------------------
    // Top HUD Utility Buttons (Camera FOLLOW/FREE, Bribe ₹500, Audio Mute)
    // ------------------------------------------------------------------------
    _bindUtilityButtons() {
      const doc = global.document;
      if (!doc) return;

      const camBtn = doc.getElementById("btn-camera");
      if (camBtn) {
        this._on(camBtn, "click", (e) => {
          e.preventDefault();
          camBtn.blur();
          global.GameAssets.ensureAudio();
          this.engine.toggleCameraMode();
        });
      }

      const bribeBtn = doc.getElementById("btn-bribe");
      if (bribeBtn) {
        this._on(bribeBtn, "click", (e) => {
          e.preventDefault();
          bribeBtn.blur();
          global.GameAssets.ensureAudio();
          this.engine.bribePolice();
        });
      }

      const soundBtn = doc.getElementById("btn-sound");
      if (soundBtn) {
        this._on(soundBtn, "click", (e) => {
          e.preventDefault();
          soundBtn.blur();
          global.GameAssets.ensureAudio();
          this.engine.toggleMute();
        });
      }
    }

    // ------------------------------------------------------------------------
    // Keyboard Bindings (WASD / Arrows, Space, F / Enter, Q, C, B, Shift/X)
    // ------------------------------------------------------------------------
    _bindKeyboard() {
      const dirMap = {
        KeyW: "up",
        ArrowUp: "up",
        KeyS: "down",
        ArrowDown: "down",
        KeyA: "left",
        ArrowLeft: "left",
        KeyD: "right",
        ArrowRight: "right"
      };

      const fireCodes = new Set(["ShiftLeft", "ShiftRight", "KeyX", "KeyJ"]);

      this._on(global, "keydown", (e) => {
        const code = e.code;

        if (code in dirMap) {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          const dir = dirMap[code];
          this._dirKeys[dir].add(code);
          this._syncDirection(dir);
          return;
        }

        if (fireCodes.has(code)) {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this._fireKeys.add(code);
          this._syncFire();
          if (!e.repeat) this.engine.fireOnce();
          return;
        }

        if (e.repeat) return;

        if (code === "Space") {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this.engine.triggerJump();
        } else if (code === "KeyF" || code === "Enter") {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this.engine.triggerVehicleAction();
        } else if (code === "KeyQ") {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this.engine.switchWeapon();
        } else if (code === "KeyC") {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this.engine.toggleCameraMode();
        } else if (code === "KeyB") {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this.engine.bribePolice();
        } else if (code === "KeyM") {
          e.preventDefault();
          global.GameAssets.ensureAudio();
          this.engine.toggleMute();
        }
      });

      this._on(global, "keyup", (e) => {
        const code = e.code;
        if (code in dirMap) {
          const dir = dirMap[code];
          this._dirKeys[dir].delete(code);
          this._syncDirection(dir);
        } else if (fireCodes.has(code)) {
          this._fireKeys.delete(code);
          this._syncFire();
        }
      });
    }

    // ------------------------------------------------------------------------
    // Optional Desktop Mouse Click-to-Fire (Ignores Camera Drag Orbits)
    // ------------------------------------------------------------------------
    _bindCanvasQuickFire() {
      const canvas = this.engine.canvas;
      if (!canvas) return;
      let downX = 0;
      let downY = 0;
      let downTime = 0;

      this._on(canvas, "pointerdown", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        global.GameAssets.ensureAudio();
        downX = e.clientX;
        downY = e.clientY;
        downTime = performance.now();
      });

      this._on(canvas, "pointerup", (e) => {
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
        const dt = performance.now() - downTime;
        // Fire only on crisp non-drag click in FOLLOW mode
        if (moved < 6 && dt < 240 && this.engine.cameraMode === "FOLLOW") {
          this.engine.fireOnce();
        }
      });
    }

    // ------------------------------------------------------------------------
    // Safety Reset on Tab Switch / Window Blur (Prevents Stuck Keys)
    // ------------------------------------------------------------------------
    _bindSafetyReset() {
      const resetAll = () => {
        const dirs = ["up", "down", "left", "right"];
        for (let i = 0; i < dirs.length; i++) {
          this._dirPointers[dirs[i]].clear();
          this._dirKeys[dirs[i]].clear();
          this._syncDirection(dirs[i]);
        }
        this._firePointers.clear();
        this._fireKeys.clear();
        this._syncFire();
        this.engine.clearAllInputs();
      };

      this._on(global, "blur", resetAll);
      if (global.document) {
        this._on(global.document, "visibilitychange", () => {
          if (global.document.hidden) resetAll();
        });
      }
    }

    dispose() {
      for (let i = 0; i < this._listeners.length; i++) {
        const l = this._listeners[i];
        l.target.removeEventListener(l.event, l.handler, l.options);
      }
      this._listeners.length = 0;
    }
  }

  global.GameControls = GameControls;
})(window);
