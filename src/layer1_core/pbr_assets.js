/* ============================================================================
   Layer 1 — Core Engine: True PBR Material Pipeline (Albedo + Tangent-Space
   Normal Maps + Roughness Maps) & GLTF/Draco Loader
   Generates continuous procedural PBR maps via Sobel height-to-normal filters
   for high-fidelity stylized-realistic Indian sandstone, Makrana marble,
   carved wood, bronze, Gwalior ceramic tilework & granite surfaces.
   ============================================================================ */

import * as THREE from "three";

function makeCanvas(size = 256) {
  if (typeof document === "undefined") return null;
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
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// Converts a grayscale height canvas into a true Tangent-Space RGB Normal Map!
function heightCanvasToNormalCanvas(heightCanvas, strength = 2.4) {
  if (!heightCanvas) return null;
  const size = heightCanvas.width;
  const hctx = heightCanvas.getContext("2d");
  const src = hctx.getImageData(0, 0, size, size).data;

  const outCanvas = makeCanvas(size);
  const octx = outCanvas.getContext("2d");
  const outImg = octx.createImageData(size, size);
  const dst = outImg.data;

  const sample = (x, y) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return src[(wy * size + wx) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 3x3 Sobel gradient for smooth beveled stone & carving normals
      const tl = sample(x - 1, y - 1);
      const t  = sample(x,     y - 1);
      const tr = sample(x + 1, y - 1);
      const l  = sample(x - 1, y);
      const r  = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b  = sample(x,     y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      const idx = (y * size + x) * 4;
      dst[idx + 0] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  octx.putImageData(outImg, 0, 0);
  return outCanvas;
}

function generateStonePBR({ baseHex, mortarHex, rows = 8, cols = 4, normalStrength = 2.6, baseRough = 0.78, seed = 11, repeat = 2 }) {
  const size = 256;
  const colCanvas = makeCanvas(size);
  const heightCanvas = makeCanvas(size);
  const roughCanvas = makeCanvas(size);
  if (!colCanvas || !heightCanvas || !roughCanvas) return {};

  const cctx = colCanvas.getContext("2d");
  const hctx = heightCanvas.getContext("2d");
  const rctx = roughCanvas.getContext("2d");
  const rand = seededRand(seed);

  cctx.fillStyle = mortarHex;
  cctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#222222";
  hctx.fillRect(0, 0, size, size);
  rctx.fillStyle = "#e8e8e8"; // Rougher recessed mortar
  rctx.fillRect(0, 0, size, size);

  const base = new THREE.Color(baseHex);
  const rh = size / rows;
  const cw = size / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cw + offset;
      const y = r * rh;
      const delta = (rand() - 0.5) * 0.075;
      const col = base.clone().offsetHSL(0, delta * 0.35, delta);
      cctx.fillStyle = "#" + col.getHexString();
      cctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);

      // Softly beveled stone heightfield (gradient pillow edge for realistic bevel catch-light!)
      const hLum = Math.floor(190 + (rand() - 0.5) * 35);
      hctx.fillStyle = `rgb(${hLum},${hLum},${hLum})`;
      hctx.fillRect(x + 3, y + 3, cw - 6, rh - 6);
      hctx.strokeStyle = "#888888";
      hctx.lineWidth = 2;
      hctx.strokeRect(x + 2.5, y + 2.5, cw - 5, rh - 5);

      const rLum = Math.floor((baseRough + (rand() - 0.5) * 0.14) * 255);
      rctx.fillStyle = `rgb(${rLum},${rLum},${rLum})`;
      rctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
    }
  }

  // Natural carved sandstone mineral micro-relief
  for (let i = 0; i < 1100; i++) {
    const gx = rand() * size;
    const gy = rand() * size;
    const a = rand() * 0.14;
    cctx.fillStyle = rand() > 0.5 ? `rgba(255,248,232,${a})` : `rgba(42,24,10,${a})`;
    cctx.fillRect(gx, gy, 2, 2);
    const hl = Math.floor(128 + (rand() - 0.5) * 90);
    hctx.fillStyle = `rgba(${hl},${hl},${hl},0.28)`;
    hctx.fillRect(gx, gy, 2, 2);
  }

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, normalStrength);
  return {
    map: toTexture(colCanvas, true, repeat, repeat),
    normalMap: toTexture(normalCanvas, false, repeat, repeat),
    roughnessMap: toTexture(roughCanvas, false, repeat, repeat)
  };
}

