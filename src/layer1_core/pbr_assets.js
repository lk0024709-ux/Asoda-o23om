/* ============================================================================
   Layer 1 — Core Engine: Procedural PBR Material Pipeline & GLTF/Draco Loader
   Generates tactile PBR textures (albedo, bump/normal, roughness) via Canvas2D
   for Indian heritage materials while keeping initial web download tiny (< 2MB).
   Also provides DRACOLoader + GLTFLoader hooks for optional external CC0 GLBs.
   ============================================================================ */

import * as THREE from "three";

const HAS_DOM = typeof document !== "undefined";

function makeCanvas(size = 256) {
  if (!HAS_DOM) return null;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function toTexture(canvas, isColor = true, repeatX = 1, repeatY = 1) {
  if (!canvas) return null;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function generateStoneMaps({ baseHex, mortarHex, rows = 8, cols = 4, grain = 18, seed = 11 }) {
  const size = 256;
  const colCanvas = makeCanvas(size);
  const bumpCanvas = makeCanvas(size);
  if (!colCanvas || !bumpCanvas) return { map: null, bumpMap: null };

  const cctx = colCanvas.getContext("2d");
  const bctx = bumpCanvas.getContext("2d");
  const rand = seededRand(seed);

  cctx.fillStyle = mortarHex;
  cctx.fillRect(0, 0, size, size);
  bctx.fillStyle = "#303030";
  bctx.fillRect(0, 0, size, size);

  const base = new THREE.Color(baseHex);
  const rh = size / rows;
  const cw = size / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cw + offset;
      const y = r * rh;
      const delta = (rand() - 0.5) * 0.08;
      const col = base.clone().offsetHSL(0, delta * 0.4, delta);
      cctx.fillStyle = "#" + col.getHexString();
      cctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

      const lum = Math.floor(175 + (rand() - 0.5) * 45);
      bctx.fillStyle = `rgb(${lum},${lum},${lum})`;
      bctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
    }
  }

  // Subtle carved sandstone grain speckles
  for (let i = 0; i < 900; i++) {
    const gx = rand() * size;
    const gy = rand() * size;
    const alpha = rand() * 0.14;
    cctx.fillStyle = rand() > 0.5 ? `rgba(255,248,230,${alpha})` : `rgba(45,25,10,${alpha})`;
    cctx.fillRect(gx, gy, 2, 2);
    const bl = Math.floor(128 + (rand() - 0.5) * grain * 4);
    bctx.fillStyle = `rgba(${bl},${bl},${bl},0.35)`;
    bctx.fillRect(gx, gy, 2, 2);
  }

  return {
    map: toTexture(colCanvas, true, 2, 2),
    bumpMap: toTexture(bumpCanvas, false, 2, 2)
  };
}

function generateMarbleMaps({ baseHex = "#f5efe6", veinHex = "#d4c8b8", seed = 37 }) {
  const size = 256;
  const colCanvas = makeCanvas(size);
  const bumpCanvas = makeCanvas(size);
  if (!colCanvas || !bumpCanvas) return { map: null, bumpMap: null };

  const cctx = colCanvas.getContext("2d");
  const bctx = bumpCanvas.getContext("2d");
  const rand = seededRand(seed);

  cctx.fillStyle = baseHex;
  cctx.fillRect(0, 0, size, size);
  bctx.fillStyle = "#c8c8c8";
  bctx.fillRect(0, 0, size, size);

  // Soft Makrana marble veins
  cctx.strokeStyle = veinHex;
  cctx.lineWidth = 1.6;
  for (let v = 0; v < 14; v++) {
    cctx.globalAlpha = 0.22 + rand() * 0.25;
    cctx.beginPath();
    let vx = rand() * size;
    let vy = 0;
    cctx.moveTo(vx, vy);
    for (let s = 1; s <= 8; s++) {
      vx += (rand() - 0.5) * 38;
      vy = (s / 8) * size;
      cctx.lineTo(vx, vy);
    }
    cctx.stroke();
  }
  cctx.globalAlpha = 1;

  // Subtle tile joints
  cctx.strokeStyle = "rgba(120,105,88,0.22)";
  bctx.strokeStyle = "#707070";
  cctx.lineWidth = 2;
  bctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const p = i * 64;
    cctx.beginPath(); cctx.moveTo(p, 0); cctx.lineTo(p, size); cctx.stroke();
    cctx.beginPath(); cctx.moveTo(0, p); cctx.lineTo(size, p); cctx.stroke();
    bctx.beginPath(); bctx.moveTo(p, 0); bctx.lineTo(p, size); bctx.stroke();
    bctx.beginPath(); bctx.moveTo(0, p); bctx.lineTo(size, p); bctx.stroke();
  }

  return {
    map: toTexture(colCanvas, true, 3, 3),
    bumpMap: toTexture(bumpCanvas, false, 3, 3)
  };
}

