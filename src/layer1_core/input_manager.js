/* ============================================================================
   Layer 1 — Core Engine: Unified Input Manager
   - Desktop: WASD/Arrows move, Mouse drag look, Shift sprint, Space jump/horn,
     E interact, F photo mode, M map, J journal, V vehicle/boat switch, T time
   - Mobile: Auto-detect touch dual-stick controls (left move joystick,
     right camera look pad) without page scroll or text selection
   ============================================================================ */

export class InputManager {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.keys = new Set();
    this.isTouchDevice =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0);

    // Camera orbit angles (radians)
    this.yaw = 0;
    this.pitch = 0.28;

    // Analog mobile stick states (-1..1)
    this.leftStick = { active: false, pointerId: null, originX: 0, originY: 0, x: 0, y: 0 };
    this.rightStick = { active: false, pointerId: null, lastX: 0, lastY: 0 };
    this.mouseDrag = { active: false, lastX: 0, lastY: 0 };
    this.mobileSprint = false;
    this.uiBlocked = false; // True when modal overlay is open

    if (typeof window !== "undefined") {
      this._bindDesktop();
      this._bindTouchSticks();
    }
  }

  setUIBlocked(blocked) {
    this.uiBlocked = !!blocked;
    if (blocked) {
      this.keys.clear();
      this.leftStick.x = 0;
      this.leftStick.y = 0;
      this.mouseDrag.active = false;
    }
  }

  getMoveVector() {
    if (this.uiBlocked) return { x: 0, z: 0, sprint: false };
    let x = 0;
    let z = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;

    if (this.leftStick.active) {
      x += this.leftStick.x;
      z -= this.leftStick.y; // stick up is negative screen Y -> forward +1
    }

    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    const sprint =
      this.keys.has("ShiftLeft") ||
      this.keys.has("ShiftRight") ||
      this.mobileSprint ||
      (this.leftStick.active && len > 0.88);

    return { x, z, sprint };
  }

  _bindDesktop() {
    window.addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

      const code = e.code;
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) {
        if (!this.uiBlocked) e.preventDefault();
      }
      this.keys.add(code);

      if (e.repeat) return;

      // Global shortcut toggles work even to close open modals
      if (code === "Escape") {
        this.callbacks.onEscape?.();
        return;
      }
      if (code === "KeyM") {
        this.callbacks.onToggleMap?.();
        return;
      }
      if (code === "KeyJ") {
        this.callbacks.onToggleJournal?.();
        return;
      }
      if (code === "KeyF") {
        this.callbacks.onTogglePhotoMode?.();
        return;
      }

      if (this.uiBlocked) return;

      if (code === "KeyE") this.callbacks.onInteract?.();
      else if (code === "KeyV") this.callbacks.onCycleTransport?.();
      else if (code === "KeyT") this.callbacks.onCycleTime?.();
      else if (code === "Space") this.callbacks.onJumpOrHorn?.();
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener("blur", () => {
      this.keys.clear();
      this.mouseDrag.active = false;
      this.leftStick.active = false;
      this.leftStick.x = 0;
      this.leftStick.y = 0;
    });

    // Smooth mouse-drag camera look on 3D canvas
    if (this.canvas) {
      this.canvas.addEventListener("pointerdown", (e) => {
        if (this.uiBlocked || e.pointerType === "touch") return;
        this.callbacks.onFirstGesture?.();
        this.mouseDrag.active = true;
        this.mouseDrag.lastX = e.clientX;
        this.mouseDrag.lastY = e.clientY;
        try { this.canvas.setPointerCapture(e.pointerId); } catch (_) {}
      });

      this.canvas.addEventListener("pointermove", (e) => {
        if (!this.mouseDrag.active || this.uiBlocked) return;
        const dx = e.clientX - this.mouseDrag.lastX;
        const dy = e.clientY - this.mouseDrag.lastY;
        this.mouseDrag.lastX = e.clientX;
        this.mouseDrag.lastY = e.clientY;
        this.yaw -= dx * 0.0052;
        this.pitch = Math.max(-0.18, Math.min(1.05, this.pitch + dy * 0.0042));
      });

      const stopDrag = () => { this.mouseDrag.active = false; };
      this.canvas.addEventListener("pointerup", stopDrag);
      this.canvas.addEventListener("pointercancel", stopDrag);
    }
  }

  _bindTouchSticks() {
    if (typeof document === "undefined") return;
    const controlsWrap = document.getElementById("mobile-controls");
    if (controlsWrap && this.isTouchDevice) {
      controlsWrap.classList.add("touch-active");
    }

    const leftZone = document.getElementById("touch-left-zone");
    const leftKnob = document.getElementById("touch-left-knob");
    const rightZone = document.getElementById("touch-right-zone");
    const rightKnob = document.getElementById("touch-right-knob");

    const maxR = 42;

    if (leftZone && leftKnob) {
      leftZone.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.callbacks.onFirstGesture?.();
        const rect = leftZone.getBoundingClientRect();
        this.leftStick.active = true;
        this.leftStick.pointerId = e.pointerId;
        this.leftStick.originX = rect.left + rect.width / 2;
        this.leftStick.originY = rect.top + rect.height / 2;
        try { leftZone.setPointerCapture(e.pointerId); } catch (_) {}
        this._updateLeftKnob(e.clientX, e.clientY, leftKnob, maxR);
      }, { passive: false });

      leftZone.addEventListener("pointermove", (e) => {
        if (!this.leftStick.active || e.pointerId !== this.leftStick.pointerId) return;
        e.preventDefault();
        this._updateLeftKnob(e.clientX, e.clientY, leftKnob, maxR);
      }, { passive: false });

      const endLeft = (e) => {
        if (e.pointerId !== this.leftStick.pointerId) return;
        this.leftStick.active = false;
        this.leftStick.pointerId = null;
        this.leftStick.x = 0;
        this.leftStick.y = 0;
        leftKnob.style.transform = "translate(-50%, -50%)";
      };
      leftZone.addEventListener("pointerup", endLeft);
      leftZone.addEventListener("pointercancel", endLeft);
    }

    if (rightZone && rightKnob) {
      rightZone.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.callbacks.onFirstGesture?.();
        this.rightStick.active = true;
        this.rightStick.pointerId = e.pointerId;
        this.rightStick.lastX = e.clientX;
        this.rightStick.lastY = e.clientY;
        try { rightZone.setPointerCapture(e.pointerId); } catch (_) {}
      }, { passive: false });

      rightZone.addEventListener("pointermove", (e) => {
        if (!this.rightStick.active || e.pointerId !== this.rightStick.pointerId) return;
        e.preventDefault();
        const dx = e.clientX - this.rightStick.lastX;
        const dy = e.clientY - this.rightStick.lastY;
        this.rightStick.lastX = e.clientX;
        this.rightStick.lastY = e.clientY;
        this.yaw -= dx * 0.0068;
        this.pitch = Math.max(-0.18, Math.min(1.05, this.pitch + dy * 0.0052));
        const kx = Math.max(-24, Math.min(24, dx * 2));
        const ky = Math.max(-24, Math.min(24, dy * 2));
        rightKnob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
      }, { passive: false });

      const endRight = (e) => {
        if (e.pointerId !== this.rightStick.pointerId) return;
        this.rightStick.active = false;
        this.rightStick.pointerId = null;
        rightKnob.style.transform = "translate(-50%, -50%)";
      };
      rightZone.addEventListener("pointerup", endRight);
      rightZone.addEventListener("pointercancel", endRight);
    }
  }

  _updateLeftKnob(cx, cy, knob, maxR) {
    let dx = cx - this.leftStick.originX;
    let dy = cy - this.leftStick.originY;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    this.leftStick.x = dx / maxR;
    this.leftStick.y = dy / maxR;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
}
