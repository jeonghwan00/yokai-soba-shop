// Entry point — boots the asset loader, then drives a scene-dispatched
// game loop. Logical canvas is 640x360; CSS does integer-multiple scaling.

import { state, dispatch, SCENES } from './state.js';
import { loadAssets } from './systems/assetLoader.js';
import { attachInput, onClick, onKeyDown } from './systems/input.js';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, drawText, clear } from './systems/renderer.js';
import { audio } from './systems/audio.js';
import { tr, getLocale, onLocaleChange } from './i18n.js';
import { portal } from './portals.js';

// Keep the browser tab title in sync with the active locale.
function syncDocTitle() {
  document.title = getLocale() === 'en' ? 'Yokai Soba Shop' : '요괴 소바집';
}
syncDocTitle();
onLocaleChange(syncDocTitle);
import * as titleScene from './scenes/titleScene.js';
import * as morningScene from './scenes/morningScene.js';
import * as nightScene from './scenes/nightScene.js';
import * as tallyScene from './scenes/tallyScene.js';
import * as endingScene from './scenes/endingScene.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function fitCanvasToViewport() {
  const scale = Math.max(
    1,
    Math.min(
      Math.floor(window.innerWidth / LOGICAL_WIDTH),
      Math.floor(window.innerHeight / LOGICAL_HEIGHT)
    )
  );
  canvas.style.width = `${LOGICAL_WIDTH * scale}px`;
  canvas.style.height = `${LOGICAL_HEIGHT * scale}px`;
}
window.addEventListener('resize', fitCanvasToViewport);
fitCanvasToViewport();

attachInput(canvas);

// Scene table — keyed by SCENES enum. Each scene exports enter/exit/update/render.
const sceneModules = {
  [SCENES.TITLE]: titleScene,
  [SCENES.MORNING]: morningScene,
  [SCENES.NIGHT]: nightScene,
  [SCENES.TALLY]: tallyScene,
  [SCENES.ENDING]: endingScene,
};

let activeSceneKey = null;

function syncActiveScene() {
  const next = state.scene;
  if (next === activeSceneKey) return;
  if (activeSceneKey) {
    sceneModules[activeSceneKey]?.exit?.();
  }
  activeSceneKey = next;
  sceneModules[activeSceneKey]?.enter?.();
}

// Boot screen — shown only while assets load. Kept tiny so we honor the
// jam rule about no heavy loading screens.
let bootProgress = 0;
function renderBoot() {
  clear(ctx, '#0a0a0f');
  drawText(ctx, '요괴 소바집', LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 - 14, {
    color: '#f5e6d3', size: 18, align: 'center', baseline: 'middle',
  });
  const barW = 160, barH = 4, barX = (LOGICAL_WIDTH - barW) / 2, barY = LOGICAL_HEIGHT / 2 + 12;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#f4d03f';
  ctx.fillRect(barX, barY, Math.round(barW * bootProgress), barH);
}

function update(dt) {
  syncActiveScene();
  if (state.scene === SCENES.BOOT) return;
  sceneModules[activeSceneKey]?.update?.(dt);
}

function render() {
  if (state.scene === SCENES.BOOT) {
    renderBoot();
    return;
  }
  sceneModules[activeSceneKey]?.render?.(ctx);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Kick off asset load in parallel with the loop.
// Some UI/background art is not yet on disk — list them here so the loader
// reports a warning instead of rejecting the whole batch.
const OPTIONAL_KEYS = new Set([
  'dialogue_frame',
  'shop_rain', // safety: present today, but tolerate if regenerated
]);

loadAssets({
  optionalKeys: OPTIONAL_KEYS,
  onProgress: (_loaded, _total, fraction) => {
    bootProgress = fraction;
  },
}).then((assets) => {
  audio.attach(assets);
  dispatch({ type: 'ASSETS_LOADED', assets });
  // Vibe Jam continuity: arrivals through a portal skip our title screen
  // entirely so the hand-off feels seamless to the player.
  if (portal.arrived) {
    dispatch({ type: 'START_GAME' });
  }
}).catch((err) => {
  console.error('[main] asset load failed', err);
  drawText(ctx, tr('자산 로드 실패 — 콘솔 확인', 'Asset load failed — see console'),
    LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 30, {
    color: '#e74c3c', size: 10, align: 'center', baseline: 'middle',
  });
});

// Browsers block audio playback until the user has interacted with the
// page. The first click / first keydown unlocks the mixer; we then start
// BGM (if assets are ready) so it's running by the time we leave the title.
function primeAndStartBGM() {
  if (audio.isPrimed()) return;
  audio.ensurePrimed();
  audio.playBGM('bgm_main');
}
onClick(primeAndStartBGM);
onKeyDown((key) => {
  primeAndStartBGM();
  // 'ㅡ' is the jamo produced when Korean IME is on and M is pressed.
  if (key === 'm' || key === 'ㅡ') audio.toggleMuted();
});
