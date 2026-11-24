/* ============================================================================
   Layer 2 — Streaming & World: High-Fidelity Sculpted Indian Monument Builders
   Strict Non-Voxel Art Direction:
   - Built exclusively from smooth, curved, beveled & sculpted polygonal meshes
     (LatheGeometry domes/shikharas/pillars/bells, beveled ExtrudeGeometry
     cusped Rajput/Mughal arches, TubeGeometry branches/trunks, organic noise-
     sculpted boulders & hills) — ZERO BoxGeometry / flat voxel blocks!
   - Uses THREE.LOD & THREE.InstancedMesh for locked 60 FPS desktop / 30 FPS mobile
   ============================================================================ */

import * as THREE from "three";
import {
  createBeveledSlab,
  createCuspedArchWall,
  createOnionDome,
  createNagaraShikhara,
  createCarvedPillar,
  createDravidianGopuramBody,
  createTempleBell,
  createTerracottaMatka,
  createFlameTear,
  createJharokhaOriel,
  createSculptedBoulder,
  createOrganicHill,
  createOrganicTreeCanopy,
  createCurvedTreeTrunk,
  createCurvedTube
} from "../layer1_core/sculpted_geometry.js";

function addMesh(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Smooth cylindrical/domed distant LOD silhouette (never a raw cube!)
function wrapInLOD(highGroup, lowMat, radW, height, lowDist = 96) {
  const lod = new THREE.LOD();
  lod.addLevel(highGroup, 0);
  const lowSilhouette = new THREE.Mesh(
    createOnionDome(radW * 0.58, height * 0.88, 16),
    lowMat
  );
  lod.addLevel(lowSilhouette, lowDist);
  return lod;
}

// Sculpted Rajput Chhatri Pavilion (Turned Pillars + Bulbous Onion Dome + Kalash)
function buildChhatri(parent, assets, x, y, z, scale = 1, stoneKey = "sandstone", domeKey = "marble") {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const stone = assets.get(stoneKey);
  const dome = assets.get(domeKey);

  addMesh(g, new THREE.CylinderGeometry(1.55, 1.7, 0.36, 16), stone, 0, 0.18, 0);
  const pGeo = createCarvedPillar(0.12, 2.35, 14);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addMesh(g, pGeo, stone, Math.cos(a) * 1.15, 0.34, Math.sin(a) * 1.15);
  }
  // Curved chhajja overhanging eaves ring
  addMesh(g, new THREE.CylinderGeometry(1.5, 1.95, 0.34, 16), stone, 0, 2.75, 0);
  addMesh(g, createOnionDome(1.22, 2.15, 28), dome, 0, 2.86, 0);
  parent.add(g);
  return g;
}

// Sculpted Parabolic Rekha-Prasada Nagara Hindu Temple (Curved Shikhara + Bronze Ghanta Bell)
function buildNagaraTemple(assets, stoneKey = "sandstone", goldCap = true) {
  const high = new THREE.Group();
  const stone = assets.get(stoneKey);
  const ochre = assets.get("carvedOchre");
  const gold = assets.get("templeGold");
  const marigold = assets.get("marigold");

  // Molded beveled stone Jagati platform + wide carved steps
  addMesh(high, createBeveledSlab(12.5, 1.4, 13.5, 0.22), ochre, 0, 0.7, 0);
  for (let s = 0; s < 3; s++) {
    addMesh(high, createBeveledSlab(4.8, 0.44, 1.15, 0.08), stone, 0, 0.22 + s * 0.42, 7.6 - s * 0.95);
  }

  // Open Pillared Mandapa Porch with Turned Fluted Columns
  const pGeo = createCarvedPillar(0.32, 4.6, 18);
  for (const px of [-4.2, -1.8, 1.8, 4.2]) {
    addMesh(high, pGeo, stone, px, 1.4, 5.2);
  }
  addMesh(high, createBeveledSlab(10.6, 0.65, 5.4, 0.16), stone, 0, 6.2, 3.6);
  // Sculpted Mandapa stepped domical roof
  addMesh(high, createNagaraShikhara(3.4, 4.2, 24), ochre, 0, 6.4, 3.6);

  // Hanging Flared Bronze Temple Bell (Ghanta)
  addMesh(high, new THREE.CylinderGeometry(0.035, 0.035, 1.45, 10), gold, 0, 5.2, 5.2);
  const bell = addMesh(high, createTempleBell(0.46, 0.78), gold, 0, 3.72, 5.2);
  bell.name = "templeBell";

  // Sweeping Curved Marigold Toran Garland across doorway
  const garlandCurve = [];
  for (let i = -4; i <= 4; i++) {
    const t = i / 4;
    garlandCurve.push([t * 2.1, 5.78 - Math.cos(t * Math.PI * 0.5) * 0.55, 5.85]);
  }
  addMesh(high, createCurvedTube(garlandCurve, 0.16, 20, 10), marigold, 0, 0, 0, 0, 0, 0, false);

  // Garbhagriha Sanctum + Continuous Sculpted Parabolic Rekha-Prasada Shikhara + Flanking Urushringas!
  addMesh(high, createBeveledSlab(8.6, 5.4, 7.6, 0.25), stone, 0, 4.1, -2.4);
  addMesh(high, createNagaraShikhara(4.3, 12.8, 32), goldCap ? stone : ochre, 0, 6.6, -2.4);
  // Sculpted miniature flanking spires (Urushringas)
  for (const [ux, uz] of [[-2.6, -2.4], [2.6, -2.4], [0, 0.2], [0, -5.0]]) {
    addMesh(high, createNagaraShikhara(1.45, 5.6, 20), ochre, ux, 6.7, uz);
  }
  if (goldCap) {
    addMesh(high, createOnionDome(1.15, 2.5, 24), gold, 0, 17.5, -2.4);
  }
  // Curved Saffron Dhwaja Temple Flag
  addMesh(high, new THREE.CylinderGeometry(0.055, 0.06, 3.4, 10), gold, 0.25, 20.6, -2.4);
  const flag = addMesh(high, new THREE.PlaneGeometry(2.2, 1.1, 8, 2), assets.get("saffronCloth"), 1.35, 21.6, -2.4, 0, 0, 0, false);
  flag.name = "clothFlag";

  return wrapInLOD(high, stone, 12, 20, 98);
}

// Sculpted Stone Elephant (Hampi Vittala Chariot Guard)
function buildSculptedElephant(assets, stoneKey = "granite") {
  const g = new THREE.Group();
  const mat = assets.get(stoneKey);
  addMesh(g, new THREE.CapsuleGeometry(0.68, 1.1, 10, 18), mat, 0, 1.35, 0, Math.PI / 2, 0, 0);
  addMesh(g, new THREE.SphereGeometry(0.58, 18, 14), mat, 0, 1.65, 0.95);
  // Sweeping curved elephant trunk!
  addMesh(g, createCurvedTube([[0, 1.55, 1.45], [0, 1.05, 1.72], [0, 0.65, 1.5], [0, 0.78, 1.28]], 0.14, 16, 10), mat, 0, 0, 0);
  // Flared sculpted ears
  addMesh(g, new THREE.SphereGeometry(0.42, 12, 10), mat, -0.58, 1.65, 0.85).scale.set(0.25, 1.0, 0.85);
  addMesh(g, new THREE.SphereGeometry(0.42, 12, 10), mat,  0.58, 1.65, 0.85).scale.set(0.25, 1.0, 0.85);
  // Four smooth pillar legs
  const legGeo = new THREE.CapsuleGeometry(0.2, 0.68, 8, 12);
  for (const lx of [-0.36, 0.36]) {
    for (const lz of [-0.55, 0.55]) {
      addMesh(g, legGeo, mat, lx, 0.54, lz);
    }
  }
  return g;
}

