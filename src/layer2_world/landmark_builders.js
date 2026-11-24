/* ============================================================================
   Layer 2 — Streaming & World: Handcrafted 3D Indian Landmark & Prop Builders
   - Uses THREE.LOD for major temples, forts & palaces
   - Uses THREE.InstancedMesh for jharokha lattices, bazaar stalls, festival
     diyas, Mysore Palace illumination bulbs, marigold garlands & trees
   - Returns collision AABBs + animated festival/light references per hub
   ============================================================================ */

import * as THREE from "three";

// Helper to add a box/cylinder/cone mesh with shadow config
function addMesh(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Wrap high-detail group + low-detail silhouette inside a THREE.LOD
function wrapInLOD(highGroup, lowColorMat, boxW, boxH, boxD, lowDist = 88) {
  const lod = new THREE.LOD();
  lod.addLevel(highGroup, 0);
  const lowMesh = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), lowColorMat);
  lowMesh.position.y = boxH * 0.5;
  lod.addLevel(lowMesh, lowDist);
  return lod;
}

// Shared Rajput Chhatri cupola helper
function buildChhatri(parent, assets, x, y, z, scale = 1, stoneKey = "sandstone", domeKey = "marble") {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);
  const stone = assets.get(stoneKey);
  const dome = assets.get(domeKey);
  const gold = assets.get("templeGold");

  addMesh(g, new THREE.BoxGeometry(2.4, 0.35, 2.4), stone, 0, 0.18, 0);
  const pGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8);
  for (const px of [-0.9, 0.9]) {
    for (const pz of [-0.9, 0.9]) {
      addMesh(g, pGeo, stone, px, 1.4, pz);
    }
  }
  addMesh(g, new THREE.BoxGeometry(2.7, 0.25, 2.7), stone, 0, 2.55, 0);
  addMesh(g, new THREE.SphereGeometry(1.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), dome, 0, 2.65, 0);
  addMesh(g, new THREE.ConeGeometry(0.18, 0.75, 8), gold, 0, 4.05, 0);
  parent.add(g);
  return g;
}

// Shared Nagara Shikhara Hindu Temple (with hanging brass bell!)
function buildNagaraTemple(assets, stoneKey = "sandstone", goldCap = true) {
  const high = new THREE.Group();
  const stone = assets.get(stoneKey);
  const ochre = assets.get("carvedOchre");
  const gold = assets.get("templeGold");
  const marigold = assets.get("marigold");

  // Raised jagati stone plinth + front steps
  addMesh(high, new THREE.BoxGeometry(12, 1.4, 13), ochre, 0, 0.7, 0);
  for (let s = 0; s < 3; s++) {
    addMesh(high, new THREE.BoxGeometry(4.6, 0.45, 1.1), stone, 0, 0.22 + s * 0.42, 7.6 - s * 0.95);
  }

  // Open pillared Mandapa porch (walkable!)
  const pGeo = new THREE.CylinderGeometry(0.32, 0.36, 4.6, 10);
  for (const px of [-4.2, -1.8, 1.8, 4.2]) {
    addMesh(high, pGeo, stone, px, 3.7, 5.2);
  }
  addMesh(high, new THREE.BoxGeometry(10.5, 0.65, 5.4), stone, 0, 6.2, 3.6);
  addMesh(high, new THREE.ConeGeometry(4.2, 3.4, 4), ochre, 0, 8.2, 3.6, 0, Math.PI / 4, 0);

  // Hanging Brass Temple Bell (Ghanta) at Mandapa Entrance
  addMesh(high, new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), gold, 0, 5.1, 5.2);
  const bell = addMesh(high, new THREE.ConeGeometry(0.42, 0.68, 12), gold, 0, 4.15, 5.2);
  bell.name = "templeBell";

  // Marigold Toran Garland across temple doorway
  for (let i = -3; i <= 3; i++) {
    const droop = Math.cos((i / 3) * Math.PI * 0.5) * 0.38;
    addMesh(high, new THREE.SphereGeometry(0.22, 8, 8), marigold, i * 0.55, 5.65 - droop, 5.85, 0, 0, 0, false);
  }

  // Garbhagriha Sanctum + Tiered Soaring Shikhara Spire
  addMesh(high, new THREE.BoxGeometry(8.2, 5.6, 7.2), stone, 0, 4.2, -2.4);
  for (let tier = 0; tier < 5; tier++) {
    const w = 7.4 - tier * 1.15;
    const h = 2.1;
    addMesh(high, new THREE.BoxGeometry(w, h, w * 0.92), tier % 2 === 0 ? ochre : stone, 0, 7.6 + tier * 1.9, -2.4);
  }
  // Amalaka fluted disc + Golden Kalash + Saffron Temple Flag (Dhwaja)
  addMesh(high, new THREE.CylinderGeometry(1.4, 1.4, 0.65, 16), goldCap ? gold : ochre, 0, 16.5, -2.4);
  addMesh(high, new THREE.ConeGeometry(0.65, 1.9, 10), gold, 0, 17.7, -2.4);
  addMesh(high, new THREE.CylinderGeometry(0.06, 0.06, 3.6, 6), gold, 0.3, 19.6, -2.4);
  const flag = addMesh(high, new THREE.PlaneGeometry(2.1, 1.1), assets.get("saffronCloth"), 1.35, 20.6, -2.4, 0, 0, 0, false);
  flag.name = "clothFlag";

  return wrapInLOD(high, stone, 12, 18, 13, 95);
}

// ============================================================================
// INDIVIDUAL CITY LANDMARK BUILDERS
// ============================================================================

