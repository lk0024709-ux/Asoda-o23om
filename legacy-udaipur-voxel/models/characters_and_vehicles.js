/* ============================================================================
   models/characters_and_vehicles.js
   Procedural 3D Voxel Model Builders for:
   - Vehicles: AUTO (Auto-Rickshaw), SUV, POLICE (with Red/Blue Siren Lightbar)
   - Articulated Characters: Gangster Hero (with Pistol & SMG), NPCs, Cops
   - Collectible Cash Stash (₹) Bundle Model
   - Smooth Articulated Walking & Aiming Animation Helper
   ============================================================================ */

(function (global) {
  "use strict";

  // Helper to create a positioned voxel box child mesh
  function makeBox(scene, name, w, h, d, x, y, z, mat, parent) {
    const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    mesh.position.set(x, y, z);
    mesh.material = mat;
    mesh.parent = parent;
    mesh.isPickable = false;
    return mesh;
  }

  // Helper to create a rotating voxel wheel assembly (tire + hubcap)
  function makeWheel(scene, name, radius, thickness, x, y, z, parent) {
    const C = global.COLORS;
    const pivot = new BABYLON.TransformNode(name + "_pivot", scene);
    pivot.position.set(x, y, z);
    pivot.parent = parent;

    const tireMat = global.createColorMat(scene, "tire", C.TIRE_BLACK, { specular: 0.05, freeze: true });
    const rimMat = global.createColorMat(scene, "rim", C.WHEEL_RIM, { specular: 0.3, freeze: true });

    const d = radius * 2;
    makeBox(scene, name + "_tire", thickness, d, d, 0, 0, 0, tireMat, pivot);
    makeBox(scene, name + "_rim", thickness + 0.06, d * 0.48, d * 0.48, 0, 0, 0, rimMat, pivot);
    return pivot;
  }

  // ==========================================================================
  // VOXEL VEHICLE BUILDERS (AUTO, SUV, POLICE)
  // Local +Z = Front, Local Y = 0 = Ground Contact
  // ==========================================================================
  function createVehicleModel(scene, type, options) {
    const opts = options || {};
    const C = global.COLORS;
    const root = new BABYLON.TransformNode("veh_" + type + "_" + Math.floor(Math.random() * 1e5), scene);
    const wheels = [];
    let sirenRed = null;
    let sirenBlue = null;
    let sirenRedMat = null;
    let sirenBlueMat = null;

    const matGlass = global.createColorMat(scene, "veh_glass", C.GLASS_TINT, { specular: 0.5, freeze: true });
    const matDark = global.createColorMat(scene, "veh_dark", C.TIRE_BLACK, { specular: 0.1, freeze: true });
    const matHead = global.createColorMat(scene, "veh_head", C.HEADLIGHT, { emissive: C.HEADLIGHT, freeze: true });
    const matTail = global.createColorMat(scene, "veh_tail", C.TAILLIGHT, { emissive: "#aa1111", freeze: true });
    const matTrim = global.createColorMat(scene, "veh_trim", C.WHEEL_RIM, { specular: 0.35, freeze: true });

    let spec;

    if (type === "AUTO") {
      // Iconic Green & Yellow Indian Udaipur Auto-Rickshaw (3-wheeler!)
      const matGreen = global.createColorMat(scene, "auto_green", C.AUTO_GREEN, { specular: 0.2, freeze: true });
      const matYellow = global.createColorMat(scene, "auto_yellow", C.AUTO_YELLOW, { specular: 0.15, freeze: true });
      const matSeat = global.createColorMat(scene, "auto_seat", C.HAVELI_BALCONY, { freeze: true });

      // Lower green body shell & nose cowl
      makeBox(scene, "auto_chassis", 2.2, 0.9, 3.3, 0, 0.9, -0.1, matGreen, root);
      makeBox(scene, "auto_nose", 1.5, 1.05, 0.95, 0, 1.12, 1.45, matGreen, root);
      makeBox(scene, "auto_bumper_f", 1.75, 0.24, 0.25, 0, 0.52, 1.95, matTrim, root);
      makeBox(scene, "auto_bumper_r", 2.25, 0.24, 0.25, 0, 0.52, -1.8, matTrim, root);

      // Yellow trim stripe & passenger bench
      makeBox(scene, "auto_stripe", 2.26, 0.22, 3.1, 0, 1.32, -0.1, matYellow, root);
      makeBox(scene, "auto_seat_r", 1.75, 0.55, 0.75, 0, 1.42, -1.05, matSeat, root);
      makeBox(scene, "auto_seat_f", 0.7, 0.45, 0.55, 0, 1.38, 0.55, matSeat, root);

      // Windshield frame & yellow canopy roof supported by corner pillars
      makeBox(scene, "auto_windshield", 1.55, 0.9, 0.14, 0, 2.02, 1.35, matGlass, root);
      makeBox(scene, "auto_pillar_fl", 0.14, 1.35, 0.14, -0.82, 2.02, 1.32, matYellow, root);
      makeBox(scene, "auto_pillar_fr", 0.14, 1.35, 0.14,  0.82, 2.02, 1.32, matYellow, root);
      makeBox(scene, "auto_pillar_rl", 0.16, 1.35, 0.16, -0.98, 2.02, -1.55, matYellow, root);
      makeBox(scene, "auto_pillar_rr", 0.16, 1.35, 0.16,  0.98, 2.02, -1.55, matYellow, root);
      makeBox(scene, "auto_back_wall", 2.1, 1.15, 0.16, 0, 1.98, -1.62, matGreen, root);
      makeBox(scene, "auto_canopy", 2.28, 0.36, 3.35, 0, 2.76, -0.12, matYellow, root);
      makeBox(scene, "auto_canopy_top", 1.92, 0.18, 2.85, 0, 3.0, -0.14, matYellow, root);

      // Iconic round central headlight & rear taillights
      makeBox(scene, "auto_headlight", 0.44, 0.4, 0.16, 0, 1.05, 1.96, matHead, root);
      makeBox(scene, "auto_tail_l", 0.32, 0.22, 0.12, -0.78, 0.95, -1.78, matTail, root);
      makeBox(scene, "auto_tail_r", 0.32, 0.22, 0.12,  0.78, 0.95, -1.78, matTail, root);

      // 3 Wheels (1 front center, 2 rear)
      wheels.push(makeWheel(scene, "auto_wf", 0.42, 0.32, 0, 0.42, 1.5, root));
      wheels.push(makeWheel(scene, "auto_wrl", 0.45, 0.36, -1.08, 0.45, -1.05, root));
      wheels.push(makeWheel(scene, "auto_wrr", 0.45, 0.36,  1.08, 0.45, -1.05, root));

      spec = {
        name: "AUTO-RICKSHAW",
        halfW: 1.35,
        halfL: 2.1,
        height: 3.1,
        maxSpeed: 28,
        reverseSpeed: 12,
        accel: 24,
        turnSpeed: 2.8
      };
    } else if (type === "POLICE") {
      // Rajasthan Police Patrol SUV / Cruiser with Red & Blue Siren Bar
      const matWhite = global.createColorMat(scene, "pol_white", C.POLICE_WHITE, { specular: 0.25, freeze: true });
      const matNavy = global.createColorMat(scene, "pol_navy", C.POLICE_NAVY, { specular: 0.25, freeze: true });
      const matKhaki = global.createColorMat(scene, "pol_khaki", C.POLICE_KHAKI, { specular: 0.15, freeze: true });

      // Dynamic non-frozen materials for siren flash animation
      sirenRedMat = new BABYLON.StandardMaterial("siren_red_" + Math.random(), scene);
      sirenRedMat.diffuseColor = BABYLON.Color3.FromHexString(C.SIREN_RED);
      sirenRedMat.emissiveColor = new BABYLON.Color3(0.35, 0, 0);

      sirenBlueMat = new BABYLON.StandardMaterial("siren_blue_" + Math.random(), scene);
      sirenBlueMat.diffuseColor = BABYLON.Color3.FromHexString(C.SIREN_BLUE);
      sirenBlueMat.emissiveColor = new BABYLON.Color3(0, 0.12, 0.35);

      // Lower chassis + navy side livery + hood + roof cabin
      makeBox(scene, "pol_body", 2.9, 1.05, 5.4, 0, 1.05, 0, matWhite, root);
      makeBox(scene, "pol_stripe_l", 2.98, 0.34, 4.9, 0, 1.05, 0, matNavy, root);
      makeBox(scene, "pol_khaki_accent", 3.0, 0.14, 4.6, 0, 1.28, 0, matKhaki, root);
      makeBox(scene, "pol_cabin", 2.65, 1.05, 3.15, 0, 2.08, -0.35, matWhite, root);
      makeBox(scene, "pol_windshield", 2.48, 0.82, 0.18, 0, 2.06, 1.24, matGlass, root);
      makeBox(scene, "pol_rear_glass", 2.42, 0.78, 0.16, 0, 2.06, -1.94, matGlass, root);
      makeBox(scene, "pol_side_glass", 2.72, 0.72, 2.45, 0, 2.08, -0.35, matGlass, root);

      // Front police bullbar & grille
      makeBox(scene, "pol_bullbar", 2.4, 0.65, 0.25, 0, 0.92, 2.82, matDark, root);
      makeBox(scene, "pol_grille", 1.8, 0.45, 0.16, 0, 1.08, 2.72, matDark, root);
      makeBox(scene, "pol_bumper_r", 2.96, 0.32, 0.28, 0, 0.65, -2.74, matDark, root);

      // Headlights & taillights
      makeBox(scene, "pol_hl_l", 0.55, 0.34, 0.16, -1.02, 1.15, 2.72, matHead, root);
      makeBox(scene, "pol_hl_r", 0.55, 0.34, 0.16,  1.02, 1.15, 2.72, matHead, root);
      makeBox(scene, "pol_tl_l", 0.55, 0.32, 0.14, -1.04, 1.15, -2.72, matTail, root);
      makeBox(scene, "pol_tl_r", 0.55, 0.32, 0.14,  1.04, 1.15, -2.72, matTail, root);

      // Roof Siren Bar Base + Flashing Red & Blue Light Beacons!
      makeBox(scene, "pol_siren_base", 1.8, 0.14, 0.48, 0, 2.68, 0.2, matDark, root);
      sirenRed = makeBox(scene, "pol_siren_red", 0.68, 0.34, 0.42, -0.5, 2.9, 0.2, sirenRedMat, root);
      sirenBlue = makeBox(scene, "pol_siren_blue", 0.68, 0.34, 0.42, 0.5, 2.9, 0.2, sirenBlueMat, root);

      // 4 Chunky Patrol Wheels
      wheels.push(makeWheel(scene, "pol_wfl", 0.56, 0.42, -1.48, 0.56,  1.65, root));
      wheels.push(makeWheel(scene, "pol_wfr", 0.56, 0.42,  1.48, 0.56,  1.65, root));
      wheels.push(makeWheel(scene, "pol_wrl", 0.56, 0.42, -1.48, 0.56, -1.65, root));
      wheels.push(makeWheel(scene, "pol_wrr", 0.56, 0.42,  1.48, 0.56, -1.65, root));

      spec = {
        name: "POLICE CRUISER",
        halfW: 1.65,
        halfL: 2.85,
        height: 3.1,
        maxSpeed: 36,
        reverseSpeed: 15,
        accel: 28,
        turnSpeed: 2.35
      };
    } else {
      // Bold Royal / Urban Voxel SUV
      const bodyHex = C[opts.colorKey] || C.SUV_CRIMSON;
      const matBody = global.createColorMat(scene, "suv_" + bodyHex, bodyHex, { specular: 0.28, freeze: true });
      const matRoof = global.createColorMat(scene, "suv_roof", C.GUN_DARK, { specular: 0.15, freeze: true });

      // Main SUV chassis, raised hood & cabin
      makeBox(scene, "suv_body", 3.05, 1.12, 5.55, 0, 1.12, 0, matBody, root);
      makeBox(scene, "suv_cabin", 2.82, 1.12, 3.35, 0, 2.22, -0.45, matBody, root);
      makeBox(scene, "suv_roof_rack", 2.45, 0.16, 2.6, 0, 2.86, -0.48, matRoof, root);

      // Tinted windows
      makeBox(scene, "suv_windshield", 2.62, 0.86, 0.16, 0, 2.2, 1.24, matGlass, root);
      makeBox(scene, "suv_rear_glass", 2.52, 0.8, 0.16, 0, 2.2, -2.14, matGlass, root);
      makeBox(scene, "suv_side_glass", 2.88, 0.76, 2.7, 0, 2.2, -0.45, matGlass, root);

      // Front grille, skid bumpers & rear spare tire
      makeBox(scene, "suv_grille", 1.85, 0.56, 0.18, 0, 1.2, 2.78, matDark, root);
      makeBox(scene, "suv_bumper_f", 3.14, 0.34, 0.34, 0, 0.68, 2.82, matDark, root);
      makeBox(scene, "suv_bumper_r", 3.14, 0.34, 0.34, 0, 0.68, -2.82, matDark, root);
      makeBox(scene, "suv_spare", 1.1, 1.1, 0.42, 0, 1.48, -2.96, matDark, root);
      makeBox(scene, "suv_spare_rim", 0.52, 0.52, 0.46, 0, 1.48, -2.96, matTrim, root);

      // Headlights & taillights
      makeBox(scene, "suv_hl_l", 0.55, 0.36, 0.16, -1.12, 1.25, 2.78, matHead, root);
      makeBox(scene, "suv_hl_r", 0.55, 0.36, 0.16,  1.12, 1.25, 2.78, matHead, root);
      makeBox(scene, "suv_tl_l", 0.52, 0.36, 0.16, -1.14, 1.25, -2.78, matTail, root);
      makeBox(scene, "suv_tl_r", 0.52, 0.36, 0.16,  1.14, 1.25, -2.78, matTail, root);

      // 4 Chunky SUV Off-Road Wheels
      wheels.push(makeWheel(scene, "suv_wfl", 0.62, 0.46, -1.56, 0.62,  1.72, root));
      wheels.push(makeWheel(scene, "suv_wfr", 0.62, 0.46,  1.56, 0.62,  1.72, root));
      wheels.push(makeWheel(scene, "suv_wrl", 0.62, 0.46, -1.56, 0.62, -1.72, root));
      wheels.push(makeWheel(scene, "suv_wrr", 0.62, 0.46,  1.56, 0.62, -1.72, root));

      spec = {
        name: "ROYAL SUV",
        halfW: 1.72,
        halfL: 2.95,
        height: 3.15,
        maxSpeed: 34,
        reverseSpeed: 14,
        accel: 25,
        turnSpeed: 2.25
      };
    }

    return {
      root: root,
      type: type,
      name: spec.name,
      wheels: wheels,
      sirenRed: sirenRed,
      sirenBlue: sirenBlue,
      sirenRedMat: sirenRedMat,
      sirenBlueMat: sirenBlueMat,
      halfW: spec.halfW,
      halfL: spec.halfL,
      height: spec.height,
      maxSpeed: spec.maxSpeed,
      reverseSpeed: spec.reverseSpeed,
      accel: spec.accel,
      turnSpeed: spec.turnSpeed,
      setSirenState: function (active, phase) {
        if (!sirenRedMat || !sirenBlueMat) return;
        if (!active) {
          sirenRedMat.emissiveColor.set(0.2, 0, 0);
          sirenBlueMat.emissiveColor.set(0, 0.05, 0.2);
          return;
        }
        const redOn = phase > 0;
        sirenRedMat.emissiveColor.set(redOn ? 1.0 : 0.12, 0, 0);
        sirenBlueMat.emissiveColor.set(0, redOn ? 0.05 : 0.65, redOn ? 0.12 : 1.0);
      }
    };
  }

  // ==========================================================================
  // ARTICULATED VOXEL CHARACTER BUILDER (HERO, NPC, COP)
  // Total height ~3.1 world units; Local +Z = Forward; Y = 0 = Ground
  // ==========================================================================
  function createCharacterModel(scene, role, options) {
    const opts = options || {};
    const C = global.COLORS;
    const uid = role + "_" + Math.floor(Math.random() * 1e6);
    const root = new BABYLON.TransformNode("char_" + uid, scene);

    // Choose character appearance colors by role
    let skinHex = C.SKIN_HERO;
    let torsoHex = C.HERO_JACKET;
    let pantsHex = C.HERO_PANTS;
    let shoeHex = C.TIRE_BLACK;
    let hairHex = C.HAIR_DARK;

    if (role === "COP") {
      skinHex = opts.skin || C.SKIN_LIGHT;
      torsoHex = C.COP_KHAKI;
      pantsHex = C.COP_KHAKI;
      shoeHex = C.COP_BELT;
    } else if (role === "NPC") {
      const idx = opts.variant || 0;
      skinHex = idx % 3 === 0 ? C.SKIN_LIGHT : idx % 3 === 1 ? C.SKIN_HERO : C.SKIN_DEEP;
      torsoHex = C.NPC_COLORS[idx % C.NPC_COLORS.length];
      pantsHex = idx % 2 === 0 ? C.HAVELI_WHITE : C.HERO_PANTS;
    }

    const matSkin = global.createColorMat(scene, "skin_" + skinHex, skinHex, { freeze: true });
    const matTorso = global.createColorMat(scene, "torso_" + torsoHex, torsoHex, { freeze: true });
    const matPants = global.createColorMat(scene, "pants_" + pantsHex, pantsHex, { freeze: true });
    const matShoe = global.createColorMat(scene, "shoe_" + shoeHex, shoeHex, { freeze: true });
    const matHair = global.createColorMat(scene, "hair_" + hairHex, hairHex, { freeze: true });
    const matDark = global.createColorMat(scene, "char_dark", C.GUN_DARK, { freeze: true });
    const matGold = global.createColorMat(scene, "char_gold", C.HERO_GOLD, { specular: 0.5, freeze: true });
    const matMetal = global.createColorMat(scene, "gun_metal", C.GUN_METAL, { specular: 0.4, freeze: true });

    // Articulated body container (for jump/bob vertical bounce)
    const body = new BABYLON.TransformNode("body_" + uid, scene);
    body.parent = root;

    // Legs pivoted at HIPS (y = 1.15) for smooth walking/sprinting animation
    const leftLegPivot = new BABYLON.TransformNode("lleg_" + uid, scene);
    leftLegPivot.position.set(-0.24, 1.15, 0);
    leftLegPivot.parent = body;
    makeBox(scene, "ll_thigh_" + uid, 0.36, 0.92, 0.38, 0, -0.46, 0, matPants, leftLegPivot);
    makeBox(scene, "ll_shoe_" + uid, 0.38, 0.24, 0.5, 0, -1.03, 0.06, matShoe, leftLegPivot);

    const rightLegPivot = new BABYLON.TransformNode("rleg_" + uid, scene);
    rightLegPivot.position.set(0.24, 1.15, 0);
    rightLegPivot.parent = body;
    makeBox(scene, "rl_thigh_" + uid, 0.36, 0.92, 0.38, 0, -0.46, 0, matPants, rightLegPivot);
    makeBox(scene, "rl_shoe_" + uid, 0.38, 0.24, 0.5, 0, -1.03, 0.06, matShoe, rightLegPivot);

    // Torso
    makeBox(scene, "torso_" + uid, 0.96, 1.08, 0.52, 0, 1.69, 0, matTorso, body);

    if (role === "HERO") {
      // Inner black tee stripe + gold gangster chain
      const matShirt = global.createColorMat(scene, "hero_shirt", C.HERO_SHIRT, { freeze: true });
      makeBox(scene, "hero_tee_" + uid, 0.36, 1.04, 0.55, 0, 1.69, 0.01, matShirt, body);
      makeBox(scene, "hero_chain_" + uid, 0.42, 0.12, 0.58, 0, 2.02, 0.02, matGold, body);
    } else if (role === "COP") {
      // Police duty belt + golden chest badge
      const matBelt = global.createColorMat(scene, "cop_belt", C.COP_BELT, { freeze: true });
      makeBox(scene, "cop_belt_" + uid, 1.0, 0.18, 0.56, 0, 1.24, 0, matBelt, body);
      makeBox(scene, "cop_badge_" + uid, 0.16, 0.18, 0.08, -0.24, 1.9, 0.28, matGold, body);
    }

    // Head
    const headPivot = new BABYLON.TransformNode("head_" + uid, scene);
    headPivot.position.set(0, 2.26, 0);
    headPivot.parent = body;
    makeBox(scene, "head_cube_" + uid, 0.72, 0.72, 0.72, 0, 0.38, 0, matSkin, headPivot);

    if (role === "HERO") {
      // Slick voxel hairstyle + dark gangster sunglasses
      makeBox(scene, "hero_hair_" + uid, 0.78, 0.24, 0.78, 0, 0.76, -0.02, matHair, headPivot);
      makeBox(scene, "hero_shades_" + uid, 0.68, 0.18, 0.12, 0, 0.44, 0.36, matDark, headPivot);
    } else if (role === "COP") {
      // Peaked Rajasthan Police Cap + Gold Emblem
      const matCap = global.createColorMat(scene, "cop_cap", C.COP_CAP, { freeze: true });
      makeBox(scene, "cop_cap_top_" + uid, 0.8, 0.24, 0.8, 0, 0.78, 0, matCap, headPivot);
      makeBox(scene, "cop_cap_visor_" + uid, 0.76, 0.08, 0.3, 0, 0.68, 0.44, matDark, headPivot);
      makeBox(scene, "cop_cap_badge_" + uid, 0.14, 0.14, 0.08, 0, 0.79, 0.41, matGold, headPivot);
      // Eyes
      makeBox(scene, "cop_eye_l_" + uid, 0.12, 0.1, 0.08, -0.17, 0.44, 0.35, matDark, headPivot);
      makeBox(scene, "cop_eye_r_" + uid, 0.12, 0.1, 0.08,  0.17, 0.44, 0.35, matDark, headPivot);
    } else {
      // NPC Eyes + Traditional Udaipur Rajasthani Turban (Pagri) on alternating locals!
      makeBox(scene, "npc_eye_l_" + uid, 0.11, 0.09, 0.08, -0.16, 0.43, 0.35, matDark, headPivot);
      makeBox(scene, "npc_eye_r_" + uid, 0.11, 0.09, 0.08,  0.16, 0.43, 0.35, matDark, headPivot);
      if ((opts.variant || 0) % 2 === 0) {
        const turbHex = C.TURBAN_COLORS[(opts.variant || 0) % C.TURBAN_COLORS.length];
        const matTurban = global.createColorMat(scene, "turban_" + turbHex, turbHex, { freeze: true });
        makeBox(scene, "npc_turban_" + uid, 0.84, 0.34, 0.84, 0, 0.82, 0, matTurban, headPivot);
        makeBox(scene, "npc_turban_crest_" + uid, 0.48, 0.18, 0.56, 0, 1.02, 0.04, matTurban, headPivot);
      } else {
        makeBox(scene, "npc_hair_" + uid, 0.76, 0.22, 0.76, 0, 0.76, -0.02, matHair, headPivot);
      }
    }

    // Left Arm pivoted at shoulder (y = 2.12)
    const leftArmPivot = new BABYLON.TransformNode("larm_" + uid, scene);
    leftArmPivot.position.set(-0.66, 2.12, 0);
    leftArmPivot.parent = body;
    makeBox(scene, "la_sleeve_" + uid, 0.32, 0.7, 0.34, 0, -0.35, 0, matTorso, leftArmPivot);
    makeBox(scene, "la_hand_" + uid, 0.28, 0.28, 0.28, 0, -0.82, 0, matSkin, leftArmPivot);

    // Right Arm pivoted at shoulder (holds VOXEL PISTOL / VOXEL SMG)
    const rightArmPivot = new BABYLON.TransformNode("rarm_" + uid, scene);
    rightArmPivot.position.set(0.66, 2.12, 0);
    rightArmPivot.parent = body;
    makeBox(scene, "ra_sleeve_" + uid, 0.32, 0.7, 0.34, 0, -0.35, 0, matTorso, rightArmPivot);
    makeBox(scene, "ra_hand_" + uid, 0.28, 0.28, 0.28, 0, -0.82, 0, matSkin, rightArmPivot);

    // Attached Voxel Weapons (for HERO and COP)
    let pistolNode = null;
    let smgNode = null;
    if (role === "HERO" || role === "COP") {
      pistolNode = new BABYLON.TransformNode("pistol_" + uid, scene);
      pistolNode.position.set(0, -0.86, 0.22);
      pistolNode.parent = rightArmPivot;
      makeBox(scene, "pis_grip_" + uid, 0.14, 0.26, 0.16, 0, -0.06, 0, matDark, pistolNode);
      makeBox(scene, "pis_slide_" + uid, 0.16, 0.16, 0.56, 0, 0.08, 0.2, matMetal, pistolNode);

      if (role === "HERO") {
        smgNode = new BABYLON.TransformNode("smg_" + uid, scene);
        smgNode.position.set(0, -0.86, 0.28);
        smgNode.parent = rightArmPivot;
        makeBox(scene, "smg_body_" + uid, 0.2, 0.24, 0.92, 0, 0.08, 0.32, matDark, smgNode);
        makeBox(scene, "smg_barrel_" + uid, 0.12, 0.12, 0.42, 0, 0.1, 0.9, matMetal, smgNode);
        makeBox(scene, "smg_mag_" + uid, 0.12, 0.42, 0.16, 0, -0.2, 0.45, matMetal, smgNode);
        makeBox(scene, "smg_accent_" + uid, 0.22, 0.08, 0.34, 0, 0.22, 0.28, matGold, smgNode);
        smgNode.setEnabled(false);
      }
    }

    return {
      root: root,
      body: body,
      head: headPivot,
      leftLeg: leftLegPivot,
      rightLeg: rightLegPivot,
      leftArm: leftArmPivot,
      rightArm: rightArmPivot,
      pistolNode: pistolNode,
      smgNode: smgNode,
      walkPhase: Math.random() * Math.PI * 2,
      setWeaponVisual: function (weaponId) {
        if (pistolNode) pistolNode.setEnabled(weaponId === "PISTOL");
        if (smgNode) smgNode.setEnabled(weaponId === "SMG");
      }
    };
  }

  // Smooth articulated leg/arm walking & aiming animation
  function animateCharacter(charModel, speed, dt, isAiming, isAirborne) {
    if (!charModel) return;
    if (isAirborne) {
      charModel.leftLeg.rotation.x = 0.42;
      charModel.rightLeg.rotation.x = -0.35;
      charModel.leftArm.rotation.x = -0.5;
      charModel.rightArm.rotation.x = isAiming ? -1.45 : -0.5;
      return;
    }

    const moving = speed > 0.35;
    if (moving) {
      charModel.walkPhase += dt * Math.min(14, 5.5 + speed * 0.55);
      const swing = Math.sin(charModel.walkPhase) * Math.min(0.82, 0.3 + speed * 0.04);
      charModel.leftLeg.rotation.x = swing;
      charModel.rightLeg.rotation.x = -swing;
      charModel.leftArm.rotation.x = -swing * 0.78;
      charModel.rightArm.rotation.x = isAiming ? -1.48 : swing * 0.78;
      charModel.body.position.y = Math.abs(Math.sin(charModel.walkPhase)) * 0.09;
    } else {
      // Smoothly return limbs to idle stance
      const lerp = Math.min(1, dt * 12);
      charModel.leftLeg.rotation.x *= 1 - lerp;
      charModel.rightLeg.rotation.x *= 1 - lerp;
      charModel.leftArm.rotation.x *= 1 - lerp;
      const targetRightArm = isAiming ? -1.48 : 0;
      charModel.rightArm.rotation.x += (targetRightArm - charModel.rightArm.rotation.x) * lerp;
      charModel.body.position.y *= 1 - lerp;
    }
  }

  // ==========================================================================
  // COLLECTIBLE CASH STASH (₹) 3D VOXEL MODEL
  // ==========================================================================
  function createCashStashModel(scene, name) {
    const C = global.COLORS;
    const root = new BABYLON.TransformNode("cash_" + name, scene);
    const matGreen = global.createColorMat(scene, "cash_green", C.CASH_GREEN, {
      emissive: "#15803d",
      specular: 0.3,
      freeze: true
    });
    const matGold = global.createColorMat(scene, "cash_band", C.CASH_BAND, {
      emissive: "#b45309",
      specular: 0.6,
      freeze: true
    });

    // Stacked glowing rupee bundle + golden strap + floating diamond beacon
    makeBox(scene, name + "_stack1", 1.15, 0.45, 0.72, 0, 0.9, 0, matGreen, root);
    makeBox(scene, name + "_stack2", 1.1, 0.36, 0.68, 0.06, 1.28, 0.04, matGreen, root);
    makeBox(scene, name + "_band", 0.28, 0.85, 0.76, 0, 1.08, 0, matGold, root);
    const gem = makeBox(scene, name + "_gem", 0.42, 0.42, 0.42, 0, 2.05, 0, matGold, root);
    gem.rotation.set(Math.PI / 4, Math.PI / 4, 0);

    return root;
  }

  global.GameModels = {
    createVehicleModel: createVehicleModel,
    createCharacterModel: createCharacterModel,
    animateCharacter: animateCharacter,
    createCashStashModel: createCashStashModel
  };
})(window);