// ============================================================================
// INDIVIDUAL CITY HUB BUILDERS (ALL 12 INDIAN HUBS)
// ============================================================================

export function buildRatanpurHub(root, assets, colliders, animRefs, state) {
  const restored = !!state?.haveliRestored;
  const sand = assets.get("sandstone");
  const ochre = assets.get("carvedOchre");
  const marble = assets.get("marble");
  const wood = assets.get("teakWood");
  const gold = assets.get("templeGold");

  // 1. Professor Vikram's Ancestral Restorable Haveli (x=0, z=-2)
  const haveli = new THREE.Group();
  haveli.position.set(0, 0, -2);

  addMesh(
    haveli,
    createBeveledSlab(16.4, 0.3, 14.4, 0.08),
    restored ? assets.get("rangoliFloor") : assets.get("cobblestone"),
    0, 0.14, 0, 0, 0, 0, false
  );

  // Back & side beveled sandstone haveli wings + sculpted cusped courtyard arcade!
  addMesh(haveli, createBeveledSlab(18.4, 9.6, 4.6, 0.24), sand, 0, 4.8, -8.5);
  addMesh(haveli, createCuspedArchWall(15.2, 4.4, 0.9, 3, 3.2, 3.6), ochre, 0, 0.2, -6.1);
  addMesh(haveli, createBeveledSlab(3.8, 8.2, 14.2, 0.22), sand, -8.2, 4.1, -0.5);
  addMesh(haveli, createBeveledSlab(3.8, 8.2, 14.2, 0.22), sand,  8.2, 4.1, -0.5);

  // Grand Cusped-Arch Haveli Pol Entry Gate (walkthrough!)
  addMesh(haveli, createCuspedArchWall(18.4, 6.8, 2.0, 1, 6.2, 5.2), ochre, 0, 0, 7.2);
  addMesh(haveli, createBeveledSlab(18.8, 0.65, 2.5, 0.14), wood, 0, 6.95, 7.2);

  // Overhanging Curved Rajasthani Jharokha Oriel Balconies
  const jharGeo = createJharokhaOriel(2.4, 2.8, 1.35);
  for (const bx of [-4.6, 0, 4.6]) {
    addMesh(haveli, jharGeo, marble, bx, 6.4, -6.0);
  }
  buildChhatri(haveli, assets, -6.5, 9.5, -8.2, 0.9);
  buildChhatri(haveli, assets,  6.5, 9.5, -8.2, 0.9);

  if (restored) {
    // Sculpted Marble Lotus Fountain + Blooming Lotus Finial + Glowing Brass Diyas + Marigold Toran
    addMesh(haveli, new THREE.CylinderGeometry(2.5, 2.75, 0.68, 28), marble, 0, 0.45, -1);
    addMesh(haveli, new THREE.CylinderGeometry(2.1, 2.1, 0.14, 24), assets.colorMat(0x28a5bd, { roughness: 0.1, clearcoat: 0.9 }), 0, 0.78, -1, 0, 0, 0, false);
    addMesh(haveli, createOnionDome(0.42, 0.95, 20), gold, 0, 0.84, -1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const diya = addMesh(haveli, createFlameTear(0.14, 0.36), assets.get("diyaGlow"), Math.cos(a) * 2.38, 0.8, -1 + Math.sin(a) * 2.38, 0, 0, 0, false);
      animRefs.festivalLights.push(diya);
    }
    const toranPts = [];
    for (let gx = -5; gx <= 5; gx++) {
      toranPts.push([gx * 0.68, 5.45 - Math.cos(gx * 0.28) * 0.45, 8.35]);
    }
    addMesh(haveli, createCurvedTube(toranPts, 0.18, 24, 10), assets.get("marigold"), 0, 0, 0, 0, 0, 0, false);
  } else {
    addMesh(haveli, createTerracottaMatka(0.55), assets.get("terracotta"), -2.4, 0.26, -2);
    addMesh(haveli, createTerracottaMatka(0.45), assets.get("terracotta"),  2.3, 0.26, -1.6);
  }
  root.add(haveli);
  colliders.push(
    { minX: -9.5, maxX: 9.5, minZ: -12.8, maxZ: -8.0 },
    { minX: -10.2, maxX: -6.2, minZ: -9.5, maxZ: 5.5 },
    { minX: 6.2, maxX: 10.2, minZ: -9.5, maxZ: 5.5 }
  );

  // 2. Shri Ganesh Mandir (x=-28, z=-18)
  const temple = buildNagaraTemple(assets, "sandstone", true);
  temple.position.set(-28, 0, -18);
  temple.rotation.y = Math.PI * 0.2;
  root.add(temple);
  colliders.push({ minX: -34, maxX: -22, minZ: -25, maxZ: -14 });

  // 3. Chandni Bazaar Cusped Archway & Gully Cricket Stumps (x=26, z=-14)
  const bazaar = new THREE.Group();
  bazaar.position.set(26, 0, -14);
  addMesh(bazaar, createBeveledSlab(14.4, 7.6, 5.0, 0.22), assets.get("jaipurPink"), 0, 3.8, -7);
  addMesh(bazaar, createCuspedArchWall(11.4, 5.8, 1.5, 1, 6.4, 4.6), sand, 0, 0, 4);
  for (const sx of [-0.28, 0, 0.28]) {
    addMesh(bazaar, new THREE.CylinderGeometry(0.038, 0.04, 1.15, 10), wood, sx, 0.58, 0);
  }
  root.add(bazaar);
  colliders.push({ minX: 19, maxX: 33, minZ: -24, maxZ: -18.5 });
}