export function buildRatanpurHub(root, assets, colliders, animRefs, state) {
  const restored = !!state?.haveliRestored;
  const sand = assets.get("sandstone");
  const ochre = assets.get("carvedOchre");
  const marble = assets.get("marble");
  const wood = assets.get("teakWood");
  const gold = assets.get("templeGold");

  // 1. Professor Vikram's Ancestral Restorable Haveli (center x=0, z=-2)
  const haveli = new THREE.Group();
  haveli.position.set(0, 0, -2);

  // Courtyard floor (Rangoli blooms vividly once restored!)
  addMesh(
    haveli,
    new THREE.BoxGeometry(16, 0.25, 14),
    restored ? assets.get("rangoliFloor") : assets.get("cobblestone"),
    0, 0.12, 0, 0, 0, 0, false
  );

  // Back wing + Left & Right wings forming open heritage courtyard
  addMesh(haveli, new THREE.BoxGeometry(18, 9.5, 4.5), sand, 0, 4.75, -8.5);
  addMesh(haveli, new THREE.BoxGeometry(3.8, 8.2, 14), sand, -8.2, 4.1, -0.5);
  addMesh(haveli, new THREE.BoxGeometry(3.8, 8.2, 14), sand,  8.2, 4.1, -0.5);
  // Front gateway pillars & carved wooden lintel (open walkthrough entrance!)
  addMesh(haveli, new THREE.BoxGeometry(5.6, 5.6, 1.8), ochre, -6.2, 2.8, 7.2);
  addMesh(haveli, new THREE.BoxGeometry(5.6, 5.6, 1.8), ochre,  6.2, 2.8, 7.2);
  addMesh(haveli, new THREE.BoxGeometry(18, 1.4, 2.1), wood, 0, 6.2, 7.2);

  // Protruding Jharokha Balconies overlooking courtyard
  for (const bx of [-4.2, 0, 4.2]) {
    addMesh(haveli, new THREE.BoxGeometry(2.6, 0.4, 1.6), ochre, bx, 4.8, -5.8);
    addMesh(haveli, new THREE.BoxGeometry(2.2, 1.8, 0.25), wood, bx, 5.8, -6.2);
  }
  buildChhatri(haveli, assets, -6.5, 9.5, -8.2, 0.85);
  buildChhatri(haveli, assets,  6.5, 9.5, -8.2, 0.85);

  if (restored) {
    // Restored Lotus Courtyard Fountain + Glowing Brass Diyas + Marigold Garlands!
    addMesh(haveli, new THREE.CylinderGeometry(2.4, 2.6, 0.65, 16), marble, 0, 0.45, -1);
    addMesh(haveli, new THREE.CylinderGeometry(2.0, 2.0, 0.12, 16), assets.colorMat(0x28a5bd, { roughness: 0.15 }), 0, 0.78, -1, 0, 0, 0, false);
    addMesh(haveli, new THREE.ConeGeometry(0.45, 0.9, 10), gold, 0, 1.25, -1);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const diya = addMesh(haveli, new THREE.SphereGeometry(0.18, 8, 8), assets.get("diyaGlow"), Math.cos(a) * 2.3, 0.9, -1 + Math.sin(a) * 2.3, 0, 0, 0, false);
      animRefs.festivalLights.push(diya);
    }
    for (let gx = -5; gx <= 5; gx++) {
      addMesh(haveli, new THREE.SphereGeometry(0.24, 8, 8), assets.get("marigold"), gx * 0.65, 5.3 - Math.cos(gx * 0.28) * 0.4, 8.25, 0, 0, 0, false);
    }
  } else {
    // Unrestored dusty crates & glowing restoration marker
    addMesh(haveli, new THREE.BoxGeometry(1.8, 1.2, 1.8), wood, -2.5, 0.7, -2);
    addMesh(haveli, new THREE.BoxGeometry(1.4, 1.0, 1.4), ochre, 2.4, 0.6, -1.5);
  }
  root.add(haveli);
  colliders.push(
    { minX: -9.5, maxX: 9.5, minZ: -12.8, maxZ: -8.0 },
    { minX: -10.2, maxX: -6.2, minZ: -9.5, maxZ: 5.5 },
    { minX: 6.2, maxX: 10.2, minZ: -9.5, maxZ: 5.5 }
  );

  // 2. Shri Ganesh Mandir (x=-28, z=-18) with THREE.LOD
  const temple = buildNagaraTemple(assets, "sandstone", true);
  temple.position.set(-28, 0, -18);
  temple.rotation.y = Math.PI * 0.2;
  root.add(temple);
  colliders.push({ minX: -34, maxX: -22, minZ: -25, maxZ: -14 });

  // 3. Chandni Bazaar Archway & Gully Cricket Wickets (x=26, z=-14)
  const bazaar = new THREE.Group();
  bazaar.position.set(26, 0, -14);
  addMesh(bazaar, new THREE.BoxGeometry(14, 7.5, 5), assets.get("jaipurPink"), 0, 3.75, -7);
  addMesh(bazaar, new THREE.BoxGeometry(1.4, 4.8, 1.4), sand, -4.5, 2.4, 4);
  addMesh(bazaar, new THREE.BoxGeometry(1.4, 4.8, 1.4), sand,  4.5, 2.4, 4);
  addMesh(bazaar, new THREE.BoxGeometry(11, 1.2, 1.8), ochre, 0, 5.2, 4);
  // Gully Cricket wooden stumps!
  for (const sx of [-0.28, 0, 0.28]) {
    addMesh(bazaar, new THREE.CylinderGeometry(0.04, 0.04, 1.15, 6), wood, sx, 0.58, 0);
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

  // 1. HAWA MAHAL (x=0, z=-22) with InstancedMesh Jharokha Honeycomb Lattice!
  const hawa = new THREE.Group();
  hawa.position.set(0, 0, -22);

  // 5 Stepped Pyramidal Terracotta-Pink Stories
  const stories = [
    { w: 22, h: 3.4, y: 1.7 },
    { w: 19.5, h: 3.2, y: 5.0 },
    { w: 16.5, h: 3.1, y: 8.15 },
    { w: 13.0, h: 2.9, y: 11.15 },
    { w: 8.5, h: 2.6, y: 13.9 }
  ];
  for (const st of stories) {
    addMesh(hawa, new THREE.BoxGeometry(st.w, st.h, 5.2), pink, 0, st.y, 0);
    addMesh(hawa, new THREE.BoxGeometry(st.w + 0.5, 0.28, 5.6), marble, 0, st.y + st.h * 0.5, 0);
  }
  buildChhatri(hawa, assets, 0, 15.2, 0, 1.0, "jaipurPink", "templeGold");
  buildChhatri(hawa, assets, -5.5, 12.6, 0, 0.72, "jaipurPink", "marble");
  buildChhatri(hawa, assets,  5.5, 12.6, 0, 0.72, "jaipurPink", "marble");

  // InstancedMesh for iconic Jharokha Honeycomb Windows!
  const jharokhaCoords = [];
  stories.forEach((st, idx) => {
    const count = Math.max(3, Math.floor(st.w / 1.85));
    for (let i = 0; i < count; i++) {
      const x = -st.w * 0.44 + (i / Math.max(1, count - 1)) * (st.w * 0.88);
      jharokhaCoords.push({ x, y: st.y, z: 2.85, idx });
    }
  });
  const jGeo = new THREE.BoxGeometry(1.15, 1.9, 0.75);
  const jInst = new THREE.InstancedMesh(jGeo, marble, jharokhaCoords.length);
  const dummy = new THREE.Object3D();
  jharokhaCoords.forEach((c, i) => {
    dummy.position.set(c.x, c.y, c.z);
    dummy.updateMatrix();
    jInst.setMatrixAt(i, dummy.matrix);
  });
  jInst.instanceMatrix.needsUpdate = true;
  hawa.add(jInst);

  // Glowing Diwali festival diya line across Hawa Mahal ledges!
  for (let i = -9; i <= 9; i += 2) {
    const d = addMesh(hawa, new THREE.SphereGeometry(0.18, 6, 6), assets.get("diyaGlow"), i, 3.55, 3.0, 0, 0, 0, false);
    animRefs.festivalLights.push(d);
  }

  root.add(wrapInLOD(hawa, pink, 22, 18, 6, 105));
  colliders.push({ minX: -11.5, maxX: 11.5, minZ: -25.5, maxZ: -18.5 });

  // 2. JANTAR MANTAR — Giant Samrat Yantra Sundial (x=34, z=-12)
  const jantar = new THREE.Group();
  jantar.position.set(34, 0, -12);
  addMesh(jantar, new THREE.BoxGeometry(18, 0.4, 16), marble, 0, 0.2, 0, 0, 0, 0, false);
  // Triangular Gnomon Staircase Ramp (angled ~27 deg Jaipur latitude!)
  const ramp = addMesh(jantar, new THREE.BoxGeometry(2.4, 0.9, 13.5), sand, 0, 4.2, 0, -0.48, 0, 0);
  ramp.castShadow = true;
  addMesh(jantar, new THREE.BoxGeometry(2.6, 7.6, 2.2), sand, 0, 3.8, -5.8);
  // Twin Marble Astronomical Quadrant Arcs
  const arcGeo = new THREE.TorusGeometry(5.6, 0.48, 10, 24, Math.PI * 0.65);
  addMesh(jantar, arcGeo, marble, -5.0, 3.2, -1.2, 0, Math.PI * 0.5, -Math.PI * 0.65);
  addMesh(jantar, arcGeo, marble,  5.0, 3.2, -1.2, 0, Math.PI * 0.5, -Math.PI * 0.65);
  buildChhatri(jantar, assets, 0, 7.6, -5.8, 0.65, "marble", "templeGold");
  root.add(jantar);
  colliders.push({ minX: 31.5, maxX: 36.5, minZ: -19.5, maxZ: -5.5 });

  // 3. AMBER FORT & SHEESH MAHAL (Hilltop Bastion x=-36, z=-30)
  const amber = new THREE.Group();
  amber.position.set(-36, 0, -30);
  // Hilltop rocky rampart plinth
  addMesh(amber, new THREE.CylinderGeometry(16, 20, 6.5, 10), assets.get("granite"), 0, 3.25, 0);
  addMesh(amber, new THREE.BoxGeometry(22, 9.5, 16), sand, 0, 11.2, 0);
  // Corner fortress bastions
  for (const bx of [-11, 11]) {
    for (const bz of [-8, 8]) {
      addMesh(amber, new THREE.CylinderGeometry(2.5, 2.8, 11.5, 12), sand, bx, 12.0, bz);
      buildChhatri(amber, assets, bx, 17.7, bz, 0.75);
    }
  }
  // Sheesh Mahal (Glittering Hall of Mirrors facade!)
  addMesh(amber, new THREE.BoxGeometry(10, 4.5, 1.2), mirror, 0, 9.2, 8.2);
  addMesh(amber, new THREE.BoxGeometry(11, 0.5, 1.8), gold, 0, 11.6, 8.3);
  root.add(wrapInLOD(amber, sand, 28, 22, 24, 115));
  colliders.push({ minX: -52, maxX: -20, minZ: -44, maxZ: -16 });

  // 4. JAIPUR CITY PALACE ARCHIVE (Chandra Mahal, x=32, z=24)
  const cpal = new THREE.Group();
  cpal.position.set(32, 0, 24);
  addMesh(cpal, new THREE.BoxGeometry(15, 12, 12), pink, 0, 6, 0);
  addMesh(cpal, new THREE.BoxGeometry(12, 4, 9), marble, 0, 14, 0);
  buildChhatri(cpal, assets, 0, 16, 0, 1.0, "marble", "templeGold");
  root.add(cpal);
  colliders.push({ minX: 24, maxX: 40, minZ: 17.5, maxZ: 30.5 });

  // 5. JAL MAHAL floating in Man Sagar Lake (x=-46, z=34)
  const jal = new THREE.Group();
  jal.position.set(-46, 0, 34);
  addMesh(jal, new THREE.BoxGeometry(12, 5.2, 12), sand, 0, 2.2, 0);
  buildChhatri(jal, assets, -4.5, 4.8, -4.5, 0.72);
  buildChhatri(jal, assets,  4.5, 4.8, -4.5, 0.72);
  buildChhatri(jal, assets, -4.5, 4.8,  4.5, 0.72);
  buildChhatri(jal, assets,  4.5, 4.8,  4.5, 0.72);
  buildChhatri(jal, assets,  0, 5.0, 0, 0.95, "sandstone", "templeGold");
  root.add(jal);

  // 6. PATRIKA GATE (Nine colorful rainbow arches at x=-2, z=48)
  const patrika = new THREE.Group();
  patrika.position.set(-2, 0, 48);
  const archCols = [0xe85d04, 0xd946ef, 0x0ea5e9, 0x10b981, 0xf59e0b];
  for (let i = -2; i <= 2; i++) {
    addMesh(patrika, new THREE.BoxGeometry(1.1, 6.5, 2.6), assets.colorMat(archCols[i + 2]), i * 4.2, 3.25, 0);
  }
  addMesh(patrika, new THREE.BoxGeometry(20, 1.8, 3.0), pink, 0, 7.2, 0);
  buildChhatri(patrika, assets, -6, 8.1, 0, 0.68, "jaipurPink", "marble");
  buildChhatri(patrika, assets,  0, 8.1, 0, 0.85, "jaipurPink", "templeGold");
  buildChhatri(patrika, assets,  6, 8.1, 0, 0.68, "jaipurPink", "marble");
  root.add(patrika);
}

