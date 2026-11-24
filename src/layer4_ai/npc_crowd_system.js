/* ============================================================================
   Layer 4 — NPC, Crowd AI & Wildlife (Strict Non-Voxel Sculpted Models):
   - 24 real minutes = 24 in-game hours dynamic Indian day/night routine
   - Named Story NPCs built from sculpted anatomical torsos, heads, turbans
     & flowing saree/kurta drapes (ZERO BoxGeometry!)
   - High-density THREE.InstancedMesh sculpted crowd silhouettes
   - Organic Sculpted Indian Wildlife (Zebu Cows with curved horns, Hanuman
     Monkeys with curved tails, Indian Pariah Street Dogs)
   ============================================================================ */

import * as THREE from "three";
import {
  createSculptedTorso,
  createSculptedHead,
  createCurvedTube
} from "../layer1_core/sculpted_geometry.js";

export const FESTIVALS = [
  { id: "normal", label: "Everyday Living India", accent: 0xf59e0b },
  { id: "diwali", label: "Diwali — Festival of Diyas", accent: 0xfbbf24 },
  { id: "gangaur", label: "Gangaur Procession (Rajasthan)", accent: 0xec4899 },
  { id: "aarti", label: "Maha Ganga Aarti (Varanasi)", accent: 0xf97316 },
  { id: "light_sound", label: "Khajuraho Light & Sound", accent: 0x8b5cf6 },
  { id: "tansen", label: "Tansen Classical Music Festival", accent: 0x06b6d4 },
  { id: "mysore_lights", label: "Mysore Palace 100,000 Bulb Glow", accent: 0xfde047 }
];

const SARI_PALETTE = [
  0xe11d48, 0xd97706, 0x059669, 0x2563eb, 0x7c3aed,
  0xca8a04, 0xdb2777, 0x0f766e, 0xf8fafc, 0xb45309
];

export class NPCCrowdSystem {
  constructor(scene, assets, worldStreamer) {
    this.scene = scene;
    this.assets = assets;
    this.world = worldStreamer;

    // 24 real minutes = 24 in-game hours => 1 game hour per 60 real seconds
    this.hourOfDay = 9.5; // Starts in crisp Golden Morning (9:30 AM)
    this.timeScale = 1.0;
    this.activeFestival = "normal";

    this.group = null;
    this.namedNPCs = [];
    this.crowdInst = null;
    this.crowdHeadInst = null;
    this.crowdData = [];
    this.wildlife = [];
    this.currentHub = null;
    this._dummyBody = new THREE.Object3D();
    this._dummyHead = new THREE.Object3D();
  }

  // Alias for compatibility
  get timeHours() { return this.hourOfDay; }
  set timeHours(v) { this.hourOfDay = v; }

  getRoutinePhase() {
    const h = this.hourOfDay;
    if (h >= 5 && h < 9) return "MORNING AARTI";
    if (h >= 9 && h < 17) return "BAZAAR HOURS";
    if (h >= 17 && h < 20.5) return "GOLDEN FESTIVAL";
    return "NIGHT ILLUMINATION";
  }

  formatClock() {
    const totalMins = Math.floor(this.hourOfDay * 60);
    const h24 = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    const suffix = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
  }

  cycleTimePreset() {
    const presets = [6.5, 13.0, 17.8, 20.8]; // Dawn, Noon, Golden Hour Sunset, Festival Night
    let next = presets[0];
    for (const p of presets) {
      if (this.hourOfDay < p - 0.3) {
        next = p;
        break;
      }
    }
    this.hourOfDay = next;
    return this.formatClock();
  }

  cycleTimeOfDay() {
    this.cycleTimePreset();
    return this.getRoutinePhase();
  }

  cycleFestival() {
    const idx = FESTIVALS.findIndex((f) => f.id === this.activeFestival);
    const next = FESTIVALS[(idx + 1) % FESTIVALS.length];
    this.activeFestival = next.id;
    return next;
  }