export function buildJaipurHub(root, assets, colliders, animRefs) {
  const pink = assets.get("jaipurPink");
  const sand = assets.get("sandstone");
  const marble = assets.get("marble");
  const gold = assets.get("templeGold");
  const mirror = assets.get("mirrorGlass");

  // 1. HAWA MAHAL (x=0, z=-22) — 5 Sculpted Stories + InstancedMesh Curved Jharokha Oriels!
  const hawa = new THREE.Group();
  hawa.position.set(0, 0, -22);

  const stories = [
    { w: 22.4, h: 3.4, y: 1.7 },
    { w: 19.8, h: 3.2, y: 5.0 },
    { w: 16.8, h: 3.1, y: 8.15 },
    { w: 13.2, h: 2.9, y: 11.15 },
    { w: 8.8,  h: 2.6, y: 13.9 }
  ];
  for (const st of stories) {
    addMesh(hawa, createBeveledSlab(st.w, st.h, 5.2, 0.18), pink, 0, st.y, 0);
    addMesh(hawa, createBeveledSlab(st.w + 0.7, 0.34, 5.8, 0.08), marble, 0, st.y + st.h * 0.5, 0);
  }
  buildChhatri(hawa, assets, 0, 15.2, 0, 1.05, "jaipurPink", "templeGold");
  buildChhatri(hawa, assets, -5.6, 12.6, 0, 0.75, "jaipurPink", "marble");
  buildChhatri(hawa, assets,  5.6, 12.6, 0, 0.75, "jaipurPink", "marble");

  // InstancedMesh of sculpted curved Bangla-roof Jharokha honeycomb bay windows!
  const jharokhaCoords = [];
  stories.forEach((st) => {
    const count = Math.max(3, Math.floor(st.w / 1.85));
    for (let i = 0; i < count; i++) {
      const x = -st.w * 0.44 + (i / Math.max(1, count - 1)) * (st.w * 0.88);
      jharokhaCoords.push({ x, y: st.y, z: 2.75 });
    }
  });
  const jInst = new THREE.InstancedMesh(createJharokhaOriel(1.38, 2.25, 0.92), marble, jharokhaCoords.length);
  const dummy = new THREE.Object3D();
  jharokhaCoords.forEach((c, i) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.updateMatrix();
    jInst.setMatrixAt(i, dummy.matrix);
  });
  jInst.instanceMatrix.needsUpdate = true;
  hawa.add(jInst);

  for (let i = -9; i <= 9; i += 2) {
    const d = addMesh(hawa, createFlameTear(0.14, 0.34), assets.get("diyaGlow"), i, 3.5, 3.05, 0, 0, 0, false);
    animRefs.festivalLights.push(d);
  }

  root.add(wrapInLOD(hawa, pink, 22, 18, 108));
  colliders.push({ minX: -11.5, maxX: 11.5, minZ: -25.5, maxZ: -18.5 });

  // 2. JANTAR MANTAR — Samrat Yantra Giant Sculpted Sundial (x=34, z=-12)
  const jantar = new THREE.Group();
  jantar.position.set(34, 0, -12);
  addMesh(jantar, createBeveledSlab(18, 0.44, 16, 0.1), marble, 0, 0.22, 0, 0, 0, 0, false);
  // Sculpted triangular gnomon masonry ramp
  const gnomonShape = new THREE.Shape();
  gnomonShape.moveTo(-6.2, 0);
  gnomonShape.lineTo(6.2, 0);
  gnomonShape.lineTo(-6.2, 7.6);
  gnomonShape.closePath();
  const gnomonGeo = new THREE.ExtrudeGeometry(gnomonShape, { depth: 2.0, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.14, bevelSegments: 3 });
  gnomonGeo.translate(0, 0, -1.0);
  gnomonGeo.rotateY(-Math.PI / 2);
  gnomonGeo.computeVertexNormals();
  addMesh(jantar, gnomonGeo, sand, 0, 0.44, 0);

  const arcGeo = new THREE.TorusGeometry(5.6, 0.48, 14, 32, Math.PI * 0.65);
  addMesh(jantar, arcGeo, marble, -5.0, 3.2, -1.2, 0, Math.PI * 0.5, -Math.PI * 0.65);
  addMesh(jantar, arcGeo, marble,  5.0, 3.2, -1.2, 0, Math.PI * 0.5, -Math.PI * 0.65);
  buildChhatri(jantar, assets, 0, 7.9, -5.8, 0.65, "marble", "templeGold");
  root.add(jantar);
  colliders.push({ minX: 31.5, maxX: 36.5, minZ: -19.5, maxZ: -5.5 });

  // 3. AMBER FORT & SHEESH MAHAL (Organic Hilltop + Rounded Bastions x=-36, z=-30)
  const amber = new THREE.Group();
  amber.position.set(-36, 0, -30);
  addMesh(amber, createOrganicHill(22, 8.2, 4), assets.get("granite"), 0, 0, 0);
  addMesh(amber, createBeveledSlab(22, 9.6, 16, 0.26), sand, 0, 11.0, 0);
  for (const bx of [-11, 11]) {
    for (const bz of [-8, 8]) {
      addMesh(amber, new THREE.CylinderGeometry(2.6, 3.0, 11.8, 22), sand, bx, 11.9, bz);
      buildChhatri(amber, assets, bx, 17.8, bz, 0.78);
    }
  }
  // Sheesh Mahal Arched Mirror Pavilion
  addMesh(amber, createCuspedArchWall(11.2, 5.2, 1.3, 3, 2.6, 4.0), marble, 0, 6.6, 8.3);
  addMesh(amber, createBeveledSlab(10.2, 4.6, 0.5, 0.08), mirror, 0, 8.9, 8.0);
  addMesh(amber, createBeveledSlab(11.6, 0.48, 1.8, 0.1), gold, 0, 12.0, 8.3);
  root.add(wrapInLOD(amber, sand, 28, 22, 118));
  colliders.push({ minX: -52, maxX: -20, minZ: -44, maxZ: -16 });

  // 4. JAIPUR CITY PALACE ARCHIVE (Chandra Mahal, x=32, z=24)
  const cpal = new THREE.Group();
  cpal.position.set(32, 0, 24);
  addMesh(cpal, createBeveledSlab(15.4, 12, 12.4, 0.24), pink, 0, 6, 0);
  addMesh(cpal, createCuspedArchWall(14.6, 4.8, 0.9, 3, 3.2, 3.8), marble, 0, 0, -6.2);
  addMesh(cpal, createBeveledSlab(12.2, 4.0, 9.2, 0.2), marble, 0, 14, 0);
  buildChhatri(cpal, assets, 0, 16, 0, 1.05, "marble", "templeGold");
  root.add(cpal);
  colliders.push({ minX: 24, maxX: 40, minZ: 17.5, maxZ: 30.5 });

  // 5. JAL MAHAL floating in Man Sagar Lake (x=-46, z=34)
  const jal = new THREE.Group();
  jal.position.set(-46, 0, 34);
  addMesh(jal, createBeveledSlab(12.4, 5.2, 12.4, 0.22), sand, 0, 2.2, 0);
  buildChhatri(jal, assets, -4.5, 4.8, -4.5, 0.72);
  buildChhatri(jal, assets,  4.5, 4.8, -4.5, 0.72);
  buildChhatri(jal, assets, -4.5, 4.8,  4.5, 0.72);
  buildChhatri(jal, assets,  4.5, 4.8,  4.5, 0.72);
  buildChhatri(jal, assets,  0, 5.0, 0, 0.98, "sandstone", "templeGold");
  root.add(jal);

  // 6. PATRIKA GATE (Sculpted Multi-Arch Painted Ceremonial Gateway at x=-2, z=48)
  const patrika = new THREE.Group();
  patrika.position.set(-2, 0, 48);
  addMesh(patrika, createCuspedArchWall(21.0, 7.8, 2.8, 5, 3.1, 5.6), pink, 0, 0, 0);
  buildChhatri(patrika, assets, -6.4, 7.8, 0, 0.7, "jaipurPink", "marble");
  buildChhatri(patrika, assets,  0,   7.8, 0, 0.9, "jaipurPink", "templeGold");
  buildChhatri(patrika, assets,  6.4, 7.8, 0, 0.7, "jaipurPink", "marble");
  root.add(patrika);
}

