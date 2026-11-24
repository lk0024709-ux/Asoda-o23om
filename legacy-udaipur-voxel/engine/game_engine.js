/* ============================================================================
   engine/game_engine.js
   Core Babylon.js Open-World Game Engine for Udaipur Voxel City:
   - On-foot movement, jumping, water wading & dual weapons (VOXEL PISTOL / VOXEL SMG)
   - Vehicle hijacking, driving & safe exiting (AUTO, SUV, POLICE with sirens)
   - Police chase AI (on-foot cops + siren-blaring cruisers), wanted star decay
     & ₹500 police bribe
   - Collectible ₹ cash stashes across Udaipur landmarks
   - FOLLOW / FREE camera toggle + live Udaipur city radar minimap
   ============================================================================ */

(function (global) {
  "use strict";

  const WEAPONS = {
    PISTOL: {
      id: "PISTOL",
      name: "VOXEL PISTOL",
      fireRate: 0.3,
      damage: 36,
      speed: 80,
      spread: 0.014,
      range: 72,
      colorKey: "BULLET_PISTOL"
    },
    SMG: {
      id: "SMG",
      name: "VOXEL SMG",
      fireRate: 0.095,
      damage: 18,
      speed: 86,
      spread: 0.055,
      range: 64,
      colorKey: "BULLET_SMG"
    }
  };

  const BRIBE_COST = 500;
  const MAX_WANTED = 5;

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function lerpAngle(current, target, t) {
    const diff = wrapAngle(target - current);
    return current + diff * clamp(t, 0, 1);
  }

  function dist2D(ax, az, bx, bz) {
    return Math.hypot(bx - ax, bz - az);
  }

  class UdaipurEngine {
    constructor(canvasId, options) {
      this.options = options || {};
      this.canvas = typeof canvasId === "string" ? global.document.getElementById(canvasId) : canvasId;
      this.engine = null;
      this.scene = null;
      this.camera = null;
      this.world = null;

      // Gameplay input state (driven by GameControls)
      this.input = {
        up: false,
        down: false,
        left: false,
        right: false,
        fire: false
      };

      // Game progression & HUD state
      this.cash = 1000;
      this.wantedLevel = 0;
      this.evading = false;
      this.evadeTimer = 0;
      this.decayTimer = 0;
      this.crimeCooldown = 0;
      this.cameraMode = "FOLLOW"; // "FOLLOW" | "FREE"
      this.elapsed = 0;
      this.sirenAudioTimer = 0;
      this.sirenHigh = true;
      this.hudTickTimer = 0;
      this.radarTimer = 0;
      this.currentZone = "GANGAUR GHAT";

      // Entities
      this.player = null;
      this.vehicles = [];
      this.npcs = [];
      this.cops = [];
      this.cashStashes = [];
      this.projectiles = [];
      this.particles = [];

      // Cached DOM HUD elements
      this.dom = this._queryDom();
      this.radarCtx = this.dom.minimap ? this.dom.minimap.getContext("2d") : null;
      this._radarBg = null;
      this._running = false;
    }

    _queryDom() {
      const doc = global.document;
      if (!doc) return {};
      return {
        zone: doc.getElementById("zone-label"),
        hpFill: doc.getElementById("hp-bar-fill"),
        hpText: doc.getElementById("hp-text"),
        weaponBadge: doc.getElementById("weapon-badge"),
        vehicleBadge: doc.getElementById("vehicle-badge"),
        cashAmount: doc.getElementById("cash-amount"),
        wantedStars: doc.getElementById("wanted-stars"),
        wantedVignette: doc.getElementById("wanted-vignette"),
        camBtn: doc.getElementById("btn-camera"),
        camLabel: doc.getElementById("camera-mode-label"),
        bribeBtn: doc.getElementById("btn-bribe"),
        soundBtn: doc.getElementById("btn-sound"),
        carBtn: doc.getElementById("btn-car"),
        carSub: doc.getElementById("car-btn-sub"),
        crosshair: doc.getElementById("crosshair"),
        minimap: doc.getElementById("minimap"),
        loadingOverlay: doc.getElementById("loading-overlay")
      };
    }

    // ------------------------------------------------------------------------
    // Boot & Scene Initialization
    // ------------------------------------------------------------------------
    start() {
      if (this._running) return;
      this._running = true;

      // Support headless NullEngine for automated verification tests as well as WebGL Engine
      if (this.options.useNullEngine) {
        this.engine = new BABYLON.NullEngine();
      } else {
        this.engine = new BABYLON.Engine(this.canvas, true, {
          preserveDrawingBuffer: false,
          stencil: false,
          antialias: true,
          powerPreference: "high-performance"
        });
      }

      this.scene = new BABYLON.Scene(this.engine);
      this._setupAtmosphereAndLighting();

      // Build static batched Udaipur Voxel World
      this.world = new global.UdaipurWorld(this.scene);

      // Setup Camera (ArcRotateCamera supporting FOLLOW and FREE orbit modes)
      this._setupCamera();

      // Spawn Player, Vehicles, NPCs, Police, and Cash Stashes
      this._spawnPlayer();
      this._spawnVehicles();
      this._spawnNPCs();
      this._spawnInitialCops();
      this._spawnCashStashes();

      // Pre-render static radar backdrop for ultra-fast minimap redraws
      this._prepareRadarBackdrop();
      this._syncHud(true);

      // Hide loading overlay
      if (this.dom.loadingOverlay) {
        this.dom.loadingOverlay.classList.add("hidden");
      }

      // Main render & fixed-clamped simulation loop
      this.engine.runRenderLoop(() => {
        const rawDt = this.engine.getDeltaTime() / 1000;
        const dt = clamp(isNaN(rawDt) ? 0.016 : rawDt, 0.001, 0.05);
        this.update(dt);
        this.scene.render();
      });

      if (!this.options.useNullEngine && global.addEventListener) {
        this._resizeHandler = () => {
          if (this.engine) this.engine.resize();
        };
        global.addEventListener("resize", this._resizeHandler);
      }
    }

    _setupAtmosphereAndLighting() {
      const C = global.COLORS;
      const sky = BABYLON.Color3.FromHexString(C.SKY_TOP);
      this.scene.clearColor = new BABYLON.Color4(sky.r, sky.g, sky.b, 1);

      // Warm golden Rajasthani desert-lake atmospheric haze
      this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
      this.scene.fogColor = BABYLON.Color3.FromHexString(C.FOG_WARM);
      this.scene.fogDensity = 0.0036;

      // Ambient hemisphere light (sky azure + warm sandstone ground bounce)
      const hemi = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0.2, 1, 0.15), this.scene);
      hemi.intensity = 0.78;
      hemi.diffuse = new BABYLON.Color3(1.0, 0.96, 0.88);
      hemi.groundColor = new BABYLON.Color3(0.46, 0.39, 0.32);

      // Golden Udaipur afternoon directional sun
      const sun = new BABYLON.DirectionalLight("sunLight", new BABYLON.Vector3(-0.55, -0.82, -0.35), this.scene);
      sun.intensity = 0.82;
      sun.diffuse = new BABYLON.Color3(1.0, 0.93, 0.76);
      sun.specular = new BABYLON.Color3(0.9, 0.82, 0.6);

      // Stylized voxel sun glowing high above the Aravalli Hills
      const sunDisc = BABYLON.MeshBuilder.CreateBox("sunDisc", { size: 14 }, this.scene);
      sunDisc.position.set(-140, 115, 70);
      sunDisc.material = global.createColorMat(this.scene, "sun_disc", C.SUN_DISC, {
        emissive: C.SUN_DISC,
        disableLighting: true,
        freeze: true
      });
      sunDisc.isPickable = false;
      sunDisc.freezeWorldMatrix();
    }

    _setupCamera() {
      const sp = global.GameAssets.gridToWorld(global.SPAWNS.player.gx, 0, global.SPAWNS.player.gz);
      const cam = new BABYLON.ArcRotateCamera(
        "mainCam",
        -Math.PI / 2,
        1.14,
        17,
        new BABYLON.Vector3(sp.x, sp.y + 2.5, sp.z),
        this.scene
      );
      cam.lowerBetaLimit = 0.25;
      cam.upperBetaLimit = 1.48;
      cam.lowerRadiusLimit = 7;
      cam.upperRadiusLimit = 58;
      cam.wheelDeltaPercentage = 0.04;
      cam.inertia = 0.78;
      cam.minZ = 0.5;
      cam.maxZ = 420;
      // Disable arrow-key camera hijacking so Arrows control character & vehicle cleanly
      cam.keysUp = [];
      cam.keysDown = [];
      cam.keysLeft = [];
      cam.keysRight = [];

      if (this.canvas && !this.options.useNullEngine) {
        cam.attachControl(this.canvas, true);
      }
      this.camera = cam;
      this.scene.activeCamera = cam;
    }

    // ------------------------------------------------------------------------
    // Entity Spawning
    // ------------------------------------------------------------------------
    _spawnPlayer() {
      const sp = global.SPAWNS.player;
      const pos = global.GameAssets.gridToWorld(sp.gx, sp.gy || 0, sp.gz);
      const model = global.GameModels.createCharacterModel(this.scene, "HERO");
      model.root.position.set(pos.x, pos.y, pos.z);
      model.root.rotation.y = sp.yaw || 0;
      model.setWeaponVisual("PISTOL");

      this.player = {
        model: model,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        yaw: sp.yaw || 0,
        hp: 100,
        maxHp: 100,
        grounded: true,
        coyoteTimer: 0,
        inWater: false,
        weaponId: "PISTOL",
        fireCooldown: 0,
        aimTimer: 0,
        regenDelay: 0,
        vehicle: null,
        nearbyVehicle: null,
        halfW: 0.62,
        height: 3.0
      };
    }

    _spawnVehicles() {
      const list = global.SPAWNS.vehicles;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const pos = global.GameAssets.gridToWorld(s.gx, 0, s.gz);
        const model = global.GameModels.createVehicleModel(this.scene, s.type, {
          colorKey: s.colorKey
        });
        model.root.position.set(pos.x, 0, pos.z);
        model.root.rotation.y = s.yaw || 0;

        this.vehicles.push({
          id: i,
          type: s.type,
          name: model.name,
          model: model,
          x: pos.x,
          y: 0,
          z: pos.z,
          yaw: s.yaw || 0,
          speed: 0,
          steer: 0,
          hp: s.type === "AUTO" ? 120 : 200,
          maxHp: s.type === "AUTO" ? 120 : 200,
          driver: null, // "PLAYER" | "AI_COP" | null
          spawnX: pos.x,
          spawnZ: pos.z,
          spawnYaw: s.yaw || 0,
          respawnTimer: 0,
          sirenActive: false,
          aiStuckTimer: 0,
          aiTurnBias: i % 2 === 0 ? 1 : -1
        });
      }
    }

    _spawnNPCs() {
      const list = global.SPAWNS.npcs;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const pos = global.GameAssets.gridToWorld(s.gx, 0, s.gz);
        const model = global.GameModels.createCharacterModel(this.scene, "NPC", { variant: i });
        model.root.position.set(pos.x, 0, pos.z);
        const yaw = Math.random() * Math.PI * 2;
        model.root.rotation.y = yaw;

        this.npcs.push({
          model: model,
          x: pos.x,
          y: 0,
          z: pos.z,
          yaw: yaw,
          walkSpeed: 3.4 + (i % 4) * 0.45,
          fleeTimer: 0,
          wanderTimer: 1.5 + Math.random() * 3.5,
          hp: 40,
          alive: true,
          respawnTimer: 0,
          spawnX: pos.x,
          spawnZ: pos.z
        });
      }
    }

    _spawnInitialCops() {
      const list = global.SPAWNS.cops;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const pos = global.GameAssets.gridToWorld(s.gx, 0, s.gz);
        this._createCopEntity(pos.x, pos.z, false);
      }
    }

    _createCopEntity(wx, wz, isBackup) {
      const model = global.GameModels.createCharacterModel(this.scene, "COP");
      model.root.position.set(wx, 0, wz);
      const yaw = Math.random() * Math.PI * 2;
      model.root.rotation.y = yaw;

      const cop = {
        model: model,
        x: wx,
        y: 0,
        z: wz,
        yaw: yaw,
        hp: 75,
        maxHp: 75,
        alive: true,
        isBackup: !!isBackup,
        fireCooldown: 0.8 + Math.random() * 0.6,
        wanderTimer: 2 + Math.random() * 3,
        stuckTimer: 0,
        strafeDir: Math.random() > 0.5 ? 1 : -1,
        respawnTimer: 0,
        spawnX: wx,
        spawnZ: wz
      };
      this.cops.push(cop);
      return cop;
    }

    _spawnCashStashes() {
      const list = global.SPAWNS.cashStashes;
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const pos = global.GameAssets.gridToWorld(s.gx, 0, s.gz);
        const root = global.GameModels.createCashStashModel(this.scene, "stash_" + i);
        root.position.set(pos.x, 0, pos.z);

        this.cashStashes.push({
          root: root,
          x: pos.x,
          y: 0,
          z: pos.z,
          amount: s.amount,
          label: s.label,
          active: true,
          respawnTimer: 0,
          temporary: false,
          phase: i * 0.7
        });
      }
    }

    _spawnTemporaryCashDrop(x, z, amount) {
      const root = global.GameModels.createCashStashModel(this.scene, "drop_" + Math.floor(Math.random() * 1e6));
      root.position.set(x, 0, z);
      this.cashStashes.push({
        root: root,
        x: x,
        y: 0,
        z: z,
        amount: amount,
        label: "POLICE BOUNTY DROP",
        active: true,
        respawnTimer: 0,
        temporary: true,
        lifeTimer: 35,
        phase: Math.random() * 6
      });
    }

    // ------------------------------------------------------------------------
    // Public Control Hooks (Called by js/controls.js)
    // ------------------------------------------------------------------------
    setInput(name, active) {
      if (name in this.input) {
        this.input[name] = !!active;
      }
    }

    clearAllInputs() {
      this.input.up = false;
      this.input.down = false;
      this.input.left = false;
      this.input.right = false;
      this.input.fire = false;
    }

    fireOnce() {
      if (!this.player) return;
      this._tryFireWeapon();
    }

    triggerJump() {
      if (!this.player) return;
      const p = this.player;
      if (p.vehicle) {
        // Inside vehicle: honk Udaipur horn & gentle handbrake slip!
        global.GameAssets.SFX.horn();
        p.vehicle.speed *= 0.82;
        global.showToast("HONK! " + p.vehicle.name, "info", 1200);
        return;
      }
      if (p.grounded || p.coyoteTimer > 0 || p.inWater) {
        p.vy = p.inWater ? 11.5 : 14.8;
        p.grounded = false;
        p.coyoteTimer = 0;
        global.GameAssets.SFX.jump();
        this._spawnBurst(p.x, p.y + 0.3, p.z, global.COLORS.SIDEWALK, 5, 3.2);
      }
    }

    switchWeapon() {
      if (!this.player) return;
      const p = this.player;
      p.weaponId = p.weaponId === "PISTOL" ? "SMG" : "PISTOL";
      p.model.setWeaponVisual(p.weaponId);
      const w = WEAPONS[p.weaponId];
      global.GameAssets.SFX.weaponSwitch();
      global.showToast("EQUIPPED " + w.name, "info", 1600);
      this._syncHud(true);
    }

    triggerVehicleAction() {
      if (!this.player) return;
      const p = this.player;

      if (p.vehicle) {
        this._exitCurrentVehicle();
        return;
      }

      const nearest = this._findNearestVehicle(8.8);
      if (!nearest) {
        global.GameAssets.SFX.error();
        global.showToast("MOVE CLOSER TO AN AUTO, SUV OR POLICE CAR!", "info", 1600);
        return;
      }

      this._enterVehicle(nearest);
    }

    toggleCameraMode() {
      this.cameraMode = this.cameraMode === "FOLLOW" ? "FREE" : "FOLLOW";
      global.GameAssets.SFX.camera();
      global.showToast(
        this.cameraMode === "FREE"
          ? "CAMERA: FREE ORBIT (DRAG TO LOOK AROUND)"
          : "CAMERA: FOLLOW MODE",
        "info",
        1800
      );
      this._syncHud(true);
    }

    bribePolice() {
      if (this.wantedLevel <= 0) {
        global.showToast("NO WANTED HEAT TO CLEAR!", "info", 1500);
        return;
      }
      if (this.cash < BRIBE_COST) {
        global.GameAssets.SFX.error();
        global.showToast("NEED ₹" + BRIBE_COST + " TO BRIBE POLICE!", "wanted", 2000);
        return;
      }

      this.cash -= BRIBE_COST;
      this.wantedLevel = 0;
      this.evading = false;
      this.evadeTimer = 0;
      this.decayTimer = 0;
      this._silencePoliceChase();
      global.GameAssets.SFX.bribe();
      global.showToast("POLICE BRIBED (-₹500) — WANTED HEAT CLEARED!", "cash", 2600);
      this._syncHud(true);
    }

    toggleMute() {
      const next = !global.GameAssets.isMuted();
      global.GameAssets.setMuted(next);
      if (this.dom.soundBtn) {
        this.dom.soundBtn.textContent = next ? "🔇" : "🔊";
      }
      if (!next) {
        global.GameAssets.SFX.camera();
      }
    }

    // ------------------------------------------------------------------------
    // Vehicle Hijacking / Exiting Helpers
    // ------------------------------------------------------------------------
    _findNearestVehicle(maxDist) {
      const p = this.player;
      let best = null;
      let bestD = maxDist;
      for (let i = 0; i < this.vehicles.length; i++) {
        const v = this.vehicles[i];
        if (v.respawnTimer > 0) continue;
        const d = dist2D(p.x, p.z, v.x, v.z);
        if (d < bestD) {
          bestD = d;
          best = v;
        }
      }
      return best;
    }

    _enterVehicle(veh) {
      const p = this.player;
      p.vehicle = veh;
      veh.driver = "PLAYER";
      p.model.root.setEnabled(false);
      p.x = veh.x;
      p.y = veh.y;
      p.z = veh.z;
      p.yaw = veh.yaw;
      p.vy = 0;
      global.GameAssets.SFX.hijack();

      if (veh.type === "POLICE") {
        veh.sirenActive = true;
        this.addWanted(this.wantedLevel < 2 ? 2 - this.wantedLevel : 1, "HIJACKED POLICE CRUISER!");
      } else {
        global.showToast("HIJACKED " + veh.name + "!", "info", 2000);
        // If a cop sees a civilian vehicle theft nearby, gain 1 star
        for (let i = 0; i < this.cops.length; i++) {
          const c = this.cops[i];
          if (c.alive && dist2D(c.x, c.z, veh.x, veh.z) < 24) {
            this.addWanted(1, "VEHICLE THEFT SPOTTED BY POLICE!");
            break;
          }
        }
      }
      this._syncHud(true);
    }

    _exitCurrentVehicle() {
      const p = this.player;
      const veh = p.vehicle;
      if (!veh) return;

      // Test safe exit offsets around the vehicle so player never clips a wall or falls in lake
      const cos = Math.cos(veh.yaw);
      const sin = Math.sin(veh.yaw);
      const sideDist = veh.model.halfW + 1.4;
      const candidates = [
        { x: veh.x - cos * sideDist, z: veh.z + sin * sideDist }, // Left door
        { x: veh.x + cos * sideDist, z: veh.z - sin * sideDist }, // Right door
        { x: veh.x - sin * (veh.model.halfL + 1.5), z: veh.z - cos * (veh.model.halfL + 1.5) }, // Rear
        { x: veh.x + sin * (veh.model.halfL + 1.5), z: veh.z + cos * (veh.model.halfL + 1.5) }  // Front
      ];

      let exitX = veh.x;
      let exitZ = veh.z;
      for (let i = 0; i < candidates.length; i++) {
        const cx = candidates[i].x;
        const cz = candidates[i].z;
        const gy = this.world.getGroundY(cx, cz, veh.y);
        if (!this.world.hitsBox(cx, gy, cz, p.halfW, p.height) && !this.world.isWater(cx, cz)) {
          exitX = cx;
          exitZ = cz;
          break;
        }
      }

      veh.driver = null;
      if (veh.type === "POLICE" && this.wantedLevel === 0) {
        veh.sirenActive = false;
        veh.model.setSirenState(false, 0);
      }
      p.vehicle = null;
      p.x = exitX;
      p.z = exitZ;
      p.y = Math.max(0, this.world.getGroundY(exitX, exitZ, veh.y + 0.5));
      p.vy = 0;
      p.grounded = true;
      p.model.root.position.set(p.x, p.y, p.z);
      p.model.root.rotation.y = p.yaw;
      p.model.root.setEnabled(true);

      global.GameAssets.SFX.exitCar();
      global.showToast("EXITED " + veh.name, "info", 1400);
      this._syncHud(true);
    }

    // ------------------------------------------------------------------------
    // Wanted System & Police Heat Management
    // ------------------------------------------------------------------------
    addWanted(amount, toastMsg) {
      const prev = this.wantedLevel;
      this.wantedLevel = clamp(this.wantedLevel + amount, 0, MAX_WANTED);
      this.crimeCooldown = 10;
      this.evading = false;
      this.evadeTimer = 0;
      this.decayTimer = 0;

      if (this.wantedLevel > prev) {
        global.GameAssets.SFX.wantedUp();
        global.showToast(
          (toastMsg ? toastMsg + " " : "") + "WANTED " + "★".repeat(this.wantedLevel),
          "wanted",
          2500
        );
      } else if (toastMsg) {
        global.showToast(toastMsg, "wanted", 2000);
      }
      this._syncHud(true);
    }

    _silencePoliceChase() {
      for (let i = 0; i < this.vehicles.length; i++) {
        const v = this.vehicles[i];
        if (v.type === "POLICE") {
          if (v.driver === "AI_COP") v.driver = null;
          if (v.driver !== "PLAYER") {
            v.sirenActive = false;
            v.model.setSirenState(false, 0);
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // Main Simulation Update Loop
    // ------------------------------------------------------------------------
    update(dt) {
      this.elapsed += dt;

      // Subtle shimmering animation on Lake Pichola water surface
      if (this.world.waterShimmerMesh) {
        this.world.waterShimmerMesh.position.y =
          this.world.waterLevelY + Math.sin(this.elapsed * 2.1) * 0.05;
      }

      this._updatePlayer(dt);
      this._updateVehicles(dt);
      this._updateNPCs(dt);
      this._updatePoliceAndWanted(dt);
      this._updateProjectiles(dt);
      this._updateCashStashes(dt);
      this._updateParticles(dt);
      this._updateCamera(dt);

      // Periodic HUD & Radar refresh
      this.hudTickTimer += dt;
      if (this.hudTickTimer >= 0.14) {
        this.hudTickTimer = 0;
        this._syncHud(false);
      }

      this.radarTimer += dt;
      if (this.radarTimer >= 0.08) {
        this.radarTimer = 0;
        this._renderRadar();
      }
    }

    // ------------------------------------------------------------------------
    // Player Movement, Jumping, Shooting & Regeneration
    // ------------------------------------------------------------------------
    _updatePlayer(dt) {
      const p = this.player;
      p.fireCooldown = Math.max(0, p.fireCooldown - dt);
      p.aimTimer = Math.max(0, p.aimTimer - dt);
      p.regenDelay = Math.max(0, p.regenDelay - dt);

      // Slow health regeneration when out of combat
      if (p.hp < p.maxHp && p.regenDelay <= 0) {
        p.hp = Math.min(p.maxHp, p.hp + dt * 5.5);
      }

      // Continuous fire when holding FIRE button (perfect for VOXEL SMG & Pistol)
      if (this.input.fire && p.fireCooldown <= 0) {
        this._tryFireWeapon();
      }

      if (p.vehicle) {
        // Player drives their hijacked vehicle
        this._drivePlayerVehicle(p.vehicle, dt);
        p.nearbyVehicle = null;
        return;
      }

      // Check nearest hijackable vehicle for HUD highlight
      p.nearbyVehicle = this._findNearestVehicle(8.8);

      // Camera-relative horizontal forward & right axes
      const camAlpha = this.camera.alpha;
      const fwdX = -Math.cos(camAlpha);
      const fwdZ = -Math.sin(camAlpha);
      const rightX = fwdZ;
      const rightZ = -fwdX;

      let moveFwd = (this.input.up ? 1 : 0) - (this.input.down ? 1 : 0);
      let moveRight = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);

      let wishX = fwdX * moveFwd + rightX * moveRight;
      let wishZ = fwdZ * moveFwd + rightZ * moveRight;
      const wishLen = Math.hypot(wishX, wishZ);

      const moveSpeed = p.inWater ? 8.2 : 13.8;
      if (wishLen > 0.01) {
        wishX /= wishLen;
        wishZ /= wishLen;
        p.vx = wishX * moveSpeed;
        p.vz = wishZ * moveSpeed;

        const targetYaw = Math.atan2(wishX, wishZ);
        p.yaw = lerpAngle(p.yaw, targetYaw, dt * 13);

        // In FOLLOW mode, gently swing camera behind sideways movement for 1-hand D-pad navigation
        if (this.cameraMode === "FOLLOW" && moveRight !== 0) {
          this.camera.alpha -= moveRight * dt * 1.15;
        }
      } else {
        const damp = Math.max(0, 1 - dt * 14);
        p.vx *= damp;
        p.vz *= damp;
      }

      // Horizontal wall-sliding collision against voxel world (separate X & Z passes)
      const stepClearance = 0.85;
      const nextX = p.x + p.vx * dt;
      const gxGround = this.world.getGroundY(nextX, p.z, p.y);
      const canStepX = gxGround - p.y <= stepClearance;
      if (canStepX && !this.world.hitsBox(nextX, Math.max(p.y, gxGround), p.z, p.halfW, p.height)) {
        p.x = nextX;
      } else {
        p.vx = 0;
      }

      const nextZ = p.z + p.vz * dt;
      const gzGround = this.world.getGroundY(p.x, nextZ, p.y);
      const canStepZ = gzGround - p.y <= stepClearance;
      if (canStepZ && !this.world.hitsBox(p.x, Math.max(p.y, gzGround), nextZ, p.halfW, p.height)) {
        p.z = nextZ;
      } else {
        p.vz = 0;
      }

      // Vertical physics, gravity, stair stepping & Lake Pichola water wading
      const wasInWater = p.inWater;
      p.inWater = this.world.isWater(p.x, p.z);
      const groundY = this.world.getGroundY(p.x, p.z, p.y);

      if (p.inWater && !wasInWater) {
        this._spawnBurst(p.x, this.world.waterLevelY + 0.3, p.z, global.COLORS.WATER_FOAM, 10, 5);
        global.beep(190, 0.14, "sine", 0.08, 95);
        global.showToast("SPLASHING IN LAKE PICHOLA!", "info", 1600);
      }

      p.vy -= 34 * dt;
      p.y += p.vy * dt;

      if (p.y <= groundY) {
        p.y = groundY;
        p.vy = 0;
        p.grounded = true;
        p.coyoteTimer = 0.12;
      } else {
        p.grounded = false;
        p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
      }

      // Apply transform & articulated walking animation
      p.model.root.position.set(p.x, p.y, p.z);
      p.model.root.rotation.y = p.yaw;

      const horizSpeed = Math.hypot(p.vx, p.vz);
      global.GameModels.animateCharacter(
        p.model,
        horizSpeed,
        dt,
        p.aimTimer > 0 || this.input.fire,
        !p.grounded && !p.inWater
      );
    }

    // ------------------------------------------------------------------------
    // Weapons & Shooting (VOXEL PISTOL & VOXEL SMG)
    // ------------------------------------------------------------------------
    _tryFireWeapon() {
      const p = this.player;
      const weapon = WEAPONS[p.weaponId];
      if (!weapon || p.fireCooldown > 0) return;

      p.fireCooldown = weapon.fireRate;
      p.aimTimer = 0.45;

      // Determine firing origin & direction (with subtle auto-aim assist on nearby cops)
      let yaw = p.vehicle ? p.vehicle.yaw : p.yaw;
      const originX = p.x + Math.sin(yaw) * (p.vehicle ? 2.6 : 0.95);
      const originY = p.y + (p.vehicle ? 1.85 : 1.95);
      const originZ = p.z + Math.cos(yaw) * (p.vehicle ? 2.6 : 0.95);

      // Soft auto-aim cone toward closest alive cop within 30 units
      let bestAngleDiff = 0.42; // ~24 degrees
      let aimTargetYaw = yaw;
      for (let i = 0; i < this.cops.length; i++) {
        const c = this.cops[i];
        if (!c.alive) continue;
        const d = dist2D(originX, originZ, c.x, c.z);
        if (d < 30 && d > 1.2) {
          const toCop = Math.atan2(c.x - originX, c.z - originZ);
          const diff = Math.abs(wrapAngle(toCop - yaw));
          if (diff < bestAngleDiff) {
            bestAngleDiff = diff;
            aimTargetYaw = toCop;
          }
        }
      }

      yaw = aimTargetYaw + (Math.random() - 0.5) * weapon.spread * 2;
      if (!p.vehicle) {
        p.yaw = aimTargetYaw;
      }

      const dirX = Math.sin(yaw);
      const dirZ = Math.cos(yaw);

      this._spawnProjectile(
        originX,
        originY,
        originZ,
        dirX * weapon.speed,
        0,
        dirZ * weapon.speed,
        weapon.damage,
        "PLAYER",
        global.COLORS[weapon.colorKey],
        weapon.range / weapon.speed
      );

      // Muzzle flash particle + sound + reticle kick
      this._spawnBurst(originX, originY, originZ, global.COLORS.MUZZLE_FLASH, 3, 4.5);
      if (weapon.id === "SMG") {
        global.GameAssets.SFX.smg();
      } else {
        global.GameAssets.SFX.pistol();
      }

      if (this.dom.crosshair) {
        this.dom.crosshair.classList.add("firing");
        setTimeout(() => {
          if (this.dom.crosshair) this.dom.crosshair.classList.remove("firing");
        }, 70);
      }

      // Firing in the city alerts nearby NPCs to scatter & draws police attention
      this._alertNPCsNear(p.x, p.z, 26);
      if (this.wantedLevel === 0) {
        for (let i = 0; i < this.cops.length; i++) {
          const c = this.cops[i];
          if (c.alive && dist2D(c.x, c.z, p.x, p.z) < 34) {
            this.addWanted(1, "GUNFIRE REPORTED!");
            break;
          }
        }
      } else {
        this.crimeCooldown = Math.max(this.crimeCooldown, 7);
      }
    }

    _spawnProjectile(x, y, z, vx, vy, vz, damage, owner, colorHex, ttl) {
      const box = BABYLON.MeshBuilder.CreateBox(
        "proj_" + Math.floor(Math.random() * 1e6),
        { width: 0.22, height: 0.22, depth: 0.72 },
        this.scene
      );
      box.position.set(x, y, z);
      box.rotation.y = Math.atan2(vx, vz);
      box.material = global.createColorMat(this.scene, "proj_" + colorHex, colorHex, {
        emissive: colorHex,
        disableLighting: true,
        freeze: true
      });
      box.isPickable = false;

      this.projectiles.push({
        mesh: box,
        x: x,
        y: y,
        z: z,
        vx: vx,
        vy: vy,
        vz: vz,
        damage: damage,
        owner: owner,
        ttl: ttl || 1.0
      });
    }

    _updateProjectiles(dt) {
      const p = this.player;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const b = this.projectiles[i];
        b.ttl -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.z += b.vz * dt;
        b.mesh.position.set(b.x, b.y, b.z);

        let remove = b.ttl <= 0 || Math.abs(b.x) > this.world.worldLimit || Math.abs(b.z) > this.world.worldLimit;

        // Voxel building / hill / tree collision
        if (!remove && this.world.hitsVoxel(b.x, b.y, b.z)) {
          this._spawnBurst(b.x, b.y, b.z, global.COLORS.PALACE_CREAM, 5, 6);
          remove = true;
        }

        if (!remove && b.owner === "PLAYER") {
          // Hit cops
          for (let ci = 0; ci < this.cops.length; ci++) {
            const c = this.cops[ci];
            if (!c.alive) continue;
            if (dist2D(b.x, b.z, c.x, c.z) < 1.25 && b.y >= c.y && b.y <= c.y + 3.2) {
              c.hp -= b.damage;
              this._spawnBurst(b.x, b.y, b.z, global.COLORS.SIREN_RED, 7, 7);
              global.GameAssets.SFX.hit();
              if (this.wantedLevel < 2) {
                this.addWanted(1, "ATTACKED POLICE OFFICER!");
              } else {
                this.crimeCooldown = 10;
              }
              if (c.hp <= 0) {
                this._defeatCop(c);
              }
              remove = true;
              break;
            }
          }

          // Hit NPCs (raises wanted level!)
          if (!remove) {
            for (let ni = 0; ni < this.npcs.length; ni++) {
              const n = this.npcs[ni];
              if (!n.alive) continue;
              if (dist2D(b.x, b.z, n.x, n.z) < 1.15 && b.y >= n.y && b.y <= n.y + 3.0) {
                n.hp -= b.damage;
                n.fleeTimer = 8;
                this._spawnBurst(b.x, b.y, b.z, global.COLORS.AWNING_SAFFRON, 6, 6);
                global.GameAssets.SFX.hit();
                this.addWanted(1, "CITIZEN ASSAULTED!");
                if (n.hp <= 0) {
                  n.alive = false;
                  n.respawnTimer = 18;
                  n.model.root.setEnabled(false);
                }
                remove = true;
                break;
              }
            }
          }

          // Hit un-occupied vehicles (sparks + bounce)
          if (!remove) {
            for (let vi = 0; vi < this.vehicles.length; vi++) {
              const v = this.vehicles[vi];
              if (v === p.vehicle || v.respawnTimer > 0) continue;
              if (dist2D(b.x, b.z, v.x, v.z) < v.model.halfL * 0.9 && b.y < v.y + v.model.height) {
                v.hp -= b.damage;
                this._spawnBurst(b.x, b.y, b.z, global.COLORS.MUZZLE_FLASH, 6, 7);
                if (v.type === "POLICE") {
                  this.addWanted(1, "DAMAGED POLICE CRUISER!");
                }
                if (v.hp <= 0) {
                  this._wreckVehicle(v);
                }
                remove = true;
                break;
              }
            }
          }
        } else if (!remove && b.owner === "COP") {
          // Police bullet hitting player
          const hitRadius = p.vehicle ? p.vehicle.model.halfL * 0.85 : 1.05;
          if (dist2D(b.x, b.z, p.x, p.z) < hitRadius && b.y >= p.y && b.y <= p.y + 3.2) {
            this._damagePlayer(p.vehicle ? b.damage * 0.45 : b.damage);
            this._spawnBurst(b.x, b.y, b.z, global.COLORS.SIREN_RED, 5, 5);
            remove = true;
          }
        }

        if (remove) {
          b.mesh.dispose();
          this.projectiles.splice(i, 1);
        }
      }
    }

    _damagePlayer(amount) {
      const p = this.player;
      p.hp = Math.max(0, p.hp - amount);
      p.regenDelay = 5.0;
      global.GameAssets.SFX.hit();

      if (p.hp <= 0) {
        // Wasted / Busted respawn cleanly at Gangaur Ghat
        if (p.vehicle) {
          this._exitCurrentVehicle();
        }
        const bail = Math.min(this.cash, 250);
        this.cash -= bail;
        this.wantedLevel = 0;
        this.evading = false;
        this._silencePoliceChase();

        const sp = global.GameAssets.gridToWorld(global.SPAWNS.player.gx, 0, global.SPAWNS.player.gz);
        p.x = sp.x;
        p.y = 0;
        p.z = sp.z;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
        p.yaw = 0;
        p.hp = p.maxHp;
        p.model.root.position.set(p.x, p.y, p.z);
        p.model.root.setEnabled(true);

        global.GameAssets.SFX.error();
        global.showToast(
          "BUSTED BY UDAIPUR POLICE! BAIL -₹" + bail + " — RESPAWNED AT GANGAUR GHAT",
          "wanted",
          3400
        );
        this._syncHud(true);
      }
    }

    // ------------------------------------------------------------------------
    // Vehicle Driving, Collisions & AI Police Pursuit Cruisers
    // ------------------------------------------------------------------------
    _drivePlayerVehicle(veh, dt) {
      const throttle = (this.input.up ? 1 : 0) - (this.input.down ? 1 : 0);
      const steerInput = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);

      if (throttle > 0) {
        veh.speed = Math.min(veh.model.maxSpeed, veh.speed + veh.model.accel * dt);
      } else if (throttle < 0) {
        veh.speed = Math.max(-veh.model.reverseSpeed, veh.speed - veh.model.accel * 1.15 * dt);
      } else {
        // Smooth rolling drag
        const drag = Math.min(Math.abs(veh.speed), 14 * dt);
        veh.speed -= Math.sign(veh.speed) * drag;
      }

      if (Math.abs(veh.speed) > 0.45 && steerInput !== 0) {
        const dirSign = veh.speed >= 0 ? 1 : -1;
        const speedFactor = clamp(Math.abs(veh.speed) / 9, 0.35, 1.0);
        veh.yaw += steerInput * veh.model.turnSpeed * speedFactor * dirSign * dt;
      }
      veh.steer += (steerInput - veh.steer) * Math.min(1, dt * 10);

      this._stepVehiclePhysics(veh, dt, true);

      // Keep player synced to driven vehicle
      this.player.x = veh.x;
      this.player.y = veh.y;
      this.player.z = veh.z;
      this.player.yaw = veh.yaw;
    }

    _updateVehicles(dt) {
      const p = this.player;
      const sirenPhase = Math.sin(this.elapsed * 14);

      for (let i = 0; i < this.vehicles.length; i++) {
        const v = this.vehicles[i];

        // Handle wrecked/sunk vehicle respawn timer
        if (v.respawnTimer > 0) {
          v.respawnTimer -= dt;
          if (v.respawnTimer <= 0) {
            v.x = v.spawnX;
            v.y = 0;
            v.z = v.spawnZ;
            v.yaw = v.spawnYaw;
            v.speed = 0;
            v.hp = v.maxHp;
            v.driver = null;
            v.sirenActive = false;
            v.model.root.position.set(v.x, v.y, v.z);
            v.model.root.rotation.y = v.yaw;
            v.model.root.setEnabled(true);
          }
          continue;
        }

        // AI Police Cruiser pursuit when Wanted Level >= 1
        if (v.type === "POLICE" && v.driver !== "PLAYER") {
          if (this.wantedLevel >= 1) {
            v.driver = "AI_COP";
            v.sirenActive = true;
            this._updatePoliceCarAI(v, dt);
          } else {
            if (v.driver === "AI_COP") v.driver = null;
            v.sirenActive = false;
            v.speed *= Math.max(0, 1 - dt * 4);
            this._stepVehiclePhysics(v, dt, false);
          }
        } else if (v.driver !== "PLAYER") {
          // Parked/coasting unoccupied civilian vehicle
          if (Math.abs(v.speed) > 0.05) {
            v.speed *= Math.max(0, 1 - dt * 3.5);
            this._stepVehiclePhysics(v, dt, false);
          }
        }

        // Flash police cruiser siren beacons
        if (v.type === "POLICE") {
          v.model.setSirenState(v.sirenActive, sirenPhase);
        }
      }
    }

    _updatePoliceCarAI(veh, dt) {
      const p = this.player;
      const dx = p.x - veh.x;
      const dz = p.z - veh.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 85) {
        veh.speed *= Math.max(0, 1 - dt * 3);
        this._stepVehiclePhysics(veh, dt, false);
        return;
      }

      const desiredYaw = Math.atan2(dx, dz);
      const angleDiff = wrapAngle(desiredYaw - veh.yaw);

      // Avoid walls ahead by probing forward point
      const probeX = veh.x + Math.sin(veh.yaw) * 6.5;
      const probeZ = veh.z + Math.cos(veh.yaw) * 6.5;
      const blockedAhead =
        this.world.hitsBox(probeX, 0.2, probeZ, veh.model.halfW, veh.model.height) ||
        this.world.isWater(probeX, probeZ);

      if (blockedAhead) {
        veh.aiStuckTimer += dt;
        veh.yaw += veh.aiTurnBias * 2.4 * dt;
        veh.speed = veh.aiStuckTimer > 1.2 ? -9 : 8;
        if (veh.aiStuckTimer > 2.2) {
          veh.aiStuckTimer = 0;
          veh.aiTurnBias *= -1;
        }
      } else {
        veh.aiStuckTimer = Math.max(0, veh.aiStuckTimer - dt);
        const turnStep = clamp(angleDiff, -2.1 * dt, 2.1 * dt);
        veh.yaw += turnStep;

        const targetSpeed = dist > 11 ? Math.min(25, 16 + this.wantedLevel * 2.2) : 6;
        veh.speed += (targetSpeed - veh.speed) * Math.min(1, dt * 3.5);
      }

      this._stepVehiclePhysics(veh, dt, false);

      // Police car ramming player on foot
      if (!p.vehicle && dist < 3.4 && Math.abs(veh.speed) > 6) {
        this._damagePlayer(14);
        veh.speed = -4;
      }
    }

    _stepVehiclePhysics(veh, dt, isPlayer) {
      const moveDist = veh.speed * dt;
      const sin = Math.sin(veh.yaw);
      const cos = Math.cos(veh.yaw);
      const nextX = veh.x + sin * moveDist;
      const nextZ = veh.z + cos * moveDist;

      // Check water plunge in Lake Pichola
      if (this.world.isWater(nextX, nextZ)) {
        if (isPlayer) {
          this._exitCurrentVehicle();
          global.showToast("SPLASH! VEHICLE SUNK IN LAKE PICHOLA!", "wanted", 2400);
          this._spawnBurst(nextX, this.world.waterLevelY + 0.5, nextZ, global.COLORS.WATER_FOAM, 14, 7);
          veh.respawnTimer = 10;
          veh.model.root.setEnabled(false);
          return;
        } else {
          veh.speed = -veh.speed * 0.5;
          return;
        }
      }

      // Separate X and Z voxel box collision for clean sliding along roads & bridges
      const colRadius = veh.model.halfW + 0.25;
      let collided = false;
      if (!this.world.hitsBox(nextX, 0.2, veh.z, colRadius, veh.model.height)) {
        veh.x = nextX;
      } else {
        collided = true;
      }
      if (!this.world.hitsBox(veh.x, 0.2, nextZ, colRadius, veh.model.height)) {
        veh.z = nextZ;
      } else {
        collided = true;
      }

      if (collided) {
        if (Math.abs(veh.speed) > 10 && isPlayer) {
          global.GameAssets.SFX.hit();
          this._spawnBurst(veh.x + sin * 2, 1.1, veh.z + cos * 2, global.COLORS.MUZZLE_FLASH, 5, 5);
        }
        veh.speed *= -0.25;
      }

      // Vehicle-to-vehicle bump separation
      for (let j = 0; j < this.vehicles.length; j++) {
        const other = this.vehicles[j];
        if (other === veh || other.respawnTimer > 0) continue;
        const d = dist2D(veh.x, veh.z, other.x, other.z);
        const minD = veh.model.halfW + other.model.halfW + 0.8;
        if (d > 0.01 && d < minD) {
          const push = (minD - d) * 0.5;
          const nx = (veh.x - other.x) / d;
          const nz = (veh.z - other.z) / d;
          veh.x += nx * push;
          veh.z += nz * push;
          if (Math.abs(veh.speed) > 9 && isPlayer) {
            other.speed = Math.min(10, Math.abs(veh.speed) * 0.4);
            global.GameAssets.SFX.hit();
            if (other.type === "POLICE") {
              this.addWanted(1, "RAMMED POLICE CRUISER!");
            }
          }
          veh.speed *= 0.45;
        }
      }

      // Player vehicle ramming cops or scattering NPCs at speed!
      if (isPlayer && Math.abs(veh.speed) > 8) {
        this._alertNPCsNear(veh.x, veh.z, 12);
        for (let ci = 0; ci < this.cops.length; ci++) {
          const c = this.cops[ci];
          if (!c.alive) continue;
          if (dist2D(veh.x, veh.z, c.x, c.z) < veh.model.halfW + 1.1) {
            this._defeatCop(c);
            this.addWanted(1, "POLICE RAMMED!");
            global.GameAssets.SFX.hit();
          }
        }
      }

      // Ground contact + wheel rotation + subtle turn body roll
      veh.y = Math.max(-0.5, this.world.getGroundY(veh.x, veh.z, 0.4));
      veh.model.root.position.set(veh.x, veh.y, veh.z);
      veh.model.root.rotation.y = veh.yaw;
      veh.model.root.rotation.z = -veh.steer * clamp(veh.speed / 28, -1, 1) * 0.09;

      const wheelSpin = veh.speed * dt * 1.45;
      for (let wi = 0; wi < veh.model.wheels.length; wi++) {
        veh.model.wheels[wi].rotation.x += wheelSpin;
      }
    }

    _wreckVehicle(veh) {
      this._spawnBurst(veh.x, veh.y + 1.5, veh.z, global.COLORS.AWNING_SAFFRON, 16, 10);
      this._spawnBurst(veh.x, veh.y + 2.0, veh.z, global.COLORS.MUZZLE_FLASH, 10, 8);
      global.beep(95, 0.3, "sawtooth", 0.16, 38);
      global.showToast(veh.name + " WRECKED! +₹200", "cash", 2000);
      this.cash += 200;
      this.addWanted(1, "VEHICLE DESTROYED!");
      veh.respawnTimer = 15;
      veh.driver = null;
      veh.sirenActive = false;
      veh.model.root.setEnabled(false);
    }

    // ------------------------------------------------------------------------
    // Udaipur NPC Citizens AI (Strolling & Fleeing Mayhem)
    // ------------------------------------------------------------------------
    _alertNPCsNear(wx, wz, radius) {
      for (let i = 0; i < this.npcs.length; i++) {
        const n = this.npcs[i];
        if (!n.alive) continue;
        if (dist2D(wx, wz, n.x, n.z) < radius) {
          n.fleeTimer = 6.5;
          n.yaw = Math.atan2(n.x - wx, n.z - wz) + (Math.random() - 0.5) * 0.5;
        }
      }
    }

    _updateNPCs(dt) {
      for (let i = 0; i < this.npcs.length; i++) {
        const n = this.npcs[i];
        if (!n.alive) {
          n.respawnTimer -= dt;
          if (n.respawnTimer <= 0) {
            n.alive = true;
            n.hp = 40;
            n.x = n.spawnX;
            n.z = n.spawnZ;
            n.y = 0;
            n.model.root.position.set(n.x, n.y, n.z);
            n.model.root.setEnabled(true);
          }
          continue;
        }

        let speed = n.walkSpeed;
        if (n.fleeTimer > 0) {
          n.fleeTimer -= dt;
          speed = 9.5;
        } else {
          n.wanderTimer -= dt;
          if (n.wanderTimer <= 0) {
            n.wanderTimer = 2.0 + Math.random() * 4.5;
            n.yaw += (Math.random() - 0.5) * 2.2;
          }
        }

        const nx = n.x + Math.sin(n.yaw) * speed * dt;
        const nz = n.z + Math.cos(n.yaw) * speed * dt;
        if (
          !this.world.isWater(nx, nz) &&
          !this.world.hitsBox(nx, 0.2, nz, 0.6, 2.8)
        ) {
          n.x = nx;
          n.z = nz;
        } else {
          n.yaw += Math.PI * 0.65 + Math.random() * 0.8;
          speed = 0;
        }

        n.y = this.world.getGroundY(n.x, n.z, n.y);
        n.model.root.position.set(n.x, n.y, n.z);
        n.model.root.rotation.y = n.yaw;
        global.GameModels.animateCharacter(n.model, speed, dt, false, false);
      }
    }

    // ------------------------------------------------------------------------
    // Police Chase AI, Backup Spawning & Wanted Star Decay
    // ------------------------------------------------------------------------
    _defeatCop(cop) {
      cop.alive = false;
      cop.respawnTimer = cop.isBackup ? 999 : 20;
      cop.model.root.setEnabled(false);
      this._spawnBurst(cop.x, cop.y + 1.5, cop.z, global.COLORS.SIREN_BLUE, 10, 7);
      this._spawnTemporaryCashDrop(cop.x, cop.z, 150);
      global.showToast("OFFICER DOWN! COLLECT ₹150 BOUNTY", "cash", 1800);
    }

    _updatePoliceAndWanted(dt) {
      const p = this.player;
      let nearestCopDist = 999;
      let aliveCops = 0;

      // Update siren pulse audio while wanted
      if (this.wantedLevel > 0) {
        this.sirenAudioTimer += dt;
        if (this.sirenAudioTimer >= 0.72) {
          this.sirenAudioTimer = 0;
          this.sirenHigh = !this.sirenHigh;
          global.GameAssets.SFX.sirenPulse(this.sirenHigh);
        }
      }

      // Update every cop entity
      for (let i = this.cops.length - 1; i >= 0; i--) {
        const c = this.cops[i];
        if (!c.alive) {
          if (c.isBackup) {
            c.model.root.dispose();
            this.cops.splice(i, 1);
            continue;
          }
          c.respawnTimer -= dt;
          if (c.respawnTimer <= 0) {
            c.alive = true;
            c.hp = c.maxHp;
            c.x = c.spawnX;
            c.z = c.spawnZ;
            c.y = 0;
            c.model.root.position.set(c.x, 0, c.z);
            c.model.root.setEnabled(true);
          }
          continue;
        }

        aliveCops++;
        const d = dist2D(c.x, c.z, p.x, p.z);
        if (d < nearestCopDist) nearestCopDist = d;

        if (this.wantedLevel > 0) {
          // Active chase & engagement AI
          const toPlayerYaw = Math.atan2(p.x - c.x, p.z - c.z);
          c.yaw = lerpAngle(c.yaw, toPlayerYaw, dt * 8);

          const chaseSpeed = 8.8 + this.wantedLevel * 0.7;
          let moveSpeed = 0;
          if (d > 9.5) {
            const tryX = c.x + Math.sin(c.yaw) * chaseSpeed * dt;
            const tryZ = c.z + Math.cos(c.yaw) * chaseSpeed * dt;
            let moved = false;

            if (!this.world.isWater(tryX, c.z) && !this.world.hitsBox(tryX, 0.2, c.z, 0.62, 2.9)) {
              c.x = tryX;
              moved = true;
            }
            if (!this.world.isWater(c.x, tryZ) && !this.world.hitsBox(c.x, 0.2, tryZ, 0.62, 2.9)) {
              c.z = tryZ;
              moved = true;
            }

            if (!moved) {
              // Side-step around Udaipur havelis & palace pillars
              const sideYaw = c.yaw + c.strafeDir * Math.PI * 0.5;
              const sx = c.x + Math.sin(sideYaw) * chaseSpeed * dt;
              const sz = c.z + Math.cos(sideYaw) * chaseSpeed * dt;
              if (!this.world.isWater(sx, sz) && !this.world.hitsBox(sx, 0.2, sz, 0.62, 2.9)) {
                c.x = sx;
                c.z = sz;
              } else {
                c.strafeDir *= -1;
              }
            }
            moveSpeed = chaseSpeed;
          }

          // Shoot at player when in range
          c.fireCooldown -= dt;
          if (d < 26 && c.fireCooldown <= 0) {
            c.fireCooldown = Math.max(0.55, 1.35 - this.wantedLevel * 0.14) + Math.random() * 0.35;
            const spread = (Math.random() - 0.5) * 0.14;
            const syaw = toPlayerYaw + spread;
            this._spawnProjectile(
              c.x + Math.sin(syaw) * 0.9,
              c.y + 1.9,
              c.z + Math.cos(syaw) * 0.9,
              Math.sin(syaw) * 58,
              0,
              Math.cos(syaw) * 58,
              7 + this.wantedLevel * 1.5,
              "COP",
              global.COLORS.SIREN_RED,
              0.9
            );
            global.GameAssets.SFX.pistol();
          }

          c.y = this.world.getGroundY(c.x, c.z, c.y);
          c.model.root.position.set(c.x, c.y, c.z);
          c.model.root.rotation.y = c.yaw;
          global.GameModels.animateCharacter(c.model, moveSpeed, dt, d < 26, false);
        } else {
          // Calm patrol when wantedLevel === 0 (despawn excess distant backup cops)
          if (c.isBackup && d > 45) {
            c.model.root.dispose();
            this.cops.splice(i, 1);
            continue;
          }
          c.wanderTimer -= dt;
          if (c.wanderTimer <= 0) {
            c.wanderTimer = 2.5 + Math.random() * 4;
            c.yaw += (Math.random() - 0.5) * 1.8;
          }
          const patrolSpeed = 3.6;
          const nx = c.x + Math.sin(c.yaw) * patrolSpeed * dt;
          const nz = c.z + Math.cos(c.yaw) * patrolSpeed * dt;
          if (!this.world.isWater(nx, nz) && !this.world.hitsBox(nx, 0.2, nz, 0.62, 2.9)) {
            c.x = nx;
            c.z = nz;
          } else {
            c.yaw += Math.PI * 0.7;
          }
          c.y = this.world.getGroundY(c.x, c.z, c.y);
          c.model.root.position.set(c.x, c.y, c.z);
          c.model.root.rotation.y = c.yaw;
          global.GameModels.animateCharacter(c.model, patrolSpeed, dt, false, false);
        }
      }

      // Dynamic Police Backup Spawner at 2★+
      const desiredCops = this.wantedLevel > 0 ? Math.min(8, 3 + this.wantedLevel) : 4;
      if (this.wantedLevel >= 1 && aliveCops < desiredCops) {
        const nodes = global.SPAWNS.policeBackupNodes;
        for (let ni = 0; ni < nodes.length; ni++) {
          const n = nodes[(ni + Math.floor(this.elapsed)) % nodes.length];
          const wp = global.GameAssets.gridToWorld(n.gx, 0, n.gz);
          const d = dist2D(wp.x, wp.z, p.x, p.z);
          if (d > 26 && d < 78) {
            this._createCopEntity(wp.x, wp.z, true);
            break;
          }
        }
      }

      // Wanted Star Decay (Evade police out of range & without committing fresh crimes!)
      if (this.wantedLevel > 0) {
        this.crimeCooldown = Math.max(0, this.crimeCooldown - dt);
        let nearestPoliceVeh = 999;
        for (let vi = 0; vi < this.vehicles.length; vi++) {
          const v = this.vehicles[vi];
          if (v.type === "POLICE" && v.driver === "AI_COP" && v.respawnTimer <= 0) {
            nearestPoliceVeh = Math.min(nearestPoliceVeh, dist2D(v.x, v.z, p.x, p.z));
          }
        }

        const outOfSight = nearestCopDist > 26 && nearestPoliceVeh > 28 && this.crimeCooldown <= 0;
        if (outOfSight) {
          if (!this.evading) {
            this.evading = true;
            global.showToast("EVADING POLICE — STAY OUT OF SIGHT!", "info", 1800);
          }
          this.decayTimer += dt;
          if (this.decayTimer >= 6.0) {
            this.decayTimer = 0;
            this.wantedLevel = Math.max(0, this.wantedLevel - 1);
            if (this.wantedLevel === 0) {
              this.evading = false;
              this._silencePoliceChase();
              global.GameAssets.SFX.bribe();
              global.showToast("HEAT COOLED DOWN — COAST IS CLEAR!", "cash", 2400);
            } else {
              global.showToast("HEAT COOLING... " + "★".repeat(this.wantedLevel), "info", 1600);
            }
            this._syncHud(true);
          }
        } else {
          this.evading = false;
          this.decayTimer = 0;
        }
      }
    }

    // ------------------------------------------------------------------------
    // Collectible Cash Stashes (₹)
    // ------------------------------------------------------------------------
    _updateCashStashes(dt) {
      const p = this.player;
      const pickupRadius = p.vehicle ? 4.4 : 2.9;

      for (let i = this.cashStashes.length - 1; i >= 0; i--) {
        const s = this.cashStashes[i];
        if (!s.active) {
          s.respawnTimer -= dt;
          if (s.respawnTimer <= 0) {
            s.active = true;
            s.root.setEnabled(true);
          }
          continue;
        }

        if (s.temporary) {
          s.lifeTimer -= dt;
          if (s.lifeTimer <= 0) {
            s.root.dispose();
            this.cashStashes.splice(i, 1);
            continue;
          }
        }

        // Bob & spin smoothly
        s.root.rotation.y += dt * 1.9;
        s.root.position.y = Math.sin(this.elapsed * 3.0 + s.phase) * 0.28;

        if (dist2D(p.x, p.z, s.x, s.z) < pickupRadius) {
          this.cash += s.amount;
          global.GameAssets.SFX.cash();
          this._spawnBurst(s.x, 1.4, s.z, global.COLORS.CASH_BAND, 10, 6.5);
          global.showToast("+₹" + s.amount.toLocaleString("en-IN") + " — " + s.label, "cash", 2300);

          if (s.temporary) {
            s.root.dispose();
            this.cashStashes.splice(i, 1);
          } else {
            s.active = false;
            s.respawnTimer = 45;
            s.root.setEnabled(false);
          }
          this._syncHud(true);
        }
      }
    }

    // ------------------------------------------------------------------------
    // Lightweight Voxel Spark & Splash Particles
    // ------------------------------------------------------------------------
    _spawnBurst(x, y, z, colorHex, count, speed) {
      // Cap total active particles for locked FPS
      if (this.particles.length > 70) return;
      const mat = global.createColorMat(this.scene, "pt_" + colorHex, colorHex, {
        emissiveScale: 0.4,
        freeze: true
      });
      for (let i = 0; i < count; i++) {
        const mesh = BABYLON.MeshBuilder.CreateBox(
          "pt_" + Math.floor(Math.random() * 1e6),
          { size: 0.28 },
          this.scene
        );
        mesh.position.set(x, y, z);
        mesh.material = mat;
        mesh.isPickable = false;
        const a = Math.random() * Math.PI * 2;
        const spd = (0.4 + Math.random() * 0.8) * speed;
        this.particles.push({
          mesh: mesh,
          vx: Math.cos(a) * spd,
          vy: 2.5 + Math.random() * speed * 0.8,
          vz: Math.sin(a) * spd,
          ttl: 0.35 + Math.random() * 0.28
        });
      }
    }

    _updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.ttl -= dt;
        if (pt.ttl <= 0) {
          pt.mesh.dispose();
          this.particles.splice(i, 1);
          continue;
        }
        pt.vy -= 18 * dt;
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y += pt.vy * dt;
        pt.mesh.position.z += pt.vz * dt;
        pt.mesh.scaling.setAll(clamp(pt.ttl * 2.2, 0.1, 1));
      }
    }

    // ------------------------------------------------------------------------
    // Camera Tracking (FOLLOW & FREE Modes)
    // ------------------------------------------------------------------------
    _updateCamera(dt) {
      const p = this.player;
      const cam = this.camera;
      const targetY = p.y + (p.vehicle ? 2.4 : 2.3);
      const followRate = Math.min(1, dt * 8.5);

      cam.target.x += (p.x - cam.target.x) * followRate;
      cam.target.y += (targetY - cam.target.y) * followRate;
      cam.target.z += (p.z - cam.target.z) * followRate;

      if (this.cameraMode === "FOLLOW") {
        const desiredRadius = p.vehicle ? 23 : 16.5;
        const desiredBeta = p.vehicle ? 1.1 : 1.15;
        cam.radius += (desiredRadius - cam.radius) * Math.min(1, dt * 4.5);
        cam.beta += (desiredBeta - cam.beta) * Math.min(1, dt * 4.5);

        if (p.vehicle) {
          // Smoothly align camera directly behind driving vehicle's tail
          const targetAlpha = -Math.PI / 2 - p.vehicle.yaw;
          cam.alpha = lerpAngle(cam.alpha, targetAlpha, dt * 4.2);
        }
      }
    }

    // ------------------------------------------------------------------------
    // HUD Sync & Live 2D Udaipur Radar Minimap
    // ------------------------------------------------------------------------
    _syncHud(force) {
      const d = this.dom;
      const p = this.player;
      if (!p || !d) return;

      const zone = this.world.getZoneName(p.x, p.z);
      if (zone !== this.currentZone || force) {
        this.currentZone = zone;
        if (d.zone) d.zone.textContent = zone;
      }

      if (d.hpFill) {
        const pct = Math.round((p.hp / p.maxHp) * 100);
        d.hpFill.style.width = pct + "%";
        if (d.hpText) d.hpText.textContent = String(Math.ceil(p.hp));
      }

      if (d.weaponBadge) {
        d.weaponBadge.textContent = WEAPONS[p.weaponId].name;
      }

      if (d.vehicleBadge) {
        if (p.vehicle) {
          const kmh = Math.round(Math.abs(p.vehicle.speed) * 3.1);
          d.vehicleBadge.textContent = p.vehicle.type + " · " + kmh + " KM/H";
        } else {
          d.vehicleBadge.textContent = p.inWater ? "SWIMMING" : "ON FOOT";
        }
      }

      if (d.cashAmount) {
        d.cashAmount.textContent = this.cash.toLocaleString("en-IN");
      }

      if (d.wantedStars) {
        const stars = d.wantedStars.querySelectorAll(".star");
        for (let i = 0; i < stars.length; i++) {
          stars[i].classList.toggle("active", i < this.wantedLevel);
        }
        d.wantedStars.classList.toggle("flashing", this.wantedLevel > 0 && !this.evading);
        d.wantedStars.classList.toggle("evading", this.wantedLevel > 0 && this.evading);
      }

      if (d.wantedVignette) {
        d.wantedVignette.classList.toggle("active", this.wantedLevel > 0);
      }

      if (d.camLabel && d.camBtn) {
        d.camLabel.textContent = this.cameraMode;
        d.camBtn.classList.toggle("free-cam", this.cameraMode === "FREE");
      }

      if (d.bribeBtn) {
        const canBribe = this.wantedLevel > 0 && this.cash >= BRIBE_COST;
        d.bribeBtn.disabled = this.wantedLevel === 0;
        d.bribeBtn.classList.toggle("ready", canBribe);
      }

      if (d.carBtn && d.carSub) {
        if (p.vehicle) {
          d.carBtn.classList.add("nearby");
          d.carSub.textContent = "EXIT";
        } else if (p.nearbyVehicle) {
          d.carBtn.classList.add("nearby");
          d.carSub.textContent = p.nearbyVehicle.type;
        } else {
          d.carBtn.classList.remove("nearby");
          d.carSub.textContent = "F";
        }
      }

      if (d.crosshair) {
        d.crosshair.classList.toggle("driving", !!p.vehicle);
      }
    }

    _prepareRadarBackdrop() {
      if (!this.radarCtx || !global.document) return;
      const size = 112;
      const off = global.document.createElement("canvas");
      off.width = size;
      off.height = size;
      const ctx = off.getContext("2d");

      // Background land tone
      ctx.fillStyle = "#1c2434";
      ctx.fillRect(0, 0, size, size);

      const toPx = (gx) => ((gx - this.world.minGrid) / (this.world.maxGrid - this.world.minGrid)) * size;
      const toPz = (gz) => ((this.world.maxGrid - gz) / (this.world.maxGrid - this.world.minGrid)) * size;

      // Paint terrain blocks accurately from UdaipurWorld predicates
      for (let gx = this.world.minGrid; gx <= this.world.maxGrid; gx += 2) {
        for (let gz = this.world.minGrid; gz <= this.world.maxGrid; gz += 2) {
          let col = null;
          if (this.world.isLakeBasin(gx, gz)) {
            col = "#0e7490";
          } else if (this.world.isJagMandirIsland(gx, gz)) {
            col = "#e9c496";
          } else if (this.world.isJagMandirBridge(gx, gz)) {
            col = "#cbb592";
          } else if (this.world.isRoad(gx, gz)) {
            col = "#475569";
          } else if (gx >= 24 && gx <= 43 && gz >= -16 && gz <= 16) {
            col = "#d99f26"; // City Palace gold silhouette
          } else if (this.world.isGangaurGhatArea(gx, gz)) {
            col = "#f1f5f9";
          } else if (gx <= -43 || gx >= 46) {
            col = "#4d4438"; // Aravalli hills
          }
          if (col) {
            ctx.fillStyle = col;
            ctx.fillRect(Math.floor(toPx(gx)), Math.floor(toPz(gz)), 3, 3);
          }
        }
      }

      this._radarBg = off;
    }

    _renderRadar() {
      const ctx = this.radarCtx;
      if (!ctx || !this.player) return;
      const size = 112;
      const span = (this.world.maxGrid - this.world.minGrid) * this.world.voxelSize;
      const minW = this.world.minGrid * this.world.voxelSize;
      const maxW = this.world.maxGrid * this.world.voxelSize;

      const wxToPx = (wx) => ((wx - minW) / span) * size;
      const wzToPz = (wz) => ((maxW - wz) / span) * size;

      if (this._radarBg) {
        ctx.drawImage(this._radarBg, 0, 0);
      } else {
        ctx.fillStyle = "#1c2434";
        ctx.fillRect(0, 0, size, size);
      }

      // Cash Stashes (gold diamonds)
      ctx.fillStyle = "#facc15";
      for (let i = 0; i < this.cashStashes.length; i++) {
        const s = this.cashStashes[i];
        if (!s.active) continue;
        ctx.fillRect(wxToPx(s.x) - 1.5, wzToPz(s.z) - 1.5, 3, 3);
      }

      // Vehicles (cyan dots; police cars flash red/blue when chasing)
      for (let i = 0; i < this.vehicles.length; i++) {
        const v = this.vehicles[i];
        if (v.respawnTimer > 0 || v === this.player.vehicle) continue;
        ctx.fillStyle =
          v.type === "POLICE"
            ? this.wantedLevel > 0 && Math.sin(this.elapsed * 12) > 0
              ? "#ff3b4b"
              : "#38bdf8"
            : "#a5f3fc";
        ctx.fillRect(wxToPx(v.x) - 1.5, wzToPz(v.z) - 1.5, 3, 3);
      }

      // Cops (red/blue pulsing blips)
      const copFlash = Math.sin(this.elapsed * 10) > 0;
      for (let i = 0; i < this.cops.length; i++) {
        const c = this.cops[i];
        if (!c.alive) continue;
        ctx.fillStyle = this.wantedLevel > 0 ? (copFlash ? "#ff3b4b" : "#38bdf8") : "#60a5fa";
        ctx.beginPath();
        ctx.arc(wxToPx(c.x), wzToPz(c.z), 2.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player Directional Arrow
      const px = wxToPx(this.player.x);
      const pz = wzToPz(this.player.z);
      ctx.save();
      ctx.translate(px, pz);
      ctx.rotate(this.player.yaw);
      ctx.fillStyle = "#4ade80";
      ctx.strokeStyle = "#052e16";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3.5, 4);
      ctx.lineTo(0, 2);
      ctx.lineTo(-3.5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    dispose() {
      if (this._resizeHandler && global.removeEventListener) {
        global.removeEventListener("resize", this._resizeHandler);
      }
      if (this.engine) {
        this.engine.stopRenderLoop();
        this.engine.dispose();
      }
      this._running = false;
    }
  }

  global.UdaipurEngine = UdaipurEngine;
})(window);
