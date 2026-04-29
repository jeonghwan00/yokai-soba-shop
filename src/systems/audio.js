// Tiny BGM player.
//
// Holds one HTMLAudioElement, exposes play/stop/setMuted with fades. Browsers
// require a user gesture before audio can start, so the host is expected to
// call ensurePrimed() inside a click handler (we do this on the title click)
// before calling playBGM().

const FADE_MS = 800;
const DEFAULT_VOLUME = 0.55;

export function createAudioMixer() {
  let bgmEl = null;
  let bgmKey = null;
  let bgmTargetVolume = DEFAULT_VOLUME;
  let muted = false;
  let primed = false;
  let assets = null;

  function attach(loadedAssets) {
    assets = loadedAssets;
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
    setMuted,
    toggleMuted,
    isMuted,
    isPrimed,
  };
}

// Singleton instance — only one mixer per page makes sense for our game.
export const audio = createAudioMixer();