export function buildUdaipurHub(root, assets, colliders, animRefs) {
  const marble = assets.get("marble");
  const sand = assets.get("sandstone");

  // 1. UDAIPUR CITY PALACE overlooking Lake Pichola (x=42, z=-6)
  const palace = new THREE.Group();
  palace.position.set(42, 0, -6);
  addMesh(palace, createBeveledSlab(18.2, 11.2, 32.4, 0.26), sand, 0, 5.6, 0);
  addMesh(palace, createBeveledSlab(15.2, 7.2, 26.4, 0.24), marble, 0.5, 14.6, 0);
  addMesh(palace, createBeveledSlab(11.2, 4.6, 14.4, 0.2), marble, 1.0, 20.4, 0);
  // Sculpted Lake-Facing Arched Colonnade & Jharokha Balconies
  addMesh(palace, createCuspedArchWall(28.0, 5.4, 1.1, 6, 3.2, 4.2), marble, -9.2, 0.2, 0, 0, Math.PI / 2, 0);

  buildChhatri(palace, assets, 1, 22.6, 0, 1.6, "marble", "templeGold");
  buildChhatri(palace, assets, -1, 18.1, -10.5, 1.08, "marble", "templeGold");
  buildChhatri(palace, assets, -1, 18.1,  10.5, 1.08, "marble", "templeGold");

  const jharGeo = createJharokhaOriel(2.2, 2.6, 1.45);
  for (let gz = -12; gz <= 12; gz += 4) {
    addMesh(palace, jharGeo, marble, -9.3, 8.6, gz, 0, -Math.PI / 2, 0);
    const l = addMesh(palace, createFlameTear(0.16, 0.4), assets.get("diyaGlow"), -10.2, 9.2, gz, 0, 0, 0, false);
    animRefs.festivalLights.push(l);
  }
  root.add(wrapInLOD(palace, marble, 22, 26, 118));
  colliders.push({ minX: 32, maxX: 52, minZ: -23, maxZ: 11 });

  // 2. JAG MANDIR ISLAND PALACE inside Lake Pichola (x=-26, z=-18)
  const jag = new THREE.Group();
  jag.position.set(-26, 0, -18);
  addMesh(jag, new THREE.CylinderGeometry(11.6, 12.8, 2.2, 28), sand, 0, 0.2, 0);
  addMesh(jag, createBeveledSlab(9.8, 5.2, 9.8, 0.24), marble, 0, 3.8, 0);
  buildChhatri(jag, assets, 0, 6.4, 0, 1.45, "sandstone", "templeGold");
  buildChhatri(jag, assets, -7.2, 1.3, 0, 0.8, "marble", "marble");
  buildChhatri(jag, assets,  7.2, 1.3, 0, 0.8, "marble", "marble");
  root.add(jag);

  // 3. TAJ LAKE PALACE (Jag Niwas) floating in Lake Pichola (x=-22, z=24)
  const lakePal = new THREE.Group();
  lakePal.position.set(-22, 0, 24);
  addMesh(lakePal, createBeveledSlab(14.4, 1.8, 12.4, 0.22), marble, 0, 0.3, 0);
  addMesh(lakePal, createBeveledSlab(12.2, 5.6, 10.2, 0.22), marble, 0, 3.8, 0);
  buildChhatri(lakePal, assets, -4.2, 6.6, -3.5, 0.78, "marble", "marble");
  buildChhatri(lakePal, assets,  4.2, 6.6,  3.5, 0.78, "marble", "marble");
  buildChhatri(lakePal, assets,  0,   6.6,  0,   1.08, "marble", "templeGold");
  root.add(lakePal);

  // 4. JAGDISH TEMPLE (x=34, z=-34)
  const jagdish = buildNagaraTemple(assets, "marble", true);
  jagdish.position.set(34, 0, -34);
  root.add(jagdish);
  colliders.push({ minX: 28, maxX: 40, minZ: -41, maxZ: -28 });

  // 5. SAHELIYON-KI-BARI Lotus Pool Garden (x=38, z=36)
  const garden = new THREE.Group();
  garden.position.set(38, 0, 36);
  addMesh(garden, createBeveledSlab(16.4, 0.3, 16.4, 0.1), assets.get("grassGarden"), 0, 0.15, 0, 0, 0, 0, false);
  addMesh(garden, new THREE.CylinderGeometry(4.9, 5.2, 0.72, 32), marble, 0, 0.45, 0);
  addMesh(garden, new THREE.CylinderGeometry(4.35, 4.35, 0.16, 28), assets.colorMat(0x22a6b3, { roughness: 0.08, clearcoat: 0.9 }), 0, 0.82, 0, 0, 0, 0, false);
  buildChhatri(garden, assets, 0, 0.85, 0, 0.92, "marble", "marble");
  root.add(garden);

  // 6. SAJJANGARH (MONSOON PALACE) atop Sculpted Organic Aravalli Mountain (x=-74, z=-4)
  const hill = new THREE.Group();
  hill.position.set(-74, 0, -4);
  addMesh(hill, createOrganicHill(30, 22, 9), assets.get("granite"), 0, 0, 0);
  addMesh(hill, createBeveledSlab(14.2, 6.4, 10.2, 0.24), marble, 0, 20.5, 0);
  buildChhatri(hill, assets, 0, 23.6, 0, 1.2, "marble", "templeGold");
  root.add(hill);

  // Stepped Beveled Makrana Marble Gangaur Ghat along East shore
  for (let s = 0; s < 3; s++) {
    addMesh(root, createBeveledSlab(1.45, 0.44, 58, 0.08), marble, 20.5 - s * 1.25, -0.15 - s * 0.35, 0, 0, 0, 0, false);
  }
}

export function buildAhmedabadHub(root, assets, colliders) {
  const ochre = assets.get("carvedOchre");
  const sand = assets.get("sandstone");
  const marble = assets.get("marble");
  const white = assets.get("whitewash");
  const wood = assets.get("teakWood");

  // 1. ADALAJ STEPWELL (Vav) — Carved Multi-Tiered Octagonal Stepwell (x=0, z=-18)
  const vav = new THREE.Group();
  vav.position.set(0, 0, -18);
  addMesh(vav, createBeveledSlab(18.4, 1.2, 22.4, 0.2), sand, 0, 0.6, 0);
  const pGeo = createCarvedPillar(0.24, 2.8, 16);
  for (let tier = 0; tier < 3; tier++) {
    const inset = tier * 1.3;
    const y = 1.6 + tier * 1.45;
    addMesh(vav, createBeveledSlab(2.6, 0.85, 18.2 - inset, 0.14), ochre, -7.2 + inset * 0.4, y, 0);
    addMesh(vav, createBeveledSlab(2.6, 0.85, 18.2 - inset, 0.14), ochre,  7.2 - inset * 0.4, y, 0);
    for (const pz of [-6, 0, 6]) {
      addMesh(vav, pGeo, sand, -6.2 + inset * 0.3, y - 0.5, pz);
      addMesh(vav, pGeo, sand,  6.2 - inset * 0.3, y - 0.5, pz);
    }
  }
  addMesh(vav, new THREE.CylinderGeometry(3.8, 3.8, 0.35, 16), assets.colorMat(0x16697a, { roughness: 0.1, clearcoat: 0.9 }), 0, 1.28, -4);
  for (let st = 0; st < 7; st++) {
    addMesh(vav, createBeveledSlab(5.8, 0.35, 1.25, 0.07), ochre, 0, 1.25 - st * 0.12, 9.5 - st * 1.4);
  }
  buildChhatri(vav, assets, -6.5, 6.2, -7.5, 0.74, "carvedOchre", "sandstone");
  buildChhatri(vav, assets,  6.5, 6.2, -7.5, 0.74, "carvedOchre", "sandstone");
  root.add(vav);
  colliders.push({ minX: -9.5, maxX: -5.0, minZ: -29, maxZ: -8 }, { minX: 5.0, maxX: 9.5, minZ: -29, maxZ: -8 });

  // 2. SIDI SAIYYED MOSQUE — Sculpted Tree-of-Life Carved Stone Jali (x=-32, z=6)
  const sidi = new THREE.Group();
  sidi.position.set(-32, 0, 6);
  addMesh(sidi, createBeveledSlab(14.4, 7.6, 10.2, 0.24), sand, 0, 3.8, 0);
  addMesh(sidi, createCuspedArchWall(14.0, 5.6, 1.0, 3, 3.2, 4.4), ochre, 0, 0, 5.1);
  // Flowing curved Tree-of-Life sculpted jali tendrils in central arch!
  for (let b = -3; b <= 3; b++) {
    const branch = createCurvedTube(
      [[0, 1.6, 5.25], [b * 0.32, 2.8, 5.28], [b * 0.62, 3.85 - Math.abs(b) * 0.18, 5.28]],
      0.085, 14, 8
    );
    addMesh(sidi, branch, assets.get("templeGold"), 0, 0, 0);
  }
  for (const dx of [-4.2, 0, 4.2]) {
    addMesh(sidi, createOnionDome(1.9, 2.8, 28), marble, dx, 7.5, 0);
  }
  root.add(sidi);
  colliders.push({ minX: -39.5, maxX: -24.5, minZ: 0.5, maxZ: 11.5 });

  // 3. SABARMATI ASHRAM (Serene Whitewashed Courtyard + Sculpted Charkha x=34, z=-8)
  const ashram = new THREE.Group();
  ashram.position.set(34, 0, -8);
  addMesh(ashram, createBeveledSlab(14.2, 4.2, 9.2, 0.2), white, 0, 2.1, -3);
  addMesh(ashram, createBeveledSlab(15.2, 1.2, 10.2, 0.35), assets.get("terracotta"), 0, 4.6, -3);
  addMesh(ashram, new THREE.TorusGeometry(0.95, 0.11, 12, 28), wood, 0, 1.35, 4.5);
  addMesh(ashram, createBeveledSlab(2.4, 0.24, 0.85, 0.06), wood, 0, 0.2, 4.5);
  root.add(ashram);
  colliders.push({ minX: 26.5, maxX: 41.5, minZ: -16, maxZ: -6 });
}

