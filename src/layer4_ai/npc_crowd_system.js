/* ============================================================================
   Layer 4 — NPC & AI System:
   - 24-min = 24-hour Day/Night Routine Scheduler
   - Articulated Named Regional NPCs (Priests, Boatmen, Vendors, Conservators)
   - THREE.InstancedMesh Strolling Bazaar Crowds (low draw-call overhead)
   - Authentic Indian Ambient Wildlife: Holy Cows, Temple Monkeys & Street Dogs
   ============================================================================ */

import * as THREE from "three";

const SARI_COLORS = [0xe11d48, 0xf59e0b, 0x0ea5e9, 0x10b981, 0x9333ea, 0xe85d04, 0xd946ef];

export class NPCCrowdSystem {
  constructor(scene, assets, worldStreamer) {
    this.scene = scene;
    this.assets = assets;
    this.world = worldStreamer;

    // 24 real minutes = 24 in-game hours (1 hour per 60 real seconds)
    this.hourOfDay = 9.5; // Starts in crisp Golden Morning (9:30 AM)
    this.group = null;
    this.namedNPCs = [];
    this.animals = [];
    this.crowdInst = null;
    this.crowdAgents = [];
    this._dummy = new THREE.Object3D();
  }

  getRoutinePhase() {
    const h = this.hourOfDay;
    if (h >= 5 && h < 9) return "MORNING AARTI";
    if (h >= 9 && h < 17) return "BAZAAR HOURS";
    if (h >= 17 && h < 20.5) return "GOLDEN FESTIVAL";
    return "NIGHT ILLUMINATION";
  }

