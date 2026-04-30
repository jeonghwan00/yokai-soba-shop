// Asset loader: builds a single manifest of every PNG/audio used by the game,
// loads them in parallel, and reports progress (0..1) so the caller can show
// a minimal progress indicator (jam rule: no heavy loading screens).
//
// All assets resolve relative to /assets/ (served from public/assets/).

const CHARACTER_KEYS = [
  'yukionna',
  'kitsune',
  'kappa',
  'tengu',
  'nekomata',
  'grandmother',
];

function buildManifest() {
  const images = {};

  for (const key of CHARACTER_KEYS) {
    images[`${key}_neutral`] = `assets/characters/${key}_1.png`;
    images[`${key}_happy`] = `assets/characters/${key}_2.png`;
    images[`${key}_sad`] = `assets/characters/${key}_3.png`;
  }

  images.ingredient_sheet = 'assets/ingredients/ingredient_sheet.png';
  images.topping_sheet = 'assets/ingredients/topping_sheet.png';

  images.shop_night = 'assets/backgrounds/shop_interior_night.png';
  images.shop_rain = 'assets/backgrounds/shop_interior_rain.png';

  images.recipe_notebook = 'assets/ui/recipe_notebook.png';
  images.dialogue_frame = 'assets/ui/dialogue_frame.png';
  images.heart_low = 'assets/ui/heart_low.png';
  images.heart_mid = 'assets/ui/heart_mid.png';
  images.heart_high = 'assets/ui/heart_high.png';

  // Only BGM streams from disk — SFX are synthesized in audio.js via
  // WebAudio so we don't ship one-shot files.
  const audio = {
    bgm_main: 'assets/audio/bgm_main.mp3',
  };

  return { images, audio };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// We resolve as soon as metadata is available — the actual data streams in
// progressively when we call .play(). For multi-MB BGM tracks this avoids
// blocking the boot screen on a full preload.
function loadAudio(src) {
  return new Promise((resolve, reject) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => resolve(a);
    a.oncanplay = () => resolve(a); // belt + suspenders for browsers that skip metadata event
    a.onerror = () => reject(new Error(`Failed to load audio: ${src}`));
    a.src = src;
  });
}

// Loads every entry in the manifest in parallel and reports progress.
// onProgress(loaded, total, fraction) is invoked after each asset settles.
// `optional` keys (e.g. audio that may not exist yet) won't reject the batch —
// they resolve to null and get logged.
export async function loadAssets({ onProgress, optionalKeys = new Set() } = {}) {
  const manifest = buildManifest();
  const tasks = [];

  for (const [key, src] of Object.entries(manifest.images)) {
    tasks.push({ key, src, kind: 'image' });
  }
  for (const [key, src] of Object.entries(manifest.audio)) {
    tasks.push({ key, src, kind: 'audio' });
  }

  const total = tasks.length;
  let loaded = 0;
  const results = { images: {}, audio: {} };

  const promises = tasks.map(async ({ key, src, kind }) => {
    const isOptional = optionalKeys.has(key) || kind === 'audio';
    try {
      const value =
        kind === 'image' ? await loadImage(src) : await loadAudio(src);
      results[kind === 'image' ? 'images' : 'audio'][key] = value;
    } catch (err) {
      if (isOptional) {
        results[kind === 'image' ? 'images' : 'audio'][key] = null;
        console.warn(`[assetLoader] optional miss: ${key} (${src})`);
      } else {
        throw err;
      }
    } finally {
      loaded += 1;
      if (onProgress) onProgress(loaded, total, loaded / total);
    }
  });

  await Promise.all(promises);
  return results;
}

export { buildManifest, CHARACTER_KEYS };