export function buildVaranasiHub(root, assets, colliders, animRefs) {
  const sand = assets.get("sandstone");
  const ochre = assets.get("carvedOchre");
  const gold = assets.get("templeGold");

  // 1. DASHASHWAMEDH & ASSI GHATS (Beveled Stepped Stone Riverfront)
  for (let s = 0; s < 5; s++) {
    addMesh(root, createBeveledSlab(2.45, 0.5, 110, 0.08), s % 2 === 0 ? sand : ochre, 8 - s * 2.1, 1.2 - s * 0.35, 0, 0, 0, 0, false);
  }

  // Seven Sculpted Brass Ganga Aarti Lamp Stands + Teardrop Flames + Floating River Diyas
  for (let i = -3; i <= 3; i++) {
    const gz = i * 3.8;
    addMesh(root, createCarvedPillar(0.18, 1.85, 14), gold, 3.2, 0.72, gz);
    const flame = addMesh(root, createFlameTear(0.36, 1.18), assets.get("aartiFlame"), 3.2, 2.55, gz, 0, 0, 0, false);
    animRefs.aartiFlames.push(flame);
    const diya = addMesh(root, createFlameTear(0.18, 0.36), assets.get("diyaGlow"), 16 + Math.abs(i) * 2.2, 0.05, gz * 1.4, 0, 0, 0, false);
    animRefs.floatingDiyas.push(diya);
  }

  // Domed Traditional Ghat Umbrellas
  const umbGeo = new THREE.SphereGeometry(2.4, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.35);
  for (const uz of [-18, -8, 8, 22, 34]) {
    addMesh(root, new THREE.CylinderGeometry(0.08, 0.09, 3.6, 10), assets.get("teakWood"), 4.5, 2.8, uz);
    addMesh(root, umbGeo, uz % 16 === 0 ? assets.get("saffronCloth") : assets.get("crimsonCloth"), 4.5, 3.6, uz);
  }

  // 2. KASHI VISHWANATH GOLDEN SHIKHARA TEMPLE (x=-26, z=-12)
  const kashi = buildNagaraTemple(assets, "carvedOchre", true);
  kashi.position.set(-26, 0, -12);
  addMesh(kashi, createNagaraShikhara(3.5, 10.5, 28), gold, 0, 8.8, -2.4);
  root.add(kashi);
  colliders.push({ minX: -32, maxX: -20, minZ: -19, maxZ: -6 });

  // 3. SARNATH DHAMEK STUPA (Sculpted Cylindrical Drum & Hemispherical Dome x=-36, z=-40)
  const stupa = new THREE.Group();
  stupa.position.set(-36, 0, -40);
  addMesh(stupa, new THREE.CylinderGeometry(8.6, 9.3, 6.5, 32), sand, 0, 3.25, 0);
  addMesh(stupa, new THREE.TorusGeometry(8.6, 0.42, 12, 32), ochre, 0, 6.4, 0, Math.PI / 2, 0, 0);
  addMesh(stupa, new THREE.CylinderGeometry(7.3, 7.7, 6.2, 32), assets.get("terracotta"), 0, 9.5, 0);
  addMesh(stupa, new THREE.SphereGeometry(7.3, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), ochre, 0, 12.4, 0);
  root.add(stupa);
  colliders.push({ minX: -45, maxX: -27, minZ: -49, maxZ: -31 });
}

export function buildMPHub(hubId, root, assets, colliders, animRefs) {
  const sand = assets.get("sandstone");
  const ochre = assets.get("carvedOchre");
  const marble = assets.get("marble");

  if (hubId === "khajuraho") {
    const main = buildNagaraTemple(assets, "sandstone", true);
    main.position.set(0, 0, -12);
    main.scale.setScalar(1.34);
    root.add(main);
    colliders.push({ minX: -9, maxX: 9, minZ: -21, maxZ: -5 });

    const jain = buildNagaraTemple(assets, "carvedOchre", false);
    jain.position.set(-32, 0, -6);
    jain.scale.setScalar(0.92);
    root.add(jain);
    colliders.push({ minX: -38, maxX: -26, minZ: -13, maxZ: 0 });

    const spotCols = [0xff8c1a, 0xd946ef, 0x38bdf8];
    spotCols.forEach((col, i) => {
      const orb = addMesh(root, new THREE.SphereGeometry(0.46, 16, 12), assets.colorMat(col, { emissive: col, emissiveIntensity: 2.3 }), -10 + i * 10, 0.8, 3, 0, 0, 0, false);
      animRefs.festivalLights.push(orb);
    });
  } else if (hubId === "orchha") {
    // Jahangir Mahal — Bundela Arched Rajput Palace with 8 Onion-Dome Chhatris
    const jm = new THREE.Group();
    jm.position.set(24, 0, -14);
    addMesh(jm, createBeveledSlab(20.4, 11, 20.4, 0.28), sand, 0, 5.5, 0);
    addMesh(jm, createCuspedArchWall(18.6, 5.4, 1.1, 4, 3.2, 4.2), ochre, 0, 0, 10.2);
    addMesh(jm, createBeveledSlab(16.2, 4.5, 16.2, 0.24), ochre, 0, 13.2, 0);
    for (const cx of [-7.8, 0, 7.8]) {
      for (const cz of [-7.8, 7.8]) {
        buildChhatri(jm, assets, cx, 11.2, cz, 0.92, "sandstone", "marble");
      }
    }
    buildChhatri(jm, assets, 0, 15.5, 0, 1.32, "sandstone", "templeGold");
    root.add(wrapInLOD(jm, sand, 22, 20, 108));
    colliders.push({ minX: 13.5, maxX: 34.5, minZ: -24.5, maxZ: -3.5 });

    const ram = buildNagaraTemple(assets, "jaipurPink", true);
    ram.position.set(-2, 0, -26);
    root.add(ram);
    colliders.push({ minX: -8, maxX: 4, minZ: -33, maxZ: -20 });
  } else {
    // GWALIOR FORT & MAN MANDIR PALACE (Glazed Blue Tilework + Sculpted Bastions)
    const fort = new THREE.Group();
    fort.position.set(0, 0, -18);
    const blueTile = assets.get("gwaliorBlue");
    addMesh(fort, createBeveledSlab(30.4, 11.2, 16.2, 0.28), sand, 0, 5.6, 0);
    addMesh(fort, createBeveledSlab(30.8, 3.8, 16.6, 0.16), blueTile, 0, 8.2, 0);
    for (const bx of [-14, -7, 0, 7, 14]) {
      addMesh(fort, new THREE.CylinderGeometry(2.35, 2.55, 13.2, 22), sand, bx, 6.6, 8.2);
      addMesh(fort, new THREE.CylinderGeometry(2.48, 2.48, 2.8, 22), blueTile, bx, 9.5, 8.2);
      buildChhatri(fort, assets, bx, 13.1, 8.2, 0.85, "sandstone", "templeGold");
    }
    root.add(wrapInLOD(fort, blueTile, 32, 18, 112));
    colliders.push({ minX: -16, maxX: 16, minZ: -27, maxZ: -9 });

    const tansen = new THREE.Group();
    tansen.position.set(-30, 0, 10);
    addMesh(tansen, new THREE.CylinderGeometry(6.5, 7.1, 1.0, 28), marble, 0, 0.5, 0);
    buildChhatri(tansen, assets, 0, 1.0, 0, 1.9, "marble", "templeGold");
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const d = addMesh(tansen, createFlameTear(0.18, 0.44), assets.get("diyaGlow"), Math.cos(a) * 5.8, 1.05, Math.sin(a) * 5.8, 0, 0, 0, false);
      animRefs.festivalLights.push(d);
    }
    root.add(tansen);
  }
}

