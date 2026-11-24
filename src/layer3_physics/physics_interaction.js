/* ============================================================================
   Layer 3 — Physics & Interaction (Strict Non-Voxel Sculpted Models):
   - Anatomical Sculpted Protagonist (Aarav) with sinusoidal cloth-wave scarf
   - Curved Sculpted Auto-Rickshaw (Bajaj RE fairing + domed canopy)
   - Sculpted Royal Enfield Bullet 350 (teardrop tank, swept chrome exhaust,
     curved handlebars & fenders)
   - Doubly-Curved Wooden Shikara / Kettuvallam Boat Hull
   ============================================================================ */

import * as THREE from "three";
import {
  createSculptedTorso,
  createSculptedHead,
  createSculptedAutoChassis,
  createSculptedAutoCanopy,
  createTeardropTank,
  createSculptedBoatHull,
  createCurvedTube,
  createBeveledSlab
} from "../layer1_core/sculpted_geometry.js";

export const TRANSPORT_MODES = ["FOOT", "AUTO", "ENFIELD", "BOAT"];

export class PhysicsInteraction {
  constructor(scene, assets, worldStreamer) {
    this.scene = scene;
    this.assets = assets;
    this.world = worldStreamer;

    this.pos = new THREE.Vector3(0, 0, 24);
    this.vel = new THREE.Vector3();
    this.yaw = Math.PI;
    this.vy = 0;
    this.grounded = true;
    this.speed = 0;

    // Transport & vitals
    this.transport = "FOOT";
    this.stamina = 100;
    this.maxStamina = 100;
    this.spiceHeat = 0;
    this.spiceShakeTimer = 0;
    this.shoesOff = false;
    this.onViewpoint = false;

    // Sculpted 3D Models
    this.root = new THREE.Group();
    this.aarav = this._buildAaravModel();
    this.autoMesh = this._buildAutoRickshaw();
    this.enfieldMesh = this._buildRoyalEnfield();
    this.boatMesh = this._buildIndianBoat();

    this.root.add(this.aarav.group, this.autoMesh.group, this.enfieldMesh.group, this.boatMesh.group);
    this.scene.add(this.root);
    this._syncTransportVisuals();
  }