  clear() {
    if (!this.group) return;
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    this.group = null;
    this.namedNPCs = [];
    this.crowdInst = null;
    this.crowdHeadInst = null;
    this.crowdData = [];
    this.wildlife = [];
  }

  populateHub(hub, crowdBudget = 32) {
    this.clear();
    this.currentHub = hub;
    this.group = new THREE.Group();
    this.group.name = "npc_crowd_" + hub.id;
    this.scene.add(this.group);

    for (const def of (hub.npcs || [])) {
      const npc = this._buildNamedNPC(def);
      this.group.add(npc.mesh);
      this.namedNPCs.push(npc);
    }

    this._buildInstancedCrowd(hub, crowdBudget);
    this._buildIndianWildlife(hub);
  }

  // --------------------------------------------------------------------------
  // Sculpted Anatomical Story NPC (ZERO BoxGeometry!)
  // --------------------------------------------------------------------------
  _buildNamedNPC(def) {
    const g = new THREE.Group();
    const clothMat = this.assets.colorMat(def.color || 0xd97706, { roughness: 0.78 });
    const skinMat = this.assets.colorMat(0xc5854b, { roughness: 0.66 });
    const wrapMat = this.assets.colorMat(0xfef3c7, { roughness: 0.82 });
    const legMat = this.assets.colorMat(0x2d241e, { roughness: 0.84 });
    const isFemale = /Meera|Ananya|Lakshmi|Bahu|Devi/i.test(def.name || "");

    // Legs or Flowing Pleated Saree Skirt
    if (isFemale) {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.94, 18), clothMat);
      skirt.position.y = 0.48;
      skirt.castShadow = true;
      g.add(skirt);
    } else {
      const legGeo = new THREE.CapsuleGeometry(0.095, 0.54, 8, 12);
      for (const lx of [-0.14, 0.14]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.44, 0);
        leg.castShadow = true;
        g.add(leg);
      }
    }

    // Sculpted Contoured Kurta / Blouse Torso + Shawl/Dupatta Wrap
    const body = new THREE.Mesh(createSculptedTorso(0.84, 0.25, 0.2, !isFemale), clothMat);
    body.position.y = 0.84;
    body.castShadow = true;
    g.add(body);

    const shawl = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 10, 18), wrapMat);
    shawl.position.set(0, 1.54, 0);
    shawl.rotation.x = Math.PI / 2 + 0.18;
    g.add(shawl);

    // Sculpted Capsule Arms & Rounded Hands
    const armGeo = new THREE.CapsuleGeometry(0.075, 0.44, 8, 12);
    for (const ax of [-0.32, 0.32]) {
      const arm = new THREE.Mesh(armGeo, clothMat);
      arm.position.set(ax, 1.24, 0);
      arm.rotation.z = ax < 0 ? 0.12 : -0.12;
      arm.castShadow = true;
      g.add(arm);

      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), skinMat);
      hand.position.set(ax * 1.12, 0.94, 0);
      g.add(hand);
    }

    // Sculpted Neck & Anatomical Oval Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.15, 12), skinMat);
    neck.position.y = 1.72;
    g.add(neck);

    const head = new THREE.Mesh(createSculptedHead(0.195), skinMat);
    head.position.y = 1.94;
    head.castShadow = true;
    g.add(head);

    // Regional Headwear: Draped Rajasthani Pagdi Turban OR Traditional Hair Bun with Marigold Gajra
    if (!isFemale) {
      const pagdiBase = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.075, 10, 20), clothMat);
      pagdiBase.position.y = 2.08;
      pagdiBase.rotation.x = Math.PI / 2;
      const pagdiCrown = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), clothMat);
      pagdiCrown.scale.set(1, 0.65, 1);
      pagdiCrown.position.y = 2.12;
      g.add(pagdiBase, pagdiCrown);
    } else {
      const hairMat = this.assets.colorMat(0x18181b, { roughness: 0.72 });
      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.205, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
        hairMat
      );
      hair.position.set(0, 1.98, -0.02);
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), hairMat);
      bun.position.set(0, 1.9, -0.22);
      const gajra = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 14), this.assets.get("marigold"));
      gajra.position.set(0, 1.9, -0.2);
      g.add(hair, bun, gajra);
    }

    // Subtle floating golden conversation halo
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.028, 10, 24),
      this.assets.get("diyaGlow")
    );
    ring.position.y = 2.58;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);

    g.position.set(def.x, 0, def.z);
    return {
      data: def,
      mesh: g,
      ring,
      baseX: def.x,
      baseZ: def.z,
      phase: Math.random() * Math.PI * 2
    };
  }

  // --------------------------------------------------------------------------
  // High-Density Sculpted Instanced Crowds (Lathe Torso + Oval Head)
  // --------------------------------------------------------------------------
  _buildInstancedCrowd(hub, count) {
    const bodyGeo = createSculptedTorso(1.38, 0.29, 0.23, false);
    const headGeo = createSculptedHead(0.185);
    const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.03 });
    const headMat = this.assets.colorMat(0xc98b55, { roughness: 0.68 });

    this.crowdInst = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
    this.crowdHeadInst = new THREE.InstancedMesh(headGeo, headMat, count);
    this.crowdInst.castShadow = true;

    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (i % 5) * 0.2;
      const rad = 12 + ((i * 11) % 34);
      let x = Math.cos(a) * rad;
      let z = Math.sin(a) * rad;
      if (this.world?.isPointInWater(x, z)) {
        x = hub.spawn.x + (Math.random() - 0.5) * 14;
        z = hub.spawn.z + (Math.random() - 0.5) * 14;
      }

      col.setHex(SARI_PALETTE[i % SARI_PALETTE.length]);
      this.crowdInst.setColorAt(i, col);

      this.crowdData.push({
        x,
        z,
        dir: Math.random() * Math.PI * 2,
        speed: 1.0 + (i % 4) * 0.35,
        phase: Math.random() * Math.PI * 2
      });
    }

    if (this.crowdInst.instanceColor) this.crowdInst.instanceColor.needsUpdate = true;
    this.group.add(this.crowdInst, this.crowdHeadInst);
  }

  // --------------------------------------------------------------------------
  // Sculpted Organic Indian Wildlife (Cows, Monkeys, Street Dogs — ZERO Boxes!)
  // --------------------------------------------------------------------------
  _buildIndianWildlife(hub) {
    const cowMat = this.assets.colorMat(0xf5f5f4, { roughness: 0.85 });
    const brownCowMat = this.assets.colorMat(0x9a6b48, { roughness: 0.85 });
    const hornMat = this.assets.colorMat(0x3f2c1f, { roughness: 0.65 });
    const dogMat = this.assets.colorMat(0xb87a42, { roughness: 0.84 });
    const monkeyMat = this.assets.colorMat(0x7c5838, { roughness: 0.82 });

    // 1. Sculpted Indian Zebu Cows (Capsule torso + dorsal hump + curved horns & tail)
    for (let i = 0; i < 4; i++) {
      const cow = new THREE.Group();
      const mat = i % 2 === 0 ? cowMat : brownCowMat;
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.08, 10, 16), mat);
      torso.rotation.x = Math.PI / 2;
      torso.position.y = 0.96;
      torso.castShadow = true;
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 12), mat);
      hump.scale.set(0.8, 1.05, 1.1);
      hump.position.set(0, 1.32, 0.34);
      const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.42, 8, 12), mat);
      neck.position.set(0, 1.14, 0.82);
      neck.rotation.x = 0.62;
      const head = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.32, 8, 12), mat);
      head.rotation.x = Math.PI / 2 + 0.35;
      head.position.set(0, 1.24, 1.14);

      const hornL = new THREE.Mesh(
        createCurvedTube([[-0.12, 1.38, 1.04], [-0.26, 1.54, 1.0], [-0.22, 1.72, 1.06]], 0.035, 10, 8),
        hornMat
      );
      const hornR = new THREE.Mesh(
        createCurvedTube([[0.12, 1.38, 1.04], [0.26, 1.54, 1.0], [0.22, 1.72, 1.06]], 0.035, 10, 8),
        hornMat
      );
      const tail = new THREE.Mesh(
        createCurvedTube([[0, 1.04, -0.78], [0, 0.72, -0.92], [0.04, 0.36, -0.88]], 0.03, 10, 8),
        mat
      );
      cow.add(torso, hump, neck, head, hornL, hornR, tail);

      for (const [lx, lz] of [[-0.24, 0.48], [0.24, 0.48], [-0.24, -0.48], [0.24, -0.48]]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.62, 6, 10), mat);
        leg.position.set(lx, 0.42, lz);
        cow.add(leg);
      }

      let cx = -22 + i * 15;
      let cz = 14 + (i % 2) * 14;
      if (this.world?.isPointInWater(cx, cz)) {
        cx = hub.spawn.x + (i - 1.5) * 6;
        cz = hub.spawn.z + 6;
      }
      cow.position.set(cx, 0, cz);
      this.group.add(cow);
      this.wildlife.push({ mesh: cow, kind: "cow", baseX: cx, baseZ: cz, phase: i * 1.4 });
    }

    // 2. Sculpted Hanuman/Rhesus Monkeys (Organic curved tail & rounded silhouette)
    const monkeyCount = hub.id === "jaipur" || hub.id === "varanasi" ? 6 : 3;
    for (let i = 0; i < monkeyCount; i++) {
      const m = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.34, 8, 12), monkeyMat);
      body.position.y = 0.44;
      const head = new THREE.Mesh(createSculptedHead(0.145), monkeyMat);
      head.position.set(0, 0.78, 0.05);
      const tail = new THREE.Mesh(
        createCurvedTube([[0, 0.32, -0.14], [0, 0.56, -0.42], [0.06, 0.9, -0.34], [0.04, 1.02, -0.22]], 0.032, 14, 8),
        monkeyMat
      );
      m.add(body, head, tail);
      let mx = (i - monkeyCount / 2) * 11;
      let mz = -16 + (i % 2) * 8;
      if (this.world?.isPointInWater(mx, mz)) {
        mx = hub.spawn.x - 8 + i * 4;
        mz = hub.spawn.z - 6;
      }
      m.position.set(mx, 0, mz);
      this.group.add(m);
      this.wildlife.push({ mesh: m, kind: "monkey", baseX: mx, baseZ: mz, phase: i * 2.1 });
    }

    // 3. Sculpted Indian Pariah Street Dogs
    for (let i = 0; i < 3; i++) {
      const dog = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.54, 8, 12), dogMat);
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.46;
      const head = new THREE.Mesh(createSculptedHead(0.135), dogMat);
      head.position.set(0, 0.64, 0.44);
      const snout = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.14, 6, 10), dogMat);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 0.6, 0.58);
      const tail = new THREE.Mesh(
        createCurvedTube([[0, 0.52, -0.34], [0, 0.74, -0.48], [0, 0.86, -0.36]], 0.028, 10, 8),
        dogMat
      );
      dog.add(body, head, snout, tail);
      for (const [lx, lz] of [[-0.1, 0.22], [0.1, 0.22], [-0.1, -0.22], [0.1, -0.22]]) {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.32, 6, 8), dogMat);
        leg.position.set(lx, 0.22, lz);
        dog.add(leg);
      }
      let dx = 12 - i * 12;
      let dz = 22 + i * 3;
      if (this.world?.isPointInWater(dx, dz)) {
        dx = hub.spawn.x + (i - 1) * 5;
        dz = hub.spawn.z + 4;
      }
      dog.position.set(dx, 0, dz);
      this.group.add(dog);
      this.wildlife.push({ mesh: dog, kind: "dog", baseX: dx, baseZ: dz, phase: i * 1.9 });
    }
  }

  findNearestNPC(px, pz, maxDist = 5.5) {
    let best = null;
    let bestD = maxDist;
    for (const n of this.namedNPCs) {
      const d = Math.hypot(px - n.mesh.position.x, pz - n.mesh.position.z);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  getNearestNPC(px, pz, maxDist = 5.5) {
    return this.findNearestNPC(px, pz, maxDist);
  }

  update(dt, elapsedSec, playerPos, worldOverride = null) {
    const world = worldOverride || this.world;
    this.hourOfDay = (this.hourOfDay + (dt / 60) * this.timeScale) % 24;

    const isNight = this.hourOfDay < 5.6 || this.hourOfDay > 20.0;
    const isDawn = this.hourOfDay >= 5.5 && this.hourOfDay < 8.5;

    for (const n of this.namedNPCs) {
      n.ring.rotation.z = elapsedSec * 1.8 + n.phase;
      n.ring.position.y = 2.58 + Math.sin(elapsedSec * 2.6 + n.phase) * 0.08;
      if (playerPos) {
        const dx = playerPos.x - n.mesh.position.x;
        const dz = playerPos.z - n.mesh.position.z;
        if (Math.hypot(dx, dz) < 7.5) {
          n.mesh.rotation.y = Math.atan2(dx, dz);
        } else {
          n.mesh.rotation.y = Math.sin(elapsedSec * 0.4 + n.phase) * 0.35;
        }
      }
    }

    if (this.crowdInst && this.crowdHeadInst) {
      const speedMult = isNight ? 0.35 : isDawn ? 0.72 : 1.0;

      for (let i = 0; i < this.crowdData.length; i++) {
        const c = this.crowdData[i];
        const nx = c.x + Math.cos(c.dir) * c.speed * speedMult * dt;
        const nz = c.z + Math.sin(c.dir) * c.speed * speedMult * dt;
        const outOfBounds = Math.hypot(nx, nz) > 54;
        const blocked =
          outOfBounds ||
          (world && (world.isPointInWater(nx, nz) || world.hitsBuilding(nx, nz, 1.0)));

        if (blocked) {
          c.dir += Math.PI * 0.65 + (i % 3) * 0.3;
        } else {
          c.x = nx;
          c.z = nz;
        }

        const bob = Math.abs(Math.sin(elapsedSec * 4.5 + c.phase)) * 0.08 * speedMult;
        this._dummyBody.position.set(c.x, 0.25 + bob, c.z);
        this._dummyBody.rotation.set(0, -c.dir + Math.PI / 2, 0);
        this._dummyBody.updateMatrix();
        this.crowdInst.setMatrixAt(i, this._dummyBody.matrix);

        this._dummyHead.position.set(c.x, 1.82 + bob, c.z);
        this._dummyHead.rotation.set(0, -c.dir + Math.PI / 2, 0);
        this._dummyHead.updateMatrix();
        this.crowdHeadInst.setMatrixAt(i, this._dummyHead.matrix);
      }
      this.crowdInst.instanceMatrix.needsUpdate = true;
      this.crowdHeadInst.instanceMatrix.needsUpdate = true;
    }

    for (const w of this.wildlife) {
      if (w.kind === "cow") {
        const t = elapsedSec * 0.25 + w.phase;
        w.mesh.position.x = w.baseX + Math.sin(t) * 2.4;
        w.mesh.position.z = w.baseZ + Math.cos(t * 0.8) * 1.8;
        w.mesh.rotation.y = Math.atan2(Math.cos(t) * 2.4, -Math.sin(t * 0.8) * 1.8);
      } else if (w.kind === "monkey") {
        const hop = Math.max(0, Math.sin(elapsedSec * 3.8 + w.phase)) * 0.65;
        w.mesh.position.y = hop;
        w.mesh.rotation.y = elapsedSec * 0.8 + w.phase;
      } else {
        const t = elapsedSec * 0.65 + w.phase;
        w.mesh.position.x = w.baseX + Math.cos(t) * 3.2;
        w.mesh.position.z = w.baseZ + Math.sin(t) * 2.4;
        w.mesh.rotation.y = -t;
      }
    }
  }
}