export function buildSouthIndiaHub(hubId, root, assets, colliders, animRefs) {
  const granite = assets.get("granite");
  const sand = assets.get("sandstone");
  const marble = assets.get("marble");
  const gold = assets.get("templeGold");
  const wood = assets.get("teakWood");

  if (hubId === "hampi") {
    // 1. VITTALA ICONIC STONE CHARIOT (x=0, z=-14)
    const chariot = new THREE.Group();
    chariot.position.set(0, 0, -14);
    addMesh(chariot, createBeveledSlab(10.2, 1.2, 12.2, 0.18), granite, 0, 0.6, 0);
    // Carved Granite Chariot Wheels (Torus rim + hub + spokes!)
    const rimGeo = new THREE.TorusGeometry(1.65, 0.24, 12, 28);
    rimGeo.rotateY(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.52, 16);
    hubGeo.rotateZ(Math.PI / 2);
    for (const wx of [-3.5, 3.5]) {
      for (const wz of [-2.4, 2.4]) {
        addMesh(chariot, rimGeo, sand, wx, 1.95, wz);
        addMesh(chariot, hubGeo, granite, wx, 1.95, wz);
      }
    }
    addMesh(chariot, createBeveledSlab(6.4, 4.8, 7.8, 0.22), granite, 0, 3.8, 0);
    addMesh(chariot, createDravidianGopuramBody(5.4, 6.2, 3.6), sand, 0, 6.0, 0);
    addMesh(chariot, createOnionDome(2.1, 2.6, 26), gold, 0, 9.4, 0);

    // Twin Sculpted Granite Elephants pulling the Chariot!
    const el1 = buildSculptedElephant(assets, "granite");
    el1.position.set(-1.8, 0, 6.4);
    const el2 = buildSculptedElephant(assets, "granite");
    el2.position.set(1.8, 0, 6.4);
    chariot.add(el1, el2);

    root.add(chariot);
    colliders.push({ minX: -5.5, maxX: 5.5, minZ: -20.5, maxZ: -8 });

    // 2. VIRUPAKSHA SCULPTED DRAVIDIAN GOPURAM (x=-34, z=-18)
    const gop = buildDravidianGopuram(assets, 0xd8c3a5);
    gop.position.set(-34, 0, -18);
    root.add(gop);
    colliders.push({ minX: -41, maxX: -27, minZ: -24, maxZ: -12 });

    // 3. ACT 5 CONGLOMERATE EXCAVATION SITE (x=34, z=-16)
    const dig = new THREE.Group();
    dig.position.set(34, 0, -16);
    addMesh(dig, createBeveledSlab(14, 0.35, 14, 0.1), assets.get("carvedOchre"), 0, 0.18, 0);
    const caution = assets.colorMat(0xf59e0b, { roughness: 0.32, clearcoat: 0.6 });
    addMesh(dig, createBeveledSlab(4.2, 2.5, 5.4, 0.3), caution, 3, 1.75, -2);
    addMesh(dig, createCurvedTube([[2.2, 2.5, 0.2], [1.6, 4.8, 2.4], [0.8, 2.6, 4.2]], 0.34, 16, 12), assets.get("bulletBlack"), 0, 0, 0);
    addMesh(dig, createBeveledSlab(9.2, 1.1, 0.38, 0.08), caution, 0, 0.75, 6.8);
    root.add(dig);

    // Organic Weathered Vijayanagara Granite Boulders (NO dodecahedrons!)
    const boulderSpots = [
      [-52, 8, 1.6], [-48, -42, 2.1], [48, -38, 1.8], [52, 16, 1.7],
      [-20, -46, 2.2], [18, -46, 1.9], [-55, 34, 2.0], [54, 42, 1.5]
    ];
    boulderSpots.forEach(([bx, bz, sc], idx) => {
      addMesh(root, createSculptedBoulder(3.4 * sc, idx + 1), granite, bx, sc * 2.0, bz);
    });
  } else if (hubId === "madurai") {
    // 1. MEENAKSHI AMMAN TEMPLE — Vivid Sculpted Concave Dravidian Gopurams!
    const southGop = buildDravidianGopuram(assets, 0xe11d48, true);
    southGop.position.set(0, 0, -18);
    southGop.scale.setScalar(1.25);
    root.add(southGop);
    const westGop = buildDravidianGopuram(assets, 0x0ea5e9, true);
    westGop.position.set(-22, 0, -28);
    westGop.scale.setScalar(0.95);
    root.add(westGop);
    const eastGop = buildDravidianGopuram(assets, 0x10b981, true);
    eastGop.position.set(22, 0, -28);
    eastGop.scale.setScalar(0.95);
    root.add(eastGop);
    colliders.push({ minX: -9, maxX: 9, minZ: -25, maxZ: -11 });

    // 2. THIRUMALAI NAYAKKAR PALACE — Grand Arched White Colonnade Hearing Hall (x=34, z=0)
    const hall = new THREE.Group();
    hall.position.set(34, 0, 0);
    addMesh(hall, createBeveledSlab(18.4, 0.85, 22.4, 0.16), marble, 0, 0.42, 0);
    const colGeo = createCarvedPillar(0.62, 9.6, 20);
    for (const cx of [-7, -2.5, 2.5, 7]) {
      for (const cz of [-8, 8]) {
        addMesh(hall, colGeo, assets.get("whitewash"), cx, 0.8, cz);
      }
    }
    addMesh(hall, createCuspedArchWall(18.2, 4.4, 1.2, 3, 4.2, 3.6), assets.get("whitewash"), 0, 6.2, -8);
    addMesh(hall, createBeveledSlab(18.6, 1.8, 22.6, 0.24), marble, 0, 11.2, 0);
    addMesh(hall, createBeveledSlab(2.6, 1.5, 1.4, 0.14), wood, 0, 1.55, 0);
    addMesh(hall, createBeveledSlab(1.65, 0.22, 0.92, 0.05), gold, 0, 2.4, 0);
    root.add(hall);
  } else if (hubId === "mysore") {
    // 1. MYSORE PALACE (Amba Vilas) — Cusped Arches + Sculpted Pink Onion Domes + Night Bulbs!
    const mysore = new THREE.Group();
    mysore.position.set(0, 0, -18);
    const pinkDome = assets.colorMat(0xc24d66, { roughness: 0.28, metalness: 0.16, clearcoat: 0.5 });
    addMesh(mysore, createBeveledSlab(36.4, 11.5, 16.4, 0.28), sand, 0, 5.75, 0);
    addMesh(mysore, createCuspedArchWall(35.0, 5.8, 1.2, 7, 3.4, 4.6), marble, 0, 0, 8.2);
    addMesh(mysore, createBeveledSlab(14.4, 5.5, 12.2, 0.24), marble, 0, 14.2, 0);

    // Sculpted Bulbous Pink Onion Domes & Golden Finials!
    addMesh(mysore, createOnionDome(4.2, 6.8, 32), pinkDome, 0, 16.8, 0);
    for (const dx of [-14, -7.5, 7.5, 14]) {
      addMesh(mysore, createOnionDome(2.4, 3.8, 24), pinkDome, dx, 11.5, 4);
    }

    // InstancedMesh 100,000-Bulb Mysore Palace Night Illumination!
    const bulbCoords = [];
    for (let x = -17.5; x <= 17.5; x += 1.25) {
      bulbCoords.push([x, 4.2, 8.85], [x, 8.2, 8.85], [x, 11.5, 8.85]);
    }
    for (let y = 1.5; y <= 11.5; y += 1.4) {
      for (const x of [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5]) {
        bulbCoords.push([x, y, 8.85]);
      }
    }
    const bulbInst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 10, 8), assets.get("diyaGlow"), bulbCoords.length);
    const dummy = new THREE.Object3D();
    bulbCoords.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.updateMatrix();
      bulbInst.setMatrixAt(i, dummy.matrix);
    });
    bulbInst.instanceMatrix.needsUpdate = true;
    mysore.add(bulbInst);
    animRefs.mysoreBulbs = bulbInst;

    root.add(wrapInLOD(mysore, sand, 36, 23, 118));
    colliders.push({ minX: -18.5, maxX: 18.5, minZ: -26.5, maxZ: -9.5 });

    // 2. CHAMUNDI HILLS Sculpted Organic Hilltop Temple (x=-38, z=-20)
    const cham = new THREE.Group();
    cham.position.set(-38, 0, -20);
    addMesh(cham, createOrganicHill(20, 12.5, 12), granite, 0, 0, 0);
    const cGop = buildDravidianGopuram(assets, 0xf4bd34, false);
    cGop.position.set(0, 11.0, 0);
    cGop.scale.setScalar(0.68);
    cham.add(cGop);
    root.add(cham);
  } else {
    // KOCHI — Sculpted Cantilevered Curved Wooden Chinese Fishing Nets + Mattancherry Palace
    const netMat = assets.colorMat(0xd6cfc2, { doubleSide: true, roughness: 0.9 });
    for (let ni = -1; ni <= 1; ni++) {
      const netGroup = new THREE.Group();
      netGroup.position.set(2, 0, -6 + ni * 16);
      addMesh(netGroup, createBeveledSlab(5.2, 1.2, 4.6, 0.14), wood, 2.5, 0.6, 0);
      addMesh(netGroup, createCurvedTube([[2.0, 1.1, -1.5], [-1.5, 5.2, -1.6], [-6.4, 7.8, -1.6]], 0.17, 16, 10), wood, 0, 0, 0);
      addMesh(netGroup, createCurvedTube([[2.0, 1.1,  1.5], [-1.5, 5.2,  1.6], [-6.4, 7.8,  1.6]], 0.17, 16, 10), wood, 0, 0, 0);
      addMesh(netGroup, new THREE.CylinderGeometry(0.14, 0.14, 9.6, 12), wood, -6.2, 7.7, 0, Math.PI / 2, 0, 0);
      // Curved sagging parabolic net dome
      addMesh(netGroup, new THREE.SphereGeometry(4.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), netMat, -6.8, 5.4, 0, Math.PI, 0, 0, false);
      addMesh(netGroup, createSculptedBoulder(0.72, ni + 5), granite, 4.5, 2.3, 0);
      animRefs.fishingNets.push(netGroup);
      root.add(netGroup);
    }

    // MATTANCHERRY PALACE & PARADESI SYNAGOGUE (Beveled Walls + Curved Kerala Tile Roof)
    const matPal = new THREE.Group();
    matPal.position.set(32, 0, -18);
    addMesh(matPal, createBeveledSlab(20.4, 6.2, 14.4, 0.22), assets.get("whitewash"), 0, 3.1, 0);
    addMesh(matPal, createDravidianGopuramBody(21.6, 15.6, 4.2), assets.get("terracotta"), 0, 6.1, 0);
    addMesh(matPal, createBeveledSlab(4.6, 12, 4.6, 0.2), assets.get("whitewash"), -13, 6, 4);
    addMesh(matPal, createOnionDome(2.4, 3.2, 22), assets.get("terracotta"), -13, 12.0, 4);
    root.add(matPal);
    colliders.push({ minX: 21.5, maxX: 42.5, minZ: -25.5, maxZ: -10.5 });
  }
}

