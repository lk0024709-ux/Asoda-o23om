/* ============================================================================
   Audio System — Procedural Web Audio API Indian Heritage Soundscape
   - Classical Indian Raga Sitar & Bansuri Flute Ambient Phrases (Bhupali, Yaman,
     Desh, Khamaj, Bhairav, Malkauns) + gentle Tanpura drone
   - Resonant Brass Temple Bell (Ghanta), Camera Shutter, Auto Horn,
     Royal Enfield Thump, Food Sizzle & Heritage Chimes
   ============================================================================ */

const RAGA_SCALES = {
  bhupali:  [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], // Sa Re Ga Pa Dha Sa'
  yaman:    [261.63, 293.66, 329.63, 369.99, 392.0, 440.0, 493.88, 523.25],
  desh:     [261.63, 293.66, 349.23, 392.0, 466.16, 523.25],
  khamaj:   [261.63, 329.63, 349.23, 392.0, 440.0, 466.16, 523.25],
  bhairav:  [261.63, 277.18, 329.63, 349.23, 392.0, 415.3, 493.88, 523.25],
  malkauns: [261.63, 311.13, 349.23, 415.3, 466.16, 523.25]
};

export class BharatAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ragaKey = "bhupali";
    this._musicTimer = 0;
    this._noteIndex = 0;
  }

  unlock() {
    if (this.muted || typeof window === "undefined") return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch (_) {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setRaga(key) {
    if (RAGA_SCALES[key]) this.ragaKey = key;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type = "sine", vol = 0.08, endFreq = null, delay = 0) {
    const ctx = this.unlock();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(25, endFreq), now + dur);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.03);
    } catch (_) {}
  }

  // Called in main loop to weave subtle ambient sitar / flute phrases
  updateMusic(dt) {
    if (this.muted || !this.ctx || this.ctx.state !== "running") return;
    this._musicTimer -= dt;
    if (this._musicTimer > 0) return;

    const scale = RAGA_SCALES[this.ragaKey] || RAGA_SCALES.bhupali;
    // Soft tanpura Sa-Pa resonance on every 6th phrase
    if (this._noteIndex % 6 === 0) {
      this._tone(130.81, 3.2, "triangle", 0.022);
      this._tone(196.0, 2.8, "sine", 0.016, null, 0.25);
    }
    // Delicate plucked sitar or airy bansuri flute note
    const note = scale[(this._noteIndex * 2 + Math.floor(Math.random() * 2)) % scale.length];
    const isFlute = this._noteIndex % 3 === 0;
    this._tone(note, isFlute ? 1.15 : 0.72, isFlute ? "sine" : "sawtooth", isFlute ? 0.028 : 0.018);

    this._noteIndex++;
    this._musicTimer = 1.65 + Math.random() * 1.4;
  }

  playTempleBell() {
    // Rich metallic harmonic brass ghanta bell resonance!
    this._tone(587.3, 2.1, "sine", 0.14);
    this._tone(1174.6, 1.4, "triangle", 0.07);
    this._tone(1760.0, 0.85, "sine", 0.04);
  }

  playShutter() {
    this._tone(900, 0.05, "square", 0.07, 220);
    this._tone(640, 0.07, "triangle", 0.06, 980, 0.06);
  }

  playStoryChime() {
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((n, i) => this._tone(n, 0.35, "triangle", 0.08, null, i * 0.09));
  }

  playAutoHorn() {
    this._tone(420, 0.16, "sawtooth", 0.08, 412);
    this._tone(530, 0.16, "sawtooth", 0.07, 520, 0.09);
  }

  playEnfieldThump() {
    this._tone(92, 0.18, "sawtooth", 0.11, 52);
    this._tone(86, 0.18, "triangle", 0.1, 48, 0.14);
  }

  playEatFood(tooSpicy = false) {
    this._tone(520, 0.1, "sine", 0.08, 720);
    if (tooSpicy) {
      this._tone(340, 0.28, "sawtooth", 0.09, 180, 0.12);
    } else {
      this._tone(720, 0.14, "triangle", 0.08, 880, 0.1);
    }
  }

  playFastTravel() {
    const scale = RAGA_SCALES[this.ragaKey] || RAGA_SCALES.bhupali;
    scale.slice(0, 5).forEach((f, i) => this._tone(f, 0.25, "sine", 0.07, null, i * 0.065));
  }
}