function generateMarblePBR({ baseHex = "#f5efe6", veinHex = "#cabda9", seed = 37 }) {
  const size = 256;
  const colCanvas = makeCanvas(size);
  const heightCanvas = makeCanvas(size);
  const roughCanvas = makeCanvas(size);
  if (!colCanvas || !heightCanvas || !roughCanvas) return {};

  const cctx = colCanvas.getContext("2d");
  const hctx = heightCanvas.getContext("2d");
  const rctx = roughCanvas.getContext("2d");
  const rand = seededRand(seed);

  cctx.fillStyle = baseHex;
  cctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#dcdcdc";
  hctx.fillRect(0, 0, size, size);
  rctx.fillStyle = "#484848"; // Polished smooth Makrana marble!
  rctx.fillRect(0, 0, size, size);

  cctx.strokeStyle = veinHex;
  cctx.lineWidth = 1.8;
  for (let v = 0; v < 18; v++) {
    cctx.globalAlpha = 0.2 + rand() * 0.25;
    cctx.beginPath();
    let vx = rand() * size;
    let vy = 0;
    cctx.moveTo(vx, vy);
    for (let s = 1; s <= 10; s++) {
      vx += (rand() - 0.5) * 34;
      vy = (s / 10) * size;
      cctx.lineTo(vx, vy);
    }
    cctx.stroke();
  }
  cctx.globalAlpha = 1;

  // Fine inlaid marble slab seams
  cctx.strokeStyle = "rgba(120,104,88,0.18)";
  hctx.strokeStyle = "#8c8c8c";
  rctx.strokeStyle = "#989898";
  cctx.lineWidth = 1.5;
  hctx.lineWidth = 2;
  rctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const p = i * 64;
    cctx.beginPath(); cctx.moveTo(p, 0); cctx.lineTo(p, size); cctx.stroke();
    cctx.beginPath(); cctx.moveTo(0, p); cctx.lineTo(size, p); cctx.stroke();
    hctx.beginPath(); hctx.moveTo(p, 0); hctx.lineTo(p, size); hctx.stroke();
    hctx.beginPath(); hctx.moveTo(0, p); hctx.lineTo(size, p); hctx.stroke();
    rctx.beginPath(); rctx.moveTo(p, 0); rctx.lineTo(p, size); rctx.stroke();
    rctx.beginPath(); rctx.moveTo(0, p); rctx.lineTo(size, p); rctx.stroke();
  }

  const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 1.4);
  return {
    map: toTexture(colCanvas, true, 3, 3),
    normalMap: toTexture(normalCanvas, false, 3, 3),
    roughnessMap: toTexture(roughCanvas, false, 3, 3)
  };
}

function generateWoodPBR(seed = 81) {
  const size = 256;
  const colCanvas = makeCanvas(size);
  const heightCanvas = makeCanvas(size);
  if (!colCanvas || !heightCanvas) return {};
  const cctx = colCanvas.getContext("2d");
  const hctx = heightCanvas.getContext("2d");
  const rand = seededRand(seed);

  cctx.fillStyle = "#5c361c";
  cctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 2) {
    const shade = Math.floor(Math.sin(y * 0.14) * 14 + (rand() - 0.5) * 18);
    cctx.fillStyle = `rgb(${92 + shade},${54 + Math.floor(shade * 0.6)},${28 + Math.floor(shade * 0.35)})`;
    cctx.fillRect(0, y, size, 2);
    const hl = Math.max(20, Math.min(240, 128 + shade * 2));
    hctx.fillStyle = `rgb(${hl},${hl},${hl})`;
    hctx.fillRect(0, y, size, 2);
  }
  return {
    map: toTexture(colCanvas, true, 2, 2),
    normalMap: toTexture(heightCanvasToNormalCanvas(heightCanvas, 1.8), false, 2, 2)
  };
}