  // --------------------------------------------------------------------------
  // 1. Sculpted Anatomical Protagonist — Aarav (ZERO BoxGeometry!)
  // --------------------------------------------------------------------------
  _buildAaravModel() {
    const g = new THREE.Group();
    const skin = this.assets.colorMat(0xc68642, { roughness: 0.64 });
    const kurta = this.assets.colorMat(0x1e40af, { roughness: 0.76 });
    const vest = this.assets.colorMat(0x78350f, { roughness: 0.78 });
    const pants = this.assets.colorMat(0x27272a, { roughness: 0.84 });
    const shoeMat = this.assets.colorMat(0x3f2414, { roughness: 0.65 });
    const hair = this.assets.colorMat(0x18181b, { roughness: 0.72 });
    const scarfMat = this.assets.get("saffronCloth");

    const add = (geo, mat, x, y, z, parent = g, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      parent.add(m);
      return m;
    };

    // Articulated Sculpted Capsule Legs & Contoured Footwear
    const legGeo = new THREE.CapsuleGeometry(0.11, 0.56, 8, 16);
    const shoeGeo = new THREE.CapsuleGeometry(0.095, 0.14, 8, 12);
    shoeGeo.rotateX(Math.PI / 2);

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.16, 0.88, 0);
    add(legGeo, pants, 0, -0.38, 0, leftLeg);
    add(shoeGeo, shoeMat, 0, -0.78, 0.06, leftLeg);
    g.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, 0.88, 0);
    add(legGeo, pants, 0, -0.38, 0, rightLeg);
    add(shoeGeo, shoeMat, 0, -0.78, 0.06, rightLeg);
    g.add(rightLeg);

    // Sculpted Lathe Torso (Indigo Kurta + Contoured Nehru Heritage Vest)
    add(createSculptedTorso(0.86, 0.27, 0.21, true), kurta, 0, 0.84, 0);
    add(createSculptedTorso(0.62, 0.29, 0.23, false), vest, 0, 1.06, 0);

    // Sculpted DSLR Conservation Camera & Barrel Lens on Chest
    add(createBeveledSlab(0.22, 0.14, 0.12, 0.03), this.assets.get("bulletBlack"), 0.08, 1.32, 0.24);
    add(new THREE.CylinderGeometry(0.055, 0.06, 0.1, 16), this.assets.get("chrome"), 0.08, 1.32, 0.32, g, Math.PI / 2, 0, 0);

    // Subdivided Flowing Cloth Scarf (animated wave mesh!)
    const scarfGeo = new THREE.PlaneGeometry(0.32, 0.94, 4, 10);
    scarfGeo.translate(0, -0.45, 0);
    const scarf = add(scarfGeo, scarfMat, -0.22, 1.62, -0.22, g, 0.22, 0, 0);

    // Sculpted Capsule Arms & Rounded Hands
    const armGeo = new THREE.CapsuleGeometry(0.088, 0.48, 8, 14);
    const handGeo = new THREE.SphereGeometry(0.085, 14, 12);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.37, 1.58, 0);
    add(armGeo, kurta, 0, -0.28, 0, leftArm);
    add(handGeo, skin, 0, -0.62, 0, leftArm);
    g.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.37, 1.58, 0);
    add(armGeo, kurta, 0, -0.28, 0, rightArm);
    add(handGeo, skin, 0, -0.62, 0, rightArm);
    g.add(rightArm);

    // Sculpted Neck, Oval Cranium Head & Contoured Hair Crown
    add(new THREE.CylinderGeometry(0.09, 0.105, 0.18, 14), skin, 0, 1.74, 0);
    add(createSculptedHead(0.21), skin, 0, 1.98, 0);
    add(new THREE.SphereGeometry(0.215, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hair, 0, 2.02, -0.02);

    return { group: g, leftLeg, rightLeg, leftArm, rightArm, scarf, phase: 0 };
  }

  // --------------------------------------------------------------------------
  // 2. Sculpted Curved Bajaj RE Auto-Rickshaw (Beveled Fairing + Domed Canopy)
  // --------------------------------------------------------------------------
  _buildAutoRickshaw() {
    const g = new THREE.Group();
    const green = this.assets.get("autoGreen");
    const yellow = this.assets.get("autoYellow");
    const tire = this.assets.get("tireBlack");
    const chrome = this.assets.get("chrome");
    const glass = this.assets.get("mirrorGlass");

    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // Continuous curved extruded side-profile Bajaj body fairing + domed vinyl canopy
    add(createSculptedAutoChassis(), green, 0, 0, 0);
    add(createSculptedAutoCanopy(), yellow, 0, 2.08, -0.06);
    // Curved chrome tubular roll-cage pillars
    add(createCurvedTube([[-0.72, 1.25, 1.1], [-0.74, 1.8, 1.05], [-0.72, 2.15, 0.85]], 0.04, 12, 8), chrome, 0, 0, 0);
    add(createCurvedTube([[ 0.72, 1.25, 1.1], [ 0.74, 1.8, 1.05], [ 0.72, 2.15, 0.85]], 0.04, 12, 8), chrome, 0, 0, 0);
    add(createCurvedTube([[-0.82, 1.25, -1.2], [-0.84, 1.8, -1.25], [-0.8, 2.15, -1.1]], 0.045, 12, 8), chrome, 0, 0, 0);
    add(createCurvedTube([[ 0.82, 1.25, -1.2], [ 0.84, 1.8, -1.25], [ 0.8, 2.15, -1.1]], 0.045, 12, 8), chrome, 0, 0, 0);
    // Curved wrap windshield + chrome-bezel round headlight + curved front mudguard
    add(createBeveledSlab(1.36, 0.72, 0.09, 0.03), glass, 0, 1.66, 1.18, -0.14, 0, 0);
    add(new THREE.SphereGeometry(0.19, 16, 14), this.assets.get("diyaGlow"), 0, 0.96, 1.64);
    add(new THREE.TorusGeometry(0.21, 0.035, 10, 20), chrome, 0, 0.96, 1.62);
    add(new THREE.TorusGeometry(0.42, 0.1, 10, 18, Math.PI * 0.75), yellow, 0, 0.38, 1.32, 0, Math.PI / 2, 0.35);

    // Sculpted Torus Tires with Chrome Rims
    const makeWheel = (wx, wy, wz) => {
      const wg = new THREE.Group();
      wg.position.set(wx, wy, wz);
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.11, 12, 24), tire);
      t.rotation.y = Math.PI / 2;
      t.castShadow = true;
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16), chrome);
      r.rotation.z = Math.PI / 2;
      wg.add(t, r);
      g.add(wg);
      return wg;
    };

    const wheels = [
      makeWheel(0, 0.38, 1.32),
      makeWheel(-0.92, 0.38, -0.92),
      makeWheel( 0.92, 0.38, -0.92)
    ];

    return { group: g, wheels };
  }

  // --------------------------------------------------------------------------
  // 3. Sculpted Royal Enfield Bullet 350 (Teardrop Tank, Swept Exhaust & Curves)
  // --------------------------------------------------------------------------
  _buildRoyalEnfield() {
    const g = new THREE.Group();
    const black = this.assets.get("bulletBlack");
    const chrome = this.assets.get("chrome");
    const tire = this.assets.get("tireBlack");
    const tankMat = this.assets.colorMat(0x991b1b, { roughness: 0.18, metalness: 0.55, clearcoat: 0.92 });
    const leather = this.assets.colorMat(0x4a2511, { roughness: 0.65 });

    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // Sculpted Engine Block Cylinder Fins + Teardrop Bullet Fuel Tank + Contoured Leather Saddle
    add(new THREE.CylinderGeometry(0.24, 0.26, 0.52, 18), black, 0, 0.66, 0.06);
    add(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 16), chrome, 0, 0.52, -0.04, 0, 0, Math.PI / 2);
    add(createTeardropTank(), tankMat, 0, 1.06, 0.32);
    add(new THREE.CapsuleGeometry(0.17, 0.56, 10, 16), leather, 0, 0.94, -0.45, Math.PI / 2, 0, 0);

    // Swept Chrome Peashooter Exhaust Pipe + Tubular Frame + Classic Swept Handlebars
    add(createCurvedTube([[0.18, 0.66, 0.25], [0.28, 0.42, 0.15], [0.28, 0.38, -0.35], [0.3, 0.44, -1.18]], 0.055, 22, 12), chrome, 0, 0, 0);
    add(createCurvedTube([[0, 1.15, 0.68], [0, 0.68, 0.35], [0, 0.55, -0.45], [0, 0.92, -0.78]], 0.042, 18, 10), black, 0, 0, 0);
    add(createCurvedTube([[-0.46, 1.3, 0.56], [-0.26, 1.36, 0.68], [0, 1.34, 0.72], [0.26, 1.36, 0.68], [0.46, 1.3, 0.56]], 0.032, 18, 10), chrome, 0, 0, 0);

    // Telescopic Chrome Front Forks + Curved Mudguards + Iconic Round Bullet Headlight
    add(new THREE.CylinderGeometry(0.038, 0.042, 1.04, 12), chrome, -0.15, 0.9, 0.84, -0.28, 0, 0);
    add(new THREE.CylinderGeometry(0.038, 0.042, 1.04, 12), chrome,  0.15, 0.9, 0.84, -0.28, 0, 0);
    add(new THREE.TorusGeometry(0.5, 0.075, 10, 20, Math.PI * 0.7), tankMat, 0, 0.44, 1.04, 0, Math.PI / 2, 0.38);
    add(new THREE.TorusGeometry(0.5, 0.085, 10, 20, Math.PI * 0.7), tankMat, 0, 0.44, -0.96, 0, Math.PI / 2, 0.55);
    add(new THREE.SphereGeometry(0.16, 16, 14), chrome, 0, 1.16, 0.94);
    add(new THREE.SphereGeometry(0.145, 14, 12), this.assets.get("diyaGlow"), 0, 1.16, 1.02);

    const makeMotoWheel = (wz) => {
      const wg = new THREE.Group();
      wg.position.set(0, 0.45, wz);
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.1, 14, 28), tire);
      t.rotation.y = Math.PI / 2;
      t.castShadow = true;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.03, 10, 24), chrome);
      rim.rotation.y = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 14), chrome);
      hub.rotation.z = Math.PI / 2;
      wg.add(t, rim, hub);
      g.add(wg);
      return wg;
    };

    const wheels = [makeMotoWheel(1.04), makeMotoWheel(-0.96)];
    return { group: g, wheels };
  }

  // --------------------------------------------------------------------------
  // 4. Sculpted Doubly-Curved Indian Shikara / Kettuvallam Wooden Boat
  // --------------------------------------------------------------------------
  _buildIndianBoat() {
    const g = new THREE.Group();
    const wood = this.assets.get("teakWood");
    const canopy = this.assets.get("crimsonCloth");
    const gold = this.assets.get("templeGold");

    // Doubly-curved lofted hull (gracefully curved prow & stern sheer!)
    const hull = new THREE.Mesh(createSculptedBoatHull(5.6, 1.95, 0.78), wood);
    hull.material = wood.clone();
    hull.material.side = THREE.DoubleSide;
    hull.castShadow = true;
    g.add(hull);

    // Arched festive canopy supported by curved bamboo hoops
    const arch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 2.25, 22, 1, true, 0, Math.PI),
      canopy
    );
    arch.position.set(0, 1.18, -0.2);
    arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    g.add(arch);

    for (const hz of [-1.3, -0.2, 0.9]) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.04, 10, 22, Math.PI), gold);
      rib.position.set(0, 1.18, hz);
      g.add(rib);
    }

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), this.assets.get("diyaGlow"));
    lantern.position.set(0, 1.05, 2.42);
    g.add(lantern);

    return { group: g };
  }

  _syncTransportVisuals() {
    this.aarav.group.visible = this.transport === "FOOT" || this.transport === "ENFIELD" || this.transport === "BOAT";
    this.autoMesh.group.visible = this.transport === "AUTO";
    this.enfieldMesh.group.visible = this.transport === "ENFIELD";
    this.boatMesh.group.visible = this.transport === "BOAT";

    if (this.transport === "ENFIELD") {
      this.aarav.group.position.set(0, 0.34, -0.26);
    } else if (this.transport === "BOAT") {
      this.aarav.group.position.set(0, 0.36, -0.15);
    } else {
      this.aarav.group.position.set(0, 0, 0);
    }
  }

  setPosition(x, y, z, yaw = Math.PI) {
    this.pos.set(x, y, z);
    this.yaw = yaw;
    this.vy = 0;
    this.speed = 0;
    this.onViewpoint = false;
    this.transport = "FOOT";
    this._syncTransportVisuals();
    this.root.position.copy(this.pos);
    this.root.rotation.set(0, this.yaw, 0);
  }

  cycleTransport() {
    const hub = this.world.currentHub;
    const allowed = hub?.hasWater ? ["FOOT", "AUTO", "ENFIELD", "BOAT"] : ["FOOT", "AUTO", "ENFIELD"];
    const idx = allowed.indexOf(this.transport);
    const next = allowed[(idx + 1) % allowed.length];

    if (next === "BOAT" && hub?.waterArea) {
      const wa = hub.waterArea;
      const edgeX = wa.x + (this.pos.x >= wa.x ? wa.w * 0.36 : -wa.w * 0.36);
      this.pos.set(edgeX, -0.2, THREE.MathUtils.clamp(this.pos.z, wa.z - wa.d * 0.38, wa.z + wa.d * 0.38));
    } else if (this.transport === "BOAT" && this.world.isPointInWater(this.pos.x, this.pos.z)) {
      this.pos.set(hub.spawn.x, 0, hub.spawn.z);
    }

    this.transport = next;
    this.onViewpoint = false;
    this.speed = 0;
    this._syncTransportVisuals();
    return next;
  }

  eatStreetFood(staminaGain, spiceGain) {
    this.stamina = Math.min(this.maxStamina, this.stamina + staminaGain);
    if (spiceGain <= 15) {
      this.spiceHeat = Math.max(0, this.spiceHeat - 45);
      this.spiceShakeTimer = 0;
      return { tooSpicy: false, cooled: true };
    }
    this.spiceHeat = Math.min(100, this.spiceHeat + spiceGain);
    if (this.spiceHeat >= 75) {
      this.spiceShakeTimer = 4.5;
      return { tooSpicy: true, cooled: false };
    }
    return { tooSpicy: false, cooled: false };
  }

  meditate() {
    this.stamina = this.maxStamina;
    this.spiceHeat = 0;
    this.spiceShakeTimer = 0;
  }

  jump() {
    if (this.transport === "FOOT" && this.grounded) {
      this.vy = 9.2;
      this.grounded = false;
      return true;
    }
    return false;
  }

  update(dt, elapsedSec, input, camera) {
    const mv = input.getMoveVector();

    this.spiceHeat = Math.max(0, this.spiceHeat - dt * 5.2);
    this.spiceShakeTimer = Math.max(0, this.spiceShakeTimer - dt);
    const spicePenalty = this.spiceShakeTimer > 0 ? 0.68 : 1.0;

    const camYaw = input.yaw;
    const fwdX = -Math.sin(camYaw);
    const fwdZ = -Math.cos(camYaw);
    const rightX = Math.cos(camYaw);
    const rightZ = -Math.sin(camYaw);

    let wishX = fwdX * mv.z + rightX * mv.x;
    let wishZ = fwdZ * mv.z + rightZ * mv.x;
    const wishMag = Math.hypot(wishX, wishZ);
    if (wishMag > 0.01) {
      wishX /= wishMag;
      wishZ /= wishMag;
    }

    const isSprinting = this.transport === "FOOT" && mv.sprint && wishMag > 0.1 && this.stamina > 4;
    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 16);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 11);
    }

    let topSpeed = 8.4;
    if (this.transport === "FOOT") topSpeed = (isSprinting ? 14.5 : 8.4) * spicePenalty;
    else if (this.transport === "AUTO") topSpeed = 20.5;
    else if (this.transport === "ENFIELD") topSpeed = 26.0;
    else if (this.transport === "BOAT") topSpeed = 14.5;

    const targetSpeed = wishMag * topSpeed;
    const accelRate = this.transport === "FOOT" ? 14 : 6.5;
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * accelRate);

    if (wishMag > 0.05) {
      const targetYaw = Math.atan2(wishX, wishZ);
      let diff = targetYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turnRate = this.transport === "FOOT" ? 12 : this.transport === "BOAT" ? 4.2 : 6.5;
      this.yaw += diff * Math.min(1, dt * turnRate);
    }

    const stepX = Math.sin(this.yaw) * this.speed * dt;
    const stepZ = Math.cos(this.yaw) * this.speed * dt;
    const colRad = this.transport === "FOOT" ? 0.65 : this.transport === "ENFIELD" ? 0.95 : 1.35;

    const canMoveTo = (nx, nz) => {
      if (this.world.hitsBuilding(nx, nz, colRad)) return false;
      const inWater = this.world.isPointInWater(nx, nz);
      if (this.transport === "BOAT") return inWater;
      return !inWater;
    };

    if (this.onViewpoint) {
      if (wishMag > 0.5) {
        this.onViewpoint = false;
        this.pos.y = 0;
      }
    } else {
      if (canMoveTo(this.pos.x + stepX, this.pos.z)) this.pos.x += stepX;
      else this.speed *= 0.6;
      if (canMoveTo(this.pos.x, this.pos.z + stepZ)) this.pos.z += stepZ;
      else this.speed *= 0.6;

      if (this.transport === "BOAT") {
        this.pos.y = -0.28 + Math.sin(elapsedSec * 2.8) * 0.08;
        this.grounded = true;
      } else {
        this.vy -= 26 * dt;
        this.pos.y += this.vy * dt;
        if (this.pos.y <= 0) {
          this.pos.y = 0;
          this.vy = 0;
          this.grounded = true;
        }
      }
    }

    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
    this.root.rotation.z =
      this.transport === "ENFIELD"
        ? THREE.MathUtils.clamp(-mv.x * (this.speed / 26) * 0.24, -0.26, 0.26)
        : this.transport === "BOAT"
        ? Math.sin(elapsedSec * 2.1) * 0.045
        : 0;

    // Continuous vertex cloth ripple animation on Aarav's scarf!
    const scarfPos = this.aarav.scarf.geometry.attributes.position;
    for (let i = 0; i < scarfPos.count; i++) {
      const sy = scarfPos.getY(i); // 0 shoulder -> -0.94 hem
      const flex = Math.abs(sy);
      const wave = Math.sin(elapsedSec * (5 + this.speed * 0.4) + sy * 6.0) * 0.075 * flex;
      const trail = -flex * (0.18 + Math.min(0.45, this.speed * 0.03));
      scarfPos.setZ(i, wave + trail);
    }
    scarfPos.needsUpdate = true;

    if (this.transport === "FOOT" && this.speed > 0.4 && this.grounded) {
      this.aarav.phase += dt * (5 + this.speed * 0.65);
      const sw = Math.sin(this.aarav.phase) * Math.min(0.75, this.speed * 0.07);
      this.aarav.leftLeg.rotation.x = sw;
      this.aarav.rightLeg.rotation.x = -sw;
      this.aarav.leftArm.rotation.x = -sw * 0.7;
      this.aarav.rightArm.rotation.x = sw * 0.7;
    } else {
      this.aarav.leftLeg.rotation.x *= 0.84;
      this.aarav.rightLeg.rotation.x *= 0.84;
      this.aarav.leftArm.rotation.x *= 0.84;
      this.aarav.rightArm.rotation.x *= 0.84;
    }

    const wheelDelta = this.speed * dt * 1.9;
    if (this.transport === "AUTO") {
      this.autoMesh.wheels.forEach((w) => { w.rotation.x += wheelDelta; });
    } else if (this.transport === "ENFIELD") {
      this.enfieldMesh.wheels.forEach((w) => { w.rotation.x += wheelDelta; });
    }

    const camDist =
      this.transport === "FOOT" ? 7.8 : this.transport === "ENFIELD" ? 9.5 : 12.2;
    const camTarget = new THREE.Vector3(
      this.pos.x,
      this.pos.y + (this.transport === "FOOT" ? 2.15 : 2.5),
      this.pos.z
    );

    const pitch = THREE.MathUtils.clamp(input.pitch, -0.1, 1.0);
    const horizDist = Math.cos(pitch) * camDist;
    const desiredCamPos = new THREE.Vector3(
      camTarget.x + Math.sin(camYaw) * horizDist,
      Math.max(1.0, camTarget.y + Math.sin(pitch) * camDist + 1.2),
      camTarget.z + Math.cos(camYaw) * horizDist
    );

    if (this.spiceShakeTimer > 0) {
      const mag = 0.18 * (this.spiceShakeTimer / 4.5);
      desiredCamPos.x += (Math.random() - 0.5) * mag;
      desiredCamPos.y += (Math.random() - 0.5) * mag;
    }

    camera.position.lerp(desiredCamPos, Math.min(1, dt * 8.5));
    camera.lookAt(camTarget);
  }
}
