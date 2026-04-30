// Tiny BGM player + WebAudio-synthesized SFX.
//
// BGM holds one HTMLAudioElement with fades. SFX are generated on demand
// from a shared AudioContext so we don't ship sound files for short cues.
// Browsers require a user gesture before audio can start; the host is
// expected to call ensurePrimed() inside a click handler (we do this on
// the title click) before calling playBGM() or playSfx().

const FADE_MS = 800;
const DEFAULT_VOLUME = 0.55;
const SFX_GAIN = 0.32;            // master gain for synthesized one-shots

// SFX synthesizers — each takes (audioCtx, gain) and schedules a brief
// envelope on a fresh oscillator chain. Kept inline so the file is the
// single point of truth for game audio.

function sfxDoorBell(ctx, gain) {
  // Two-note bright bell: short attack, long decay, slight detune for warmth.
  const t0 = ctx.currentTime;
  const g = ctx.createGain();
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * 0.7, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);

  for (const freq of [880, 1320]) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + 0.65);
  }
}

function sfxBowlPlace(ctx, gain) {
  // Soft low thunk with a tiny pitch drop — sounds like ceramic settling.
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(120, t0 + 0.12);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * 0.9, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.25);
}

function sfxTextBlip(ctx, gain) {
  // Very short high tick — used while the typewriter reveals characters.
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 1100;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * 0.18, t0 + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}

function sfxSatisfied(ctx, gain) {
  // Two sine glissandos rising in parallel — the "rin~" satisfaction chime.
  const t0 = ctx.currentTime;
  const g = ctx.createGain();
  g.connect(ctx.destination);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain * 0.55, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);

  const o1 = ctx.createOscillator();
  o1.type = 'sine';
  o1.frequency.setValueAtTime(660, t0);                       // E5
  o1.frequency.linearRampToValueAtTime(990, t0 + 0.4);        // → B5
  o1.connect(g);
  o1.start(t0);
  o1.stop(t0 + 0.95);

  const o2 = ctx.createOscillator();
  o2.type = 'sine';
  o2.frequency.setValueAtTime(990, t0);                       // B5
  o2.frequency.linearRampToValueAtTime(1320, t0 + 0.4);       // → E6
  o2.connect(g);
  o2.start(t0);
  o2.stop(t0 + 0.95);
}

const SFX = {
  door_bell:   sfxDoorBell,
  bowl_place:  sfxBowlPlace,
  text_blip:   sfxTextBlip,
  satisfied:   sfxSatisfied,
};

export function createAudioMixer() {
  let bgmEl = null;
  let bgmKey = null;
  let bgmTargetVolume = DEFAULT_VOLUME;
  let muted = false;
  let primed = false;
  let assets = null;
  let sfxCtx = null;          // lazy WebAudio AudioContext for synthesized SFX

  function attach(loadedAssets) {
    assets = loadedAssets;
  }

  function getSfxCtx() {
    if (!sfxCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      sfxCtx = new Ctx();
    }
    if (sfxCtx.state === 'suspended') {
      // Resume can be called outside a gesture; just ignore failures.
      sfxCtx.resume().catch(() => {});
    }
    return sfxCtx;
  }

  function playSfx(name) {
    if (muted || !primed) return;
    const synth = SFX[name];
    if (!synth) return;
    const ctx = getSfxCtx();
    if (!ctx) return;
    try {
      synth(ctx, SFX_GAIN);
    } catch (err) {
      console.warn('[audio] sfx failed:', name, err);
    }
  }

  // Browsers gate audio playback on a user gesture. Calling this inside a
  // real click/keydown handler unlocks the mixer for the rest of the
  // session.
  function ensurePrimed() {
    primed = true;
  }

  function fadeTo(el, target, ms) {
    if (!el) return;
    // Capture the current key so a track switch mid-fade doesn't pause the
    // new track when this fade completes.
    const fadeOwnerKey = bgmKey;
    const start = el.volume;
    const t0 = performance.now();
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      el.volume = start + (target - start) * k;
      if (k < 1) {
        requestAnimationFrame(tick);
      } else if (target === 0 && el === bgmEl && bgmKey === fadeOwnerKey) {
        try { el.pause(); } catch (_) {}
      }
    };
    requestAnimationFrame(tick);
  }

  function effectiveVolume() {
    return muted ? 0 : bgmTargetVolume;
  }

  function playBGM(key, { volume = DEFAULT_VOLUME, loop = true } = {}) {
    if (!primed) {
      // Not allowed to play yet — record the intent; the host should retry
      // after the next user gesture.
      bgmKey = key;
      bgmTargetVolume = volume;
      return;
    }
    const el = assets?.audio?.[key];
    if (!el) {
      console.warn(`[audio] BGM not loaded: ${key}`);
      return;
    }
    if (bgmEl === el && !el.paused) {
      // Already playing the requested track — just adjust target volume.
      bgmTargetVolume = volume;
      fadeTo(el, effectiveVolume(), FADE_MS);
      return;
    }
    // Different (or paused) track — fade out the old one if any, fade in the new.
    if (bgmEl && bgmEl !== el) {
      fadeTo(bgmEl, 0, FADE_MS);
    }
    bgmEl = el;
    bgmKey = key;
    bgmTargetVolume = volume;
    el.loop = loop;
    el.volume = 0;
    el.currentTime = 0;
    const playPromise = el.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((err) => {
        // Autoplay blocked despite priming — wait for the next gesture.
        console.warn('[audio] play() rejected:', err.name);
        primed = false;
      });
    }
    fadeTo(el, effectiveVolume(), FADE_MS);
  }

  function stopBGM() {
    if (!bgmEl) return;
    fadeTo(bgmEl, 0, FADE_MS);
  }

  function setMuted(v) {
    muted = !!v;
    if (bgmEl) fadeTo(bgmEl, effectiveVolume(), 250);
  }

  function toggleMuted() {
    setMuted(!muted);
    return muted;
  }

  function isMuted() { return muted; }
  function isPrimed() { return primed; }

  return {
    attach,
    ensurePrimed,
    playBGM,
    stopBGM,
    playSfx,
    setMuted,
    toggleMuted,
    isMuted,
    isPrimed,
  };
}

// Singleton instance — only one mixer per page makes sense for our game.
export const audio = createAudioMixer();
