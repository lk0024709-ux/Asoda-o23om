/* ============================================================================
   src/main.js — BharatVerse: The Living Legend (7-Layer Orchestrator)
   Connects:
     Layer 1: CoreEngine, PBRAssetLibrary, Shaders, InputManager
     Layer 2: WorldStreamer, Pan-India 12-Hub Registry, Landmark Builders
     Layer 3: PhysicsInteraction (Aarav, Auto, Royal Enfield, Boat, Spice/Shoes)
     Layer 4: NPCCrowdSystem (24-min Day/Night Routine, Crowds, Desi Wildlife)
     Layer 5: QuestStorySystem ("The Lost Ledger of Mewar" + Side Quests)
     Layer 6: UIManager (Rangoli HUD, Pan-India Map, Journal, Photo Mode, Hearing)
     Layer 7: SaveManager (IndexedDB + Settings) + BharatAudio (Indian Ragas)
   ============================================================================ */

import * as THREE from "three";
import { CoreEngine } from "./layer1_core/core_engine.js";
import { PBRAssetLibrary } from "./layer1_core/pbr_assets.js";
import { InputManager } from "./layer1_core/input_manager.js";
import { CITY_HUBS } from "./layer2_world/pan_india_data.js";
import { WorldStreamer } from "./layer2_world/world_streamer.js";
import { PhysicsInteraction } from "./layer3_physics/physics_interaction.js";
import { NPCCrowdSystem } from "./layer4_ai/npc_crowd_system.js";
import { QuestStorySystem } from "./layer5_narrative/quest_story_system.js";
import { UIManager } from "./layer6_ui/ui_manager.js";
import { SaveManager } from "./layer7_persistence/save_manager.js";
import { BharatAudio } from "./audio/bharat_audio.js";

export class BharatVerseGame {
  constructor(canvas, options = {}) {
    this.options = options;
    this.canvas = canvas;
    this.elapsed = 0;
    this._autosaveTimer = 0;
    this._hudTimer = 0;
    this._running = false;
    this._activeInteraction = null;
    this._respectedHomes = new Set();

    // Initialize all 7 architectural layers
    this.core = new CoreEngine(canvas, options);
    this.assets = new PBRAssetLibrary();
    this.world = new WorldStreamer(this.core.scene, this.assets);
    this.physics = new PhysicsInteraction(this.core.scene, this.assets, this.world);
    this.npcSystem = new NPCCrowdSystem(this.core.scene, this.assets, this.world);
    this.quest = new QuestStorySystem();
    this.saveManager = new SaveManager();
    this.audio = new BharatAudio();

    this.ui = new UIManager({
      onModalStateChange: (blocked) => this.input.setUIBlocked(blocked),
      onRenderMap: () => this.ui.renderPanIndiaMap(this.world.currentHub.id, this.quest),
      onRenderJournal: () => this.ui.renderJournal(this.quest),
      onFastTravel: (hubId) => this.travelToHub(hubId),
      onCycleTime: () => this.cycleTimeOfDay(),
      onCycleTransport: () => this.cycleTransportMode(),
      onInteract: () => this.handleInteract(),
      onToggleMute: () => this.audio.toggleMute(),
      onPhotoSnap: (dl, filter) => this.handlePhotoSnap(dl, filter),
      onDeliverHearing: (arg) => this.handlePublicHearingVerdict(arg),
      onQualityChange: (tier) => {
        this.core.setQualityTier(tier);
        this.ui.showToast(`Graphics Tier set to ${tier.toUpperCase()}`);
        this.saveNow();
      },
      onManualSave: () => this.saveNow(true),
      onResetSave: () => this.resetJourney()
    });

    this.input = new InputManager(canvas, {
      onFirstGesture: () => this.audio.unlock(),
      onInteract: () => this.handleInteract(),
      onToggleMap: () => this.ui.toggleModal("map"),
      onToggleJournal: () => this.ui.toggleModal("journal"),
      onTogglePhotoMode: () => this.ui.togglePhotoMode(),
      onCycleTransport: () => this.cycleTransportMode(),
      onCycleTime: () => this.cycleTimeOfDay(),
      onJumpOrHorn: () => this.handleJumpOrHorn(),
      onEscape: () => this.ui.closeAllModals()
    });
  }