export function buildUdaipurHub(root, assets, colliders, animRefs) {
  const marble = assets.get("marble");
  const sand = assets.get("sandstone");
  const gold = assets.get("templeGold");

  // 1. UDAIPUR CITY PALACE overlooking Lake Pichola (x=42, z=-6)
  const palace = new THREE.Group();
  palace.position.set(42, 0, -6);
  addMesh(palace, new THREE.BoxGeometry(18, 11, 32), sand, 0, 5.5, 0);
  addMesh(palace, new THREE.BoxGeometry(15, 7, 26), marble, 0.5, 14.5, 0);
  addMesh(palace, new THREE.BoxGeometry(11, 4.5, 14), marble, 1, 20.2, 0);
  // Iconic Gold Domes & Marble Jharokhas facing Lake Pichola (-X)
  buildChhatri(palace, assets, 1, 22.5, 0, 1.55, "marble", "templeGold");
  buildChhatri(palace, assets, -1, 18.0, -10.5, 1.05, "marble", "templeGold");
  buildChhatri(palace, assets, -1, 18.0,  10.5, 1.05, "marble", "templeGold");
  for (let gz = -12; gz <= 12; gz += 4) {
    addMesh(palace, new THREE.BoxGeometry(1.5, 2.2, 2.2), marble, -9.4, 8.5, gz);
    const l = addMesh(palace, new THREE.SphereGeometry(0.24, 6, 6), assets.get("diyaGlow"), -10.1, 9.2, gz, 0, 0, 0, false);
    animRefs.festivalLights.push(l);
  }
  root.add(wrapInLOD(palace, marble, 18, 25, 32, 115));
  colliders.push({ minX: 32, maxX: 52, minZ: -23, maxZ: 11 });

  // 2. JAG MANDIR ISLAND PALACE inside Lake Pichola (x=-26, z=-18)
  const jag = new THREE.Group();
  jag.position.set(-26, 0, -18);
  addMesh(jag, new THREE.CylinderGeometry(11.5, 12.5, 2.2, 12), sand, 0, 0.2, 0);
  addMesh(jag, new THREE.BoxGeometry(9.5, 5.2, 9.5), marble, 0, 3.8, 0);
  buildChhatri(jag, assets, 0, 6.4, 0, 1.4, "sandstone", "templeGold");
  buildChhatri(jag, assets, -7.2, 1.3, 0, 0.78, "marble", "marble");
  buildChhatri(jag, assets,  7.2, 1.3, 0, 0.78, "marble", "marble");
  root.add(jag);

  // 3. TAJ LAKE PALACE (Jag Niwas) floating in Lake Pichola (x=-22, z=24)
  const lakePal = new THREE.Group();
  lakePal.position.set(-22, 0, 24);
  addMesh(lakePal, new THREE.BoxGeometry(14, 1.8, 12), marble, 0, 0.3, 0);
  addMesh(lakePal, new THREE.BoxGeometry(12, 5.6, 10), marble, 0, 3.8, 0);
  buildChhatri(lakePal, assets, -4.2, 6.6, -3.5, 0.75, "marble", "marble");
  buildChhatri(lakePal, assets,  4.2, 6.6,  3.5, 0.75, "marble", "marble");
  buildChhatri(lakePal, assets, 0, 6.6, 0, 1.05, "marble", "templeGold");
  root.add(lakePal);

  // 4. JAGDISH TEMPLE (x=34, z=-34)
  const jagdish = buildNagaraTemple(assets, "marble", true);
  jagdish.position.set(34, 0, -34);
  root.add(jagdish);
  colliders.push({ minX: 28, maxX: 40, minZ: -41, maxZ: -28 });

  // 5. SAHELIYON-KI-BARI Lotus Pool Garden (x=38, z=36)
  const garden = new THREE.Group();
  garden.position.set(38, 0, 36);
  addMesh(garden, new THREE.BoxGeometry(16, 0.3, 16), assets.get("grassGarden"), 0, 0.15, 0, 0, 0, 0, false);
  addMesh(garden, new THREE.CylinderGeometry(4.8, 5.0, 0.7, 16), marble, 0, 0.45, 0);
  addMesh(garden, new THREE.CylinderGeometry(4.3, 4.3, 0.15, 16), assets.colorMat(0x22a6b3, { roughness: 0.1 }), 0, 0.82, 0, 0, 0, 0, false);
  buildChhatri(garden, assets, 0, 0.85, 0, 0.9, "marble", "marble");
  root.add(garden);

  // 6. SAJJANGARH (MONSOON PALACE) atop Aravalli Hills West of Lake Pichola (x=-74, z=-4)
  const hill = new THREE.Group();
  hill.position.set(-74, 0, -4);
  addMesh(hill, new THREE.ConeGeometry(28, 22, 9), assets.get("granite"), 0, 10, 0);
  addMesh(hill, new THREE.BoxGeometry(14, 6.5, 10), marble, 0, 21.5, 0);
  buildChhatri(hill, assets, 0, 24.8, 0, 1.15, "marble", "templeGold");
  root.add(hill);

  // Stepped Gangaur Ghat edge along East shore (x=19, z=-28..28)
  for (let s = 0; s < 3; s++) {
    addMesh(root, new THREE.BoxGeometry(1.4, 0.45, 58), marble, 20.5 - s * 1.2, -0.15 - s * 0.35, 0, 0, 0, 0, false);
  }
}