function generateRangoliFloorMap() {
  const size = 256;
  const c = makeCanvas(size);
  if (!c) return null;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#dcc59e";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const rings = [
    { r: 110, col: "#9a3412", petals: 16 },
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

function generateBlueTilePBR() {
  const size = 256;
  const c = makeCanvas(size);
  const h = makeCanvas(size);
  if (!c || !h) return {};
  const ctx = c.getContext("2d");
  const hctx = h.getContext("2d");
  ctx.fillStyle = "#146c94";
  ctx.fillRect(0, 0, size, size);
  hctx.fillStyle = "#606060";
  hctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 32) {
    ctx.fillStyle = "#19a7ce";
    ctx.fillRect(0, y + 4, size, 16);
    hctx.fillStyle = "#d0d0d0";
    hctx.fillRect(0, y + 4, size, 16);
    ctx.fillStyle = y % 64 === 0 ? "#f5c542" : "#22b8cf";
    for (let x = 0; x < size; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x + 16, y + 5);
      ctx.lineTo(x + 27, y + 16);
      ctx.lineTo(x + 16, y + 27);
      ctx.lineTo(x + 5, y + 16);
      ctx.closePath();
      ctx.fill();
      hctx.fillStyle = "#ffffff";
      hctx.fillRect(x + 10, y + 10, 12, 12);
    }
  }
  return {
    map: toTexture(c, true, 3, 2),
    normalMap: toTexture(heightCanvasToNormalCanvas(h, 2.2), false, 3, 2)
  };
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
    // 1. Jaipur Terracotta Pink Sandstone (Albedo + Normal + Roughness)
    const jaipur = generateStonePBR({ baseHex: "#da7f68", mortarHex: "#f6e5d5", rows: 8, cols: 4, normalStrength: 2.2, baseRough: 0.76, seed: 101 });
    this._register("jaipurPink", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...jaipur,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 1.0,
      metalness: 0.04
    }));

    // 2. Warm Rajasthani Golden Sandstone (Amber Fort, Ratanpur, Khajuraho)
    const sand = generateStonePBR({ baseHex: "#d1a56c", mortarHex: "#8c633b", rows: 7, cols: 4, normalStrength: 2.8, baseRough: 0.82, seed: 202 });
    this._register("sandstone", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...sand,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 1.0,
      metalness: 0.04
    }));

    // 3. Carved Deep Ochre Temple & Stepwell Stone
    const ochre = generateStonePBR({ baseHex: "#b27e49", mortarHex: "#6a4522", rows: 10, cols: 5, normalStrength: 3.1, baseRough: 0.84, seed: 303 });
    this._register("carvedOchre", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...ochre,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 1.0,
      metalness: 0.06
    }));

    // 4. Polished Makrana White Marble (MeshPhysicalMaterial with clearcoat sheen!)
    const marble = generateMarblePBR({ baseHex: "#f7f1e7", veinHex: "#cabda9", seed: 404 });
    this._register("marble", new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      ...marble,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.34,
      metalness: 0.05,
      clearcoat: 0.38,
      clearcoatRoughness: 0.24
    }));

    // 5. Cobblestone Old-City Road
    const cobble = generateStonePBR({ baseHex: "#7c7366", mortarHex: "#494138", rows: 12, cols: 8, normalStrength: 3.2, baseRough: 0.88, seed: 505, repeat: 4 });
    this._register("cobblestone", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...cobble,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughness: 1.0,
      metalness: 0.03
    }));

    // 6. Sculpted Vijayanagara Granite (Hampi Boulders & Dravidian Bases)
    const granite = generateStonePBR({ baseHex: "#937e66", mortarHex: "#5d4c3b", rows: 5, cols: 3, normalStrength: 3.4, baseRough: 0.9, seed: 606 });
    this._register("granite", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...granite,
      normalScale: new THREE.Vector2(1.15, 1.15),
      roughness: 1.0,
      metalness: 0.04
    }));

    // 7. Gwalior Glazed Blue Ceramic Tilework
    const gwalior = generateBlueTilePBR();
    this._register("gwaliorBlue", new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      ...gwalior,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.24,
      metalness: 0.14,
      clearcoat: 0.72,
      clearcoatRoughness: 0.14
    }));

    // 8. Rangoli Courtyard Motif Floor
    this._register("rangoliFloor", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: generateRangoliFloorMap(),
      roughness: 0.68,
      metalness: 0.05
    }));

    // 9. Carved Indian Teak Wood
    const teak = generateWoodPBR(81);
    this._register("teakWood", new THREE.MeshStandardMaterial({
      color: 0xffffff,
      ...teak,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.64,
      metalness: 0.06
    }));

    // 10. Heritage Metals, Clearcoated Vehicles, Textiles & Emissive Festival Lamps
    this._register("templeGold", new THREE.MeshPhysicalMaterial({
      color: 0xf5be38,
      emissive: 0x3b2400,
      roughness: 0.18,
      metalness: 0.92,
      clearcoat: 0.45
    }));
    this._register("mirrorGlass", new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.06,
      metalness: 0.85,
      clearcoat: 1.0,
      emissive: 0x1e3a5f,
      emissiveIntensity: 0.28
    }));
    this._register("terracotta", new THREE.MeshStandardMaterial({
      color: 0xba4f33,
      ...(sand.normalMap ? { normalMap: sand.normalMap, normalScale: new THREE.Vector2(0.55, 0.55) } : {}),
      roughness: 0.82,
      metalness: 0.04
    }));
    this._register("whitewash", new THREE.MeshStandardMaterial({
      color: 0xf4eee2,
      ...(sand.normalMap ? { normalMap: sand.normalMap, normalScale: new THREE.Vector2(0.28, 0.28) } : {}),
      roughness: 0.84,
      metalness: 0.02
    }));
    this._register("highwayAsphalt", new THREE.MeshStandardMaterial({
      color: 0x31363f,
      ...(cobble.normalMap ? { normalMap: cobble.normalMap, normalScale: new THREE.Vector2(0.32, 0.32) } : {}),
      roughness: 0.88,
      metalness: 0.04
    }));
    this._register("earthDesert", new THREE.MeshStandardMaterial({
      color: 0xcba977,
      ...(sand.normalMap ? { normalMap: sand.normalMap, normalScale: new THREE.Vector2(0.45, 0.45) } : {}),
      roughness: 0.94,
      metalness: 0.01
    }));
    this._register("grassGarden", new THREE.MeshStandardMaterial({
      color: 0x3f7d36,
      ...(cobble.normalMap ? { normalMap: cobble.normalMap, normalScale: new THREE.Vector2(0.35, 0.35) } : {}),
      roughness: 0.92,
      metalness: 0.02
    }));
    this._register("foliageDark", new THREE.MeshStandardMaterial({
      color: 0x255c2b,
      roughness: 0.84,
      metalness: 0.02
    }));
    this._register("foliageBright", new THREE.MeshStandardMaterial({
      color: 0x458b3c,
      roughness: 0.8,
      metalness: 0.02
    }));
    this._register("marigold", new THREE.MeshStandardMaterial({
      color: 0xff8c1a,
      emissive: 0x6b2800,
      emissiveIntensity: 0.45,
      roughness: 0.6
    }));
    this._register("diyaGlow", new THREE.MeshStandardMaterial({
      color: 0xffe484,
      emissive: 0xff9a1f,
      emissiveIntensity: 2.3,
      roughness: 0.18
    }));
    this._register("aartiFlame", new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      emissive: 0xff6b00,
      emissiveIntensity: 2.9,
      roughness: 0.1
    }));
    this._register("saffronCloth", new THREE.MeshStandardMaterial({
      color: 0xe85d04,
      roughness: 0.78,
      side: THREE.DoubleSide
    }));
    this._register("crimsonCloth", new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      roughness: 0.78,
      side: THREE.DoubleSide
    }));
    this._register("tealCloth", new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.78,
      side: THREE.DoubleSide
    }));
    this._register("indigoCloth", new THREE.MeshStandardMaterial({
      color: 0x3730a3,
      roughness: 0.78,
      side: THREE.DoubleSide
    }));
    this._register("autoGreen", new THREE.MeshPhysicalMaterial({
      color: 0x15803d,
      roughness: 0.26,
      metalness: 0.25,
      clearcoat: 0.75,
      clearcoatRoughness: 0.18
    }));
    this._register("autoYellow", new THREE.MeshPhysicalMaterial({
      color: 0xfacc15,
      roughness: 0.28,
      metalness: 0.2,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2
    }));
    this._register("chrome", new THREE.MeshPhysicalMaterial({
      color: 0xeef2f6,
      roughness: 0.12,
      metalness: 0.96,
      clearcoat: 0.8
    }));
    this._register("bulletBlack", new THREE.MeshPhysicalMaterial({
      color: 0x18181b,
      roughness: 0.22,
      metalness: 0.65,
      clearcoat: 0.85
    }));
    this._register("tireBlack", new THREE.MeshStandardMaterial({
      color: 0x1e1e22,
      roughness: 0.92,
      metalness: 0.04
    }));
  }

  get(key, fallbackHex = 0xcfa36b) {
    if (this.materials.has(key)) return this.materials.get(key);
    const mat = new THREE.MeshStandardMaterial({
      color: fallbackHex,
      roughness: 0.75,
      metalness: 0.06
    });
    this._register(key, mat);
    return mat;
  }

  colorMat(hex, opts = {}) {
    const key = `c_${hex}_${opts.emissive || 0}_${opts.roughness ?? 0.72}_${opts.metalness ?? 0.06}_${opts.clearcoat || 0}`;
    if (this.materials.has(key)) return this.materials.get(key);
    const MatClass = opts.clearcoat ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const mat = new MatClass({
      color: hex,
      roughness: opts.roughness ?? 0.72,
      metalness: opts.metalness ?? 0.06,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 1.0,
      side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
      ...(opts.clearcoat ? { clearcoat: opts.clearcoat, clearcoatRoughness: 0.2 } : {})
    });
    return this._register(key, mat);
  }

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