  async start() {
    if (this._running) return;
    this._running = true;

    const saved = await this.saveManager.load();
    let startHub = "ratanpur";
    if (saved) {
      this.quest.importState(saved.quest);
      if (saved.hubId && CITY_HUBS[saved.hubId]) startHub = saved.hubId;
      if (Number.isFinite(saved.hourOfDay)) this.npcSystem.hourOfDay = saved.hourOfDay;
      if (saved.qualityTier) {
        this.core.setQualityTier(saved.qualityTier);
        if (this.ui.dom.qualitySelect) this.ui.dom.qualitySelect.value = saved.qualityTier;
      }
    }

    this.travelToHub(startHub, { silent: true });
    this.ui.hideLoading();
    this.ui.showToast(
      saved
        ? `Welcome back to ${CITY_HUBS[startHub].name}, Aarav! Press [M] for Pan-India Map or [F] for Photo Mode.`
        : "Namaste Aarav! Restore Grandfather Vikram's Haveli ahead [E] to begin The Lost Ledger of Mewar."
    , 4500);

    if (!this.options.headless && typeof window !== "undefined") {
      window.addEventListener("resize", () => this.core.resize());
      let lastTime = performance.now();
      const loop = (now) => {
        if (!this._running) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        this.update(dt);
        this.core.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  travelToHub(hubId, opts = {}) {
    const hub = this.world.loadHub(hubId, { haveliRestored: this.quest.haveliRestored });
    this.physics.setPosition(hub.spawn.x, 0, hub.spawn.z, hub.spawn.yaw);
    this.input.yaw = hub.spawn.yaw + Math.PI;
    this.npcSystem.populateHub(hub);
    this.audio.setRaga(hub.raga || "bhupali");

    // Stop active race if leaving Jaipur
    if (this.quest.race.active && hub.id !== "jaipur") {
      this.quest.race.active = false;
      this.world.setRaceCheckpoint(null);
    }

    const firstVisit = this.quest.markHubVisited(hub.id);
    if (!opts.silent) {
      this.audio.playFastTravel();
      this.ui.showToast(
        `Arrived in ${hub.name} (${hub.region})${firstVisit ? " · +35 Samman!" : ""} — ${hub.festival.name}`,
        3800
      );
      this.saveNow();
    }
  }

  cycleTransportMode() {
    this.audio.unlock();
    const mode = this.physics.cycleTransport();
    if (mode === "AUTO") this.audio.playAutoHorn();
    else if (mode === "ENFIELD") this.audio.playEnfieldThump();
    else if (mode === "BOAT") this.audio.playFastTravel();

    const names = {
      FOOT: "On Foot (Shift to Sprint)",
      AUTO: "Auto-Rickshaw (Space to Horn)",
      ENFIELD: "Royal Enfield Bullet 350 (Thump!)",
      BOAT: "Traditional Wooden Boat (Sail Lakes & Rivers!)"
    };
    this.ui.showToast(`Traversal: ${names[mode]}`, 2400);
  }

  cycleTimeOfDay() {
    this.audio.unlock();
    const clock = this.npcSystem.cycleTimePreset();
    const phase = this.npcSystem.getRoutinePhase();
    this.ui.showToast(`Time shifted to ${clock} · ${phase}`, 2400);
  }

  handleJumpOrHorn() {
    this.audio.unlock();
    if (this.physics.transport === "AUTO") {
      this.audio.playAutoHorn();
      this.ui.showToast("Peep-Peep! Horn OK Please!", 1400);
    } else if (this.physics.transport === "ENFIELD") {
      this.audio.playEnfieldThump();
      this.ui.showToast("Dug-Dug-Dug! Royal Enfield Bullet!", 1400);
    } else {
      this.physics.jump();
    }
  }

  // --------------------------------------------------------------------------
  // Contextual Proximity Interaction Detector & Executor [E]
  // --------------------------------------------------------------------------
  _detectNearbyInteraction() {
    const hub = this.world.currentHub;
    if (!hub) return null;
    const p = this.physics.pos;

    // 1. Pan-India Highway Portal Gate
    if (Math.hypot(p.x - 0, p.z - 56) < 9.5) {
      return {
        kind: "highway",
        prompt: "[E] Open Pan-India Highway Map (Travel Across 12 Cities)"
      };
    }

    // 2. Named Regional NPCs
    const npc = this.npcSystem.findNearestNPC(p.x, p.z, 5.2);
    if (npc) {
      return {
        kind: "npc",
        npc: npc.data,
        prompt: `[E] Speak with ${npc.data.name}`
      };
    }

    // 3. Regional Street Food / Chai Tapri Stall
    if (hub.foodStall && Math.hypot(p.x - hub.foodStall.x, p.z - hub.foodStall.z) < 5.5) {
      return {
        kind: "food",
        stall: hub.foodStall,
        prompt: `[E] Eat ${hub.foodStall.dish} at ${hub.foodStall.name}`
      };
    }

    // 4. Friendly Pol Home (Remove Shoes Mechanic!)
    if (hub.friendlyHome && Math.hypot(p.x - hub.friendlyHome.x, p.z - hub.friendlyHome.z) < 6.5) {
      return {
        kind: "home",
        home: hub.friendlyHome,
        prompt: `[E] Remove Shoes & Greet ${hub.friendlyHome.owner}`
      };
    }

    // 5. Major Landmarks (Restoration, Bells, Viewpoints, Meditation, Story Clues, Hearing)
    for (const lm of hub.landmarks) {
      const dist = Math.hypot(p.x - lm.x, p.z - lm.z);
      if (dist < lm.radius + 3.5) {
        let label = `[E] Inspect ${lm.name}`;
        if (lm.id === "ratanpur_haveli" && !this.quest.haveliRestored) {
          label = "[E] Restore Ancestral Haveli Courtyard & Inspect Bahi-Khata";
        } else if (lm.type === "temple") {
          label = `[E] Ring Brass Bell & Join Aarti at ${lm.name}`;
        } else if (lm.type === "meditation") {
          label = `[E] Meditate & Restore Full Stamina at ${lm.name}`;
        } else if (lm.viewpoint) {
          label = `[E] Climb to ${lm.name} Rooftop Viewpoint`;
        } else if (lm.type === "hearing") {
          label = `[E] Step Up to Public Heritage Hearing Podium (${lm.name})`;
        }
        return { kind: "landmark", landmark: lm, prompt: label };
      }
    }
    return null;
  }

  handleInteract() {
    this.audio.unlock();
    const act = this._activeInteraction;
    if (!act) {
      this.ui.showToast("Walk closer to an NPC, temple, Chai Tapri, or monument to interact [E].", 2200);
      return;
    }

    const hub = this.world.currentHub;

    if (act.kind === "highway") {
      this.ui.toggleModal("map");
      return;
    }

    if (act.kind === "food") {
      const st = act.stall;
      const res = this.physics.eatStreetFood(st.stamina, st.spice);
      this.audio.playEatFood(res.tooSpicy);
      if (hub.id === "ahmedabad") {
        const done = this.quest.completeSideMission("heritage_walk");
        if (done) this.ui.showToast(`Quest Complete: ${done.title} (+${done.rewardSamman} Samman)!`, 3400);
      }
      if (res.tooSpicy) {
        this.ui.showToast(`🔥 UFF, TOO MUCH TEEKHA! (${st.dish}) — Stamina restored, cool off with Lassi/Jigarthanda!`, 3600);
      } else if (res.cooled) {
        this.ui.showToast(`❄️ Refreshing ${st.dish}! Spice heat cooled & Stamina +${st.stamina}!`, 3000);
      } else {
        this.ui.showToast(`😋 Enjoyed ${st.dish}! Stamina +${st.stamina} · "${st.quote}"`, 3400);
      }
      return;
    }

    if (act.kind === "home") {
      this.physics.shoesOff = true;
      const key = `${hub.id}_${act.home.owner}`;
      let bonus = "";
      if (!this._respectedHomes.has(key)) {
        this._respectedHomes.add(key);
        this.quest.homesRespected++;
        this.quest.addSamman(45);
        bonus = " (+45 Samman for respecting home customs!)";
      }
      this.audio.playStoryChime();
      this.ui.openDialogue({
        speaker: act.home.owner,
        role: `${hub.name} Pol Residence · Shoes Removed 👞`,
        text: act.home.quote + bonus,
        choices: [{ label: "Dhanyavaad! Step back outside", primary: true }]
      });
      return;
    }

    if (act.kind === "npc") {
      this._openNPCDialogue(hub, act.npc);
      return;
    }

    if (act.kind === "landmark") {
      this._interactLandmark(hub, act.landmark);
    }
  }

  _openNPCDialogue(hub, npc) {
    const choices = [];

    // Contextual Side Missions & Ally Recruitment per NPC!
    if (npc.id === "pandit_sharma" && !this.quest.completedSides.has("missing_laddu")) {
      choices.push({
        label: "Recover Missing Laddu Prasad from Rooftop Monkeys (+120 Samman)",
        primary: true,
        action: () => {
          this.quest.completeSideMission("missing_laddu");
          this.quest.recruitAlly("Pandit Sharma (Ratanpur)");
          this.audio.playTempleBell();
          this.ui.showToast("Missing Laddu recovered! Pandit Sharma joins your cause (+195 Samman)!", 3600);
          this.saveNow();
        }
      });
    } else if (npc.id === "bazaar_kabir" && !this.quest.completedSides.has("gully_cricket")) {
      choices.push({
        label: "🏏 Play Gully Cricket Over — Swing for a Winning Six! (+110 Samman)",
        primary: true,
        action: () => {
          this.quest.completeSideMission("gully_cricket");
          this.quest.recruitAlly("Chandni Bazaar Youth (Ratanpur)");
          this.audio.playStoryChime();
          this.ui.showToast("SIXER over Chandni Bazaar! Kabir tips you off about Jaipur's Jantar Mantar (+185 Samman)!", 3800);
          this.saveNow();
        }
      });
    } else if (npc.id === "rickshaw_banti") {
      choices.push({
        label: "🛺 Start Pink City Rickshaw Race Time Trial!",
        primary: true,
        action: () => this.startPinkCityRickshawRace()
      });
    } else if (npc.id === "conservation_meera" && !this.quest.completedSides.has("lake_cleanup")) {
      choices.push({
        label: "🌊 Organize Lake Pichola Community Cleanup (+140 Samman)",
        primary: true,
        action: () => {
          this.quest.completeSideMission("lake_cleanup");
          this.quest.recruitAlly("Dr. Meera & Udaipur Citizens");
          this.audio.playStoryChime();
          this.ui.showToast("Lake Pichola Cleanup succeeded! Udaipur citizens pledge support for the Hearing (+215 Samman)!", 3800);
          this.saveNow();
        }
      });
    } else if (npc.role === "ally" || npc.role === "guide") {
      const allyLabel = `${npc.name} (${hub.name})`;
      if (!this.quest.allies.has(allyLabel)) {
        choices.push({
          label: `🤝 Rally ${npc.name} as Heritage Hearing Ally (+75 Samman)`,
          primary: true,
          action: () => {
            this.quest.recruitAlly(allyLabel);
            this.audio.playStoryChime();
            this.ui.showToast(`${allyLabel} joined your Heritage Coalition! (+75 Samman)`, 3200);
            this.saveNow();
          }
        });
      }
    } else if (npc.role === "hearing") {
      choices.push({
        label: "⚖️ Begin Act 5 Public Heritage Hearing Now!",
        primary: true,
        action: () => this.ui.openPublicHearing(this.quest)
      });
    }

    choices.push({ label: "Namaste, see you around" });

    this.ui.openDialogue({
      speaker: npc.name,
      role: `${hub.name}, ${hub.region}`,
      text: npc.greeting,
      choices
    });
  }

  _interactLandmark(hub, lm) {
    // Check main storyline progression first!
    const storyRes = this.quest.handleLandmarkStoryAction(hub.id, lm);
    if (storyRes?.openHearing) {
      this.ui.openPublicHearing(this.quest);
      return;
    }

    if (storyRes) {
      this.audio.playStoryChime();
      if (storyRes.rebuildHub) {
        // Reload Ratanpur visually with restored Rangoli courtyard, fountain & diyas!
        const keepPos = this.physics.pos.clone();
        this.world.loadHub(hub.id, { haveliRestored: true });
        this.npcSystem.populateHub(hub);
        this.physics.pos.copy(keepPos);
      }
      this.ui.openDialogue({
        speaker: lm.name,
        role: this.quest.getCurrentStoryStep().act,
        text: `${storyRes.headline}\n\n${storyRes.detail}`,
        choices: [
          { label: "Open Pan-India Map [M]", primary: true, action: () => this.ui.toggleModal("map") },
          { label: "Continue Exploring" }
        ]
      });
      this.saveNow();
      return;
    }

    // Standard rich non-combat landmark interactions:
    if (lm.type === "temple") {
      this.quest.bellsRung++;
      this.quest.addSamman(25);
      this.audio.playTempleBell();
      this.ui.showToast(`🔔 Rang the sacred brass bell at ${lm.name}! (+25 Samman · Peace & Harmony)`, 3200);
    } else if (lm.type === "meditation") {
      this.physics.meditate();
      this.audio.playStoryChime();
      this.ui.showToast(`🧘 Meditated at ${lm.name} — Stamina 100% restored & spice heat cleared!`, 3000);
    } else if (lm.viewpoint) {
      this.physics.pos.set(lm.viewpoint.x, lm.viewpoint.y, lm.viewpoint.z);
      this.physics.onViewpoint = true;
      this.audio.playStoryChime();
      this.ui.showToast(`🌅 Panoramic Rooftop View of ${lm.name}! Press [F] for Photo Mode or move to descend.`, 3600);
    } else {
      this.ui.openDialogue({
        speaker: lm.name,
        role: `${hub.name} Heritage Site`,
        text: lm.lore + "\n\nTip: Press [F] for Photo Mode to capture this monument in your Bahi-Khata Conservation Journal!",
        choices: [
          { label: "📷 Open Photo Mode", primary: true, action: () => this.ui.togglePhotoMode(true) },
          { label: "Close" }
        ]
      });
    }
  }

  // --------------------------------------------------------------------------
  // Pink City Rickshaw Time-Trial Mini-Game (Jaipur)
  // --------------------------------------------------------------------------
  startPinkCityRickshawRace() {
    this.physics.transport = "AUTO";
    this.physics._syncTransportVisuals();
    this.quest.race.active = true;
    this.quest.race.index = 0;
    this.quest.race.timer = 45.0;
    this.world.setRaceCheckpoint(this.quest.race.checkpoints[0]);
    this.audio.playAutoHorn();
    this.ui.showToast("🛺 PINK CITY RICKSHAW RACE STARTED! Drive through all 4 golden hoops!", 3400);
  }

  _updateRickshawRace(dt) {
    const r = this.quest.race;
    if (!r.active) return;
    r.timer -= dt;
    if (r.timer <= 0) {
      r.active = false;
      this.world.setRaceCheckpoint(null);
      this.ui.showToast("Time's up on the Rickshaw Race! Talk to Banti anytime to retry.", 3000);
      return;
    }
    const target = r.checkpoints[r.index];
    if (Math.hypot(this.physics.pos.x - target.x, this.physics.pos.z - target.z) < 5.2) {
      this.audio.playAutoHorn();
      r.index++;
      if (r.index >= r.checkpoints.length) {
        r.active = false;
        this.world.setRaceCheckpoint(null);
        this.quest.completeSideMission("rickshaw_race");
        this.quest.recruitAlly("Banti & Jaipur Auto Union");
        this.audio.playStoryChime();
        this.ui.showToast(`🏆 PINK CITY RICKSHAW RACE WON with ${r.timer.toFixed(1)}s left! (+235 Samman)`, 4000);
        this.saveNow();
      } else {
        this.world.setRaceCheckpoint(r.checkpoints[r.index]);
        this.ui.showToast(`Checkpoint ${r.index}/${r.checkpoints.length} cleared!`, 1400);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Photo Mode Landmark Detection & PNG Export
  // --------------------------------------------------------------------------
  _detectPhotoLandmark() {
    const hub = this.world.currentHub;
    if (!hub) return null;
    const camPos = this.core.camera.position;
    const camDir = new THREE.Vector3();
    this.core.camera.getWorldDirection(camDir);

    let best = null;
    let bestScore = -1;
    for (const lm of hub.landmarks) {
      const toLm = new THREE.Vector3(lm.x - camPos.x, 4 - camPos.y, lm.z - camPos.z);
      const dist = toLm.length();
      if (dist > 82) continue;
      toLm.normalize();
      const dot = camDir.dot(toLm);
      if (dot > 0.65 && dot > bestScore) {
        bestScore = dot;
        best = lm;
      }
    }
    return best;
  }

  handlePhotoSnap(downloadPng, filter) {
    this.audio.playShutter();
    const target = this._detectPhotoLandmark();
    if (target) {
      const res = this.quest.recordPhoto(target);
      if (res.newlyDocumented) {
        this.audio.playStoryChime();
        this.ui.showToast(`📷 Documented "${target.name}" in Bahi-Khata Journal! (+${target.photoPoints} Samman)`, 3600);
        this.saveNow();
      } else {
        this.ui.showToast(`📷 Captured ${target.name} (${filter.label})!`, 2200);
      }
    } else {
      this.ui.showToast(`📷 Scenic BharatVerse Snapshot taken (${filter.label})!`, 2200);
    }

    if (downloadPng && typeof document !== "undefined") {
      const dataUrl = this.core.captureScreenshotDataURL();
      if (dataUrl) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `BharatVerse-${this.world.currentHub.id}-${filter.id}.png`;
        a.click();
      }
    }
  }

  handlePublicHearingVerdict(arg) {
    const result = this.quest.evaluatePublicHearing(arg);
    this.audio.playStoryChime();
    this.saveNow();
    return result;
  }

  async saveNow(showToast = false) {
    await this.saveManager.save({
      hubId: this.world.currentHub?.id || "ratanpur",
      hourOfDay: this.npcSystem.hourOfDay,
      qualityTier: this.core.tier,
      quest: this.quest.exportState()
    });
    if (showToast) {
      this.ui.showToast("💾 Progress saved to IndexedDB (BharatVerseDB)!", 2200);
    }
    if (this.ui.dom.saveStatus) {
      this.ui.dom.saveStatus.textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
    }
  }

  async resetJourney() {
    await this.saveManager.clear();
    this.quest.reset();
    this._respectedHomes.clear();
    this.npcSystem.hourOfDay = 9.5;
    this.ui.closeAllModals();
    this.travelToHub("ratanpur");
    this.ui.showToast("New Heritage Journey started in Ratanpur!", 3000);
  }

  // --------------------------------------------------------------------------
  // Master Per-Frame Simulation Update (All 7 Layers)
  // --------------------------------------------------------------------------
  update(dt) {
    this.elapsed += dt;

    // Layer 4: Day/Night Clock + NPCs + Instanced Crowds + Animals
    this.npcSystem.update(dt, this.elapsed, this.physics.pos);

    // Layer 1: Celestial Sky, Sun/Moon Shadows, Bloom & Dust Particles
    const atmosphere = this.core.updateAtmosphere(
      this.npcSystem.hourOfDay,
      this.elapsed,
      this.world.currentHub?.theme,
      this.physics.pos
    );

    // Layer 2: Water & Heat-Haze Shaders + Festival Lights & Flags
    this.world.update(this.elapsed, dt, atmosphere);

    // Layer 3: Aarav / Vehicle / Boat Physics + Third-Person Camera
    this.physics.update(dt, this.elapsed, this.input, this.core.camera);

    // Layer 5: Active Mini-Games & Contextual Prompts
    this._updateRickshawRace(dt);
    this._activeInteraction = this._detectNearbyInteraction();

    // Audio: Subtle classical Indian raga phrases
    this.audio.updateMusic(dt);

    // Layer 6: HUD & Photo Mode target updates (throttled cleanly at ~12Hz)
    this._hudTimer += dt;
    if (this._hudTimer >= 0.08) {
      this._hudTimer = 0;
      this.ui.updateHUD({
        hub: this.world.currentHub,
        clock: this.npcSystem.formatClock(),
        routine: this.npcSystem.getRoutinePhase(),
        physics: this.physics,
        quest: this.quest,
        interactPrompt: this._activeInteraction?.prompt || null
      });
      if (this.ui.activeModal === "photo") {
        this.ui.updatePhotoTargetHint(this._detectPhotoLandmark());
      }
    }

    // Layer 7: Periodic IndexedDB Auto-Save
    this._autosaveTimer += dt;
    if (this._autosaveTimer >= 25) {
      this._autosaveTimer = 0;
      this.saveNow(false);
    }
  }
}

// Browser Entry Bootstrap
if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("bv-canvas");
    if (!canvas) return;
    const game = new BharatVerseGame(canvas);
    window.bharatVerse = game;
    game.start();

    // Register Offline PWA / Android WebView Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  });
}