export function buildAhmedabadHub(root, assets, colliders) {
  const ochre = assets.get("carvedOchre");
  const sand = assets.get("sandstone");
  const marble = assets.get("marble");
  const white = assets.get("whitewash");
  const wood = assets.get("teakWood");

  // 1. ADALAJ STEPWELL (Vav) — Five-Tiered Carved Octagonal Stepwell (x=0, z=-18)
  const vav = new THREE.Group();
  vav.position.set(0, 0, -18);
  // Perimeter carved stone pavilion walls + tiered inner gallery ledges
  addMesh(vav, new THREE.BoxGeometry(18, 1.2, 22), sand, 0, 0.6, 0);
  for (let tier = 0; tier < 4; tier++) {
    const inset = tier * 1.4;
    const y = 1.6 + tier * 1.3;
    // Left & right carved colonnades framing the central stepped descent
    addMesh(vav, new THREE.BoxGeometry(2.6, 1.1, 18 - inset), ochre, -7.2 + inset * 0.4, y, 0);
    addMesh(vav, new THREE.BoxGeometry(2.6, 1.1, 18 - inset), ochre,  7.2 - inset * 0.4, y, 0);
  }
  // Central octagonal stepwell water-shaft beacon + stone steps
  addMesh(vav, new THREE.CylinderGeometry(3.8, 3.8, 0.35, 8), assets.colorMat(0x16697a, { roughness: 0.15 }), 0, 1.28, -4);
  for (let st = 0; st < 7; st++) {
    addMesh(vav, new THREE.BoxGeometry(5.8, 0.35, 1.2), ochre, 0, 1.25 - st * 0.12, 9.5 - st * 1.4);
  }
  buildChhatri(vav, assets, -6.5, 6.4, -7.5, 0.72, "carvedOchre", "sandstone");
  buildChhatri(vav, assets,  6.5, 6.4, -7.5, 0.72, "carvedOchre", "sandstone");
  root.add(vav);
  colliders.push({ minX: -9.5, maxX: -5.0, minZ: -29, maxZ: -8 }, { minX: 5.0, maxX: 9.5, minZ: -29, maxZ: -8 });

  // 2. SIDI SAIYYED MOSQUE — Famous Tree-of-Life Carved Stone Jali (x=-32, z=6)
  const sidi = new THREE.Group();
  sidi.position.set(-32, 0, 6);
  addMesh(sidi, new THREE.BoxGeometry(14, 7.5, 10), sand, 0, 3.75, 0);
  // Iconic Semicircular Stone Lattice Jali Window with Tree Branches!
  addMesh(sidi, new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16, 1, false, 0, Math.PI), ochre, 0, 4.2, 5.1, Math.PI / 2, 0, 0);
  for (let b = -3; b <= 3; b++) {
    addMesh(sidi, new THREE.BoxGeometry(0.14, 2.4, 0.65), assets.get("templeGold"), b * 0.45, 4.6, 5.2, 0, 0, b * 0.22);
  }
  for (const dx of [-4, 0, 4]) {
    addMesh(sidi, new THREE.SphereGeometry(1.9, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), marble, dx, 7.4, 0);
  }
  root.add(sidi);
  colliders.push({ minX: -39.5, maxX: -24.5, minZ: 0.5, maxZ: 11.5 });

  // 3. SABARMATI ASHRAM (Serene whitewashed Gandhi courtyard x=34, z=-8)
  const ashram = new THREE.Group();
  ashram.position.set(34, 0, -8);
  addMesh(ashram, new THREE.BoxGeometry(14, 4.2, 9), white, 0, 2.1, -3);
  addMesh(ashram, new THREE.ConeGeometry(10.5, 2.6, 4), assets.get("terracotta"), 0, 5.5, -3, 0, Math.PI / 4, 0);
  // Wooden Charkha spinning-wheel sculpture in courtyard
  addMesh(ashram, new THREE.TorusGeometry(0.95, 0.12, 8, 16), wood, 0, 1.3, 4.5);
  addMesh(ashram, new THREE.BoxGeometry(2.4, 0.25, 0.8), wood, 0, 0.2, 4.5);
  root.add(ashram);
  colliders.push({ minX: 26.5, maxX: 41.5, minZ: -16, maxZ: -6 });
}

