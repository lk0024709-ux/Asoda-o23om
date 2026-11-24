/* ============================================================================
   Layer 1 — Core Engine: Non-Voxel Sculpted & Beveled Polygonal Geometry Kit
   Enforces the Non-Voxel Art Direction Mandate:
   - ZERO BoxGeometry, ZERO flat-shaded cubes, ZERO low-poly dodecahedrons
   - Continuous, curved, subdivided surfaces via LatheGeometry, beveled
     ExtrudeGeometry, TubeGeometry along CatmullRomCurve3, CapsuleGeometry,
     and organically displaced smooth heightfields / boulders with smooth normals
   ============================================================================ */

import * as THREE from "three";

// ----------------------------------------------------------------------------
// 1. Beveled Architectural Stone / Wood / Terrace Slab (Replaces Raw Cubes)
// ----------------------------------------------------------------------------
export function createBeveledSlab(w, h, d, bevel = 0.12, curveSegments = 6) {
  const b = Math.min(bevel, w * 0.18, h * 0.25, d * 0.18);
  const hw = Math.max(0.05, w * 0.5 - b);
  const hh = Math.max(0.05, h * 0.5 - b);
  const r = Math.min(b * 1.4, hw * 0.45, hh * 0.45);

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const depth = Math.max(0.04, d - b * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: b,
    bevelThickness: b,
    curveSegments
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 2. Sculpted Rajput / Mughal Cusped Multi-Arch Facade Wall (Extrude + Holes)
// ----------------------------------------------------------------------------
export function createCuspedArchWall(w, h, depth, archCount = 3, archW = 2.6, archH = 4.2) {
  const b = Math.min(0.14, depth * 0.18);
  const hw = w * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.lineTo(hw, 0);
  shape.lineTo(hw, h);
  shape.lineTo(-hw, h);
  shape.closePath();

  const span = w / Math.max(1, archCount);
  const actualArchW = Math.min(archW, span * 0.72);
  const actualArchH = Math.min(archH, h * 0.78);

  for (let i = 0; i < archCount; i++) {
    const cx = -hw + span * (i + 0.5);
    const aw = actualArchW * 0.5;
    const springY = actualArchH * 0.56;
    const hole = new THREE.Path();
    hole.moveTo(cx - aw, 0.02);
    hole.lineTo(cx - aw, springY);
    // Pointed scalloped Rajput ogee arch curve
    hole.bezierCurveTo(cx - aw, actualArchH * 0.86, cx - aw * 0.28, actualArchH * 0.9, cx, actualArchH);
    hole.bezierCurveTo(cx + aw * 0.28, actualArchH * 0.9, cx + aw, actualArchH * 0.86, cx + aw, springY);
    hole.lineTo(cx + aw, 0.02);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.15, depth - b * 2),
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: b,
    bevelThickness: b,
    curveSegments: 14
  });
  geo.translate(0, 0, -(depth - b * 2) * 0.5);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 3. Sculpted Indian Bulbous Onion Dome + Inverted Lotus Crown + Kalash Spire
// ----------------------------------------------------------------------------
export function createOnionDome(radius = 1.4, height = 2.6, radialSegments = 32) {
  const pts = [
    new THREE.Vector2(radius * 0.96, 0.0),
    new THREE.Vector2(radius * 1.02, height * 0.08),
    new THREE.Vector2(radius * 0.92, height * 0.16),
    new THREE.Vector2(radius * 1.08, height * 0.34), // Bulbous swell
    new THREE.Vector2(radius * 1.05, height * 0.5),
    new THREE.Vector2(radius * 0.82, height * 0.68),
    new THREE.Vector2(radius * 0.44, height * 0.82),
    new THREE.Vector2(radius * 0.24, height * 0.87), // Inverted lotus neck
    new THREE.Vector2(radius * 0.3, height * 0.91),  // Lotus padma rim
    new THREE.Vector2(radius * 0.14, height * 0.96), // Kalash pot
    new THREE.Vector2(radius * 0.04, height * 1.08),
    new THREE.Vector2(0.001, height * 1.18)          // Spire tip
  ];
  const geo = new THREE.LatheGeometry(pts, radialSegments);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 4. Sculpted Curved Parabolic Nagara Temple Shikhara Spire + Amalaka + Kalash
// ----------------------------------------------------------------------------
export function createNagaraShikhara(baseRadius = 4.2, height = 14.0, radialSegments = 32) {
  const pts = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height * 0.84;
    // Parabolic Rekha-Prasada inward curve with carved horizontal bhumi moldings
    const curve = Math.pow(1 - t * 0.84, 0.72);
    const rib = Math.sin(t * Math.PI * 14) * 0.045 * (1 - t * 0.4);
    const r = Math.max(0.25, baseRadius * (curve + rib));
    pts.push(new THREE.Vector2(r, y));
  }
  // Neck, Fluted Amalaka Stone Disc & Golden Kalash Crown
  const topY = height * 0.84;
  pts.push(new THREE.Vector2(baseRadius * 0.22, topY + height * 0.03));
  pts.push(new THREE.Vector2(baseRadius * 0.36, topY + height * 0.06));
  pts.push(new THREE.Vector2(baseRadius * 0.34, topY + height * 0.095));
  pts.push(new THREE.Vector2(baseRadius * 0.16, topY + height * 0.115));
  pts.push(new THREE.Vector2(baseRadius * 0.22, topY + height * 0.145));
  pts.push(new THREE.Vector2(baseRadius * 0.08, topY + height * 0.18));
  pts.push(new THREE.Vector2(0.001, topY + height * 0.24));

  const geo = new THREE.LatheGeometry(pts, radialSegments);
  // Subtle vertical ratha fluting around perimeter
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y < topY) {
      const ang = Math.atan2(z, x);
      const flute = 1 + Math.cos(ang * 8) * 0.065 + Math.cos(ang * 16) * 0.025;
      pos.setX(i, x * flute);
      pos.setZ(i, z * flute);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 5. Turned & Fluted Indian Heritage Pillar (Kumbha Base + Shaft + Padma Capital)
// ----------------------------------------------------------------------------
export function createCarvedPillar(radius = 0.32, height = 4.5, radialSegments = 20) {
  const pts = [
    new THREE.Vector2(radius * 1.48, 0.0),
    new THREE.Vector2(radius * 1.48, height * 0.06),
    new THREE.Vector2(radius * 1.15, height * 0.11),
    new THREE.Vector2(radius * 1.32, height * 0.15),
    new THREE.Vector2(radius * 1.0,  height * 0.2),
    new THREE.Vector2(radius * 0.92, height * 0.52),
    new THREE.Vector2(radius * 0.85, height * 0.78),
    new THREE.Vector2(radius * 1.12, height * 0.84),
    new THREE.Vector2(radius * 0.96, height * 0.89),
    new THREE.Vector2(radius * 1.42, height * 0.95),
    new THREE.Vector2(radius * 1.48, height)
  ];
  const geo = new THREE.LatheGeometry(pts, radialSegments);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 6. Sculpted Dravidian Pyramidal Curved Gopuram Body (Curved Concave Profile)
// ----------------------------------------------------------------------------
export function createDravidianGopuramBody(width = 12, depth = 6.8, height = 16) {
  // Build continuous curved stepped concave pyramid with smooth rounded corner moldings
  const geo = new THREE.CylinderGeometry(1, 1, height, 24, 18);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const t = (y + height * 0.5) / height; // 0 bottom -> 1 top
    // Smooth concave upward taper + sculpted cornice tala bands
    const taper = Math.pow(1 - t * 0.64, 0.88);
    const band = 1 + Math.sin(t * Math.PI * 12) * 0.045;
    // Softly squared rounded-rectangle superellipse cross-section
    const ang = Math.atan2(z, x);
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const sx = Math.sign(ca) * Math.pow(Math.abs(ca), 0.52) * (width * 0.5) * taper * band;
    const sz = Math.sign(sa) * Math.pow(Math.abs(sa), 0.52) * (depth * 0.5) * taper * band;
    pos.setX(i, sx);
    pos.setZ(i, sz);
  }
  geo.translate(0, height * 0.5, 0);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 7. Sculpted Flared Bronze Temple Bell (Ghanta), Diya Lamp, Flame & Matka Pot
// ----------------------------------------------------------------------------
export function createTempleBell(radius = 0.44, height = 0.72) {
  const pts = [
    new THREE.Vector2(0.04, height),
    new THREE.Vector2(radius * 0.34, height * 0.88),
    new THREE.Vector2(radius * 0.48, height * 0.62),
    new THREE.Vector2(radius * 0.62, height * 0.32),
    new THREE.Vector2(radius * 1.0, height * 0.06),
    new THREE.Vector2(radius * 0.92, 0.0)
  ];
  const geo = new THREE.LatheGeometry(pts, 24);
  geo.computeVertexNormals();
  return geo;
}

export function createTerracottaMatka(radius = 0.42) {
  const pts = [
    new THREE.Vector2(radius * 0.38, 0.0),
    new THREE.Vector2(radius * 0.92, radius * 0.42),
    new THREE.Vector2(radius * 1.0,  radius * 0.92),
    new THREE.Vector2(radius * 0.78, radius * 1.38),
    new THREE.Vector2(radius * 0.42, radius * 1.62),
    new THREE.Vector2(radius * 0.54, radius * 1.82),
    new THREE.Vector2(radius * 0.44, radius * 1.86)
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.computeVertexNormals();
  return geo;
}

export function createFlameTear(radius = 0.32, height = 1.05) {
  const pts = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(radius * 0.92, height * 0.24),
    new THREE.Vector2(radius * 1.0, height * 0.45),
    new THREE.Vector2(radius * 0.65, height * 0.72),
    new THREE.Vector2(radius * 0.22, height * 0.9),
    new THREE.Vector2(0.001, height)
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 8. Sculpted Rajasthani Jharokha Oriel Bay Window (Curved Bangla Eave Canopy)
// ----------------------------------------------------------------------------
export function createJharokhaOriel(w = 1.35, h = 2.1, d = 0.85) {
  // Curved arched bay body with overhanging curved Bengali dome eave
  const pts = [
    new THREE.Vector2(0.18, 0.0),
    new THREE.Vector2(0.55, h * 0.16),
    new THREE.Vector2(0.68, h * 0.22),
    new THREE.Vector2(0.62, h * 0.72),
    new THREE.Vector2(0.84, h * 0.8),
    new THREE.Vector2(0.72, h * 0.92),
    new THREE.Vector2(0.32, h * 0.99),
    new THREE.Vector2(0.001, h * 1.06)
  ];
  const geo = new THREE.LatheGeometry(pts, 16);
  geo.scale(w * 0.74, 1, d * 0.82);
  geo.translate(0, -h * 0.5, 0);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 9. Organic Sculpted Granite Boulders, Rolling Hills & Lush Tree Canopies
// ----------------------------------------------------------------------------
export function createSculptedBoulder(radius = 3.5, seed = 1) {
  const geo = new THREE.SphereGeometry(radius, 24, 18);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n1 = Math.sin(x * 0.65 + seed * 3.1) * Math.cos(y * 0.72 - seed * 1.7) * Math.sin(z * 0.61 + seed);
    const n2 = Math.cos(x * 1.4 - z * 1.2 + seed * 2.3) * 0.35;
    const flattenBottom = y < 0 ? 0.74 : 1.0;
    const disp = 1 + n1 * 0.22 + n2 * 0.1;
    pos.setXYZ(i, x * disp * 1.12, y * disp * flattenBottom * 0.85, z * disp);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createOrganicHill(radius = 28, height = 20, seed = 1) {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2, 24, 24);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z) / radius;
    const falloff = Math.max(0, 1 - dist * dist);
    const smoothFalloff = falloff * falloff * (3 - 2 * falloff);
    const ridge =
      1 +
      0.28 * Math.sin(x * 0.14 + seed * 2.1) * Math.cos(z * 0.12 - seed) +
      0.14 * Math.cos((x + z) * 0.22 + seed);
    pos.setY(i, smoothFalloff * height * Math.max(0.2, ridge) - 0.5);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createOrganicTreeCanopy(radius = 2.7, seed = 7) {
  const geo = new THREE.SphereGeometry(radius, 22, 16);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const billow =
      1 +
      0.24 * Math.sin(x * 1.35 + seed) * Math.cos(z * 1.35 - seed) +
      0.16 * Math.sin(y * 1.8 + x * 0.9);
    pos.setXYZ(i, x * billow * 1.18, y * billow * 0.76, z * billow * 1.18);
  }
  geo.computeVertexNormals();
  return geo;
}

export function createCurvedTreeTrunk(height = 4.6, baseR = 0.42, topR = 0.2) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.18, height * 0.35, 0.08),
    new THREE.Vector3(-0.1, height * 0.7, -0.06),
    new THREE.Vector3(0.06, height, 0)
  ]);
  const geo = new THREE.TubeGeometry(curve, 14, baseR, 12, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp(y / height, 0, 1);
    const scale = THREE.MathUtils.lerp(1.0, topR / baseR, t);
    const center = curve.getPoint(t);
    pos.setX(i, center.x + (pos.getX(i) - center.x) * scale);
    pos.setZ(i, center.z + (pos.getZ(i) - center.z) * scale);
  }
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 10. Sculpted Doubly-Curved Indian Shikara / Kettuvallam Wooden Boat Hull
// ----------------------------------------------------------------------------
export function createSculptedBoatHull(length = 5.4, width = 1.9, depth = 0.82) {
  const segL = 22;
  const segU = 14;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segL; i++) {
    const t = i / segL; // 0 stern -> 1 bow
    const z = (t - 0.5) * length;
    // Pointed curved sheer profile tapering gracefully at both bow and stern!
    const beam = Math.sin(t * Math.PI);
    const smoothBeam = Math.pow(beam, 0.72) * (width * 0.5);
    const sheerLift = Math.pow(Math.abs(t - 0.5) * 2, 2.4) * 0.55;

    for (let j = 0; j <= segU; j++) {
      const u = j / segU; // 0 port gunwale -> 0.5 keel -> 1 starboard gunwale
      const ang = (u - 0.5) * Math.PI;
      const x = Math.sin(ang) * smoothBeam;
      const y = (1 - Math.cos(ang)) * depth + sheerLift;
      positions.push(x, y, z);
      uvs.push(u, t);
    }
  }

  const ring = segU + 1;
  for (let i = 0; i < segL; i++) {
    for (let j = 0; j < segU; j++) {
      const a = i * ring + j;
      const b = a + ring;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 11. Sculpted Bajaj RE Auto-Rickshaw Curved Fairing & Curved Canopy Roof
// ----------------------------------------------------------------------------
export function createSculptedAutoChassis() {
  // Smooth curved side profile of an iconic Indian Auto-Rickshaw extruded across width with round bevels!
  const shape = new THREE.Shape();
  shape.moveTo(-1.32, 0.36);
  shape.lineTo(1.25, 0.36);
  shape.quadraticCurveTo(1.66, 0.42, 1.62, 0.96);  // Rounded front apron nose
  shape.quadraticCurveTo(1.52, 1.32, 1.15, 1.38);  // Curved windshield cowl
  shape.lineTo(0.88, 1.35);
  shape.lineTo(0.82, 0.85);                        // Open driver footwell cutout
  shape.lineTo(-0.35, 0.85);
  shape.quadraticCurveTo(-0.45, 1.28, -0.78, 1.32); // Passenger side bolster
  shape.lineTo(-1.26, 1.3);
  shape.quadraticCurveTo(-1.46, 1.1, -1.32, 0.36);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.56,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.14,
    bevelThickness: 0.14,
    curveSegments: 16
  });
  geo.translate(0, 0, -0.78);
  geo.rotateY(-Math.PI / 2); // Align nose along +Z!
  geo.computeVertexNormals();
  return geo;
}

export function createSculptedAutoCanopy() {
  // Domed curved vinyl auto-rickshaw roof canopy
  const geo = new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.46);
  geo.scale(1.04, 0.52, 1.55);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 12. Sculpted Royal Enfield Teardrop Tank, Curved Handlebars & Swept Exhaust
// ----------------------------------------------------------------------------
export function createTeardropTank() {
  const pts = [
    new THREE.Vector2(0.01, -0.45),
    new THREE.Vector2(0.14, -0.32),
    new THREE.Vector2(0.24, -0.05),
    new THREE.Vector2(0.28, 0.22),
    new THREE.Vector2(0.22, 0.38),
    new THREE.Vector2(0.01, 0.44)
  ];
  const geo = new THREE.LatheGeometry(pts, 24);
  geo.rotateX(Math.PI / 2);
  geo.scale(1.0, 0.82, 1.0);
  geo.computeVertexNormals();
  return geo;
}

export function createCurvedTube(points, radius = 0.05, tubularSegments = 18, radialSegments = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  geo.computeVertexNormals();
  return geo;
}

// ----------------------------------------------------------------------------
// 13. Sculpted Organic Torso & Contoured Humanoid Body Parts (Zero Cubes!)
// ----------------------------------------------------------------------------
export function createSculptedTorso(height = 0.86, chestR = 0.28, waistR = 0.22, flaredHem = false) {
  const pts = flaredHem
    ? [
        new THREE.Vector2(chestR * 1.48, 0.0),
        new THREE.Vector2(waistR * 1.18, height * 0.32),
        new THREE.Vector2(waistR * 0.96, height * 0.56),
        new THREE.Vector2(chestR * 1.06, height * 0.84),
        new THREE.Vector2(chestR * 0.72, height * 0.96),
        new THREE.Vector2(chestR * 0.42, height)
      ]
    : [
        new THREE.Vector2(waistR * 1.12, 0.0),
        new THREE.Vector2(waistR * 0.96, height * 0.32),
        new THREE.Vector2(chestR * 1.06, height * 0.76),
        new THREE.Vector2(chestR * 0.84, height * 0.94),
        new THREE.Vector2(chestR * 0.42, height)
      ];
  const geo = new THREE.LatheGeometry(pts, 20);
  geo.scale(1.12, 1.0, 0.78);
  geo.computeVertexNormals();
  return geo;
}

export function createSculptedHead(radius = 0.22) {
  const geo = new THREE.SphereGeometry(radius, 22, 18);
  geo.scale(0.92, 1.14, 0.98);
  geo.computeVertexNormals();
  return geo;
}