  formatClock() {
    const h = Math.floor(this.hourOfDay) % 24;
    const m = Math.floor((this.hourOfDay - Math.floor(this.hourOfDay)) * 60);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
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

  populateHub(hub) {
    this.clear();
    this.group = new THREE.Group();
    this.group.name = "npc_crowd_" + hub.id;
    this.namedNPCs = [];
    this.animals = [];
    this.crowdAgents = [];

    // 1. Named Story & Local NPCs
    (hub.npcs || []).forEach((npc, idx) => {
      const mesh = this._buildNamedNPC(npc, idx);
      mesh.position.set(npc.x, 0, npc.z);
      this.group.add(mesh);
      this.namedNPCs.push({ data: npc, mesh, basePos: new THREE.Vector3(npc.x, 0, npc.z) });
    });

    // 2. InstancedMesh Bazaar Crowd (24 strolling citizens in 2 draw calls!)
    const crowdCount = 24;
    const bodyInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.28, 0.36, 1.35, 8),
      this.assets.colorMat(0xffffff, { roughness: 0.8 }),
      crowdCount
    );
    const headInst = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      this.assets.colorMat(0xc4864b, { roughness: 0.72 }),
      crowdCount
    );
    const color = new THREE.Color();

    for (let i = 0; i < crowdCount; i++) {
      let cx = (Math.random() - 0.5) * 62;
      let cz = (Math.random() - 0.5) * 58;
      // Keep out of water
      if (this.world.isPointInWater(cx, cz)) {
        cx = hub.spawn.x + (Math.random() - 0.5) * 14;
        cz = hub.spawn.z + (Math.random() - 0.5) * 14;
      }
      color.setHex(SARI_COLORS[i % SARI_COLORS.length]);
      bodyInst.setColorAt(i, color);
      this.crowdAgents.push({
        x: cx,
        z: cz,
        yaw: Math.random() * Math.PI * 2,
        speed: 1.4 + Math.random() * 1.4,
        turnTimer: 2 + Math.random() * 4,
        phase: Math.random() * 6
      });
    }
    if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true;
    this.group.add(bodyInst, headInst);
    this.crowdInst = { bodyInst, headInst };

    // 3. Authentic Desi Ambient Wildlife (2 Holy Cows, 2 Playful Monkeys, 2 Street Dogs)
    this._spawnAmbientAnimals(hub);

    this.scene.add(this.group);
  }

  _buildNamedNPC(npc, idx) {
    const g = new THREE.Group();
    const outfitHex =
      npc.role === "priest" ? 0xf97316 :
      npc.role === "ally" ? 0x0d9488 :
      npc.role === "hearing" ? 0x1e3a8a :
      SARI_COLORS[idx % SARI_COLORS.length];

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.42, 1.38, 10),
      this.assets.colorMat(outfitHex, { roughness: 0.8 })
    );
    body.position.y = 0.72;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 10, 10),
      this.assets.colorMat(0xc4864b, { roughness: 0.72 })
    );
    head.position.y = 1.68;
    head.castShadow = true;
    g.add(head);

    // Traditional Turban / Pagri or Tilak accent
    const pagri = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.27, 0.18, 10),
      this.assets.colorMat(npc.role === "priest" ? 0xfef08a : 0xe11d48)
    );
    pagri.position.y = 1.88;
    g.add(pagri);

    // Subtle glowing gold dialogue ring overhead
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.045, 6, 16),
      this.assets.get("diyaGlow")
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 2.38;
    halo.name = "npcHalo";
    g.add(halo);

    return g;
  }

  _spawnAmbientAnimals(hub) {
    const spawnNear = (ox, oz) => {
      let x = hub.spawn.x + ox;
      let z = hub.spawn.z + oz;
      if (this.world.isPointInWater(x, z)) {
        x = hub.spawn.x + 6;
        z = hub.spawn.z + 6;
      }
      return { x, z };
    };

    // 2 Holy Indian Cows (white humped zebu silhouette!)
    [[-10, -4], [10, 8]].forEach(([ox, oz]) => {
      const p = spawnNear(ox, oz);
      const cow = new THREE.Group();
      const white = this.assets.get("whitewash");
      const dark = this.assets.get("teakWood");
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.9, 1.9), white);
      torso.position.y = 1.1;
      torso.castShadow = true;
      cow.add(torso);
      const hump = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), white);
      hump.position.set(0, 1.62, 0.42);
      cow.add(hump);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.62), white);
      head.position.set(0, 1.35, 1.18);
      cow.add(head);
      for (const lx of [-0.34, 0.34]) {
        for (const lz of [-0.68, 0.68]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.16), dark);
          leg.position.set(lx, 0.36, lz);
          cow.add(leg);
        }
      }
      cow.position.set(p.x, 0, p.z);
      this.group.add(cow);
      this.animals.push({ type: "cow", mesh: cow, yaw: Math.random() * 6, speed: 0.9, timer: 3 });
    });

    // 2 Playful Temple Monkeys (hopping near bazaar / temple!)
    [[-6, -12], [12, -10]].forEach(([ox, oz]) => {
      const p = spawnNear(ox, oz);
      const monkey = new THREE.Group();
      const fur = this.assets.colorMat(0x8c6239, { roughness: 0.9 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.32), fur);
      body.position.y = 0.46;
      monkey.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), fur);
      head.position.set(0, 0.85, 0.08);
      monkey.add(head);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.7, 6), fur);
      tail.position.set(0, 0.6, -0.32);
      tail.rotation.x = -0.6;
      monkey.add(tail);
      monkey.position.set(p.x, 0, p.z);
      this.group.add(monkey);
      this.animals.push({ type: "monkey", mesh: monkey, yaw: Math.random() * 6, speed: 2.2, timer: 2 });
    });

    // 2 Friendly Street Dogs
    [[6, 4], [-8, 12]].forEach(([ox, oz]) => {
      const p = spawnNear(ox, oz);
      const dog = new THREE.Group();
      const coat = this.assets.colorMat(0xc58c52, { roughness: 0.88 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.82), coat);
      body.position.y = 0.46;
      dog.add(body);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.34), coat);
      head.position.set(0, 0.66, 0.48);
      dog.add(head);
      dog.position.set(p.x, 0, p.z);
      this.group.add(dog);
      this.animals.push({ type: "dog", mesh: dog, yaw: Math.random() * 6, speed: 1.8, timer: 2.5 });
    });
  }

  update(dt, elapsedSec, playerPos) {
    // 24 real minutes = 24 game hours => 1/60 hour per second
    this.hourOfDay = (this.hourOfDay + dt / 60) % 24;

    // 1. Named NPCs gently turn toward Aarav when nearby + bobbing gold halo
    for (const npc of this.namedNPCs) {
      const dist = Math.hypot(playerPos.x - npc.mesh.position.x, playerPos.z - npc.mesh.position.z);
      if (dist < 10) {
        npc.mesh.rotation.y = Math.atan2(
          playerPos.x - npc.mesh.position.x,
          playerPos.z - npc.mesh.position.z
        );
      }
      const halo = npc.mesh.getObjectByName("npcHalo");
      if (halo) {
        halo.position.y = 2.38 + Math.sin(elapsedSec * 3.5) * 0.1;
        halo.rotation.z += dt * 1.4;
      }
    }

    // 2. Instanced Bazaar Crowd strolling (slows gently late at night)
    if (this.crowdInst) {
      const nightSlow = this.hourOfDay > 22 || this.hourOfDay < 5 ? 0.35 : 1.0;
      const { bodyInst, headInst } = this.crowdInst;
      for (let i = 0; i < this.crowdAgents.length; i++) {
        const a = this.crowdAgents[i];
        a.turnTimer -= dt;
        if (a.turnTimer <= 0) {
          a.turnTimer = 2.2 + Math.random() * 4.0;
          a.yaw += (Math.random() - 0.5) * 2.1;
        }
        const nx = a.x + Math.sin(a.yaw) * a.speed * nightSlow * dt;
        const nz = a.z + Math.cos(a.yaw) * a.speed * nightSlow * dt;
        if (
          Math.abs(nx) < 42 &&
          Math.abs(nz) < 42 &&
          !this.world.isPointInWater(nx, nz) &&
          !this.world.hitsBuilding(nx, nz, 0.7)
        ) {
          a.x = nx;
          a.z = nz;
        } else {
          a.yaw += Math.PI * 0.75;
        }
        const bob = Math.abs(Math.sin(elapsedSec * 5 + a.phase)) * 0.08 * nightSlow;
        this._dummy.position.set(a.x, 0.7 + bob, a.z);
        this._dummy.rotation.set(0, a.yaw, 0);
        this._dummy.updateMatrix();
        bodyInst.setMatrixAt(i, this._dummy.matrix);

        this._dummy.position.set(a.x, 1.62 + bob, a.z);
        this._dummy.updateMatrix();
        headInst.setMatrixAt(i, this._dummy.matrix);
      }
      bodyInst.instanceMatrix.needsUpdate = true;
      headInst.instanceMatrix.needsUpdate = true;
    }

    // 3. Ambient Animals (Cows amble, Monkeys hop, Dogs trot)
    for (const an of this.animals) {
      an.timer -= dt;
      if (an.timer <= 0) {
        an.timer = 2.5 + Math.random() * 4;
        an.yaw += (Math.random() - 0.5) * 2.4;
      }
      const nx = an.mesh.position.x + Math.sin(an.yaw) * an.speed * dt;
      const nz = an.mesh.position.z + Math.cos(an.yaw) * an.speed * dt;
      if (
        Math.abs(nx) < 44 &&
        Math.abs(nz) < 44 &&
        !this.world.isPointInWater(nx, nz) &&
        !this.world.hitsBuilding(nx, nz, 0.9)
      ) {
        an.mesh.position.x = nx;
        an.mesh.position.z = nz;
      } else {
        an.yaw += Math.PI * 0.8;
      }
      an.mesh.rotation.y = an.yaw;
      if (an.type === "monkey") {
        an.mesh.position.y = Math.abs(Math.sin(elapsedSec * 6.5)) * 0.45;
      }
    }
  }

  findNearestNPC(x, z, maxDist = 5.5) {
    let best = null;
    let bestD = maxDist;
    for (const npc of this.namedNPCs) {
      const d = Math.hypot(x - npc.mesh.position.x, z - npc.mesh.position.z);
      if (d < bestD) {
        bestD = d;
        best = npc;
      }
    }
    return best;
  }

  clear() {
    if (!this.group) return;
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
    });
    this.group = null;
    this.namedNPCs = [];
    this.animals = [];
    this.crowdInst = null;
  }
}
