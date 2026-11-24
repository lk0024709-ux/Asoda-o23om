/* ============================================================================
   Layer 2 — Streaming & World: Seamless Hub Chunk Streamer & Horizon Manager
   Loads active city hubs on demand, manages GLSL water/heat-haze uniforms,
   collision AABBs, distant LOD silhouettes, festival light choreography,
   and clean GPU disposal across Pan-India fast travel.
   ============================================================================ */

import * as THREE from "three";
import { CITY_HUBS } from "./pan_india_data.js";
import {
  buildRatanpurHub,
  buildJaipurHub,
  buildUdaipurHub,
  buildAhmedabadHub,
  buildVaranasiHub,
  buildMPHub,
  buildSouthIndiaHub,
  buildSharedDesiProps
} from "./landmark_builders.js";
import { createIndianWaterMaterial, createHeatHazeMaterial } from "../layer1_core/shaders.js";

export class WorldStreamer {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.currentHub = null;
    this.hubRoot = null;
    this.colliders = [];
    this.waterMeshes = [];
    this.heatHazeMeshes = [];
    this.raceRingGroup = null;
    this.animRefs = {
      festivalLights: [],
      aartiFlames: [],
      floatingDiyas: [],
      mysoreBulbs: null,
      fishingNets: []
    };
  }

  loadHub(hubId, saveState = {}) {
    const hub = CITY_HUBS[hubId] || CITY_HUBS.ratanpur;
    this._unloadCurrent();

    this.currentHub = hub;
    this.hubRoot = new THREE.Group();
    this.hubRoot.name = "hub_" + hub.id;
    this.colliders = [];
    this.waterMeshes = [];
    this.heatHazeMeshes = [];
    this.animRefs = {
      festivalLights: [],
      aartiFlames: [],
      floatingDiyas: [],
      mysoreBulbs: null,
      fishingNets: []
    };

    // 1. Base Ground Plane (1 km² hub chunk feel) + Main Cobblestone Heritage Plaza
    const groundMat = this.assets.get(hub.theme.groundMat || "earthDesert");
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.hubRoot.add(ground);

    // Connecting Pan-India Highway Strip leading south to Highway Portal (z: 18 -> 110)
    const highway = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 96),
      this.assets.get("highwayAsphalt")
    );
    highway.rotation.x = -Math.PI / 2;
    highway.position.set(0, 0.04, 62);
    highway.receiveShadow = true;
    this.hubRoot.add(highway);

    // Subtle dashed yellow highway centerline
    for (let hz = 22; hz <= 104; hz += 7) {
      const dash = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 3.2),
        this.assets.get("autoYellow")
      );
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.06, hz);
      this.hubRoot.add(dash);
    }

    // Highway Heat Haze GLSL Shader Plane (visible on sunny afternoon!)
    const hazeMat = createHeatHazeMaterial();
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.2), hazeMat);
    haze.position.set(0, 1.6, 48);
    this.hubRoot.add(haze);
    this.heatHazeMeshes.push(haze);

    // 2. Custom GLSL Indian Water Surface (Lake Pichola / Ganges / Betwa / Man Sagar / Kochi Backwaters)
    if (hub.hasWater && hub.waterArea) {
      const wa = hub.waterArea;
      const waterMat = createIndianWaterMaterial({
        deepColor: wa.deepColor,
        shallowColor: wa.shallowColor
      });
      const waterGeo = new THREE.PlaneGeometry(wa.w, wa.d, 28, 28);
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(wa.x, -0.35, wa.z);
      this.hubRoot.add(water);
      this.waterMeshes.push(water);
    }

    // 3. Distant Horizon Hills / Aravalli & Deccan Silhouettes (low-poly distant ring)
    this._buildHorizonRing(hub);

    // 4. Handcrafted Regional Architecture & Signature Monuments
    if (hub.id === "ratanpur") {
      buildRatanpurHub(this.hubRoot, this.assets, this.colliders, this.animRefs, saveState);
    } else if (hub.id === "jaipur") {
      buildJaipurHub(this.hubRoot, this.assets, this.colliders, this.animRefs);
    } else if (hub.id === "udaipur") {
      buildUdaipurHub(this.hubRoot, this.assets, this.colliders, this.animRefs);
    } else if (hub.id === "ahmedabad") {
      buildAhmedabadHub(this.hubRoot, this.assets, this.colliders, this.animRefs);
    } else if (hub.id === "varanasi") {
      buildVaranasiHub(this.hubRoot, this.assets, this.colliders, this.animRefs);
    } else if (hub.id === "khajuraho" || hub.id === "orchha" || hub.id === "gwalior") {
      buildMPHub(hub.id, this.hubRoot, this.assets, this.colliders, this.animRefs);
    } else {
      buildSouthIndiaHub(hub.id, this.hubRoot, this.assets, this.colliders, this.animRefs);
    }

    // 5. Shared Authentic Desi Street Details (Chai Tapri, Pol Home, Horn OK Truck, Instanced Bazaars & Trees)
    buildSharedDesiProps(this.hubRoot, hub, this.assets, this.colliders);

    // 6. Subtle Glowing Golden Landmark Waypoint Rings on Ground
    this._buildLandmarkMarkers(hub);

    this.scene.add(this.hubRoot);
    return hub;
  }

  _buildHorizonRing(hub) {
    const hillMat = this.assets.colorMat(
      hub.region === "South India" ? 0x627358 : 0x9b7f5e,
      { roughness: 0.95 }
    );
    const count = 18;
    const hillInst = new THREE.InstancedMesh(new THREE.ConeGeometry(28, 22, 6), hillMat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const dist = 108 + (i % 3) * 12;
      const hScale = 0.7 + ((i * 7) % 5) * 0.25;
      dummy.position.set(Math.cos(a) * dist, 9 * hScale, Math.sin(a) * dist);
      dummy.scale.set(1.2, hScale, 1.2);
      dummy.rotation.y = a;
      dummy.updateMatrix();
      hillInst.setMatrixAt(i, dummy.matrix);
    }
    hillInst.instanceMatrix.needsUpdate = true;
    this.hubRoot.add(hillInst);
  }

  _buildLandmarkMarkers(hub) {
    const goldMat = this.assets.colorMat(0xf59e0b, { emissive: 0xd97706, emissiveIntensity: 1.4 });
    hub.landmarks.forEach((lm) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 8, 24), goldMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(lm.x, 0.14, lm.z + Math.min(8, lm.radius * 0.6));
      this.hubRoot.add(ring);
    });
  }

  // Spawn or clear Pink City Rickshaw Race glowing checkpoint hoops
  setRaceCheckpoint(pos) {
    if (this.raceRingGroup) {
      this.hubRoot?.remove(this.raceRingGroup);
      this.raceRingGroup = null;
    }
    if (!pos || !this.hubRoot) return;
    const g = new THREE.Group();
    g.position.set(pos.x, 2.4, pos.z);
    const hoop = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.25, 10, 28),
      this.assets.colorMat(0xfacc15, { emissive: 0xff8c00, emissiveIntensity: 2.2 })
    );
    g.add(hoop);
    this.hubRoot.add(g);
    this.raceRingGroup = g;
  }

  // Check if world coordinate sits over hub's boatable water area
  isPointInWater(x, z) {
    const wa = this.currentHub?.waterArea;
    if (!wa) return false;
    // Allow dry islands in Udaipur (Jag Mandir & Lake Palace) and Jal Mahal in Jaipur
    if (this.currentHub.id === "udaipur") {
      if (Math.hypot(x + 26, z + 18) < 12.2) return false; // Jag Mandir
      if (Math.hypot(x + 22, z - 24) < 9.5) return false;  // Lake Palace
    }
    return (
      Math.abs(x - wa.x) < wa.w * 0.49 &&
      Math.abs(z - wa.z) < wa.d * 0.49
    );
  }

  // AABB obstacle check against buildings/monuments
  hitsBuilding(x, z, radius = 0.7) {
    if (Math.abs(x) > 96 || Math.abs(z) > 96) return true;
    for (let i = 0; i < this.colliders.length; i++) {
      const c = this.colliders[i];
      if (x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  // Per-frame shader & festival animation updates
  update(elapsedSec, dt, atmosphere) {
    // 1. Update GLSL Water Shaders
    for (const w of this.waterMeshes) {
      const u = w.material.uniforms;
      u.uTime.value = elapsedSec;
      u.uSunDir.value.copy(atmosphere.sunDir);
      u.uSkyColor.value.copy(atmosphere.skyCol);
      u.uNightFactor.value = atmosphere.nightFactor;
    }

    // 2. Update Highway Heat Haze (strongest midday, disappears at night)
    for (const h of this.heatHazeMeshes) {
      h.material.uniforms.uTime.value = elapsedSec;
      h.material.uniforms.uIntensity.value = atmosphere.dayFactor * 0.16;
    }

    // 3. Festival Lamps, Ganga Aarti Flames & Mysore Night Illumination!
    const nightOrDusk = atmosphere.nightFactor > 0.25 || atmosphere.goldenFactor > 0.4;
    for (let i = 0; i < this.animRefs.festivalLights.length; i++) {
      const l = this.animRefs.festivalLights[i];
      l.visible = nightOrDusk;
      if (l.visible) {
        const s = 0.85 + Math.sin(elapsedSec * 6 + i) * 0.22;
        l.scale.setScalar(s);
      }
    }

    for (let i = 0; i < this.animRefs.aartiFlames.length; i++) {
      const f = this.animRefs.aartiFlames[i];
      f.scale.set(
        0.9 + Math.sin(elapsedSec * 9 + i) * 0.18,
        0.85 + Math.cos(elapsedSec * 11 + i * 1.4) * 0.3,
        0.9 + Math.sin(elapsedSec * 9 + i) * 0.18
      );
    }

    for (let i = 0; i < this.animRefs.floatingDiyas.length; i++) {
      const d = this.animRefs.floatingDiyas[i];
      d.position.z += dt * 0.9;
      if (d.position.z > 42) d.position.z = -42;
      d.position.y = -0.18 + Math.sin(elapsedSec * 3 + i) * 0.06;
    }

    if (this.animRefs.mysoreBulbs) {
      this.animRefs.mysoreBulbs.visible = nightOrDusk;
    }

    // Gentle sway on Kochi cantilevered Chinese Fishing Nets
    for (let i = 0; i < this.animRefs.fishingNets.length; i++) {
      this.animRefs.fishingNets[i].rotation.z = Math.sin(elapsedSec * 0.7 + i) * 0.04;
    }

    if (this.raceRingGroup) {
      this.raceRingGroup.rotation.y += dt * 2.2;
    }

    // Gentle cloth wind wave on temple flags
    if (this.hubRoot) {
      this.hubRoot.traverse((obj) => {
        if (obj.name === "clothFlag") {
          obj.rotation.y = Math.sin(elapsedSec * 4.5) * 0.24;
        }
      });
    }
  }

  _unloadCurrent() {
    if (!this.hubRoot) return;
    this.scene.remove(this.hubRoot);
    this.hubRoot.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });
    this.hubRoot = null;
  }
}