function buildDravidianGopuram(assets, primaryHex, colorfulBands = false) {
  const high = new THREE.Group();
  const base = assets.get("granite");
  const gold = assets.get("templeGold");

  // Sculpted Grand Temple Gateway Base with Open Sacred Portal
  addMesh(high, createCuspedArchWall(13.6, 6.6, 7.6, 1, 4.6, 5.2), base, 0, 0, 0);
  // Continuous Curved Concave Sculpted Gopuram Tower Body!
  addMesh(high, createDravidianGopuramBody(12.6, 6.8, 13.6), assets.colorMat(primaryHex, { roughness: 0.62 }), 0, 6.6, 0);

  if (colorfulBands) {
    // Sculpted colorful cornice bands wrapping Meenakshi Amman's gopuram tiers
    const bandCols = [0xf59e0b, 0x0ea5e9, 0x10b981, 0x9333ea, 0xfacc15];
    bandCols.forEach((col, i) => {
      const t = (i + 1) / 6;
      const w = 12.6 * (1 - t * 0.56);
      const d = 6.8 * (1 - t * 0.56);
      addMesh(high, createBeveledSlab(w, 0.45, d, 0.14), assets.colorMat(col, { roughness: 0.58 }), 0, 7.0 + i * 2.4, 0);
    });
  }

  // Barrel-Vaulted Shala Roof + Row of Sculpted Golden Kalashams
  addMesh(high, new THREE.CapsuleGeometry(1.35, 3.4, 12, 20), gold, 0, 20.6, 0, 0, 0, Math.PI / 2);
  for (let k = -1.5; k <= 1.5; k += 1.0) {
    addMesh(high, createOnionDome(0.32, 1.05, 16), gold, k, 21.8, 0);
  }
  return wrapInLOD(high, assets.colorMat(primaryHex), 13, 22, 108);
}

