/* ============================================================================
   Layer 6 — UI/UX Manager:
   - Minimalist Rangoli-Motif HUD & Teak-Wood Heritage Modals
   - Interactive Pan-India Fast-Travel Map (all 12 City Hubs + Highway Graph)
   - Bahi-Khata Conservation Journal (Story, Side Quests, Photos, Allies)
   - Regional Dialogue & Interactive Mini-Events (Gully Cricket, Shoes-Off, etc.)
   - Photo Mode with Filters (Vintage Rajasthan, Golden Hour, Heritage Mono)
     & Real PNG Postcard Download
   - Act 5 Non-Combat Public Heritage Hearing Finale & Settings/Save Panel
   ============================================================================ */

import { CITY_HUBS, CITY_ORDER } from "../layer2_world/pan_india_data.js";
import { MAIN_STORY_STEPS, SIDE_MISSIONS } from "../layer5_narrative/quest_story_system.js";

const PHOTO_FILTERS = [
  { id: "natural", label: "Natural Bharat", css: "none" },
  { id: "vintage", label: "Vintage Rajasthan", css: "sepia(0.45) contrast(1.08) saturate(1.18) brightness(1.02)" },
  { id: "golden",  label: "Golden Hour", css: "sepia(0.28) saturate(1.42) contrast(1.06) hue-rotate(-8deg)" },
  { id: "monsoon", label: "Monsoon Teal", css: "contrast(1.1) saturate(1.22) hue-rotate(12deg)" },
  { id: "mono",    label: "Heritage Mono", css: "grayscale(0.95) contrast(1.2) sepia(0.18)" }
];

export class UIManager {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.activeModal = null; // "map" | "journal" | "dialogue" | "photo" | "hearing" | "settings" | null
    this.activeFilter = PHOTO_FILTERS[0];
    this._toastTimer = null;

