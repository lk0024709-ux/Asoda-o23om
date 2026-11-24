/* ============================================================================
   assets/game_assets.js
   Centralized Udaipur Voxel Palette (COLORS), Grid Spawn Coordinates (SPAWNS),
   Babylon Material Factory (createColorMat), Web Audio SFX (beep), and
   HUD Toast Banner Helper (showToast).
   ============================================================================ */

(function (global) {
  "use strict";

  const VOXEL_SIZE = 2; // 1 voxel = 2 world units

  // --------------------------------------------------------------------------
  // Centralized Udaipur Heritage & Arcade Voxel Color Palette
  // --------------------------------------------------------------------------
  const COLORS = {
    // Sky, Sun & Atmospheric Tones
    SKY_TOP: "#8ecae6",
    FOG_WARM: "#e8d5b7",
    SUN_DISC: "#ffe8a3",

    // Lake Pichola Water & Shore
    WATER_DEEP: "#0d6e8a",
    WATER_MID: "#168aad",
    WATER_SHALLOW: "#34a0a4",
    WATER_FOAM: "#b8f2e6",
    WATER_SHIMMER: "#48cae4",

    // Roads, Cobblestone & Sidewalks
    ROAD_ASPHALT: "#2b303a",
    ROAD_LINE: "#f4d35e",
    ROAD_CROSSWALK: "#eceff4",
    SIDEWALK: "#c7b9a5",
    COBBLESTONE: "#a89882",

    // City Palace & Gangaur Ghat
    PALACE_STONE: "#e7d3ad",
    PALACE_CREAM: "#f6ebd4",
    PALACE_TRIM: "#c9a66b",
    PALACE_ARCH_SHADOW: "#5a4634",
    GOLD_DOME: "#f4b925",
    GOLD_BRIGHT: "#ffd859",
    GHAT_MARBLE: "#f4efe6",
    GHAT_STEP: "#e2d7c5",
    GHAT_RAIL: "#d4b483",
    BRIDGE_STONE: "#cbb592",

    // Jag Mandir Island Palace
    JAG_SANDSTONE: "#dfa878",
    JAG_MARBLE: "#f7f1e5",
    JAG_ROOF: "#c86d42",
    JAG_GARDEN: "#3c8d40",

    // Old-City Havelis & Bazaars
    HAVELI_WHITE: "#f3ece1",
    HAVELI_PEACH: "#e8a87c",
    HAVELI_PINK: "#df8fa0",
    HAVELI_BLUE: "#82a8c9",
    HAVELI_OCHRE: "#d9a05b",
    HAVELI_TERRACOTTA: "#c46243",
    HAVELI_BALCONY: "#8c5a3c",
    HAVELI_WINDOW: "#2a3447",
    HAVELI_WINDOW_LIT: "#ffcf66",
    AWNING_SAFFRON: "#f26419",
    AWNING_MAGENTA: "#c73866",
    AWNING_TEAL: "#1d8a99",

    // Aravalli Hills & Nature
    HILL_ROCK: "#786958",
    HILL_OCHRE: "#a6855d",
    HILL_GRASS: "#6b7d42",
    HILL_PEAK: "#b99d7a",
    GROUND_SAND: "#d5be96",
    GRASS_LUSH: "#4d8b31",
    TREE_TRUNK: "#6b4423",
    TREE_LEAF_DARK: "#2d6a33",
    TREE_LEAF_LIGHT: "#4c9a3f",
    BOUGAINVILLEA: "#d93878",
    BOAT_WOOD: "#7a4b2a",
    BOAT_CANOPY: "#e63946",
    LAMP_POST: "#374151",
    LAMP_GLOW: "#fff0a6",

    // Vehicles (AUTO, SUV, POLICE)
    AUTO_GREEN: "#14803c",
    AUTO_YELLOW: "#facc15",
    SUV_CRIMSON: "#b91c1c",
    SUV_ROYAL: "#1d4ed8",
    SUV_PEARL: "#e2e8f0",
    POLICE_WHITE: "#f1f5f9",
    POLICE_NAVY: "#1e3a8a",
    POLICE_KHAKI: "#b59b6b",
    TIRE_BLACK: "#18181b",
    WHEEL_RIM: "#94a3b8",
    GLASS_TINT: "#1e293b",
    HEADLIGHT: "#fef08a",
    TAILLIGHT: "#ef4444",
    SIREN_RED: "#ff1e38",
    SIREN_BLUE: "#00b4ff",

    // Characters & Weapons
    SKIN_HERO: "#c68642",
    SKIN_LIGHT: "#dba06a",
    SKIN_DEEP: "#9b6434",
    HERO_JACKET: "#991b1b",
    HERO_SHIRT: "#111827",
    HERO_PANTS: "#1f2937",
    HERO_GOLD: "#fbbf24",
    HAIR_DARK: "#18181b",
    COP_KHAKI: "#bfa065",
    COP_BELT: "#3b2314",
    COP_CAP: "#1e293b",
    NPC_COLORS: ["#f97316", "#ec4899", "#06b6d4", "#eab308", "#8b5cf6", "#10b981", "#f43f5e"],
    TURBAN_COLORS: ["#ef4444", "#f59e0b", "#ec4899", "#f8fafc", "#14b8a6"],
    GUN_METAL: "#334155",
    GUN_DARK: "#0f172a",
    MUZZLE_FLASH: "#fde047",
    BULLET_PISTOL: "#facc15",
    BULLET_SMG: "#38bdf8",
    CASH_GREEN: "#22c55e",
    CASH_BAND: "#facc15"
  };

  // --------------------------------------------------------------------------
  // Grid Spawn Coordinates (1 grid unit = VOXEL_SIZE = 2 world units)
  // Orientation: +X = East (City Palace), -X = West (Lake Pichola & Aravalli),
  //              +Z = North (North Road), -Z = South (South Road & Jag Mandir Bridge)
  // --------------------------------------------------------------------------
  const SPAWNS = {
    player: { gx: 11, gz: -6, gy: 0, yaw: 0 },

    vehicles: [
      { type: "AUTO",   gx: 15,  gz: -2,  yaw: 0 },
      { type: "SUV",    gx: 17,  gz: 12,  yaw: Math.PI, colorKey: "SUV_CRIMSON" },
      { type: "POLICE", gx: 15,  gz: 30,  yaw: -Math.PI / 2 },
      { type: "AUTO",   gx: -10, gz: 31,  yaw: Math.PI / 2 },
      { type: "SUV",    gx: -37, gz: 6,   yaw: Math.PI, colorKey: "SUV_ROYAL" },
      { type: "AUTO",   gx: -4,  gz: -31, yaw: -Math.PI / 2 },
      { type: "POLICE", gx: -37, gz: -20, yaw: 0 },
      { type: "SUV",    gx: 17,  gz: -25, yaw: 0, colorKey: "SUV_PEARL" },
      { type: "AUTO",   gx: -13, gz: -16, yaw: 0 }
    ],

    npcs: [
      { gx: 9,   gz: 6 },
      { gx: 11,  gz: 14 },
      { gx: 22,  gz: 2 },
      { gx: 22,  gz: -6 },
      { gx: 29,  gz: 4 },
      { gx: -13, gz: 4 },
      { gx: -13, gz: -3 },
      { gx: 2,   gz: 26 },
      { gx: -18, gz: 26 },
      { gx: -32, gz: 10 },
      { gx: -32, gz: -12 },
      { gx: 4,   gz: -26 },
      { gx: 24,  gz: 27 },
      { gx: 28,  gz: -27 }
    ],

    cops: [
      { gx: 16,  gz: 20 },
      { gx: -20, gz: 31 },
      { gx: -36, gz: -6 },
      { gx: 16,  gz: -30 }
    ],

    policeBackupNodes: [
      { gx: 16,  gz: 38 },
      { gx: 16,  gz: -38 },
      { gx: -37, gz: 32 },
      { gx: -37, gz: -32 },
      { gx: 32,  gz: 31 },
      { gx: 32,  gz: -31 },
      { gx: -13, gz: -31 }
    ],

    cashStashes: [
      { gx: 9,   gz: 0,   amount: 300,  label: "GANGAUR GHAT STASH" },
      { gx: 28,  gz: 0,   amount: 1000, label: "CITY PALACE TREASURY" },
      { gx: -13, gz: 2,   amount: 750,  label: "JAG MANDIR ROYAL STASH" },
      { gx: 0,   gz: 35,  amount: 400,  label: "HATHIPOLE BAZAAR CUT" },
      { gx: 16,  gz: 24,  amount: 350,  label: "PALACE CHOWK STASH" },
      { gx: -32, gz: 4,   amount: 450,  label: "ARAVALLI LAKEVIEW STASH" },
      { gx: 2,   gz: -26, amount: 400,  label: "DUDHTALAI GHAT STASH" },
      { gx: 28,  gz: -27, amount: 500,  label: "OLD CITY HAVELI VAULT" },
      { gx: -24, gz: 26,  amount: 450,  label: "PICHOLA NORTH PIER" },
      { gx: -13, gz: -12, amount: 350,  label: "JAG MANDIR BRIDGE DROP" }
    ]
  };

  // Convert grid coords -> world coords (top of gy=0 is world y=0)
  function gridToWorld(gx, gy, gz) {
    return {
      x: gx * VOXEL_SIZE,
      y: (gy || 0) * VOXEL_SIZE,
      z: gz * VOXEL_SIZE
    };
  }

  // --------------------------------------------------------------------------
  // Cached Babylon.js StandardMaterial Factory (createColorMat)
  // --------------------------------------------------------------------------
  const _matCache = new WeakMap();

  function createColorMat(scene, name, hexColor, opts) {
    const options = opts || {};
    let sceneCache = _matCache.get(scene);
    if (!sceneCache) {
      sceneCache = new Map();
      _matCache.set(scene, sceneCache);
    }

    const cacheKey = [
      name || "",
      hexColor,
      options.emissive || "",
      options.alpha !== undefined ? options.alpha : 1,
      options.specular !== undefined ? options.specular : 0.08,
      options.freeze ? "F" : "D"
    ].join("|");

    if (sceneCache.has(cacheKey)) {
      return sceneCache.get(cacheKey);
    }

    const mat = new BABYLON.StandardMaterial("mat_" + (name || hexColor), scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString(hexColor);

    const spec = options.specular !== undefined ? options.specular : 0.08;
    mat.specularColor = new BABYLON.Color3(spec, spec, spec);
    mat.specularPower = options.specularPower || 24;

    if (options.emissive) {
      mat.emissiveColor = BABYLON.Color3.FromHexString(options.emissive);
    } else if (options.emissiveScale) {
      mat.emissiveColor = mat.diffuseColor.scale(options.emissiveScale);
    }

    if (options.alpha !== undefined && options.alpha < 1) {
      mat.alpha = options.alpha;
      mat.backFaceCulling = options.backFaceCulling !== undefined ? options.backFaceCulling : true;
    }

    if (options.disableLighting) {
      mat.disableLighting = true;
    }

    if (options.freeze) {
      mat.freeze();
    }

    sceneCache.set(cacheKey, mat);
    return mat;
  }

  // --------------------------------------------------------------------------
  // Web Audio API Sound Effects Engine (beep + composite arcade SFX)
  // --------------------------------------------------------------------------
  let _audioCtx = null;
  let _muted = false;

  function ensureAudio() {
    if (_muted) return null;
    const AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!_audioCtx) {
      try {
        _audioCtx = new AudioCtx();
      } catch (_) {
        return null;
      }
    }
    if (_audioCtx.state === "suspended") {
      _audioCtx.resume().catch(function () {});
    }
    return _audioCtx;
  }

  function beep(freq, duration, type, volume, freqEnd) {
    const ctx = ensureAudio();
    if (!ctx) return;

    const now = ctx.currentTime;
    const dur = Math.max(0.02, duration || 0.1);
    const vol = volume !== undefined ? volume : 0.12;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq || 440, now);
      if (freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + dur);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.015);
    } catch (_) {
      // Ignore audio scheduling glitches if tab backgrounded
    }
  }

  function setMuted(muted) {
    _muted = !!muted;
    return _muted;
  }

  function isMuted() {
    return _muted;
  }

  const SFX = {
    pistol: function () {
      beep(320, 0.09, "sawtooth", 0.14, 75);
      beep(140, 0.11, "triangle", 0.1, 48);
    },
    smg: function () {
      beep(460, 0.055, "square", 0.1, 110);
    },
    jump: function () {
      beep(210, 0.14, "sine", 0.11, 480);
    },
    horn: function () {
      beep(415, 0.16, "sawtooth", 0.1, 410);
      setTimeout(function () { beep(520, 0.16, "sawtooth", 0.09, 515); }, 85);
    },
    hijack: function () {
      beep(180, 0.09, "triangle", 0.12, 320);
      setTimeout(function () { beep(340, 0.13, "sawtooth", 0.11, 520); }, 70);
    },
    exitCar: function () {
      beep(260, 0.09, "triangle", 0.09, 150);
    },
    weaponSwitch: function () {
      beep(520, 0.05, "square", 0.08, 760);
      setTimeout(function () { beep(780, 0.06, "triangle", 0.08, 620); }, 55);
    },
    cash: function () {
      beep(660, 0.08, "sine", 0.12, 880);
      setTimeout(function () { beep(880, 0.1, "sine", 0.12, 1175); }, 65);
      setTimeout(function () { beep(1175, 0.15, "triangle", 0.11, 1320); }, 135);
    },
    bribe: function () {
      beep(523, 0.09, "triangle", 0.12, 659);
      setTimeout(function () { beep(659, 0.09, "triangle", 0.12, 784); }, 85);
      setTimeout(function () { beep(784, 0.18, "sine", 0.13, 1046); }, 170);
    },
    wantedUp: function () {
      beep(620, 0.12, "sawtooth", 0.1, 880);
      setTimeout(function () { beep(880, 0.14, "sawtooth", 0.1, 620); }, 120);
    },
    sirenPulse: function (high) {
      beep(high ? 820 : 610, 0.24, "sine", 0.05, high ? 620 : 830);
    },
    hit: function () {
      beep(150, 0.08, "sawtooth", 0.11, 60);
    },
    error: function () {
      beep(190, 0.12, "square", 0.09, 120);
    },
    camera: function () {
      beep(480, 0.06, "sine", 0.08, 640);
    }
  };

  // --------------------------------------------------------------------------
  // Toast Banner Helper (showToast)
  // --------------------------------------------------------------------------
  let _toastTimer = null;

  function showToast(message, type, durationMs) {
    const el = global.document && global.document.getElementById("toast-banner");
    if (!el) return;

    el.textContent = message;
    el.className = "visible" + (type ? " toast-" + type : "");

    if (_toastTimer) {
      clearTimeout(_toastTimer);
    }
    _toastTimer = setTimeout(function () {
      el.classList.remove("visible");
    }, durationMs || 2400);
  }

  // Export globally and under GameAssets namespace
  global.VOXEL_SIZE = VOXEL_SIZE;
  global.COLORS = COLORS;
  global.SPAWNS = SPAWNS;
  global.createColorMat = createColorMat;
  global.beep = beep;
  global.showToast = showToast;
  global.GameAssets = {
    VOXEL_SIZE: VOXEL_SIZE,
    COLORS: COLORS,
    SPAWNS: SPAWNS,
    gridToWorld: gridToWorld,
    createColorMat: createColorMat,
    beep: beep,
    SFX: SFX,
    setMuted: setMuted,
    isMuted: isMuted,
    ensureAudio: ensureAudio,
    showToast: showToast
  };
})(window);