export function buildVaranasiHub(root, assets, colliders, animRefs) {
  const sand = assets.get("sandstone");
  const ochre = assets.get("carvedOchre");
  const gold = assets.get("templeGold");

  // 1. DASHASHWAMEDH & ASSI GHATS (Stepped stone ghats descending east into Ma Ganga!)
  for (let s = 0; s < 5; s++) {
    addMesh(root, new THREE.BoxGeometry(2.4, 0.5, 110), s % 2 === 0 ? sand : ochre, 8 - s * 2.1, 1.2 - s * 0.35, 0, 0, 0, 0, false);
  }

  // Seven Ceremonial Ganga Aarti Fire Stands along Dashashwamedh Ghat (x=2, z=-12..12)
  for (let i = -3; i <= 3; i++) {
    const gz = i * 3.8;
    addMesh(root, new THREE.CylinderGeometry(0.18, 0.35, 1.8, 8), gold, 3.2, 1.6, gz);
    const flame = addMesh(root, new THREE.ConeGeometry(0.42, 1.15, 8), assets.get("aartiFlame"), 3.2, 3.05, gz, 0, 0, 0, false);
    animRefs.aartiFlames.push(flame);
    // Floating River Diyas drifting gently on the Ganges!
    const diya = addMesh(root, new THREE.SphereGeometry(0.24, 8, 8), assets.get("diyaGlow"), 16 + Math.abs(i) * 2.2, 0.12, gz * 1.4, 0, 0, 0, false);
    animRefs.floatingDiyas.push(diya);
  }
  // Iconic Striped Ghat Umbrellas
  for (const uz of [-18, -8, 8, 22, 34]) {
    addMesh(root, new THREE.CylinderGeometry(0.08, 0.08, 3.6, 6), assets.get("teakWood"), 4.5, 2.8, uz);
    addMesh(root, new THREE.ConeGeometry(2.4, 0.9, 10), uz % 16 === 0 ? assets.get("saffronCloth") : assets.get("crimsonCloth"), 4.5, 4.7, uz);
  }

  // 2. KASHI VISHWANATH GOLDEN SHIKHARA TEMPLE (x=-26, z=-12)
  const kashi = buildNagaraTemple(assets, "carvedOchre", true);
  kashi.position.set(-26, 0, -12);
  // Extra gleaming golden central dome cap
  addMesh(kashi, new THREE.ConeGeometry(3.2, 7.5, 8), gold, 0, 14.5, -2.4);
  root.add(kashi);
  colliders.push({ minX: -32, maxX: -20, minZ: -19, maxZ: -6 });

  // 3. SARNATH DHAMEK STUPA (Massive Cylindrical Sandstone Buddhist Stupa x=-36, z=-40)
  const stupa = new THREE.Group();
  stupa.position.set(-36, 0, -40);
  addMesh(stupa, new THREE.CylinderGeometry(8.5, 9.2, 6.5, 20), sand, 0, 3.25, 0);
  addMesh(stupa, new THREE.CylinderGeometry(7.2, 7.6, 6.2, 20), assets.get("terracotta"), 0, 9.5, 0);
  addMesh(stupa, new THREE.SphereGeometry(7.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), ochre, 0, 12.4, 0);
  root.add(stupa);
  colliders.push({ minX: -45, maxX: -27, minZ: -49, maxZ: -31 });
}