function generateRangoliFloorMap() {
  const size = 256;
  const c = makeCanvas(size);
  if (!c) return null;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#d9c29c";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const rings = [
    { r: 108, col: "#9a3412", petals: 16 },
    { r: 86, col: "#f59e0b", petals: 12 },
    { r: 62, col: "#be123c", petals: 8 },
    { r: 38, col: "#fef3c7", petals: 8 },
    { r: 18, col: "#15803d", petals: 6 }
  ];

  for (const ring of rings) {
    ctx.fillStyle = ring.col;
    for (let i = 0; i < ring.petals; i++) {
      const a = (i / ring.petals) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(ring.r * 0.58, 0, ring.r * 0.44, ring.r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  return toTexture(c, true, 1, 1);
}

function generateBlueTileMap() {
  const size = 256;
  const c = makeCanvas(size);
  if (!c) return null;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#146c94";
  ctx.fillRect(0, 0, size, size);

  // Gwalior Man Mandir signature turquoise, cobalt & marigold bands
  ctx.fillStyle = "#19a7ce";
  for (let y = 0; y < size; y += 32) {
    ctx.fillRect(0, y + 4, size, 16);
    ctx.fillStyle = y % 64 === 0 ? "#f5c542" : "#19a7ce";
    for (let x = 0; x < size; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 6);
      ctx.lineTo(x + 26, y + 16);
      ctx.lineTo(x + 16, y + 26);
      ctx.lineTo(x + 6, y + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#19a7ce";
  }
  return toTexture(c, true, 3, 2);
}

export class PBRAssetLibrary {
  constructor() {
    this.materials = new Map();
    this._gltfLoader = null;
    this._buildStandardPalette();
  }

  _register(key, mat) {
    mat.name = key;
    this.materials.set(key, mat);
    return mat;
  }

  _buildStandardPalette() {
    // 1. Jaipur Terracotta Pink Sandstone
    const jaipurMaps = generateStoneMaps({ baseHex: "#d87d68", mortarHex: "#f5e3d3", rows: 8, cols: 4, seed: 101 });
    this._register("jaipurPink", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: jaipurMaps.map,
      bumpMap: jaipurMaps.bumpMap,
      bumpScale: 0.08,
      roughness: 0.78,
      metalness: 0.04
    }));

    // 2. Warm Rajasthani Golden Sandstone (Amber Fort, Ratanpur, Jaisalmer, Khajuraho)
    const sandMaps = generateStoneMaps({ baseHex: "#cfa36b", mortarHex: "#8d653d", rows: 7, cols: 4, seed: 202 });
    this._register("sandstone", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: sandMaps.map,
      bumpMap: sandMaps.bumpMap,
      bumpScale: 0.12,
      roughness: 0.84,
      metalness: 0.04
    }));

    // 3. Carved Deep Ochre Stone (Stepwells, Forts, Temples)
    const ochreMaps = generateStoneMaps({ baseHex: "#b07d48", mortarHex: "#6e4a25", rows: 10, cols: 5, seed: 303 });
    this._register("carvedOchre", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: ochreMaps.map,
      bumpMap: ochreMaps.bumpMap,
      bumpScale: 0.16,
      roughness: 0.86,
      metalness: 0.05
    }));

    // 4. Makrana White Marble (Udaipur City Palace, Jag Mandir, Lake Palace, Sabarmati)
    const marbleMaps = generateMarbleMaps({ baseHex: "#f6f0e6", veinHex: "#cfc4b4", seed: 404 });
    this._register("marble", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: marbleMaps.map,
      bumpMap: marbleMaps.bumpMap,
      bumpScale: 0.03,
      roughness: 0.28,
      metalness: 0.08
    }));

    // 5. Cobblestone Bazaar Road
    const cobbleMaps = generateStoneMaps({ baseHex: "#7b7265", mortarHex: "#4b433a", rows: 12, cols: 8, seed: 505 });
    this._register("cobblestone", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: cobbleMaps.map,
      bumpMap: cobbleMaps.bumpMap,
      bumpScale: 0.14,
      roughness: 0.9,
      metalness: 0.02
    }));

    // 6. Granite Boulders & Dravidian Stone (Hampi, Orchha)
    const graniteMaps = generateStoneMaps({ baseHex: "#8f7a64", mortarHex: "#5b4a3a", rows: 6, cols: 3, seed: 606 });
    this._register("granite", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: graniteMaps.map,
      bumpMap: graniteMaps.bumpMap,
      bumpScale: 0.2,
      roughness: 0.92,
      metalness: 0.03
    }));

    // 7. Gwalior Blue Ceramic Tilework
    this._register("gwaliorBlue", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: generateBlueTileMap(),
      roughness: 0.32,
      metalness: 0.15
    }));

    // 8. Rangoli Courtyard Motif Floor
    this._register("rangoliFloor", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: generateRangoliFloorMap(),
      roughness: 0.72,
      metalness: 0.04
    }));

    // 9. Heritage Metals, Woods & Accents
    this._register("templeGold", new THREE.MeshStandardMaterial({
      color: 0xf4bd34,
      emissive: 0x3b2600,
      roughness: 0.22,
      metalness: 0.88
    }));
    this._register("mirrorGlass", new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      roughness: 0.08,
      metalness: 0.75,
      clearcoat: 1.0,
      emissive: 0x1e3a5f,
      emissiveIntensity: 0.3
    }));
    this._register("teakWood", new THREE.MeshStandardMaterial({
      color: 0x5c361c,
      roughness: 0.72,
      metalness: 0.06
    }));
    this._register("terracotta", new THREE.MeshStandardMaterial({
      color: 0xb94d32,
      roughness: 0.82,
      metalness: 0.04
    }));
    this._register("whitewash", new THREE.MeshStandardMaterial({
      color: 0xf4eee2,
      roughness: 0.85,
      metalness: 0.02
    }));
    this._register("highwayAsphalt", new THREE.MeshStandardMaterial({
      color: 0x30343c,
      roughness: 0.9,
      metalness: 0.04
    }));
    this._register("earthDesert", new THREE.MeshStandardMaterial({
      color: 0xc9a978,
      roughness: 0.95,
      metalness: 0.01
    }));
    this._register("grassGarden", new THREE.MeshStandardMaterial({
      color: 0x3f7d36,
      roughness: 0.92,
      metalness: 0.02
    }));
    this._register("foliageDark", new THREE.MeshStandardMaterial({
      color: 0x265c2b,
      roughness: 0.88,
      metalness: 0.02
    }));
    this._register("foliageBright", new THREE.MeshStandardMaterial({
      color: 0x458b3c,
      roughness: 0.85,
      metalness: 0.02
    }));
    this._register("marigold", new THREE.MeshStandardMaterial({
      color: 0xff8c1a,
      emissive: 0x6b2800,
      emissiveIntensity: 0.45,
      roughness: 0.65
    }));
    this._register("diyaGlow", new THREE.MeshStandardMaterial({
      color: 0xffe484,
      emissive: 0xff9a1f,
      emissiveIntensity: 2.2,
      roughness: 0.2
    }));
    this._register("aartiFlame", new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xff6b00,
      emissiveIntensity: 2.8,
      roughness: 0.1
    }));
    this._register("saffronCloth", new THREE.MeshStandardMaterial({
      color: 0xe85d04,
      roughness: 0.82,
      side: THREE.DoubleSide
    }));
    this._register("crimsonCloth", new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      roughness: 0.82,
      side: THREE.DoubleSide
    }));
    this._register("tealCloth", new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.82,
      side: THREE.DoubleSide
    }));
    this._register("indigoCloth", new THREE.MeshStandardMaterial({
      color: 0x3730a3,
      roughness: 0.82,
      side: THREE.DoubleSide
    }));
    this._register("autoGreen", new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.35,
      metalness: 0.25
    }));
    this._register("autoYellow", new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.35,
      metalness: 0.2
    }));
    this._register("chrome", new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.92
    }));
    this._register("bulletBlack", new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.26,
      metalness: 0.55
    }));
    this._register("tireBlack", new THREE.MeshStandardMaterial({
      color: 0x1e1e22,
      roughness: 0.92,
      metalness: 0.05
    }));
  }

  get(key, fallbackHex = 0xcfa36b) {
    if (this.materials.has(key)) return this.materials.get(key);
    const mat = new THREE.MeshStandardMaterial({
      color: fallbackHex,
      roughness: 0.78,
      metalness: 0.06
    });
    this._register(key, mat);
    return mat;
  }

  colorMat(hex, opts = {}) {
    const key = `c_${hex}_${opts.emissive || 0}_${opts.roughness ?? 0.75}_${opts.metalness ?? 0.05}`;
    if (this.materials.has(key)) return this.materials.get(key);
    const mat = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: opts.roughness ?? 0.75,
      metalness: opts.metalness ?? 0.05,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1.0,
      side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide
    });
    return this._register(key, mat);
  }

  // Optional external glTF + Draco asset loader (for plugging in Sketchfab / Meshy / CC0 GLBs)
  async loadDracoGLTF(url) {
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/loaders/DRACOLoader.js")
    ]);
    if (!this._gltfLoader) {
      this._gltfLoader = new GLTFLoader();
      const draco = new DRACOLoader();
      draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
      this._gltfLoader.setDRACOLoader(draco);
    }
    return new Promise((resolve, reject) => {
      this._gltfLoader.load(url, resolve, undefined, reject);
    });
  }
}