    this.dom = typeof document !== "undefined" ? this._cacheDom() : {};
    if (typeof document !== "undefined") {
      this._bindButtons();
      this._renderPhotoFilterButtons();
    }
  }

  _cacheDom() {
    const $ = (id) => document.getElementById(id);
    return {
      canvas: $("bv-canvas"),
      hud: $("bv-hud"),
      cityName: $("hud-city-name"),
      citySub: $("hud-city-sub"),
      regionBadge: $("hud-region-badge"),
      clockLabel: $("hud-clock"),
      festivalLabel: $("hud-festival"),
      sammanValue: $("hud-samman"),
      transportBadge: $("hud-transport"),
      staminaFill: $("hud-stamina-fill"),
      spiceWrap: $("hud-spice-wrap"),
      spiceFill: $("hud-spice-fill"),
      storyAct: $("story-act-label"),
      storyTitle: $("story-title-label"),
      storyObj: $("story-obj-label"),
      raceBanner: $("race-banner"),
      interactPill: $("interact-pill"),
      interactText: $("interact-text"),
      toast: $("bv-toast"),
      loading: $("bv-loading"),

      // Modals
      modalBackdrop: $("modal-backdrop"),
      mapModal: $("modal-map"),
      mapBoard: $("india-map-board"),
      mapSvg: $("india-map-lines"),
      mapDetails: $("map-selected-details"),
      journalModal: $("modal-journal"),
      journalBody: $("journal-body"),
      dialogueModal: $("modal-dialogue"),
      dlgSpeaker: $("dlg-speaker"),
      dlgRole: $("dlg-role"),
      dlgText: $("dlg-text"),
      dlgChoices: $("dlg-choices"),
      hearingModal: $("modal-hearing"),
      hearingBody: $("hearing-body"),
      settingsModal: $("modal-settings"),
      qualitySelect: $("setting-quality"),
      touchToggle: $("setting-touch"),
      saveStatus: $("save-status-note"),

      // Photo mode
      photoOverlay: $("photo-overlay"),
      photoTargetLabel: $("photo-target-label"),
      photoFilterRow: $("photo-filter-row"),
      photoFlash: $("photo-flash"),
      soundBtn: $("btn-hud-sound")
    };
  }

  _bindButtons() {
    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", (e) => { e.preventDefault(); fn(); });
    };

    on("btn-hud-map", () => this.toggleModal("map"));
    on("btn-hud-journal", () => this.toggleModal("journal"));
    on("btn-hud-photo", () => this.togglePhotoMode());
    on("btn-hud-time", () => this.handlers.onCycleTime?.());
    on("btn-hud-ride", () => this.handlers.onCycleTransport?.());
    on("btn-hud-settings", () => this.toggleModal("settings"));
    on("btn-hud-sound", () => {
      const muted = this.handlers.onToggleMute?.();
      if (this.dom.soundBtn) this.dom.soundBtn.textContent = muted ? "🔇" : "🔊";
    });

    // Mobile quick-action buttons
    on("mob-btn-interact", () => this.handlers.onInteract?.());
    on("mob-btn-ride", () => this.handlers.onCycleTransport?.());
    on("mob-btn-photo", () => this.togglePhotoMode());
    on("mob-btn-map", () => this.toggleModal("map"));

    // Modal close buttons
    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => this.closeAllModals());
    });

    // Photo mode shutter & postcard download
    on("btn-photo-snap", () => this._triggerPhotoCapture(false));
    on("btn-photo-download", () => this._triggerPhotoCapture(true));
    on("btn-photo-exit", () => this.togglePhotoMode(false));

    // Settings actions
    if (this.dom.qualitySelect) {
      this.dom.qualitySelect.addEventListener("change", () => {
        this.handlers.onQualityChange?.(this.dom.qualitySelect.value);
      });
    }
    if (this.dom.touchToggle) {
      this.dom.touchToggle.addEventListener("change", () => {
        const mc = document.getElementById("mobile-controls");
        if (mc) mc.classList.toggle("touch-active", this.dom.touchToggle.checked);
      });
    }
    on("btn-save-now", () => this.handlers.onManualSave?.());
    on("btn-reset-save", () => this.handlers.onResetSave?.());
  }

  hideLoading() {
    if (this.dom.loading) this.dom.loading.classList.add("hidden");
  }

  showToast(msg, duration = 3200) {
    const el = this.dom.toast;
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove("visible"), duration);
  }

  // --------------------------------------------------------------------------
  // Live HUD Refresh
  // --------------------------------------------------------------------------
  updateHUD({ hub, clock, routine, physics, quest, interactPrompt }) {
    const d = this.dom;
    if (!d.cityName || !hub) return;

    d.cityName.textContent = hub.name;
    d.citySub.textContent = hub.subtitle;
    d.regionBadge.textContent = `${hub.region} · ${hub.act}`;
    d.regionBadge.style.borderColor = hub.regionColor;
    d.clockLabel.textContent = `${clock} · ${routine}`;
    d.festivalLabel.textContent = `✦ ${hub.festival.name}`;
    d.sammanValue.textContent = quest.samman.toLocaleString("en-IN");

    const modeLabels = {
      FOOT: "ON FOOT",
      AUTO: "AUTO-RICKSHAW",
      ENFIELD: "ROYAL ENFIELD",
      BOAT: "HERITAGE BOAT"
    };
    d.transportBadge.textContent = modeLabels[physics.transport] || physics.transport;

    d.staminaFill.style.width = `${Math.round((physics.stamina / physics.maxStamina) * 100)}%`;

    if (d.spiceWrap && d.spiceFill) {
      d.spiceWrap.classList.toggle("hot", physics.spiceHeat > 15);
      d.spiceFill.style.width = `${Math.round(physics.spiceHeat)}%`;
    }

    const step = quest.getCurrentStoryStep();
    d.storyAct.textContent = step.act;
    d.storyTitle.textContent = step.title;
    d.storyObj.textContent = step.objective;

    if (d.raceBanner) {
      if (quest.race.active) {
        d.raceBanner.classList.add("visible");
        d.raceBanner.textContent = `🛺 PINK CITY RICKSHAW RACE · Gate ${quest.race.index + 1}/${quest.race.checkpoints.length} · ${quest.race.timer.toFixed(1)}s`;
      } else {
        d.raceBanner.classList.remove("visible");
      }
    }

    if (d.interactPill && d.interactText) {
      if (interactPrompt && !this.activeModal) {
        d.interactText.textContent = interactPrompt;
        d.interactPill.classList.add("visible");
      } else {
        d.interactPill.classList.remove("visible");
      }
    }
  }

  // --------------------------------------------------------------------------
  // Modal Lifecycle
  // --------------------------------------------------------------------------
  isBlockingGameplay() {
    return this.activeModal !== null && this.activeModal !== "photo";
  }

  closeAllModals() {
    this.activeModal = null;
    if (this.dom.modalBackdrop) this.dom.modalBackdrop.classList.remove("open");
    ["mapModal", "journalModal", "dialogueModal", "hearingModal", "settingsModal"].forEach((k) => {
      if (this.dom[k]) this.dom[k].classList.remove("open");
    });
    if (this.dom.photoOverlay) this.dom.photoOverlay.classList.remove("open");
    if (this.dom.hud) this.dom.hud.classList.remove("photo-hidden");
    if (this.dom.canvas) this.dom.canvas.style.filter = "none";
    this.handlers.onModalStateChange?.(false);
  }

  toggleModal(name) {
    if (this.activeModal === name) {
      this.closeAllModals();
      return;
    }
    this.closeAllModals();
    this.activeModal = name;
    if (this.dom.modalBackdrop) this.dom.modalBackdrop.classList.add("open");

    if (name === "map") {
      this.handlers.onRenderMap?.();
      this.dom.mapModal?.classList.add("open");
    } else if (name === "journal") {
      this.handlers.onRenderJournal?.();
      this.dom.journalModal?.classList.add("open");
    } else if (name === "settings") {
      this.dom.settingsModal?.classList.add("open");
    }
    this.handlers.onModalStateChange?.(true);
  }

  // --------------------------------------------------------------------------
  // Interactive Pan-India Fast-Travel Map (All 12 City Hubs)
  // --------------------------------------------------------------------------
  renderPanIndiaMap(currentHubId, quest) {
    const board = this.dom.mapBoard;
    const svg = this.dom.mapSvg;
    if (!board || !svg) return;

    // Clear existing markers
    board.querySelectorAll(".map-pin").forEach((el) => el.remove());
    svg.innerHTML = "";

    // Draw Pan-India Highway Graph edges
    const drawn = new Set();
    for (const id of CITY_ORDER) {
      const a = CITY_HUBS[id];
      for (const targetId of a.highwayLinks) {
        const b = CITY_HUBS[targetId];
        if (!b) continue;
        const pair = [id, targetId].sort().join("-");
        if (drawn.has(pair)) continue;
        drawn.add(pair);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", `${a.mapPos.x}%`);
        line.setAttribute("y1", `${a.mapPos.y}%`);
        line.setAttribute("x2", `${b.mapPos.x}%`);
        line.setAttribute("y2", `${b.mapPos.y}%`);
        line.setAttribute("stroke", "rgba(245, 197, 66, 0.55)");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("stroke-dasharray", "5 4");
        svg.appendChild(line);
      }
    }

    const activeStoryHub = quest.getCurrentStoryStep().hub;

    for (const id of CITY_ORDER) {
      const hub = CITY_HUBS[id];
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "map-pin";
      if (id === currentHubId) pin.classList.add("current");
      if (id === activeStoryHub) pin.classList.add("story-target");
      if (quest.visitedHubs.has(id)) pin.classList.add("visited");
      pin.style.left = `${hub.mapPos.x}%`;
      pin.style.top = `${hub.mapPos.y}%`;
      pin.style.setProperty("--pin-col", hub.regionColor);
      pin.innerHTML = `<span class="pin-dot"></span><span class="pin-name">${hub.name}</span>`;

      pin.addEventListener("click", () => this._showMapHubDetail(hub, currentHubId, quest));
      board.appendChild(pin);
    }

    this._showMapHubDetail(CITY_HUBS[currentHubId], currentHubId, quest);
  }

  _showMapHubDetail(hub, currentHubId, quest) {
    const box = this.dom.mapDetails;
    if (!box) return;
    const documented = hub.landmarks.filter((l) => quest.documentedPhotos.has(l.id)).length;
    const isHere = hub.id === currentHubId;

    box.innerHTML = `
      <div class="map-det-head">
        <div>
          <h3>${hub.name} <span class="det-region" style="color:${hub.regionColor}">(${hub.region})</span></h3>
          <p class="det-sub">${hub.subtitle} · ${hub.act}</p>
        </div>
        <button id="btn-fast-travel-go" class="wood-btn primary" ${isHere ? "disabled" : ""}>
          ${isHere ? "CURRENT HUB" : `FAST TRAVEL TO ${hub.name.toUpperCase()}`}
        </button>
      </div>
      <div class="map-det-grid">
        <div><strong>Monuments (${documented}/${hub.landmarks.length} Documented):</strong> ${hub.landmarks.map((l) => l.name).join(" · ")}</div>
        <div><strong>Festival Event:</strong> ${hub.festival.name} — ${hub.festival.desc}</div>
        <div><strong>Signature Food:</strong> ${hub.foodStall.dish} (${hub.foodStall.name})</div>
      </div>
    `;

    const goBtn = document.getElementById("btn-fast-travel-go");
    if (goBtn && !isHere) {
      goBtn.addEventListener("click", () => {
        this.closeAllModals();
        this.handlers.onFastTravel?.(hub.id);
      });
    }
  }

  // --------------------------------------------------------------------------
  // Bahi-Khata Conservation Journal Modal
  // --------------------------------------------------------------------------
  renderJournal(quest) {
    const body = this.dom.journalBody;
    if (!body) return;

    const allLandmarks = CITY_ORDER.flatMap((id) =>
      CITY_HUBS[id].landmarks.map((lm) => ({ ...lm, city: CITY_HUBS[id].name }))
    );
    const step = quest.getCurrentStoryStep();

    const storyHtml = MAIN_STORY_STEPS.slice(0, -1)
      .map((st, idx) => {
        const done = idx < quest.storyIndex;
        const curr = idx === quest.storyIndex;
        return `<li class="${done ? "done" : curr ? "curr" : ""}">
          <strong>${done ? "✓" : curr ? "➤" : "○"} ${st.act}: ${st.title}</strong>
          ${curr ? `<div class="j-sub">${st.objective}</div>` : ""}
        </li>`;
      })
      .join("");

    const sideHtml = Object.values(SIDE_MISSIONS)
      .map((m) => {
        const done = quest.completedSides.has(m.id);
        return `<li class="${done ? "done" : ""}">
          <strong>${done ? "✓" : "○"} ${m.title}</strong> (${CITY_HUBS[m.hub].name}) — +${m.rewardSamman} Samman
          <div class="j-sub">${m.desc}</div>
        </li>`;
      })
      .join("");

    const photoHtml = allLandmarks
      .map((lm) => {
        const got = quest.documentedPhotos.has(lm.id);
        return `<div class="photo-card ${got ? "captured" : ""}">
          <div class="pc-head"><span>${got ? "📷" : "🔒"} ${lm.name}</span><span class="pc-city">${lm.city}</span></div>
          <p>${got ? lm.lore : "Visit this city and capture it in Photo Mode [F] to record heritage lore."}</p>
        </div>`;
      })
      .join("");

    body.innerHTML = `
      <div class="journal-stats">
        <span>✦ Samman: <strong>${quest.samman}</strong></span>
        <span>🗺 Hubs Visited: <strong>${quest.visitedHubs.size}/${CITY_ORDER.length}</strong></span>
        <span>📷 Landmarks Documented: <strong>${quest.documentedPhotos.size}/${allLandmarks.length}</strong></span>
        <span>🤝 Allies Recruited: <strong>${quest.allies.size}</strong></span>
      </div>

      <div class="journal-columns">
        <section class="j-col">
          <h4>📜 The Lost Ledger of Mewar (${step.act})</h4>
          <ul class="j-list">${storyHtml}</ul>

          <h4>🤝 Allies for Public Heritage Hearing</h4>
          <p class="j-allies">${
            quest.allies.size > 0
              ? Array.from(quest.allies).join(" · ")
              : "Help regional locals, archivists, boatmen & priests across India to rally allies!"
          }</p>
        </section>

        <section class="j-col">
          <h4>🎯 Regional Side Missions</h4>
          <ul class="j-list">${sideHtml}</ul>
        </section>
      </div>

      <h4 style="margin-top:14px">📷 Conservation Photo Archive</h4>
      <div class="photo-grid">${photoHtml}</div>
    `;
  }

  // --------------------------------------------------------------------------
  // Dialogue & Interactive Story / Mini-Game Modal
  // --------------------------------------------------------------------------
  openDialogue({ speaker, role, text, choices = [] }) {
    this.closeAllModals();
    this.activeModal = "dialogue";
    if (this.dom.modalBackdrop) this.dom.modalBackdrop.classList.add("open");
    if (this.dom.dialogueModal) this.dom.dialogueModal.classList.add("open");

    if (this.dom.dlgSpeaker) this.dom.dlgSpeaker.textContent = speaker;
    if (this.dom.dlgRole) this.dom.dlgRole.textContent = role || "BHARATVERSE";
    if (this.dom.dlgText) this.dom.dlgText.textContent = text;

    if (this.dom.dlgChoices) {
      this.dom.dlgChoices.innerHTML = "";
      choices.forEach((ch) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wood-btn" + (ch.primary ? " primary" : "");
        btn.textContent = ch.label;
        btn.addEventListener("click", () => {
          this.closeAllModals();
          ch.action?.();
        });
        this.dom.dlgChoices.appendChild(btn);
      });
    }
    this.handlers.onModalStateChange?.(true);
  }

  // --------------------------------------------------------------------------
  // Act 5 Non-Combat Public Heritage Hearing Finale UI
  // --------------------------------------------------------------------------
  openPublicHearing(quest) {
    this.closeAllModals();
    this.activeModal = "hearing";
    this.dom.modalBackdrop?.classList.add("open");
    this.dom.hearingModal?.classList.add("open");

    const body = this.dom.hearingBody;
    if (!body) return;

    body.innerHTML = `
      <p class="hearing-intro">
        Before the National Heritage Tribunal, Aarav places Grandfather Professor Vikram's <strong>Bahi-Khata Ledger</strong> on the carved podium. No violence — only truth, living culture, and the voice of Bharat!
      </p>
      <div class="journal-stats">
        <span>✦ Samman: <strong>${quest.samman}</strong></span>
        <span>📷 Evidence Photos: <strong>${quest.documentedPhotos.size}</strong></span>
        <span>🤝 City Allies: <strong>${quest.allies.size}</strong></span>
        <span>🎯 Local Quests: <strong>${quest.completedSides.size}</strong></span>
      </div>
      <div class="hearing-choices">
        <button id="hear-arg-unity" class="wood-btn primary">Present Pan-India Allies & Community Samman</button>
        <button id="hear-arg-ledger" class="wood-btn">Present Photographed Bahi-Khata Architectural Proof</button>
      </div>
    `;

    const deliver = (arg) => {
      const { ending, score } = this.handlers.onDeliverHearing?.(arg);
      body.innerHTML = `
        <div class="ending-card">
          <div class="ending-tier">${ending.tier} · Heritage Score ${score}</div>
          <h3>${ending.title}</h3>
          <p>${ending.summary}</p>
          <button id="btn-ending-continue" class="wood-btn primary">Continue Exploring BharatVerse</button>
        </div>
      `;
      document.getElementById("btn-ending-continue")?.addEventListener("click", () => this.closeAllModals());
    };

    document.getElementById("hear-arg-unity")?.addEventListener("click", () => deliver("unity"));
    document.getElementById("hear-arg-ledger")?.addEventListener("click", () => deliver("ledger"));
    this.handlers.onModalStateChange?.(true);
  }

  // --------------------------------------------------------------------------
  // Photo Mode (Filters + Landmark Documentation + Real PNG Download)
  // --------------------------------------------------------------------------
  togglePhotoMode(forceState) {
    const enter = forceState !== undefined ? forceState : this.activeModal !== "photo";
    if (!enter) {
      this.closeAllModals();
      return;
    }
    this.closeAllModals();
    this.activeModal = "photo";
    this.dom.photoOverlay?.classList.add("open");
    this.dom.hud?.classList.add("photo-hidden");
    this._applyPhotoFilter(this.activeFilter);
    this.handlers.onModalStateChange?.(false); // Camera orbit stays responsive in Photo Mode!
  }

  _renderPhotoFilterButtons() {
    const row = this.dom.photoFilterRow;
    if (!row) return;
    row.innerHTML = "";
    PHOTO_FILTERS.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-pill" + (f.id === this.activeFilter.id ? " active" : "");
      btn.textContent = f.label;
      btn.addEventListener("click", () => {
        this._applyPhotoFilter(f);
        row.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
      row.appendChild(btn);
    });
  }

  _applyPhotoFilter(filter) {
    this.activeFilter = filter;
    if (this.dom.canvas) {
      this.dom.canvas.style.filter = filter.css;
    }
  }

  updatePhotoTargetHint(landmark) {
    if (this.activeModal !== "photo" || !this.dom.photoTargetLabel) return;
    this.dom.photoTargetLabel.textContent = landmark
      ? `IN FRAME: ${landmark.name} (+${landmark.photoPoints} Samman)`
      : "Aim toward any Indian monument to document it in your Bahi-Khata Journal";
  }

  _triggerPhotoCapture(downloadPng) {
    if (this.dom.photoFlash) {
      this.dom.photoFlash.classList.add("flash");
      setTimeout(() => this.dom.photoFlash?.classList.remove("flash"), 220);
    }
    this.handlers.onPhotoSnap?.(downloadPng, this.activeFilter);
  }
}