export function buildMPHub(hubId, root, assets, colliders, animRefs) {
  const sand = assets.get("sandstone");
  const ochre = assets.get("carvedOchre");
  const marble = assets.get("marble");
  const gold = assets.get("templeGold");

  if (hubId === "khajuraho") {
    // Kandariya Mahadeva Soaring Clustered Nagara Shikharas (x=0, z=-12)
    const main = buildNagaraTemple(assets, "sandstone", true);
    main.position.set(0, 0, -12);
    main.scale.setScalar(1.32);
    root.add(main);
    colliders.push({ minX: -9, maxX: 9, minZ: -21, maxZ: -5 });

    // Secondary Jain Parshvanatha Shrine (x=-32, z=-6)
    const jain = buildNagaraTemple(assets, "carvedOchre", false);
    jain.position.set(-32, 0, -6);
    jain.scale.setScalar(0.9);
    root.add(jain);
    colliders.push({ minX: -38, maxX: -26, minZ: -13, maxZ: 0 });

    // Light & Sound Show Architectural Colored Spotlights!
    const spotCols = [0xff8c1a, 0xd946ef, 0x38bdf8];
    spotCols.forEach((col, i) => {
      const orb = addMesh(root, new THREE.SphereGeometry(0.45, 8, 8), assets.colorMat(col, { emissive: col, emissiveIntensity: 2.2 }), -10 + i * 10, 0.8, 3, 0, 0, 0, false);
      animRefs.festivalLights.push(orb);
    });
  } else if (hubId === "orchha") {
    // Jahangir Mahal — Bundela Rajput Symmetric Palace with 8 Chhatris (x=24, z=-14)
    const jm = new THREE.Group();
    jm.position.set(24, 0, -14);
    addMesh(jm, new THREE.BoxGeometry(20, 11, 20), sand, 0, 5.5, 0);
    addMesh(jm, new THREE.BoxGeometry(16, 4.5, 16), ochre, 0, 13.2, 0);
    for (const cx of [-7.8, 0, 7.8]) {
      for (const cz of [-7.8, 7.8]) {
        buildChhatri(jm, assets, cx, 11.2, cz, 0.9, "sandstone", "marble");
      }
    }
    buildChhatri(jm, assets, 0, 15.5, 0, 1.3, "sandstone", "templeGold");
    root.add(wrapInLOD(jm, sand, 20, 20, 20, 105));
    colliders.push({ minX: 13.5, maxX: 34.5, minZ: -24.5, maxZ: -3.5 });

    // Ram Raja Temple (x=-2, z=-26)
    const ram = buildNagaraTemple(assets, "jaipurPink", true);
    ram.position.set(-2, 0, -26);
    root.add(ram);
    colliders.push({ minX: -8, maxX: 4, minZ: -33, maxZ: -20 });
  } else {
    // GWALIOR FORT & MAN MANDIR PALACE (Turquoise-Blue Tilework! x=0, z=-18)
    const fort = new THREE.Group();
    fort.position.set(0, 0, -18);
    const blueTile = assets.get("gwaliorBlue");
    addMesh(fort, new THREE.BoxGeometry(30, 11, 16), sand, 0, 5.5, 0);
    // Iconic Turquoise-Blue Ceramic Tilework Band Wrapping Man Mandir!
    addMesh(fort, new THREE.BoxGeometry(30.4, 3.8, 16.4), blueTile, 0, 8.2, 0);
    for (const bx of [-14, -7, 0, 7, 14]) {
      addMesh(fort, new THREE.CylinderGeometry(2.3, 2.5, 13, 12), sand, bx, 6.5, 8.2);
      addMesh(fort, new THREE.CylinderGeometry(2.42, 2.42, 2.8, 12), blueTile, bx, 9.5, 8.2);
      buildChhatri(fort, assets, bx, 13.0, 8.2, 0.82, "sandstone", "templeGold");
    }
    root.add(wrapInLOD(fort, blueTile, 32, 18, 18, 110));
    colliders.push({ minX: -16, maxX: 16, minZ: -27, maxZ: -9 });

    // Tansen Music Festival Stage Pavilion (x=-30, z=10)
    const tansen = new THREE.Group();
    tansen.position.set(-30, 0, 10);
    addMesh(tansen, new THREE.CylinderGeometry(6.5, 7, 1.0, 12), marble, 0, 0.5, 0);
    buildChhatri(tansen, assets, 0, 1.0, 0, 1.85, "marble", "templeGold");
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const d = addMesh(tansen, new THREE.SphereGeometry(0.24, 8, 8), assets.get("diyaGlow"), Math.cos(a) * 5.8, 1.3, Math.sin(a) * 5.8, 0, 0, 0, false);
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
    addMesh(chariot, new THREE.BoxGeometry(10, 1.2, 12), granite, 0, 0.6, 0);
    // Carved Giant Granite Chariot Wheels!
    const wheelGeo = new THREE.CylinderGeometry(1.75, 1.75, 0.55, 16);
    for (const wx of [-3.4, 3.4]) {
      for (const wz of [-2.4, 2.4]) {
        addMesh(chariot, wheelGeo, sand, wx, 2.0, wz, 0, 0, Math.PI / 2);
      }
    }
    // Sculpted Garuda Sanctum Shrine + Dravidian Shikhara
    addMesh(chariot, new THREE.BoxGeometry(6.2, 4.8, 7.6), granite, 0, 3.8, 0);
    addMesh(chariot, new THREE.BoxGeometry(4.8, 2.4, 5.6), sand, 0, 7.2, 0);
    addMesh(chariot, new THREE.SphereGeometry(2.1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), gold, 0, 8.4, 0);
    // Twin Stone Elephants leading the Chariot
    addMesh(chariot, new THREE.BoxGeometry(1.4, 1.8, 2.4), granite, -1.6, 1.8, 5.6);
    addMesh(chariot, new THREE.BoxGeometry(1.4, 1.8, 2.4), granite,  1.6, 1.8, 5.6);
    root.add(chariot);
    colliders.push({ minX: -5.5, maxX: 5.5, minZ: -20.5, maxZ: -8 });

    // 2. VIRUPAKSHA GOPURAM (x=-34, z=-18)
    const gop = buildDravidianGopuram(assets, [0xd8c3a5, 0xc7a97b, 0xe8d5b7, 0xb58d58, 0xf4bd34]);
    gop.position.set(-34, 0, -18);
    root.add(gop);
    colliders.push({ minX: -41, maxX: -27, minZ: -24, maxZ: -12 });

    // 3. ACT 5 ILLEGAL CONGLOMERATE EXCAVATION SITE (x=34, z=-16)
    const dig = new THREE.Group();
    dig.position.set(34, 0, -16);
    addMesh(dig, new THREE.BoxGeometry(14, 0.35, 14), assets.get("carvedOchre"), 0, 0.18, 0);
    // Warning barricades & yellow excavator bulldozer silhouette (non-combat heritage defense!)
    const caution = assets.colorMat(0xf59e0b, { roughness: 0.4 });
    addMesh(dig, new THREE.BoxGeometry(4.2, 2.6, 5.5), caution, 3, 1.8, -2);
    addMesh(dig, new THREE.BoxGeometry(1.2, 3.8, 1.2), assets.get("bulletBlack"), 1.2, 3.5, 2.2, 0.4, 0, 0);
    addMesh(dig, new THREE.BoxGeometry(9, 1.2, 0.4), caution, 0, 0.8, 6.8);
    root.add(dig);

    // Surreal Hampi Giant Granite Boulders scattered across the horizon!
    const boulderGeo = new THREE.DodecahedronGeometry(3.5, 1);
    const boulderSpots = [
      [-52, 8, 1.6], [-48, -42, 2.1], [48, -38, 1.8], [52, 16, 1.7],
      [-20, -46, 2.2], [18, -46, 1.9], [-55, 34, 2.0], [54, 42, 1.5]
    ];
    boulderSpots.forEach(([bx, bz, sc]) => {
      const m = addMesh(root, boulderGeo, granite, bx, sc * 2.2, bz, sc, sc * 0.7, 0);
      m.scale.set(sc * 1.1, sc * 0.85, sc);
    });
  } else if (hubId === "madurai") {
    // 1. MEENAKSHI AMMAN TEMPLE — Vivid Colorful Sculpted Dravidian Gopurams! (x=0, z=-18)
    const palette = [0xe11d48, 0xf59e0b, 0x0ea5e9, 0x10b981, 0x9333ea, 0xfacc15];
    const southGop = buildDravidianGopuram(assets, palette);
    southGop.position.set(0, 0, -18);
    southGop.scale.setScalar(1.25);
    root.add(southGop);
    const westGop = buildDravidianGopuram(assets, palette.slice().reverse());
    westGop.position.set(-22, 0, -28);
    westGop.scale.setScalar(0.95);
    root.add(westGop);
    const eastGop = buildDravidianGopuram(assets, palette);
    eastGop.position.set(22, 0, -28);
    eastGop.scale.setScalar(0.95);
    root.add(eastGop);
    colliders.push({ minX: -9, maxX: 9, minZ: -25, maxZ: -11 });

    // 2. THIRUMALAI NAYAKKAR PALACE — Grand Colonnaded Public Hearing Hall (x=34, z=0)
    const hall = new THREE.Group();
    hall.position.set(34, 0, 0);
    addMesh(hall, new THREE.BoxGeometry(18, 0.8, 22), marble, 0, 0.4, 0);
    const colGeo = new THREE.CylinderGeometry(0.65, 0.75, 9.5, 12);
    for (const cx of [-7, -2.5, 2.5, 7]) {
      for (const cz of [-8, 8]) {
        addMesh(hall, colGeo, assets.get("whitewash"), cx, 5.2, cz);
      }
    }
    addMesh(hall, new THREE.BoxGeometry(18, 1.8, 22), marble, 0, 10.6, 0);
    // Public Hearing Brass Podium centerpiece!
    addMesh(hall, new THREE.BoxGeometry(2.6, 1.5, 1.4), wood, 0, 1.55, 0);
    addMesh(hall, new THREE.BoxGeometry(1.6, 0.2, 0.9), gold, 0, 2.38, 0);
    root.add(hall);
  } else if (hubId === "mysore") {
    // 1. MYSORE PALACE (Amba Vilas) with InstancedMesh Night Illumination Bulbs! (x=0, z=-18)
    const mysore = new THREE.Group();
    mysore.position.set(0, 0, -18);
    const pinkDome = assets.colorMat(0xc24d66, { roughness: 0.35, metalness: 0.15 });
    addMesh(mysore, new THREE.BoxGeometry(36, 11.5, 16), sand, 0, 5.75, 0);
    addMesh(mysore, new THREE.BoxGeometry(14, 5.5, 12), marble, 0, 14.2, 0);
    // Iconic Pink Indo-Saracenic Domes & Central Golden Kalash Tower
    addMesh(mysore, new THREE.SphereGeometry(4.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), pinkDome, 0, 16.8, 0);
    addMesh(mysore, new THREE.ConeGeometry(0.9, 3.8, 10), gold, 0, 22.4, 0);
    for (const dx of [-14, -7.5, 7.5, 14]) {
      addMesh(mysore, new THREE.SphereGeometry(2.5, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), pinkDome, dx, 11.5, 4);
      addMesh(mysore, new THREE.ConeGeometry(0.4, 1.4, 8), gold, dx, 14.5, 4);
    }

    // InstancedMesh 100,000-bulb Mysore Palace Festival Night Illumination!
    const bulbCoords = [];
    for (let x = -17.5; x <= 17.5; x += 1.25) {
      bulbCoords.push([x, 4.2, 8.25], [x, 8.2, 8.25], [x, 11.5, 8.25]);
    }
    for (let y = 1.5; y <= 11.5; y += 1.4) {
      for (const x of [-17.5, -10.5, -3.5, 3.5, 10.5, 17.5]) {
        bulbCoords.push([x, y, 8.25]);
      }
    }
    const bulbInst = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.22, 6, 6),
      assets.get("diyaGlow"),
      bulbCoords.length
    );
    const dummy = new THREE.Object3D();
    bulbCoords.forEach((p, i) => {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.updateMatrix();
      bulbInst.setMatrixAt(i, dummy.matrix);
    });
    bulbInst.instanceMatrix.needsUpdate = true;
    mysore.add(bulbInst);
    animRefs.mysoreBulbs = bulbInst;

    root.add(wrapInLOD(mysore, sand, 36, 22, 16, 115));
    colliders.push({ minX: -18.5, maxX: 18.5, minZ: -26.5, maxZ: -9.5 });

    // 2. CHAMUNDI HILLS STEPPED TEMPLE (x=-38, z=-20)
    const cham = new THREE.Group();
    cham.position.set(-38, 0, -20);
    addMesh(cham, new THREE.ConeGeometry(18, 12, 8), granite, 0, 6, 0);
    const cGop = buildDravidianGopuram(assets, [0xf6ebd4, 0xf4bd34, 0xe8a87c, 0xf4bd34]);
    cGop.position.set(0, 10.5, 0);
    cGop.scale.setScalar(0.68);
    cham.add(cGop);
    root.add(cham);
  } else {
    // KOCHI — Iconic Cantilevered Wooden Chinese Fishing Nets (Cheena Vala!) + Mattancherry Palace
    const netMat = assets.colorMat(0xd6cfc2, { doubleSide: true, roughness: 0.9 });
    for (let ni = -1; ni <= 1; ni++) {
      const netGroup = new THREE.Group();
      netGroup.position.set(2, 0, -6 + ni * 16);
      // Teakwood shore platform & cantilevered dip poles stretching over emerald backwaters (-X)
      addMesh(netGroup, new THREE.BoxGeometry(5, 1.2, 4.5), wood, 2.5, 0.6, 0);
      addMesh(netGroup, new THREE.CylinderGeometry(0.16, 0.22, 13, 8), wood, -2.5, 5.2, -1.6, 0, 0, 0.72);
      addMesh(netGroup, new THREE.CylinderGeometry(0.16, 0.22, 13, 8), wood, -2.5, 5.2,  1.6, 0, 0, 0.72);
      addMesh(netGroup, new THREE.CylinderGeometry(0.14, 0.14, 10, 8), wood, -5.8, 7.6, 0, Math.PI / 2, 0, 0);
      // Hanging mesh canopy net
      const net = addMesh(netGroup, new THREE.ConeGeometry(4.2, 3.2, 4, 1, true), netMat, -6.8, 4.0, 0, Math.PI, Math.PI / 4, 0, false);
      animRefs.fishingNets.push(netGroup);
      // Counterweight stones
      addMesh(netGroup, new THREE.DodecahedronGeometry(0.65), granite, 4.5, 2.4, 0);
      root.add(netGroup);
    }

    // MATTANCHERRY PALACE & JEW TOWN SYNAGOGUE (Kerala Sloped Terracotta Roofs, x=32, z=-18)
    const matPal = new THREE.Group();
    matPal.position.set(32, 0, -18);
    addMesh(matPal, new THREE.BoxGeometry(20, 6.2, 14), assets.get("whitewash"), 0, 3.1, 0);
    addMesh(matPal, new THREE.ConeGeometry(16, 4.8, 4), assets.get("terracotta"), 0, 8.6, 0, 0, Math.PI / 4, 0);
    // Paradesi Synagogue White Clock Tower beside Mattancherry
    addMesh(matPal, new THREE.BoxGeometry(4.5, 12, 4.5), assets.get("whitewash"), -13, 6, 4);
    addMesh(matPal, new THREE.ConeGeometry(3.4, 2.8, 4), assets.get("terracotta"), -13, 13.4, 4, 0, Math.PI / 4, 0);
    root.add(matPal);
    colliders.push({ minX: 21.5, maxX: 42.5, minZ: -25.5, maxZ: -10.5 });
  }
}