// ============================================================================
// SHARED SCULPTED DESI STREET DETAILS (Chai Tapri, Pol Home, Rounded Truck, Organic Trees)
// ============================================================================
export function buildSharedDesiProps(root, hub, assets, colliders) {
  const wood = assets.get("teakWood");
  const brass = assets.get("templeGold");

  // 1. Chai Tapri / Regional Street Food Stall (Turned Pillars + Curved Awning + Brass Kettle)
  if (hub.foodStall) {
    const fs = hub.foodStall;
    const stall = new THREE.Group();
    stall.position.set(fs.x, 0, fs.z);
    addMesh(stall, createBeveledSlab(4.2, 1.2, 2.2, 0.12), wood, 0, 0.6, 0);
    const pGeo = createCarvedPillar(0.08, 2.8, 12);
    for (const px of [-1.85, 1.85]) {
      for (const pz of [-0.92, 0.92]) {
        addMesh(stall, pGeo, wood, px, 0.35, pz);
      }
    }
    addMesh(stall, createBeveledSlab(4.8, 0.2, 2.9, 0.06), assets.get("saffronCloth"), 0, 3.2, 0, 0.12, 0, 0);
    addMesh(stall, createTerracottaMatka(0.32), brass, -0.8, 1.2, 0.1);
    addMesh(stall, new THREE.CylinderGeometry(0.55, 0.55, 0.14, 20), assets.get("marigold"), 0.7, 1.3, 0.1);
    root.add(stall);
    colliders.push({ minX: fs.x - 2.3, maxX: fs.x + 2.3, minZ: fs.z - 1.4, maxZ: fs.z + 1.4 });
  }

  // 2. Friendly Pol Home with Arched Entryway, Woven Mat & Curved Terracotta Roof Matkas
  if (hub.friendlyHome) {
    const fh = hub.friendlyHome;
    const home = new THREE.Group();
    home.position.set(fh.x, 0, fh.z);
    addMesh(home, createBeveledSlab(8.2, 5.2, 6.6, 0.2), assets.get("whitewash"), 0, 2.6, 0);
    addMesh(home, createCuspedArchWall(3.2, 3.4, 0.45, 1, 1.8, 2.7), wood, 0, 0, 3.32);
    addMesh(home, createBeveledSlab(2.2, 0.08, 1.3, 0.03), assets.get("crimsonCloth"), 0, 0.05, 4.15, 0, 0, 0, false);
    // Authentic Sculpted Clay Water Matkas resting on roof!
    addMesh(home, createTerracottaMatka(0.42), assets.get("terracotta"), -2.4, 5.2, 1.2);
    addMesh(home, createTerracottaMatka(0.36), assets.get("terracotta"), -1.45, 5.2, 1.4);
    root.add(home);
    colliders.push({ minX: fh.x - 4.2, maxX: fh.x + 4.2, minZ: fh.z - 3.5, maxZ: fh.z + 3.5 });
  }

  // 3. Sculpted Rounded-Cab "Horn OK Please" Painted Indian Highway Truck!
  const truck = new THREE.Group();
  truck.position.set(-14, 0, 44);
  truck.rotation.y = Math.PI * 0.48;
  addMesh(truck, createBeveledSlab(2.7, 2.35, 2.45, 0.34), assets.colorMat(0xf59e0b, { clearcoat: 0.65 }), 0, 1.88, 2.45);
  addMesh(truck, createBeveledSlab(2.92, 3.1, 5.45, 0.28), assets.colorMat(0xd97706, { clearcoat: 0.5 }), 0, 2.38, -1.6);
  addMesh(truck, createBeveledSlab(2.98, 0.55, 5.5, 0.08), assets.colorMat(0xbe123c), 0, 1.38, -1.6);
  addMesh(truck, createBeveledSlab(2.98, 0.45, 5.5, 0.08), assets.colorMat(0x0ea5e9), 0, 3.48, -1.6);
  const wGeo = new THREE.TorusGeometry(0.48, 0.22, 12, 22);
  wGeo.rotateY(Math.PI / 2);
  for (const wx of [-1.42, 1.42]) {
    for (const wz of [-3.2, 0.2, 2.6]) {
      addMesh(truck, wGeo, assets.get("tireBlack"), wx, 0.68, wz);
    }
  }
  root.add(truck);

  // 4. Sculpted Pan-India Highway Ceremonial Archway Gate (z=56)
  const gate = new THREE.Group();
  gate.position.set(0, 0, 56);
  addMesh(gate, createCuspedArchWall(18.6, 8.2, 2.2, 1, 12.6, 6.4), assets.get("sandstone"), 0, 0, 0);
  buildChhatri(gate, assets, -7.2, 8.2, 0, 0.72, "sandstone", "templeGold");
  buildChhatri(gate, assets,  7.2, 8.2, 0, 0.72, "sandstone", "templeGold");
  root.add(gate);

  // 5. InstancedMesh Beveled Bazaar Stalls & Organic Curved-Trunk Lush Indian Trees!
  const stallCoords = [];
  const treeCoords = [];
  const waterArea = hub.waterArea;
  const inWater = (x, z) =>
    waterArea &&
    Math.abs(x - waterArea.x) < waterArea.w * 0.54 &&
    Math.abs(z - waterArea.z) < waterArea.d * 0.54;

  for (const [sx, sz] of [[-16, 16], [-16, 24], [14, 30], [22, 34], [-22, 36], [36, 16], [36, 26], [-36, 26]]) {
    if (!inWater(sx, sz)) stallCoords.push([sx, sz]);
  }

  if (stallCoords.length > 0) {
    const baseInst = new THREE.InstancedMesh(createBeveledSlab(3.2, 1.1, 2.0, 0.1), wood, stallCoords.length);
    const topInst = new THREE.InstancedMesh(createBeveledSlab(3.6, 0.22, 2.4, 0.06), assets.get("tealCloth"), stallCoords.length);
    const dummy = new THREE.Object3D();
    stallCoords.forEach(([x, z], i) => {
      dummy.position.set(x, 0.55, z);
      dummy.updateMatrix();
      baseInst.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 2.65, z);
      dummy.updateMatrix();
      topInst.setMatrixAt(i, dummy.matrix);
    });
    baseInst.instanceMatrix.needsUpdate = true;
    topInst.instanceMatrix.needsUpdate = true;
    root.add(baseInst, topInst);
  }

  // Ring of 42 Organic Curved-Trunk Trees with Sculpted Billowing Foliage Canopies!
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2;
    const rad = 44 + (i % 4) * 9;
    const tx = Math.cos(a) * rad;
    const tz = Math.sin(a) * rad;
    if (Math.abs(tx) < 10 && tz > 38) continue;
    if (inWater(tx, tz)) continue;
    treeCoords.push([tx, tz, 0.85 + (i % 3) * 0.25, a]);
  }
  if (treeCoords.length > 0) {
    const isCoastal = hub.id === "kochi" || hub.id === "udaipur";
    const trunkGeo = createCurvedTreeTrunk(isCoastal ? 7.6 : 4.5, 0.42, 0.18);
    const leafGeo = createOrganicTreeCanopy(isCoastal ? 3.2 : 2.9, isCoastal ? 13 : 7);
    const trunkInst = new THREE.InstancedMesh(trunkGeo, wood, treeCoords.length);
    const leafInst = new THREE.InstancedMesh(leafGeo, assets.get(isCoastal ? "foliageBright" : "foliageDark"), treeCoords.length);
    const dummy = new THREE.Object3D();
    treeCoords.forEach(([x, z, sc, rot], i) => {
      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, rot, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, (isCoastal ? 7.4 : 4.8) * sc, z);
      dummy.scale.set(sc, isCoastal ? sc * 0.55 : sc, sc);
      dummy.updateMatrix();
      leafInst.setMatrixAt(i, dummy.matrix);
    });
    trunkInst.instanceMatrix.needsUpdate = true;
    leafInst.instanceMatrix.needsUpdate = true;
    root.add(trunkInst, leafInst);
  }
}
