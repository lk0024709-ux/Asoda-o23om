/* ============================================================================
   Layer 3 — Physics & Interaction:
   - Articulated Protagonist (Aarav) with procedural cloth-sway scarf
   - Switchable Indian Vehicles: On-Foot, Auto-Rickshaw, Royal Enfield Bullet,
     and Wooden Boat (Pichola / Ganges / Betwa / Kochi Backwaters)
   - Collision sliding, Stamina + Teekha Spice-Level Shake & Slowdown,
     Remove-Shoes doorway mechanic, and Contextual Proximity Interactions
   ============================================================================ */

import * as THREE from "three";

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
    this.spiceHeat = 0; // 0..100 ("Teekha" risk!)
    this.spiceShakeTimer = 0;
    this.shoesOff = false;
    this.onViewpoint = false;

    // 3D Models
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
  // Procedural 3D Models: Aarav + Auto-Rickshaw + Royal Enfield + Wooden Boat
  // --------------------------------------------------------------------------
  _buildAaravModel() {
    const g = new THREE.Group();
    const skin = this.assets.colorMat(0xc68642, { roughness: 0.7 });
    const kurta = this.assets.colorMat(0x1e40af, { roughness: 0.78 }); // Indigo conservation kurta
    const vest = this.assets.colorMat(0x78350f, { roughness: 0.8 });   // Heritage Nehru jacket
    const pants = this.assets.colorMat(0x27272a, { roughness: 0.85 });
    const hair = this.assets.colorMat(0x18181b, { roughness: 0.85 });
    const scarfMat = this.assets.get("saffronCloth");

    const makePart = (geo, mat, x, y, z, parent = g) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      parent.add(m);
      return m;
    };

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.18, 0.86, 0);
    makePart(new THREE.BoxGeometry(0.24, 0.82, 0.26), pants, 0, -0.41, 0, leftLeg);
    g.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.18, 0.86, 0);
    makePart(new THREE.BoxGeometry(0.24, 0.82, 0.26), pants, 0, -0.41, 0, rightLeg);
    g.add(rightLeg);

    // Torso (Kurta + Nehru Jacket + Camera Sling)
    makePart(new THREE.BoxGeometry(0.66, 0.84, 0.36), kurta, 0, 1.28, 0);
    makePart(new THREE.BoxGeometry(0.7, 0.62, 0.39), vest, 0, 1.32, 0);
    // DSLR Conservation Camera slung on chest!
    makePart(new THREE.BoxGeometry(0.24, 0.16, 0.16), this.assets.get("bulletBlack"), 0.12, 1.28, 0.25);

    // Cloth-sway Heritage Scarf trailing behind shoulder
    const scarf = makePart(new THREE.PlaneGeometry(0.32, 0.92), scarfMat, -0.22, 1.32, -0.24);
    scarf.rotation.x = 0.22;

    // Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.46, 1.62, 0);
    makePart(new THREE.BoxGeometry(0.2, 0.68, 0.22), kurta, 0, -0.32, 0, leftArm);
    g.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.46, 1.62, 0);
    makePart(new THREE.BoxGeometry(0.2, 0.68, 0.22), kurta, 0, -0.32, 0, rightArm);
    g.add(rightArm);

    // Head + Hair
    makePart(new THREE.BoxGeometry(0.46, 0.48, 0.46), skin, 0, 1.98, 0);
    makePart(new THREE.BoxGeometry(0.5, 0.18, 0.5), hair, 0, 2.24, -0.02);

    return { group: g, leftLeg, rightLeg, leftArm, rightArm, scarf, phase: 0 };
  }

  _buildAutoRickshaw() {
    const g = new THREE.Group();
    const green = this.assets.get("autoGreen");
    const yellow = this.assets.get("autoYellow");
    const tire = this.assets.get("tireBlack");
    const chrome = this.assets.get("chrome");
    const glass = this.assets.get("mirrorGlass");

    const add = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    add(new THREE.BoxGeometry(1.75, 0.78, 2.75), green, 0, 0.78, 0);
    add(new THREE.BoxGeometry(1.3, 0.85, 0.75), green, 0, 0.92, 1.25);
    add(new THREE.BoxGeometry(1.82, 0.2, 2.65), yellow, 0, 1.15, 0);
    add(new THREE.BoxGeometry(1.85, 0.28, 2.8), yellow, 0, 2.25, -0.05);
    add(new THREE.BoxGeometry(1.35, 0.75, 0.12), glass, 0, 1.68, 1.2);
    // Pillars
    for (const [px, pz] of [[-0.68, 1.15], [0.68, 1.15], [-0.82, -1.25], [0.82, -1.25]]) {
      add(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 6), chrome, px, 1.68, pz);
    }
    // Headlight
    add(new THREE.SphereGeometry(0.18, 8, 8), this.assets.get("diyaGlow"), 0, 0.92, 1.66);

    const wGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 12);
    wGeo.rotateZ(Math.PI / 2);
    const wheels = [
      add(wGeo, tire, 0, 0.36, 1.28),
      add(wGeo, tire, -0.88, 0.36, -0.9),
      add(wGeo, tire,  0.88, 0.36, -0.9)
    ];

    return { group: g, wheels };
  }

  _buildRoyalEnfield() {
    const g = new THREE.Group();
    const black = this.assets.get("bulletBlack");
    const chrome = this.assets.get("chrome");
    const tire = this.assets.get("tireBlack");
    const tankMat = this.assets.colorMat(0x991b1b, { roughness: 0.22, metalness: 0.65 }); // Classic maroon Bullet tank!

    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.set(rx, ry, rz);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // Frame, engine block, teardrop tank, leather seat & iconic chrome exhaust peashooter!
    add(new THREE.BoxGeometry(0.44, 0.56, 1.35), black, 0, 0.68, 0);
    add(new THREE.BoxGeometry(0.42, 0.36, 0.78), tankMat, 0, 1.08, 0.28);
    add(new THREE.BoxGeometry(0.38, 0.22, 0.85), this.assets.get("teakWood"), 0, 0.95, -0.45);
    add(new THREE.CylinderGeometry(0.06, 0.08, 1.45, 8), chrome, 0.3, 0.45, -0.35, Math.PI / 2, 0, 0);
    // Front fork, chrome handlebar & round brass-ringed headlight
    add(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8), chrome, -0.16, 0.92, 0.82, -0.28, 0, 0);
    add(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8), chrome,  0.16, 0.92, 0.82, -0.28, 0, 0);
    add(new THREE.CylinderGeometry(0.04, 0.04, 0.92, 8), chrome, 0, 1.34, 0.66, 0, 0, Math.PI / 2);
    add(new THREE.SphereGeometry(0.18, 10, 10), this.assets.get("diyaGlow"), 0, 1.15, 0.96);

    const wGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.2, 14);
    wGeo.rotateZ(Math.PI / 2);
    const wheels = [
      add(wGeo, tire, 0, 0.44, 1.02),
      add(wGeo, tire, 0, 0.44, -0.95)
    ];

    return { group: g, wheels };
  }

  _buildIndianBoat() {
    const g = new THREE.Group();
    const wood = this.assets.get("teakWood");
    const canopy = this.assets.get("crimsonCloth");
    const gold = this.assets.get("templeGold");

    const add = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      g.add(m);
      return m;
    };

    // Wooden Shikara / Kettuvallam hull
    add(new THREE.BoxGeometry(1.75, 0.55, 4.4), wood, 0, 0.28, 0);
    add(new THREE.ConeGeometry(1.1, 1.4, 4), wood, 0, 0.32, 2.85).rotation.set(Math.PI / 2, Math.PI / 4, 0);
    add(new THREE.ConeGeometry(1.1, 1.4, 4), wood, 0, 0.32, -2.85).rotation.set(-Math.PI / 2, Math.PI / 4, 0);
    // Arched festive Rajasthani/Kerala canopy
    const arch = add(new THREE.CylinderGeometry(0.95, 0.95, 2.2, 12, 1, true, 0, Math.PI), canopy, 0, 1.35, -0.2);
    arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    add(new THREE.SphereGeometry(0.14, 8, 8), this.assets.get("diyaGlow"), 0, 0.72, 2.25);
    add(new THREE.BoxGeometry(1.5, 0.14, 0.2), gold, 0, 0.58, 1.2);

    return { group: g };
  }

  _syncTransportVisuals() {
    this.aarav.group.visible = this.transport === "FOOT" || this.transport === "ENFIELD" || this.transport === "BOAT";
    this.autoMesh.group.visible = this.transport === "AUTO";
    this.enfieldMesh.group.visible = this.transport === "ENFIELD";
    this.boatMesh.group.visible = this.transport === "BOAT";

    if (this.transport === "ENFIELD") {
      this.aarav.group.position.set(0, 0.32, -0.28);
    } else if (this.transport === "BOAT") {
      this.aarav.group.position.set(0, 0.35, -0.2);
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

    // When switching to BOAT on a water hub, launch cleanly onto the water edge!
    if (next === "BOAT" && hub?.waterArea) {
      const wa = hub.waterArea;
      const edgeX = wa.x + (this.pos.x >= wa.x ? wa.w * 0.36 : -wa.w * 0.36);
      this.pos.set(edgeX, -0.2, THREE.MathUtils.clamp(this.pos.z, wa.z - wa.d * 0.38, wa.z + wa.d * 0.38));
    } else if (this.transport === "BOAT" && this.world.isPointInWater(this.pos.x, this.pos.z)) {
      // Disembarking boat onto nearest dry ghat shore
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
      // Cooling drinks (Blue Lassi / Madurai Jigarthanda) soothe Teekha spice heat!
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

  // --------------------------------------------------------------------------
  // Frame Physics & Third-Person Camera Update
  // --------------------------------------------------------------------------
  update(dt, elapsedSec, input, camera) {
    const mv = input.getMoveVector();

    // Cool down Teekha spice level gradually
    this.spiceHeat = Math.max(0, this.spiceHeat - dt * 5.2);
    this.spiceShakeTimer = Math.max(0, this.spiceShakeTimer - dt);
    const spicePenalty = this.spiceShakeTimer > 0 ? 0.68 : 1.0;

    // Camera horizontal forward & right
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

    // Stamina drain when sprinting on foot
    const isSprinting = this.transport === "FOOT" && mv.sprint && wishMag > 0.1 && this.stamina > 4;
    if (isSprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 16);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + dt * 11);
    }

    // Target speed by transport mode
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

    // Separate X/Z sliding collision (respects land vs water for BOAT vs land vehicles!)
    const canMoveTo = (nx, nz) => {
      if (this.world.hitsBuilding(nx, nz, colRad)) return false;
      const inWater = this.world.isPointInWater(nx, nz);
      if (this.transport === "BOAT") return inWater;
      return !inWater;
    };

    if (this.onViewpoint) {
      // Allow exiting Hawa Mahal rooftop viewpoint cleanly on movement
      if (wishMag > 0.5) {
        this.onViewpoint = false;
        this.pos.y = 0;
      }
    } else {
      if (canMoveTo(this.pos.x + stepX, this.pos.z)) {
        this.pos.x += stepX;
      } else {
        this.speed *= 0.6;
      }
      if (canMoveTo(this.pos.x, this.pos.z + stepZ)) {
        this.pos.z += stepZ;
      } else {
        this.speed *= 0.6;
      }

      // Vertical jump gravity or boat water bobbing
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

    // Apply transform & lively animations (cloth scarf sway, legs, wheels, bike lean!)
    this.root.position.copy(this.pos);
    this.root.rotation.y = this.yaw;
    this.root.rotation.z =
      this.transport === "ENFIELD"
        ? THREE.MathUtils.clamp(-mv.x * (this.speed / 26) * 0.24, -0.26, 0.26)
        : this.transport === "BOAT"
        ? Math.sin(elapsedSec * 2.1) * 0.045
        : 0;

    // Procedural cloth-sway on Aarav's heritage scarf
    this.aarav.scarf.rotation.x = 0.2 + Math.min(0.85, this.speed * 0.05) + Math.sin(elapsedSec * 6.5) * 0.08;

    // Articulated leg/arm walk cycle
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

    // Rotate Auto-Rickshaw & Royal Enfield wheels
    const wheelDelta = this.speed * dt * 1.9;
    if (this.transport === "AUTO") {
      this.autoMesh.wheels.forEach((w) => { w.rotation.x += wheelDelta; });
    } else if (this.transport === "ENFIELD") {
      this.enfieldMesh.wheels.forEach((w) => { w.rotation.x += wheelDelta; });
    }

    // Smooth Cinematic Third-Person Camera (with Teekha spice shake if active!)
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