function buildDravidianGopuram(assets, tierColors) {
  const high = new THREE.Group();
  const base = assets.get("granite");
  const gold = assets.get("templeGold");

  // Twin gateway side towers leaving open sacred walkway
  addMesh(high, new THREE.BoxGeometry(4.2, 6.2, 7.5), base, -4.6, 3.1, 0);
  addMesh(high, new THREE.BoxGeometry(4.2, 6.2, 7.5), base,  4.6, 3.1, 0);
  addMesh(high, new THREE.BoxGeometry(13.6, 1.8, 7.8), assets.colorMat(tierColors[0]), 0, 7.1, 0);

  // Sculpted Pyramidal Colorful Gopuram Tiers
  for (let t = 0; t < 6; t++) {
    const w = 12.2 - t * 1.45;
    const d = 6.8 - t * 0.72;
    const col = tierColors[t % tierColors.length];
    addMesh(high, new THREE.BoxGeometry(w, 2.0, d), assets.colorMat(col, { roughness: 0.65 }), 0, 8.9 + t * 1.95, 0);
  }
  // Barrel-vaulted Shala Roof + Golden Kalashams
  addMesh(high, new THREE.CylinderGeometry(1.4, 1.5, 4.4, 12), gold, 0, 20.8, 0, 0, 0, Math.PI / 2);
  for (let k = -1.5; k <= 1.5; k += 1.0) {
    addMesh(high, new THREE.ConeGeometry(0.28, 1.1, 8), gold, k, 22.6, 0);
  }
  return wrapInLOD(high, assets.colorMat(tierColors[0]), 13, 22, 8, 105);
}

