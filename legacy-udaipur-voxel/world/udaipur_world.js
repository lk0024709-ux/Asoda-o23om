/* ============================================================================
   world/udaipur_world.js
   Procedural Voxel World Builder for Udaipur (1 voxel = 2 world units).
   - Batches static voxels per material via GPU thin instances (thinInstanceSetBuffer)
   - Freezes static materials and mesh world matrices for locked high FPS
   - Set-based spatial collision grid (hitsVoxel) + step/water height queries
   - Landmarks: Lake Pichola, East/West/North/South Roads, Aravalli Hills,
     City Palace with Gold Domes, Stepped Gangaur Ghat, Jag Mandir Island Palace,
     Old-City Havelis with Balconies, and Voxel Trees.
   ============================================================================ */

(function (global) {
  "use strict";

  const VOXEL = global.VOXEL_SIZE || 2;
  const MIN_G = -52;
  const MAX_G = 52;
  const WORLD_LIMIT = MAX_G * VOXEL - 4;
  const WATER_LEVEL_Y = -1.35;

  // Deterministic pseudo-random helper for repeatable Udaipur skyline & trees
  function hash2(x, z) {
    let n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function key3(gx, gy, gz) {
    return gx + "," + gy + "," + gz;
  }

  function key2(gx, gz) {
    return gx + "," + gz;
  }

  class UdaipurWorld {
    constructor(scene) {
      this.scene = scene;
      this.voxelSize = VOXEL;
      this.minGrid = MIN_G;
      this.maxGrid = MAX_G;
      this.worldLimit = WORLD_LIMIT;
      this.waterLevelY = WATER_LEVEL_Y;

      // Spatial collision Set ("gx,gy,gz")
      this.solidSet = new Set();
      // Water columns Set ("gx,gz")
      this.waterSet = new Set();
      // Custom smooth step top-Y overrides ("gx,gz" -> world Y)
      this.stepTopMap = new Map();
      // Highest solid ground/roof gy per ("gx,gz")
      this.columnMaxGy = new Map();

      // Staging map for deduplication & interior culling before thin-instance upload
      this._voxels = new Map();
      // Extra non-unit (e.g., half-height ghat step) thin instances
      this._customVoxels = [];
      // Resulting batched Babylon meshes
      this.staticMeshes = [];
      this.waterShimmerMesh = null;
      this.stats = { totalVoxels: 0, renderedInstances: 0, drawCalls: 0 };

      this._buildAll();
    }

    // ------------------------------------------------------------------------
    // Voxel Staging Helpers
    // ------------------------------------------------------------------------
    setVoxel(gx, gy, gz, matKey, solid) {
      gx = Math.round(gx);
      gy = Math.round(gy);
      gz = Math.round(gz);
      if (gx < MIN_G || gx > MAX_G || gz < MIN_G || gz > MAX_G || gy < -3 || gy > 28) {
        return;
      }
      const k = key3(gx, gy, gz);
      const isSolid = solid !== false;
      this._voxels.set(k, { gx: gx, gy: gy, gz: gz, matKey: matKey, solid: isSolid });
      if (isSolid) {
        this.solidSet.add(k);
      } else {
        this.solidSet.delete(k);
      }
    }

    clearVoxel(gx, gy, gz) {
      gx = Math.round(gx);
      gy = Math.round(gy);
      gz = Math.round(gz);
      const k = key3(gx, gy, gz);
      this._voxels.delete(k);
      this.solidSet.delete(k);
    }

    addHalfVoxel(gx, worldCenterY, gz, sy, matKey, sx, sz) {
      this._customVoxels.push({
        wx: gx * VOXEL,
        wy: worldCenterY,
        wz: gz * VOXEL,
        sx: sx || 1,
        sy: sy || 0.5,
        sz: sz || 1,
        matKey: matKey
      });
    }

    fillBox(x0, y0, z0, x1, y1, z1, matKey, solid) {
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          for (let z = z0; z <= z1; z++) {
            this.setVoxel(x, y, z, matKey, solid);
          }
        }
      }
    }

    clearBox(x0, y0, z0, x1, y1, z1) {
      for (let x = x0; x <= x1; x++) {
        for (let y = y0; y <= y1; y++) {
          for (let z = z0; z <= z1; z++) {
            this.clearVoxel(x, y, z);
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // Geography Predicates
    // ------------------------------------------------------------------------
    isEastRoad(gx, gz) {
      return gx >= 13 && gx <= 19 && gz >= -42 && gz <= 42;
    }

    isWestRoad(gx, gz) {
      return gx >= -40 && gx <= -34 && gz >= -42 && gz <= 42;
    }

    isNorthRoad(gx, gz) {
      return gz >= 28 && gz <= 34 && gx >= -40 && gx <= 42;
    }

    isSouthRoad(gx, gz) {
      return gz >= -34 && gz <= -28 && gx >= -40 && gx <= 42;
    }

    isRoad(gx, gz) {
      return (
        this.isEastRoad(gx, gz) ||
        this.isWestRoad(gx, gz) ||
        this.isNorthRoad(gx, gz) ||
        this.isSouthRoad(gx, gz)
      );
    }

    isJagMandirIsland(gx, gz) {
      const dx = (gx + 13) / 7.2;
      const dz = gz / 8.0;
      return dx * dx + dz * dz <= 1.0;
    }

    isJagMandirBridge(gx, gz) {
      return gx >= -15 && gx <= -11 && gz >= -28 && gz <= -7;
    }

    isGangaurGhatArea(gx, gz) {
      return gx >= 4 && gx <= 12 && gz >= -11 && gz <= 11;
    }

    isLakeBasin(gx, gz) {
      if (gx < -31 || gx > 6 || gz < -24 || gz > 24) return false;
      if (this.isJagMandirIsland(gx, gz)) return false;
      if (gx >= 5 && gx <= 12 && gz >= -11 && gz <= 11) return false;
      const dx = (gx + 12.5) / 18.4;
      const dz = gz / 23.6;
      const wave = 0.055 * Math.sin(gz * 0.27) + 0.045 * Math.cos(gx * 0.23);
      return dx * dx + dz * dz + wave <= 1.0;
    }

    // ------------------------------------------------------------------------
    // Master Build Sequence
    // ------------------------------------------------------------------------
    _buildAll() {
      this._buildTerrainAndLake();
      this._buildRoadsAndStreets();
      this._buildGangaurGhat();
      this._buildJagMandirAndBridge();
      this._buildCityPalace();
      this._buildOldCityHavelis();
      this._buildAravalliHills();
      this._buildTreesAndProps();
      this._finalizeThinInstances();
      this._createWaterShimmerOverlay();
    }

    // ------------------------------------------------------------------------
    // 1. Base Ground Terrain & Lake Pichola Basin
    // ------------------------------------------------------------------------
    _buildTerrainAndLake() {
      for (let gx = MIN_G; gx <= MAX_G; gx++) {
        for (let gz = MIN_G; gz <= MAX_G; gz++) {
          if (this.isLakeBasin(gx, gz)) {
            this.waterSet.add(key2(gx, gz));
            // Lakebed & shallow/deep turquoise water voxels at gy = -1
            const edgeDist = Math.hypot((gx + 12.5) / 18.4, gz / 23.6);
            const nearIsland = Math.hypot((gx + 13) / 8.5, gz / 9.4) < 1.15;
            const waterMat =
              edgeDist > 0.87 || nearIsland
                ? "WATER_SHALLOW"
                : edgeDist > 0.65
                ? "WATER_MID"
                : "WATER_DEEP";
            this.setVoxel(gx, -1, gz, waterMat, false);
          } else {
            // Land base slab at gy = 0 (top surface at y = 0)
            let groundMat = "GROUND_SAND";
            if (gx >= -33 && gx <= 12 && gz >= -27 && gz <= 27) {
              // Scenic lakeside cobblestone / marble promenade around Pichola
              groundMat = (gx + gz) % 2 === 0 ? "SIDEWALK" : "COBBLESTONE";
            } else if (gx >= 20 && gx <= 44 && gz >= -18 && gz <= 18) {
              // Royal sandstone terrace around City Palace
              groundMat = "PALACE_STONE";
            } else if (gx <= -41 || gx >= 45 || gz <= -44 || gz >= 44) {
              groundMat = hash2(gx, gz) > 0.45 ? "HILL_OCHRE" : "HILL_GRASS";
            } else {
              groundMat = (gx + gz) % 3 === 0 ? "SIDEWALK" : "GROUND_SAND";
            }
            this.setVoxel(gx, 0, gz, groundMat, true);
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 2. East / West / North / South Roads + Intersections + Lamps
    // ------------------------------------------------------------------------
    _buildRoadsAndStreets() {
      for (let gx = MIN_G; gx <= MAX_G; gx++) {
        for (let gz = MIN_G; gz <= MAX_G; gz++) {
          const eRoad = this.isEastRoad(gx, gz);
          const wRoad = this.isWestRoad(gx, gz);
          const nRoad = this.isNorthRoad(gx, gz);
          const sRoad = this.isSouthRoad(gx, gz);

          if (!(eRoad || wRoad || nRoad || sRoad)) continue;

          const isIntersection = (eRoad || wRoad) && (nRoad || sRoad);
          let roadMat = "ROAD_ASPHALT";

          if (isIntersection) {
            // Crisp zebra crosswalk border edges
            const onEdge =
              ((gx === 13 || gx === 19 || gx === -40 || gx === -34) && gz % 2 === 0) ||
              ((gz === 28 || gz === 34 || gz === -34 || gz === -28) && gx % 2 === 0);
            roadMat = onEdge ? "ROAD_CROSSWALK" : "ROAD_ASPHALT";
          } else {
            // Dashed yellow centerlines
            if ((eRoad && gx === 16 && Math.abs(gz) % 4 < 2) ||
                (wRoad && gx === -37 && Math.abs(gz) % 4 < 2) ||
                (nRoad && gz === 31 && Math.abs(gx) % 4 < 2) ||
                (sRoad && gz === -31 && Math.abs(gx) % 4 < 2)) {
              roadMat = "ROAD_LINE";
            }
          }

          this.waterSet.delete(key2(gx, gz));
          this.setVoxel(gx, 0, gz, roadMat, true);
        }
      }

      // Sandstone curbs bordering main roads (kept flush at gy=0 with sidewalk tone)
      const curbCols = [12, 20, -41, -33];
      for (let gz = -42; gz <= 42; gz++) {
        for (let i = 0; i < curbCols.length; i++) {
          const cx = curbCols[i];
          if (!this.isRoad(cx, gz) && !this.waterSet.has(key2(cx, gz))) {
            this.setVoxel(cx, 0, gz, "SIDEWALK", true);
          }
        }
      }
      const curbRows = [27, 35, -27, -35];
      for (let gx = -40; gx <= 42; gx++) {
        for (let i = 0; i < curbRows.length; i++) {
          const cz = curbRows[i];
          if (!this.isRoad(gx, cz) && !this.waterSet.has(key2(gx, cz))) {
            this.setVoxel(gx, 0, cz, "SIDEWALK", true);
          }
        }
      }

      // Heritage streetlamps at key road corners (placed safely on sidewalk curbs)
      const lampSpots = [
        [12, 26], [20, 26], [12, -26], [20, -26],
        [20, 14], [20, -14], [12, 16], [12, -16],
        [-33, 26], [-33, -26], [-33, 0], [-41, 16], [-41, -16],
        [0, 27], [-20, 27], [0, -27], [-24, -27]
      ];
      for (let i = 0; i < lampSpots.length; i++) {
        const lx = lampSpots[i][0];
        const lz = lampSpots[i][1];
        if (this.isRoad(lx, lz) || this.waterSet.has(key2(lx, lz))) continue;
        this.setVoxel(lx, 1, lz, "LAMP_POST", true);
        this.setVoxel(lx, 2, lz, "LAMP_POST", true);
        this.setVoxel(lx, 3, lz, "LAMP_POST", true);
        this.setVoxel(lx, 4, lz, "LAMP_GLOW", true);
      }
    }

    // ------------------------------------------------------------------------
    // 3. Stepped Gangaur Ghat (East Shore of Lake Pichola)
    // ------------------------------------------------------------------------
    _buildGangaurGhat() {
      // Main whitewashed marble promenade (gx: 8..12, gz: -11..11)
      for (let gx = 8; gx <= 12; gx++) {
        for (let gz = -11; gz <= 11; gz++) {
          this.waterSet.delete(key2(gx, gz));
          const tile = (gx + gz) % 2 === 0 ? "GHAT_MARBLE" : "GHAT_STEP";
          this.setVoxel(gx, 0, gz, tile, true);
        }
      }

      // Descending stepped marble terraces into Lake Pichola (gx = 7, 6, 5, 4)
      for (let gz = -10; gz <= 10; gz++) {
        // Step 1 (gx = 7): top at y = -0.35
        this.waterSet.delete(key2(7, gz));
        this.clearVoxel(7, 0, gz);
        this.setVoxel(7, -1, gz, "GHAT_MARBLE", true);
        this.addHalfVoxel(7, -0.95, gz, 0.6, "GHAT_MARBLE");
        this.stepTopMap.set(key2(7, gz), -0.35);

        // Step 2 (gx = 6): top at y = -0.85
        this.waterSet.delete(key2(6, gz));
        this.clearVoxel(6, 0, gz);
        this.setVoxel(6, -1, gz, "GHAT_STEP", true);
        this.addHalfVoxel(6, -1.2, gz, 0.35, "GHAT_STEP");
        this.stepTopMap.set(key2(6, gz), -0.85);

        // Step 3 (gx = 5): shoreline wet marble ledge right at water edge
        this.waterSet.delete(key2(5, gz));
        this.clearVoxel(5, 0, gz);
        this.setVoxel(5, -1, gz, "GHAT_MARBLE", true);
        this.stepTopMap.set(key2(5, gz), -1.2);
      }

      // Flanking marble ghat chhatri kiosks (North & South ends of Gangaur Ghat)
      const ghatChhatriZ = [-10, 10];
      for (let i = 0; i < ghatChhatriZ.length; i++) {
        const cz = ghatChhatriZ[i];
        // Low raised stone plinth
        this.fillBox(8, 1, cz - 1, 10, 1, cz + 1, "GHAT_MARBLE", true);
        // 4 slim pillars on corners -> open pavilion
        this.setVoxel(8, 2, cz - 1, "PALACE_CREAM", true);
        this.setVoxel(10, 2, cz - 1, "PALACE_CREAM", true);
        this.setVoxel(8, 2, cz + 1, "PALACE_CREAM", true);
        this.setVoxel(10, 2, cz + 1, "PALACE_CREAM", true);
        this.setVoxel(8, 3, cz - 1, "PALACE_CREAM", true);
        this.setVoxel(10, 3, cz - 1, "PALACE_CREAM", true);
        this.setVoxel(8, 3, cz + 1, "PALACE_CREAM", true);
        this.setVoxel(10, 3, cz + 1, "PALACE_CREAM", true);
        // Roof & mini golden dome finial
        this.fillBox(8, 4, cz - 1, 10, 4, cz + 1, "PALACE_TRIM", true);
        this.setVoxel(9, 5, cz, "GOLD_DOME", true);
      }

      // Iconic Gangaur Ghat Triple-Arched Gateway (Tripolia Ghat Arch at gx = 10, gz = -5..5)
      // Pillars at gz = -5, -2, +2, +5 — leaves 3 wide open walkthrough arches!
      const pillarsZ = [-5, -2, 2, 5];
      for (let i = 0; i < pillarsZ.length; i++) {
        const pz = pillarsZ[i];
        for (let y = 1; y <= 4; y++) {
          this.setVoxel(10, y, pz, "GHAT_MARBLE", true);
        }
      }
      // Arch lintel & ornate Rajput crest
      this.fillBox(10, 5, -5, 10, 5, 5, "PALACE_CREAM", true);
      this.fillBox(10, 6, -4, 10, 6, 4, "PALACE_STONE", true);
      this.setVoxel(10, 7, 0, "GOLD_DOME", true);
      this.setVoxel(10, 7, -3, "AWNING_SAFFRON", true);
      this.setVoxel(10, 7, 3, "AWNING_MAGENTA", true);

      // Traditional Rajasthani Shikara / Lake Boat moored peacefully beside Gangaur Ghat!
      for (let bz = -3; bz <= 2; bz++) {
        this.setVoxel(2, -1, bz, "BOAT_WOOD", true);
        this.setVoxel(3, -1, bz, "BOAT_WOOD", true);
      }
      this.setVoxel(2, 0, -2, "BOAT_WOOD", true);
      this.setVoxel(3, 0, -2, "BOAT_WOOD", true);
      this.setVoxel(2, 0, 1, "BOAT_WOOD", true);
      this.setVoxel(3, 0, 1, "BOAT_WOOD", true);
      this.fillBox(2, 1, -2, 3, 1, 1, "BOAT_CANOPY", true);
      this.setVoxel(2, 0, 2, "LAMP_GLOW", true);
    }

    // ------------------------------------------------------------------------
    // 4. Jag Mandir Island Palace & Arched Stone Bridge
    // ------------------------------------------------------------------------
    _buildJagMandirAndBridge() {
      // Island marble & sandstone foundation (gx: -20..-6, gz: -8..8)
      for (let gx = -20; gx <= -6; gx++) {
        for (let gz = -8; gz <= 8; gz++) {
          if (!this.isJagMandirIsland(gx, gz)) continue;
          this.waterSet.delete(key2(gx, gz));
          // Retaining marble island wall rising out of Lake Pichola
          this.setVoxel(gx, -1, gz, "JAG_SANDSTONE", true);
          const isGarden = Math.abs(gx + 13) <= 4 && Math.abs(gz) <= 5 && (Math.abs(gx + 13) >= 2 || Math.abs(gz) >= 3);
          this.setVoxel(gx, 0, gz, isGarden ? "JAG_GARDEN" : "JAG_MARBLE", true);
        }
      }

      // Perimeter marble balustrade posts around Jag Mandir terrace (leaving South bridge open)
      for (let gx = -19; gx <= -7; gx++) {
        for (let gz = -7; gz <= 7; gz++) {
          if (!this.isJagMandirIsland(gx, gz)) continue;
          const onRim =
            !this.isJagMandirIsland(gx + 1, gz) ||
            !this.isJagMandirIsland(gx - 1, gz) ||
            !this.isJagMandirIsland(gx, gz + 1) ||
            !this.isJagMandirIsland(gx, gz - 1);
          if (onRim && !(gz <= -6 && gx >= -15 && gx <= -11)) {
            if ((gx + gz) % 2 === 0) {
              this.setVoxel(gx, 1, gz, "JAG_MARBLE", true);
            }
          }
        }
      }

      // Central Gul Mahal Domed Pavilion (centered at gx = -13, gz = 0, open walkthrough core!)
      // Four grand corner piers
      const corners = [[-16, -2], [-10, -2], [-16, 4], [-10, 4]];
      for (let i = 0; i < corners.length; i++) {
        const cx = corners[i][0];
        const cz = corners[i][1];
        for (let y = 1; y <= 4; y++) {
          this.setVoxel(cx, y, cz, "JAG_SANDSTONE", true);
        }
      }
      // Back north decorative palace screen wall with arched window openings
      this.fillBox(-15, 1, 4, -11, 4, 4, "JAG_MARBLE", true);
      this.clearBox(-14, 1, 4, -12, 3, 4);
      // Pavilion roof cornice & layered Gul Mahal dome
      this.fillBox(-16, 5, -2, -10, 5, 4, "JAG_SANDSTONE", true);
      this.fillBox(-15, 6, -1, -11, 6, 3, "JAG_MARBLE", true);
      this.fillBox(-14, 7, 0, -12, 7, 2, "JAG_ROOF", true);
      this.setVoxel(-13, 8, 1, "GOLD_DOME", true);
      this.setVoxel(-13, 9, 1, "GOLD_BRIGHT", true);

      // Flanking Elephant-Gate corner chhatris on Jag Mandir's East & West wings
      const wingX = [-18, -8];
      for (let i = 0; i < wingX.length; i++) {
        const wx = wingX[i];
        this.fillBox(wx, 1, -1, wx, 3, -1, "JAG_MARBLE", true);
        this.fillBox(wx, 1, 1, wx, 3, 1, "JAG_MARBLE", true);
        this.fillBox(wx, 4, -1, wx, 4, 1, "JAG_SANDSTONE", true);
        this.setVoxel(wx, 5, 0, "GOLD_DOME", true);
      }

      // Scenic Arched Stone Bridge / Causeway linking South Road (gz = -28) to Jag Mandir (gz = -7)
      for (let gz = -28; gz <= -7; gz++) {
        for (let gx = -15; gx <= -11; gx++) {
          this.waterSet.delete(key2(gx, gz));
          const isCenter = gx === -13 && Math.abs(gz) % 3 === 0;
          this.setVoxel(gx, 0, gz, isCenter ? "PALACE_CREAM" : "BRIDGE_STONE", true);
        }
        // Bridge piers plunging into Lake Pichola every 5 voxels
        if (Math.abs(gz) % 5 === 0) {
          this.setVoxel(-15, -1, gz, "BRIDGE_STONE", true);
          this.setVoxel(-11, -1, gz, "BRIDGE_STONE", true);
        }
        // Decorative low stone lanterns on outer railings (outside drivable deck at gx = -16, -10)
        if (Math.abs(gz) % 4 === 0 && gz > -27 && gz < -8) {
          this.setVoxel(-16, 0, gz, "BRIDGE_STONE", true);
          this.setVoxel(-16, 1, gz, "GHAT_RAIL", true);
          this.setVoxel(-16, 2, gz, "LAMP_GLOW", true);
          this.setVoxel(-10, 0, gz, "BRIDGE_STONE", true);
          this.setVoxel(-10, 1, gz, "GHAT_RAIL", true);
          this.setVoxel(-10, 2, gz, "LAMP_GLOW", true);
        }
      }
    }

    // ------------------------------------------------------------------------
    // 5. City Palace with Gold Domes (Grand East Royal Complex)
    // ------------------------------------------------------------------------
    _buildCityPalace() {
      // Royal forecourt flagstones (gx: 20..34, gz: -16..16)
      for (let gx = 20; gx <= 44; gx++) {
        for (let gz = -17; gz <= 17; gz++) {
          const checker = (gx + gz) % 2 === 0 ? "PALACE_STONE" : "PALACE_CREAM";
          this.setVoxel(gx, 0, gz, checker, true);
        }
      }

      // Front Royal Perimeter Wall & Grand Open Tripolia Gateway at gx = 24
      this.fillBox(24, 1, -16, 25, 6, 16, "PALACE_STONE", true);
      // Wide grand archway opening into royal inner courtyard (gz: -3..3, y: 1..4)
      this.clearBox(24, 1, -3, 25, 4, 3);
      // Arch trim & golden crest over Tripolia Gate
      this.fillBox(24, 5, -4, 25, 5, 4, "PALACE_TRIM", true);
      this.fillBox(24, 7, -3, 25, 7, 3, "PALACE_CREAM", true);
      this.setVoxel(24, 8, 0, "GOLD_DOME", true);
      this.setVoxel(24, 8, -3, "GOLD_DOME", true);
      this.setVoxel(24, 8, 3, "GOLD_DOME", true);

      // Battlement crenellations along front wall
      for (let gz = -16; gz <= 16; gz += 2) {
        if (Math.abs(gz) > 4) {
          this.setVoxel(24, 7, gz, "PALACE_CREAM", true);
        }
      }

      // North & South Palace Courtyard Wings (leaving open inner courtyard gx: 26..33, gz: -9..9)
      this.fillBox(26, 1, 10, 43, 9, 16, "PALACE_STONE", true);
      this.fillBox(26, 1, -16, 43, 9, -10, "PALACE_STONE", true);

      // Grand Main Eastern Royal Palace Facade (gx: 34..43, gz: -16..16)
      // Tier 1: Monumental Base (y = 1..6)
      this.fillBox(34, 1, -16, 43, 6, 16, "PALACE_STONE", true);
      // Tier 2: Ornate Ivory Royal Halls (y = 7..11)
      this.fillBox(35, 7, -14, 43, 11, 14, "PALACE_CREAM", true);
      // Tier 3: Upper Zenana Crown (y = 12..14)
      this.fillBox(36, 12, -8, 42, 14, 8, "PALACE_CREAM", true);

      // Decorative trim bands across the palace facade
      for (let gz = -16; gz <= 16; gz++) {
        this.setVoxel(34, 6, gz, "PALACE_TRIM", true);
        if (Math.abs(gz) <= 14) {
          this.setVoxel(35, 11, gz, "PALACE_TRIM", true);
        }
      }

      // Arched Jharokha Windows & Projecting Balconies facing Lake Pichola & Courtyard
      for (let gz = -12; gz <= 12; gz += 4) {
        // Lower arched niches
        this.setVoxel(34, 2, gz, "PALACE_ARCH_SHADOW", true);
        this.setVoxel(34, 3, gz, "HAVELI_WINDOW_LIT", true);
        // Second-floor protruding carved jharokha balconies
        this.setVoxel(34, 7, gz - 1, "PALACE_TRIM", true);
        this.setVoxel(34, 7, gz,     "PALACE_TRIM", true);
        this.setVoxel(34, 7, gz + 1, "PALACE_TRIM", true);
        this.setVoxel(35, 8, gz,     "HAVELI_WINDOW_LIT", true);
        this.setVoxel(35, 9, gz,     "HAVELI_WINDOW", true);
        this.setVoxel(34, 10, gz,    "PALACE_CREAM", true);
      }

      // Courtyard inner wing windows
      for (let gx = 27; gx <= 33; gx += 3) {
        this.setVoxel(gx, 3, 10, "HAVELI_WINDOW_LIT", true);
        this.setVoxel(gx, 6, 10, "HAVELI_WINDOW", true);
        this.setVoxel(gx, 3, -10, "HAVELI_WINDOW_LIT", true);
        this.setVoxel(gx, 6, -10, "HAVELI_WINDOW", true);
      }

      // 5 Iconic Gleaming GOLD DOMES crowning City Palace!
      // Central Sovereign Gold Dome (tallest landmark in Udaipur!)
      this._buildGoldDome(39, 15, 0, 3);
      // Four Corner / Flanking Royal Turret Gold Domes
      this._buildGoldDome(38, 12, -11, 2);
      this._buildGoldDome(38, 12, 11, 2);
      this._buildGoldDome(27, 10, -13, 2);
      this._buildGoldDome(27, 10, 13, 2);

      // Decorative courtyard lotus fountain centerpiece (compact, walkable around)
      this.fillBox(30, 1, -1, 30, 1, 1, "GHAT_MARBLE", true);
      this.setVoxel(30, 1, 0, "WATER_SHIMMER", true);
      this.setVoxel(30, 2, 0, "GOLD_BRIGHT", true);
    }

    _buildGoldDome(cx, baseY, cz, radius) {
      // Ivory turret drum base
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) + Math.abs(dz) <= radius + 1) {
            this.setVoxel(cx + dx, baseY, cz + dz, "PALACE_CREAM", true);
          }
        }
      }
      // Layered golden dome tiers
      for (let layer = 1; layer <= radius + 1; layer++) {
        const r = Math.max(0, radius - layer + 1);
        const mat = layer >= radius ? "GOLD_BRIGHT" : "GOLD_DOME";
        for (let dx = -r; dx <= r; dx++) {
          for (let dz = -r; dz <= r; dz++) {
            if (dx * dx + dz * dz <= r * r + 0.5) {
              this.setVoxel(cx + dx, baseY + layer, cz + dz, mat, true);
            }
          }
        }
      }
      // Golden kalash spire
      this.setVoxel(cx, baseY + radius + 2, cz, "GOLD_BRIGHT", true);
    }

    // ------------------------------------------------------------------------
    // 6. Old-City Havelis with Protruding Jharokha Balconies
    // ------------------------------------------------------------------------
    _buildOldCityHavelis() {
      const haveliSpecs = [
        // North Bazaar Quarter (facing South onto North Road gz = 34)
        { x0: -28, z0: 36, w: 7, d: 7, h: 7,  wall: "HAVELI_WHITE",      trim: "PALACE_TRIM",       face: "S", awning: "AWNING_SAFFRON" },
        { x0: -19, z0: 36, w: 8, d: 8, h: 9,  wall: "HAVELI_PEACH",      trim: "HAVELI_WHITE",      face: "S", awning: "AWNING_TEAL" },
        { x0: -9,  z0: 36, w: 7, d: 7, h: 8,  wall: "HAVELI_BLUE",       trim: "HAVELI_WHITE",      face: "S", awning: "AWNING_MAGENTA" },
        { x0: 2,   z0: 36, w: 8, d: 8, h: 10, wall: "HAVELI_OCHRE",      trim: "PALACE_CREAM",      face: "S", awning: "AWNING_SAFFRON" },
        { x0: 22,  z0: 36, w: 7, d: 8, h: 8,  wall: "HAVELI_PINK",       trim: "HAVELI_WHITE",      face: "S", awning: "AWNING_TEAL" },
        { x0: 31,  z0: 36, w: 8, d: 8, h: 9,  wall: "HAVELI_TERRACOTTA", trim: "PALACE_STONE",      face: "S", awning: "AWNING_SAFFRON" },

        // North-East Heritage Block (between City Palace & North Road, facing West onto East Road)
        { x0: 22,  z0: 19, w: 8, d: 7, h: 9,  wall: "HAVELI_WHITE",      trim: "HAVELI_BALCONY",    face: "W", awning: "AWNING_MAGENTA" },
        { x0: 32,  z0: 19, w: 9, d: 7, h: 10, wall: "HAVELI_OCHRE",      trim: "PALACE_CREAM",      face: "N", awning: "AWNING_SAFFRON" },

        // South-East Heritage Block (between City Palace & South Road)
        { x0: 22,  z0: -26, w: 8, d: 7, h: 8, wall: "HAVELI_PEACH",      trim: "HAVELI_WHITE",      face: "W", awning: "AWNING_TEAL" },
        { x0: 32,  z0: -26, w: 9, d: 7, h: 9, wall: "HAVELI_BLUE",       trim: "PALACE_CREAM",      face: "S", awning: "AWNING_MAGENTA" },

        // South Old-City Bazaar Quarter (facing North onto South Road gz = -34)
        { x0: -21, z0: -44, w: 7, d: 8, h: 7, wall: "HAVELI_WHITE",      trim: "HAVELI_BALCONY",    face: "N", awning: "AWNING_SAFFRON" },
        { x0: -10, z0: -44, w: 8, d: 8, h: 9, wall: "HAVELI_PINK",       trim: "PALACE_CREAM",      face: "N", awning: "AWNING_TEAL" },
        { x0: 0,   z0: -44, w: 8, d: 8, h: 8, wall: "HAVELI_OCHRE",      trim: "HAVELI_WHITE",      face: "N", awning: "AWNING_MAGENTA" },
        { x0: 22,  z0: -44, w: 8, d: 8, h: 9, wall: "HAVELI_TERRACOTTA", trim: "PALACE_STONE",      face: "N", awning: "AWNING_SAFFRON" },
        { x0: 32,  z0: -44, w: 8, d: 8, h: 8, wall: "HAVELI_WHITE",      trim: "PALACE_TRIM",       face: "N", awning: "AWNING_TEAL" }
      ];

      for (let i = 0; i < haveliSpecs.length; i++) {
        this._buildSingleHaveli(haveliSpecs[i]);
      }
    }

    _buildSingleHaveli(h) {
      const x1 = h.x0 + h.w - 1;
      const z1 = h.z0 + h.d - 1;

      // Solid multi-story masonry shell (interior occluded automatically on thin-instance build)
      this.fillBox(h.x0, 1, h.z0, x1, h.h, z1, h.wall, true);

      // Rooftop terrace parapet wall & decorative corner finials
      for (let gx = h.x0; gx <= x1; gx++) {
        this.setVoxel(gx, h.h + 1, h.z0, h.trim, true);
        this.setVoxel(gx, h.h + 1, z1, h.trim, true);
      }
      for (let gz = h.z0; gz <= z1; gz++) {
        this.setVoxel(h.x0, h.h + 1, gz, h.trim, true);
        this.setVoxel(x1, h.h + 1, gz, h.trim, true);
      }
      this.setVoxel(h.x0, h.h + 2, h.z0, "PALACE_TRIM", true);
      this.setVoxel(x1, h.h + 2, h.z0, "PALACE_TRIM", true);
      this.setVoxel(h.x0, h.h + 2, z1, "PALACE_TRIM", true);
      this.setVoxel(x1, h.h + 2, z1, "PALACE_TRIM", true);

      // Decorative Rajasthani rooftop mini-chhatri on taller havelis
      if (h.h >= 9) {
        const mx = Math.floor((h.x0 + x1) / 2);
        const mz = Math.floor((h.z0 + z1) / 2);
        this.setVoxel(mx - 1, h.h + 1, mz - 1, h.trim, true);
        this.setVoxel(mx + 1, h.h + 1, mz - 1, h.trim, true);
        this.setVoxel(mx - 1, h.h + 1, mz + 1, h.trim, true);
        this.setVoxel(mx + 1, h.h + 1, mz + 1, h.trim, true);
        this.fillBox(mx - 1, h.h + 2, mz - 1, mx + 1, h.h + 2, mz + 1, "PALACE_TRIM", true);
        this.setVoxel(mx, h.h + 3, mz, "GOLD_DOME", true);
      }

      // Facade windows, bazaar awning & protruding Jharokha Balconies!
      const isZFace = h.face === "S" || h.face === "N";
      const faceCoord =
        h.face === "S" ? h.z0 :
        h.face === "N" ? z1 :
        h.face === "W" ? h.x0 : x1;
      const outDir = (h.face === "S" || h.face === "W") ? -1 : 1;

      if (isZFace) {
        const midX = Math.floor((h.x0 + x1) / 2);
        // Ground-floor recessed doorway & colorful cloth awning
        this.setVoxel(midX, 1, faceCoord, "PALACE_ARCH_SHADOW", true);
        this.setVoxel(midX, 2, faceCoord, "PALACE_ARCH_SHADOW", true);
        for (let gx = midX - 1; gx <= midX + 1; gx++) {
          this.setVoxel(gx, 3, faceCoord + outDir, h.awning, true);
        }

        // Upper-story windows + protruding Jharokha balconies
        for (let floorY = 4; floorY <= h.h - 2; floorY += 3) {
          for (let gx = h.x0 + 1; gx <= x1 - 1; gx += 2) {
            const lit = hash2(gx + floorY, faceCoord) > 0.42;
            this.setVoxel(gx, floorY + 1, faceCoord, lit ? "HAVELI_WINDOW_LIT" : "HAVELI_WINDOW", true);
          }
          // Protruding carved balcony slab & balustrade rail
          for (let gx = midX - 2; gx <= midX + 2; gx++) {
            if (gx > h.x0 && gx < x1) {
              this.setVoxel(gx, floorY, faceCoord + outDir, "HAVELI_BALCONY", true);
              if (gx === midX - 2 || gx === midX || gx === midX + 2) {
                this.setVoxel(gx, floorY + 1, faceCoord + outDir, h.trim, true);
              }
            }
          }
        }
      } else {
        const midZ = Math.floor((h.z0 + z1) / 2);
        this.setVoxel(faceCoord, 1, midZ, "PALACE_ARCH_SHADOW", true);
        this.setVoxel(faceCoord, 2, midZ, "PALACE_ARCH_SHADOW", true);
        for (let gz = midZ - 1; gz <= midZ + 1; gz++) {
          this.setVoxel(faceCoord + outDir, 3, gz, h.awning, true);
        }

        for (let floorY = 4; floorY <= h.h - 2; floorY += 3) {
          for (let gz = h.z0 + 1; gz <= z1 - 1; gz += 2) {
            const lit = hash2(faceCoord, gz + floorY) > 0.42;
            this.setVoxel(faceCoord, floorY + 1, gz, lit ? "HAVELI_WINDOW_LIT" : "HAVELI_WINDOW", true);
          }
          for (let gz = midZ - 2; gz <= midZ + 2; gz++) {
            if (gz > h.z0 && gz < z1) {
              this.setVoxel(faceCoord + outDir, floorY, gz, "HAVELI_BALCONY", true);
              if (gz === midZ - 2 || gz === midZ || gz === midZ + 2) {
                this.setVoxel(faceCoord + outDir, floorY + 1, gz, h.trim, true);
              }
            }
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 7. Aravalli Hills (Western Mountain Range, Spurs & Sajjangarh Crown)
    // ------------------------------------------------------------------------
    _buildAravalliHills() {
      for (let gx = MIN_G; gx <= MAX_G; gx++) {
        for (let gz = MIN_G; gz <= MAX_G; gz++) {
          if (this.isRoad(gx, gz)) continue;

          let hillHeight = 0;

          // Dramatic Western Aravalli Ridge (gx: -52..-43)
          if (gx <= -43) {
            const depth = (-42 - gx) / 10; // 0.1 to 1.0
            const ridgeWave =
              0.55 +
              0.3 * Math.sin(gz * 0.12 + 0.6) +
              0.2 * Math.cos(gz * 0.25 - gx * 0.18);
            hillHeight = Math.max(hillHeight, Math.floor(depth * 14 * ridgeWave));
          }

          // North-West Aravalli Spur (gx: -52..-32, gz: 38..52)
          if (gx <= -31 && gz >= 37) {
            const dx = (-30 - gx) / 22;
            const dz = (gz - 36) / 16;
            const d = Math.min(1, Math.hypot(dx, dz) * 0.85);
            hillHeight = Math.max(hillHeight, Math.floor(d * 10 * (0.7 + 0.3 * Math.sin(gx * 0.22))));
          }

          // South-West Aravalli Spur (gx: -52..-25, gz: -52..-37)
          if (gx <= -24 && gz <= -37) {
            const dx = (-23 - gx) / 29;
            const dz = (-36 - gz) / 16;
            const d = Math.min(1, Math.hypot(dx, dz) * 0.85);
            hillHeight = Math.max(hillHeight, Math.floor(d * 11 * (0.7 + 0.3 * Math.cos(gx * 0.21))));
          }

          // Distant Eastern Backdrop Hills behind City Palace (gx: 46..52)
          if (gx >= 46) {
            const depth = (gx - 45) / 7;
            const wave = 0.65 + 0.35 * Math.sin(gz * 0.16);
            hillHeight = Math.max(hillHeight, Math.floor(depth * 9 * wave));
          }

          // Far North & Far South outer rock boundary ridge
          if (Math.abs(gz) >= 47 && gx > -43 && gx < 46) {
            const depth = (Math.abs(gz) - 46) / 6;
            const wave = 0.6 + 0.4 * Math.cos(gx * 0.19);
            hillHeight = Math.max(hillHeight, Math.floor(depth * 6 * wave));
          }

          if (hillHeight <= 0) continue;

          for (let y = 1; y <= hillHeight; y++) {
            let mat = "HILL_ROCK";
            if (y === hillHeight) {
              mat = hillHeight >= 10 ? "HILL_PEAK" : hash2(gx, gz) > 0.38 ? "HILL_GRASS" : "HILL_OCHRE";
            } else if (y > hillHeight - 3) {
              mat = "HILL_OCHRE";
            }
            this.setVoxel(gx, y, gz, mat, true);
          }
        }
      }

      // Sajjangarh (Monsoon Palace) miniature hilltop silhouette perched on the Western Aravalli peak!
      const px = -49;
      const pz = 5;
      const peakY = 12;
      this.fillBox(px - 2, peakY - 2, pz - 3, px + 2, peakY, pz + 3, "HILL_PEAK", true);
      this.fillBox(px - 1, peakY + 1, pz - 2, px + 1, peakY + 3, pz + 2, "PALACE_CREAM", true);
      this.setVoxel(px, peakY + 4, pz, "GOLD_DOME", true);
      this.setVoxel(px, peakY + 4, pz - 2, "PALACE_TRIM", true);
      this.setVoxel(px, peakY + 4, pz + 2, "PALACE_TRIM", true);
    }

    // ------------------------------------------------------------------------
    // 8. Voxel Trees (Royal Palms, Neem/Banyan Shade Trees & Bougainvillea)
    // ------------------------------------------------------------------------
    _buildTreesAndProps() {
      // Royal Palm Trees around Jag Mandir & Lake Pichola Promenades
      const palmSpots = [
        [-17, 5], [-9, 5], [-17, -4], [-9, -4], // Jag Mandir Island
        [-32, 18], [-32, 6], [-32, -6], [-32, -18], // West Lake Promenade
        [-22, 26], [-8, 26], [6, 26], // North Lake Promenade
        [-22, -26], [-4, -26], [8, -26], // South Lake Promenade
        [10, 18], [10, -18] // East Lake Gardens
      ];
      for (let i = 0; i < palmSpots.length; i++) {
        this._placePalmTree(palmSpots[i][0], palmSpots[i][1]);
      }

      // Lush Banyan / Neem Shade Trees along Boulevards, Forecourts & Haveli Lanes
      const shadeSpots = [
        [21, 14], [21, -14], [21, 22], [21, -22],
        [11, 22], [11, -22], [21, 37], [21, -37],
        [-31, 36], [-11, 36], [11, 37], [41, 26], [41, -26],
        [-31, -36], [-1, -36], [11, -37], [41, 38], [41, -38],
        [-42, 22], [-42, 4], [-42, -14], [-42, -30],
        [27, 6], [27, -6] // City Palace courtyard ornamental shade trees
      ];
      for (let i = 0; i < shadeSpots.length; i++) {
        this._placeShadeTree(shadeSpots[i][0], shadeSpots[i][1], i % 3 === 0);
      }
    }

    _isSpotClearForTree(gx, gz) {
      if (this.isRoad(gx, gz) || this.waterSet.has(key2(gx, gz))) return false;
      if (this.solidSet.has(key3(gx, 1, gz))) return false;
      return true;
    }

    _placePalmTree(gx, gz) {
      if (!this._isSpotClearForTree(gx, gz)) return;
      const h = 4 + Math.floor(hash2(gx, gz) * 2);
      for (let y = 1; y <= h; y++) {
        this.setVoxel(gx, y, gz, "TREE_TRUNK", true);
      }
      // Crown & arching palm fronds
      this.setVoxel(gx, h + 1, gz, "TREE_LEAF_LIGHT", true);
      const fronds = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
        [2, 0], [-2, 0], [0, 2], [0, -2],
        [1, 1], [-1, -1], [1, -1], [-1, 1]
      ];
      for (let i = 0; i < fronds.length; i++) {
        const fx = fronds[i][0];
        const fz = fronds[i][1];
        const fy = Math.abs(fx) === 2 || Math.abs(fz) === 2 ? h : h + 1;
        this.setVoxel(gx + fx, fy, gz + fz, i % 2 === 0 ? "TREE_LEAF_LIGHT" : "TREE_LEAF_DARK", true);
      }
    }

    _placeShadeTree(gx, gz, withBlossoms) {
      if (!this._isSpotClearForTree(gx, gz)) return;
      this.setVoxel(gx, 1, gz, "TREE_TRUNK", true);
      this.setVoxel(gx, 2, gz, "TREE_TRUNK", true);
      this.setVoxel(gx, 3, gz, "TREE_TRUNK", true);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          this.setVoxel(gx + dx, 4, gz + dz, "TREE_LEAF_DARK", true);
          if (Math.abs(dx) + Math.abs(dz) <= 1) {
            const topMat = withBlossoms && (dx + dz) !== 0 && hash2(gx + dx, gz + dz) > 0.55
              ? "BOUGAINVILLEA"
              : "TREE_LEAF_LIGHT";
            this.setVoxel(gx + dx, 5, gz + dz, topMat, true);
          }
        }
      }
    }

    // ------------------------------------------------------------------------
    // 9. GPU Thin-Instance Batching (Per Material + Frozen Mats & World Matrices)
    // ------------------------------------------------------------------------
    _finalizeThinInstances() {
      const COLORS = global.COLORS;
      const batches = new Map();

      const pushInstance = function (matKey, wx, wy, wz, sx, sy, sz) {
        let list = batches.get(matKey);
        if (!list) {
          list = [];
          batches.set(matKey, list);
        }
        list.push(wx, wy, wz, sx, sy, sz);
      };

      // Pre-compute column max gy and cull completely enclosed interior solid voxels
      let totalVoxels = 0;
      let renderedInstances = 0;

      this._voxels.forEach((v) => {
        totalVoxels++;
        if (v.solid) {
          const ck = key2(v.gx, v.gz);
          const prev = this.columnMaxGy.get(ck);
          if (prev === undefined || v.gy > prev) {
            this.columnMaxGy.set(ck, v.gy);
          }
        }

        // Occlusion cull: if all 6 neighbors are solid voxels, skip GPU instance!
        if (
          v.solid &&
          this.solidSet.has(key3(v.gx + 1, v.gy, v.gz)) &&
          this.solidSet.has(key3(v.gx - 1, v.gy, v.gz)) &&
          this.solidSet.has(key3(v.gx, v.gy + 1, v.gz)) &&
          this.solidSet.has(key3(v.gx, v.gy - 1, v.gz)) &&
          this.solidSet.has(key3(v.gx, v.gy, v.gz + 1)) &&
          this.solidSet.has(key3(v.gx, v.gy, v.gz - 1))
        ) {
          return;
        }

        const wx = v.gx * VOXEL;
        const wy = (v.gy - 0.5) * VOXEL;
        const wz = v.gz * VOXEL;
        pushInstance(v.matKey, wx, wy, wz, 1, 1, 1);
        renderedInstances++;
      });

      // Add custom half-step Gangaur Ghat marble slabs
      for (let i = 0; i < this._customVoxels.length; i++) {
        const c = this._customVoxels[i];
        pushInstance(c.matKey, c.wx, c.wy, c.wz, c.sx, c.sy, c.sz);
        renderedInstances++;
      }

      // Build one frozen thin-instanced Mesh per material!
      batches.forEach((data, matKey) => {
        const count = data.length / 6;
        if (count === 0) return;

        const hex = COLORS[matKey] || "#d6c5a3";
        const isGold = matKey === "GOLD_DOME" || matKey === "GOLD_BRIGHT";
        const isGlow = matKey === "LAMP_GLOW" || matKey === "HAVELI_WINDOW_LIT";
        const isWater = matKey.indexOf("WATER_") === 0;

        const mat = global.createColorMat(this.scene, "world_" + matKey, hex, {
          specular: isGold ? 0.55 : isWater ? 0.35 : 0.06,
          specularPower: isGold ? 48 : 20,
          emissive: isGlow ? hex : isGold ? "#4a3300" : undefined,
          emissiveScale: isWater ? 0.14 : undefined,
          freeze: true
        });

        const baseBox = BABYLON.MeshBuilder.CreateBox(
          "voxelBatch_" + matKey,
          { size: VOXEL },
          this.scene
        );
        baseBox.material = mat;
        baseBox.isPickable = false;

        const matrixBuffer = new Float32Array(count * 16);
        for (let i = 0; i < count; i++) {
          const src = i * 6;
          const dst = i * 16;
          matrixBuffer[dst + 0]  = data[src + 3]; // sx
          matrixBuffer[dst + 5]  = data[src + 4]; // sy
          matrixBuffer[dst + 10] = data[src + 5]; // sz
          matrixBuffer[dst + 12] = data[src + 0]; // wx
          matrixBuffer[dst + 13] = data[src + 1]; // wy
          matrixBuffer[dst + 14] = data[src + 2]; // wz
          matrixBuffer[dst + 15] = 1;
        }

        baseBox.thinInstanceSetBuffer("matrix", matrixBuffer, 16, true);
        baseBox.thinInstanceRefreshBoundingInfo(true);
        baseBox.freezeWorldMatrix();
        baseBox.doNotSyncBoundingInfo = true;

        this.staticMeshes.push(baseBox);
      });

      this.stats.totalVoxels = totalVoxels;
      this.stats.renderedInstances = renderedInstances;
      this.stats.drawCalls = this.staticMeshes.length;

      // Free temporary staging memory after GPU upload
      this._voxels.clear();
      this._customVoxels.length = 0;
    }

    // Subtle translucent shimmer surface across Lake Pichola
    _createWaterShimmerOverlay() {
      const shimmer = BABYLON.MeshBuilder.CreateGround(
        "lakePicholaShimmer",
        { width: 78, height: 98, subdivisions: 2 },
        this.scene
      );
      shimmer.position.set(-25, WATER_LEVEL_Y, 0);
      const mat = global.createColorMat(this.scene, "pichola_shimmer", global.COLORS.WATER_SHIMMER, {
        alpha: 0.28,
        specular: 0.6,
        specularPower: 64,
        emissiveScale: 0.22,
        freeze: false
      });
      shimmer.material = mat;
      shimmer.isPickable = false;
      this.waterShimmerMesh = shimmer;
    }

    // ------------------------------------------------------------------------
    // Spatial Collision & World Query API (hitsVoxel, getGroundY, isWater, getZoneName)
    // ------------------------------------------------------------------------
    worldToGrid(wx, wy, wz) {
      return {
        gx: Math.round(wx / VOXEL),
        gy: Math.floor(wy / VOXEL) + 1,
        gz: Math.round(wz / VOXEL)
      };
    }

    // Exact Set-based spatial collision check for a world point (wx, wy, wz)
    hitsVoxel(wx, wy, wz) {
      const gx = Math.round(wx / VOXEL);
      const gy = Math.floor(wy / VOXEL) + 1;
      const gz = Math.round(wz / VOXEL);
      return this.solidSet.has(key3(gx, gy, gz));
    }

    // Check bounding box against solid voxels (used by player, vehicles, NPCs, cops)
    hitsBox(wx, baseY, wz, halfW, height) {
      if (Math.abs(wx) > WORLD_LIMIT || Math.abs(wz) > WORLD_LIMIT) return true;
      const samplesY = [baseY + 0.45, baseY + Math.min(height * 0.55, 1.8), baseY + height - 0.25];
      const offsets = [
        [-halfW, -halfW],
        [halfW, -halfW],
        [-halfW, halfW],
        [halfW, halfW]
      ];
      for (let yi = 0; yi < samplesY.length; yi++) {
        const sy = samplesY[yi];
        for (let oi = 0; oi < offsets.length; oi++) {
          if (this.hitsVoxel(wx + offsets[oi][0], sy, wz + offsets[oi][1])) {
            return true;
          }
        }
      }
      return false;
    }

    // Check if world coordinate sits over Lake Pichola water
    isWater(wx, wz) {
      const gx = Math.round(wx / VOXEL);
      const gz = Math.round(wz / VOXEL);
      return this.waterSet.has(key2(gx, gz));
    }

    // Compute walkable ground height at (wx, wz) given current entity foot Y
    getGroundY(wx, wz, currentY) {
      const gx = Math.round(wx / VOXEL);
      const gz = Math.round(wz / VOXEL);
      const k2 = key2(gx, gz);

      if (this.stepTopMap.has(k2)) {
        return this.stepTopMap.get(k2);
      }

      if (this.waterSet.has(k2)) {
        return WATER_LEVEL_Y - 0.4;
      }

      // Scan downward from just above current foot height for highest supporting voxel
      const maxSearchGy = Math.min(18, Math.floor((currentY + 1.1) / VOXEL) + 1);
      for (let gy = maxSearchGy; gy >= -1; gy--) {
        if (this.solidSet.has(key3(gx, gy, gz))) {
          return gy * VOXEL;
        }
      }
      return 0;
    }

    // Return live Udaipur district / landmark name for the HUD
    getZoneName(wx, wz) {
      const gx = Math.round(wx / VOXEL);
      const gz = Math.round(wz / VOXEL);

      if (this.isJagMandirIsland(gx, gz)) return "JAG MANDIR ISLAND";
      if (this.isJagMandirBridge(gx, gz)) return "JAG MANDIR BRIDGE";
      if (this.isGangaurGhatArea(gx, gz)) return "GANGAUR GHAT";
      if (this.waterSet.has(key2(gx, gz))) return "LAKE PICHOLA";
      if (gx >= 21 && gx <= 44 && gz >= -17 && gz <= 17) return "CITY PALACE";
      if (gx <= -41) return "ARAVALLI HILLS";
      if (this.isEastRoad(gx, gz)) return "PALACE ROAD (EAST)";
      if (this.isWestRoad(gx, gz)) return "ARAVALLI BYPASS (WEST)";
      if (this.isNorthRoad(gx, gz)) return "HATHIPOLE RD (NORTH)";
      if (this.isSouthRoad(gx, gz)) return "DUDHTALAI RD (SOUTH)";
      if (gz > 24 || gz < -24 || gx > 20) return "OLD CITY HAVELIS";
      return "LAKE PICHOLA SHORE";
    }
  }

  global.UdaipurWorld = UdaipurWorld;
})(window);
