/* ============================================================================
   Layer 5 — Narrative & Quest System: "The Lost Ledger of Mewar"
   - Complete 5-Act Main Story Campaign across Ratanpur, Jaipur, Udaipur,
     Ahmedabad, Varanasi, MP Circuit (Khajuraho/Orchha/Gwalior), Hampi & Madurai/Mysore
   - Playable Side Missions (Missing Laddu, Gully Cricket, Pink City Rickshaw Race,
     Lake Cleanup, Heritage Walk, Ghat Cleanup, Boatman's Request)
   - Samman Reputation, Conservation Journal Photography & Multiple Endings
   ============================================================================ */

export const MAIN_STORY_STEPS = [
  {
    id: "act1_haveli",
    act: "Act 1 · The Inheritance",
    hub: "ratanpur",
    title: "Restore Grandfather Vikram's Haveli",
    objective: "Walk into the Ancestral Haveli courtyard in Ratanpur and press [E] to restore it & inspect the first Bahi-Khata ledger page."
  },
  {
    id: "act1_jaipur",
    act: "Act 1 · The Inheritance",
    hub: "jaipur",
    title: "Decode Jantar Mantar's Sundial",
    objective: "Fast-travel to Jaipur ([M]) and press [E] at Jantar Mantar or City Palace Archive to decode Professor Vikram's alignment clue."
  },
  {
    id: "act2_udaipur",
    act: "Act 2 · The Lake's Secret",
    hub: "udaipur",
    title: "Cross Lake Pichola to Jag Mandir",
    objective: "Travel to Udaipur, board a Wooden Boat ([V]), sail to Jag Mandir Island, and press [E] to expose the illegal lakebed excavation."
  },
  {
    id: "act25_ahmedabad",
    act: "Act 2.5 · Gujarat Detour",
    hub: "ahmedabad",
    title: "Uncover the Adalaj Stepwell Seal",
    objective: "Travel to Ahmedabad and press [E] inside Adalaj Stepwell (Vav) to recover the Gujarati merchant trade-route fragment."
  },
  {
    id: "act3_varanasi",
    act: "Act 3 · The Spiritual Heart",
    hub: "varanasi",
    title: "Unlock the Kashi Temple Archive",
    objective: "In Varanasi, help clean Dashashwamedh Ghat or speak with Acharya Tripathi, then inspect Kashi Vishwanath Archive ([E])."
  },
  {
    id: "act4_mp",
    act: "Act 4 · The Heart of India",
    hub: "khajuraho",
    title: "Triangulate the Bundela-Chandela Route",
    objective: "Visit Khajuraho, Orchha, or Gwalior and inspect the monument inscriptions ([E]) to pinpoint the hidden Deccan stepwell."
  },
  {
    id: "act5_hampi",
    act: "Act 5 · The Southern Climax",
    hub: "hampi",
    title: "Document Hampi's Threatened Stepwell",
    objective: "Travel to Hampi, inspect the Conglomerate Excavation Site ([E]) or photograph it ([F]) to collect ironclad tribunal evidence."
  },
  {
    id: "act5_hearing",
    act: "Act 5 · Public Heritage Hearing",
    hub: "madurai",
    title: "Present the Bahi-Khata at the Public Hearing",
    objective: "Travel to Madurai (Thirumalai Nayakkar Palace) or Mysore Palace and press [E] at the Hearing Podium to defend Bharat's heritage!"
  },
  {
    id: "epilogue",
    act: "Epilogue · The Living Legend",
    hub: "ratanpur",
    title: "Free-Roam Across All 12 Indian Heritage Hubs",
    objective: "Complete your Conservation Journal ([F]), savor regional street food, and witness evening festivals across BharatVerse!"
  }
];

export const SIDE_MISSIONS = {
  missing_laddu: {
    id: "missing_laddu",
    hub: "ratanpur",
    title: "The Missing Laddu",
    desc: "Ring the brass bell at Shri Ganesh Mandir and recover Pandit Sharma's prasad from mischievous rooftop monkeys.",
    rewardSamman: 120
  },
  gully_cricket: {
    id: "gully_cricket",
    hub: "ratanpur",
    title: "Chandni Bazaar Gully Cricket",
    desc: "Hit a winning boundary with Kabir in Chandni Bazaar to win bazaar trust.",
    rewardSamman: 110
  },
  rickshaw_race: {
    id: "rickshaw_race",
    hub: "jaipur",
    title: "Pink City Rickshaw Time Trial",
    desc: "Race an Auto-Rickshaw through 4 glowing Jaipur heritage checkpoints before time runs out!",
    rewardSamman: 160
  },
  lake_cleanup: {
    id: "lake_cleanup",
    hub: "udaipur",
    title: "Lake Pichola Community Cleanup",
    desc: "Help Dr. Meera rally Udaipur locals to protect Lake Pichola's ghats.",
    rewardSamman: 140
  },
  heritage_walk: {
    id: "heritage_walk",
    hub: "ahmedabad",
    title: "Ahmedabad Heritage Walk & Thali",
    desc: "Sample Manek Chowk's finest Gujarati Thali for food-critic Kiranben.",
    rewardSamman: 120
  },
  ghat_cleanup: {
    id: "ghat_cleanup",
    hub: "varanasi",
    title: "Dashashwamedh Ghat Cleanup & Boatman's Request",
    desc: "Help preserve the sacred ghats and sail past the Ganga Aarti flames.",
    rewardSamman: 150
  }
};