// ============================================================================
// SHARED DESI AMBIENT WORLD PROPS (Instanced Bazaars, Chai Tapri, Horn OK Truck)
// ============================================================================
export function buildSharedDesiProps(root, hub, assets, colliders) {
  const wood = assets.get("teakWood");
  const brass = assets.get("templeGold");

  // 1. Local Chai Tapri / Street Food Stall
  if (hub.foodStall) {
    const fs = hub.foodStall;
    const stall = new THREE.Group();
    stall.position.set(fs.x, 0, fs.z);
    addMesh(stall, new THREE.BoxGeometry(4.2, 1.2, 2.2), wood, 0, 0.6, 0);
    for (const px of [-1.9, 1.9]) {
      for (const pz of [-0.95, 0.95]) {
        addMesh(stall, new THREE.CylinderGeometry(0.08, 0.08, 3.0, 6), wood, px, 1.6, pz);
      }
    }
    addMesh(stall, new THREE.BoxGeometry(4.8, 0.18, 2.8), assets.get("saffronCloth"), 0, 3.2, 0, 0.12, 0, 0);
    // Brass tea kettle & clay kulhad pyramid
    addMesh(stall, new THREE.CylinderGeometry(0.28, 0.34, 0.45, 10), brass, -0.8, 1.45, 0.1);
    addMesh(stall, new THREE.CylinderGeometry(0.55, 0.55, 0.14, 12), assets.get("marigold"), 0.7, 1.3, 0.1);
    root.add(stall);
    colliders.push({ minX: fs.x - 2.3, maxX: fs.x + 2.3, minZ: fs.z - 1.4, maxZ: fs.z + 1.4 });
  }

  // 2. Friendly NPC Pol Home with "Remove Shoes" Courtyard Mat
  if (hub.friendlyHome) {
    const fh = hub.friendlyHome;
    const home = new THREE.Group();
    home.position.set(fh.x, 0, fh.z);
    addMesh(home, new THREE.BoxGeometry(8, 5.2, 6.5), assets.get("whitewash"), 0, 2.6, 0);
    addMesh(home, new THREE.BoxGeometry(1.8, 2.8, 0.3), wood, 0, 1.4, 3.3);
    // Woven doorstep mat + terracotta water matkas on roof!
    addMesh(home, new THREE.BoxGeometry(2.2, 0.08, 1.3), assets.get("crimsonCloth"), 0, 0.05, 4.1, 0, 0, 0, false);
    addMesh(home, new THREE.SphereGeometry(0.45, 10, 8), assets.get("terracotta"), -2.4, 5.6, 1.2);
    addMesh(home, new THREE.SphereGeometry(0.38, 10, 8), assets.get("terracotta"), -1.5, 5.5, 1.4);
    root.add(home);
    colliders.push({ minX: fh.x - 4.2, maxX: fh.x + 4.2, minZ: fh.z - 3.5, maxZ: fh.z + 3.5 });
  }

  // 3. Iconic Indian "Horn OK Please" Highway Truck by the South Highway Gate!
  const truck = new THREE.Group();
  truck.position.set(-14, 0, 44);
  truck.rotation.y = Math.PI * 0.48;
  addMesh(truck, new THREE.BoxGeometry(2.7, 2.4, 2.4), assets.colorMat(0xf59e0b), 0, 1.9, 2.5);
  addMesh(truck, new THREE.BoxGeometry(2.9, 3.1, 5.4), assets.colorMat(0xd97706), 0, 2.4, -1.6);
  addMesh(truck, new THREE.BoxGeometry(2.98, 0.55, 5.5), assets.colorMat(0xbe123c), 0, 1.4, -1.6);
  addMesh(truck, new THREE.BoxGeometry(2.98, 0.45, 5.5), assets.colorMat(0x0ea5e9), 0, 3.5, -1.6);
  const wGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.45, 12);
  for (const wx of [-1.45, 1.45]) {
    for (const wz of [-3.2, 0.2, 2.6]) {
      addMesh(truck, wGeo, assets.get("tireBlack"), wx, 0.65, wz, 0, 0, Math.PI / 2);
    }
  }
  root.add(truck);

  // 4. Highway Portal Archway (Drive/Walk here or press M to travel Pan-India!)
  const gate = new THREE.Group();
  gate.position.set(0, 0, 56);
  addMesh(gate, new THREE.BoxGeometry(1.8, 7.5, 1.8), assets.get("sandstone"), -7.5, 3.75, 0);
  addMesh(gate, new THREE.BoxGeometry(1.8, 7.5, 1.8), assets.get("sandstone"),  7.5, 3.75, 0);
  addMesh(gate, new THREE.BoxGeometry(18, 1.6, 2.2), assets.get("carvedOchre"), 0, 7.6, 0);
  addMesh(gate, new THREE.BoxGeometry(12, 0.9, 2.4), assets.colorMat(0x15803d), 0, 7.6, 0.1);
  root.add(gate);

  // 5. InstancedMesh Bazaar Stalls & Lush Indian Neem / Coconut Palm Trees!
  const stallCoords = [];
  const treeCoords = [];
  const waterArea = hub.waterArea;
  const inWater = (x, z) =>
    waterArea &&
    Math.abs(x - waterArea.x) < waterArea.w * 0.54 &&
    Math.abs(z - waterArea.z) < waterArea.d * 0.54;

  // Place perimeter bazaar stalls cleanly along safe avenues
  const candidateStalls = [
    [-16, 16], [-16, 24], [14, 30], [22, 34], [-22, 36], [36, 16], [36, 26], [-36, 26]
  ];
  for (const [sx, sz] of candidateStalls) {
    if (!inWater(sx, sz)) stallCoords.push([sx, sz]);
  }

  if (stallCoords.length > 0) {
    const baseInst = new THREE.InstancedMesh(new THREE.BoxGeometry(3.2, 1.1, 2.0), wood, stallCoords.length);
    const topInst = new THREE.InstancedMesh(new THREE.BoxGeometry(3.6, 0.2, 2.4), assets.get("tealCloth"), stallCoords.length);
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

  // Ring of 36 Indian Trees (InstancedMesh trunks + canopies — 2 draw calls total!)
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2;
    const rad = 44 + (i % 4) * 9;
    const tx = Math.cos(a) * rad;
    const tz = Math.sin(a) * rad;
    if (Math.abs(tx) < 10 && tz > 38) continue; // Keep highway exit clear
    if (inWater(tx, tz)) continue;
    treeCoords.push([tx, tz, 0.85 + (i % 3) * 0.25]);
  }
  if (treeCoords.length > 0) {
    const isCoastal = hub.id === "kochi" || hub.id === "udaipur";
    const trunkInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.28, 0.42, isCoastal ? 7.5 : 4.2, 7),
      wood,
      treeCoords.length
    );
    const leafInst = new THREE.InstancedMesh(
      isCoastal ? new THREE.ConeGeometry(3.2, 2.4, 7) : new THREE.DodecahedronGeometry(2.6, 0),
      assets.get(isCoastal ? "foliageBright" : "foliageDark"),
      treeCoords.length
    );
    const dummy = new THREE.Object3D();
    treeCoords.forEach(([x, z, sc], i) => {
      dummy.position.set(x, (isCoastal ? 3.75 : 2.1) * sc, z);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, (isCoastal ? 7.6 : 5.1) * sc, z);
      dummy.updateMatrix();
      leafInst.setMatrixAt(i, dummy.matrix);
    });
    trunkInst.instanceMatrix.needsUpdate = true;
    leafInst.instanceMatrix.needsUpdate = true;
    root.add(trunkInst, leafInst);
  }
}