export class QuestStorySystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.storyIndex = 0;
    this.samman = 120; // Crowd reputation ("Samman")
    this.haveliRestored = false;
    this.visitedHubs = new Set(["ratanpur"]);
    this.documentedPhotos = new Set(); // landmark IDs captured in Photo Mode
    this.completedSides = new Set();
    this.allies = new Set();
    this.bellsRung = 0;
    this.homesRespected = 0;
    this.endingAchieved = null;

    // Active Pink City Rickshaw Race transient state
    this.race = {
      active: false,
      timer: 0,
      index: 0,
      checkpoints: [
        { x: 14, z: 4 },
        { x: 22, z: -16 },
        { x: -16, z: -12 },
        { x: 0, z: 22 }
      ]
    };
  }

  getCurrentStoryStep() {
    return MAIN_STORY_STEPS[Math.min(this.storyIndex, MAIN_STORY_STEPS.length - 1)];
  }

  exportState() {
    return {
      storyIndex: this.storyIndex,
      samman: this.samman,
      haveliRestored: this.haveliRestored,
      visitedHubs: Array.from(this.visitedHubs),
      documentedPhotos: Array.from(this.documentedPhotos),
      completedSides: Array.from(this.completedSides),
      allies: Array.from(this.allies),
      bellsRung: this.bellsRung,
      homesRespected: this.homesRespected,
      endingAchieved: this.endingAchieved
    };
  }

  importState(data) {
    if (!data) return;
    this.storyIndex = Number.isFinite(data.storyIndex) ? data.storyIndex : 0;
    this.samman = Number.isFinite(data.samman) ? data.samman : 120;
    this.haveliRestored = !!data.haveliRestored;
    this.visitedHubs = new Set(data.visitedHubs || ["ratanpur"]);
    this.documentedPhotos = new Set(data.documentedPhotos || []);
    this.completedSides = new Set(data.completedSides || []);
    this.allies = new Set(data.allies || []);
    this.bellsRung = data.bellsRung || 0;
    this.homesRespected = data.homesRespected || 0;
    this.endingAchieved = data.endingAchieved || null;
  }

  addSamman(points) {
    this.samman += points;
  }

  markHubVisited(hubId) {
    if (!this.visitedHubs.has(hubId)) {
      this.visitedHubs.add(hubId);
      this.addSamman(35);
      return true;
    }
    return false;
  }

  recruitAlly(allyName) {
    if (!this.allies.has(allyName)) {
      this.allies.add(allyName);
      this.addSamman(75);
      return true;
    }
    return false;
  }

  recordPhoto(landmark) {
    if (!landmark) return { newlyDocumented: false };
    if (this.documentedPhotos.has(landmark.id)) {
      return { newlyDocumented: false, landmark };
    }
    this.documentedPhotos.add(landmark.id);
    this.addSamman(landmark.photoPoints || 100);

    // Photographing Hampi excavation site automatically advances Act 5 evidence step!
    if (landmark.id === "hampi_excavation_site" && this.getCurrentStoryStep().id === "act5_hampi") {
      this.advanceStoryTo("act5_hearing");
    }
    return { newlyDocumented: true, landmark };
  }

  completeSideMission(sideId) {
    const mission = SIDE_MISSIONS[sideId];
    if (!mission || this.completedSides.has(sideId)) return null;
    this.completedSides.add(sideId);
    this.addSamman(mission.rewardSamman);
    return mission;
  }

  advanceStoryTo(stepId) {
    const idx = MAIN_STORY_STEPS.findIndex((s) => s.id === stepId);
    if (idx > this.storyIndex) {
      this.storyIndex = idx;
      this.addSamman(140);
      return MAIN_STORY_STEPS[this.storyIndex];
    }
    return null;
  }

  // Triggered when interacting [E] with a key landmark
  handleLandmarkStoryAction(hubId, landmark) {
    const step = this.getCurrentStoryStep();

    if (landmark.id === "ratanpur_haveli" && !this.haveliRestored) {
      this.haveliRestored = true;
      this.advanceStoryTo("act1_jaipur");
      return {
        rebuildHub: true,
        headline: "Ancestral Haveli Restored! (+140 Samman)",
        detail:
          "Rangoli blooms across Grandfather Vikram's courtyard! Hidden in his teak desk you find the first torn page of the Bahi-Khata pointing to Jaipur's Jantar Mantar sundial. Pan-India Fast Travel [M] unlocked!"
      };
    }

    if (hubId === "jaipur" && (landmark.id === "jantar_mantar" || landmark.id === "jaipur_city_palace")) {
      if (step.id === "act1_jaipur" || this.storyIndex <= 1) {
        this.recruitAlly("Astronomer Devraj (Jaipur)");
        this.advanceStoryTo("act2_udaipur");
        return {
          headline: "Sundial Alignment Decoded! (+215 Samman)",
          detail:
            "The Samrat Yantra shadow reveals the hidden compartment inside City Palace Archive! A Mewar ledger entry mentions Boatman Shambhu and Jag Mandir Island on Lake Pichola in Udaipur."
        };
      }
    }

    if (hubId === "udaipur" && landmark.id === "jag_mandir") {
      if (this.storyIndex <= 2) {
        this.recruitAlly("Boatman Shambhu (Udaipur)");
        this.advanceStoryTo("act25_ahmedabad");
        return {
          headline: "Lake Pichola's Secret Uncovered! (+215 Samman)",
          detail:
            "Carved beneath Jag Mandir's marble terrace you document illegal conglomerate drilling marks and an old Gujarati seal pointing to Ahmedabad's Adalaj Stepwell!"
        };
      }
    }

    if (hubId === "ahmedabad" && landmark.id === "adalaj_vav") {
      if (this.storyIndex <= 3) {
        this.recruitAlly("Architect Jatin Patel (Ahmedabad)");
        this.advanceStoryTo("act3_varanasi");
        return {
          headline: "Adalaj Stepwell Map Fragment Found! (+215 Samman)",
          detail:
            "On the cool subterranean carving ledge of Adalaj Vav, you recover the merchant map tracing the Bahi-Khata eastward to Varanasi's Kashi Vishwanath archive!"
        };
      }
    }

    if (hubId === "varanasi" && (landmark.id === "kashi_vishwanath" || landmark.id === "dashashwamedh_ghat")) {
      if (this.storyIndex <= 4) {
        this.completeSideMission("ghat_cleanup");
        this.recruitAlly("Acharya Tripathi (Varanasi)");
        this.advanceStoryTo("act4_mp");
        return {
          headline: "Kashi Archive Ledger Piece Recovered! (+365 Samman)",
          detail:
            "Moved by your ghat stewardship, Acharya Tripathi unlocks the Kashi archive — revealing that Chandela & Bundela kings safeguarded the route across Khajuraho, Orchha & Gwalior!"
        };
      }
    }

    if (["khajuraho", "orchha", "gwalior"].includes(hubId) && this.storyIndex <= 5) {
      this.recruitAlly("Bundela-Chandela Guild (MP Circuit)");
      this.advanceStoryTo("act5_hampi");
      return {
        headline: "Hidden Deccan Trade Stepwell Triangulated! (+215 Samman)",
        detail:
          "By aligning the Chandela temple plinth and Bundela fort notes, the complete Bahi-Khata reveals the final threatened site near Hampi's Vittala Stone Chariot!"
      };
    }

    if (hubId === "hampi" && (landmark.id === "hampi_excavation_site" || landmark.id === "stone_chariot")) {
      if (this.storyIndex <= 6) {
        this.recruitAlly("Dr. Kavya (Hampi)");
        this.advanceStoryTo("act5_hearing");
        return {
          headline: "Conglomerate Excavation Evidence Secured! (+215 Samman)",
          detail:
            "You document the historic Bahi-Khata stepwell inscription right beside the illegal bulldozers! Head to Madurai (Thirumalai Nayakkar Palace) or Mysore Palace for the Public Heritage Hearing!"
        };
      }
    }

    if (landmark.type === "hearing") {
      return { openHearing: true };
    }

    return null;
  }

  // Computes which of the 3 Non-Combat Public Hearing Endings Aarav achieves!
  evaluatePublicHearing(chosenArgument) {
    const score =
      this.samman +
      this.documentedPhotos.size * 65 +
      this.allies.size * 90 +
      this.completedSides.size * 70 +
      (chosenArgument === "unity" ? 120 : 80);

    let ending;
    if (score >= 900 || (this.allies.size >= 4 && this.documentedPhotos.size >= 4)) {
      ending = {
        tier: "GOLDEN ENDING",
        title: "BharatVerse: The Living Legend",
        summary:
          "Allies from Ratanpur, Jaipur, Udaipur, Ahmedabad, Varanasi, Madhya Pradesh, and South India stand united before the Tribunal! Your photographed Bahi-Khata proof permanently halts the conglomerate. Professor Vikram steps out from protective safekeeping, proud as India declares a protected Pan-India Living Heritage Corridor!"
      };
    } else if (score >= 480) {
      ending = {
        tier: "SILVER ENDING",
        title: "The Conservationist's Victory",
        summary:
          "Your Conservation Journal documentation and community Samman sway the Heritage Tribunal! An immediate preservation injunction protects Hampi's stepwell and Lake Pichola, while Professor Vikram's Bahi-Khata ledger is enshrined in the National Archives."
      };
    } else {
      ending = {
        tier: "BRONZE ENDING",
        title: "The Grassroots Awakening",
        summary:
          "Even with limited files, the heartfelt voices of local artisans, priests, and boatmen force a legal stay on demolition. Explore more hubs, recruit regional allies, and photograph monuments to unlock the Golden Living Legend ending!"
      };
    }

    this.endingAchieved = ending.title;
    this.storyIndex = MAIN_STORY_STEPS.length - 1;
    this.addSamman(250);
    return { ending, score };
  }
}
