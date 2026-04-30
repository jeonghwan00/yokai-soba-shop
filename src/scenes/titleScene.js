import { state, dispatch, SCENES } from '../state.js';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  clear,
  drawText,
  drawBackground,
  fillRoundRect,
} from '../systems/renderer.js';
import { onClick, pointInRect } from '../systems/input.js';
import { tr, getLocale, toggleLocale } from '../i18n.js';
import { portal, exitToVibeJam, returnToRef, refLabel } from '../portals.js';

const LANG_BTN        = { x: LOGICAL_WIDTH - 96, y: LOGICAL_HEIGHT - 28, w: 86, h: 18 };
const EXIT_PORTAL_BTN = { x: LOGICAL_WIDTH - 96, y: LOGICAL_HEIGHT - 50, w: 86, h: 18 };
const RETURN_PORTAL_BTN = { x: 10, y: LOGICAL_HEIGHT - 28, w: 100, h: 18 };

let unsubscribe = null;
let blink = 0;

export function enter() {
  blink = 0;
  unsubscribe = onClick((p) => {
    if (state.scene !== SCENES.TITLE) return;
    // Buttons are checked first so a click on them doesn't fall through to
    // "start the game".
    if (pointInRect(p, LANG_BTN)) {
      toggleLocale();
      return;
    }
    if (pointInRect(p, EXIT_PORTAL_BTN)) {
      exitToVibeJam();
      return;
    }
    if (portal.ref && pointInRect(p, RETURN_PORTAL_BTN)) {
      returnToRef();
      return;
    }
    // START_GAME transitions us to MORNING for day 1.
    dispatch({ type: 'START_GAME' });
  });
}

export function exit() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
}

export function update(dt) {
  blink += dt;
}

export function render(ctx) {
  const bg = state.assets.images?.shop_night;
  if (bg) {
    drawBackground(ctx, bg);
    ctx.fillStyle = 'rgba(10, 10, 15, 0.62)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  } else {
    clear(ctx, '#0a0a0f');
  }

  // Big title in the active language; the other language sits as a small
  // subtitle so the brand stays bilingual either way.
  drawText(ctx, tr('요괴 소바집', 'Yokai Soba Shop'), LOGICAL_WIDTH / 2, 130, {
    color: '#f5e6d3', size: 28, align: 'center', baseline: 'middle',
  });
  drawText(ctx, tr('Yokai Soba Shop', '요괴 소바집'), LOGICAL_WIDTH / 2, 158, {
    color: '#8c7a65', size: 11, align: 'center', baseline: 'middle',
  });

  // Premise tagline — sets the mood before the prologue plays.
  drawText(ctx, tr('1960년대 일본 산골.', '1960s Japan, a mountain village.'),
    LOGICAL_WIDTH / 2, 200, {
    color: '#d4b896', size: 11, align: 'center', baseline: 'middle',
  });
  drawText(ctx, tr(
    '돌아가신 할머니가 남기신 작은 소바집.',
    'A small soba shop your late grandmother left to you.'
  ), LOGICAL_WIDTH / 2, 218, {
    color: '#d4b896', size: 11, align: 'center', baseline: 'middle',
  });
  drawText(ctx, tr('오늘 밤, 첫 영업이다.', 'Tonight is your first opening.'),
    LOGICAL_WIDTH / 2, 236, {
    color: '#d4b896', size: 11, align: 'center', baseline: 'middle',
  });

  // Blinking start prompt.
  if (Math.floor(blink * 1.6) % 2 === 0) {
    drawText(ctx, tr('— 클릭해서 시작 —', '— Click to begin —'),
      LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 56, {
      color: '#f4d03f', size: 12, align: 'center', baseline: 'middle',
    });
  }

  // Language toggle button — shows the OTHER language (the one you'd
  // switch to). Avoids the "what does this button do?" ambiguity.
  fillRoundRect(ctx, LANG_BTN.x, LANG_BTN.y, LANG_BTN.w, LANG_BTN.h, 4,
    'rgba(93, 58, 26, 0.85)');
  drawText(ctx,
    getLocale() === 'ko' ? 'English' : '한국어',
    LANG_BTN.x + LANG_BTN.w / 2,
    LANG_BTN.y + LANG_BTN.h / 2, {
    color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
  });

  // Vibe Jam exit portal.
  fillRoundRect(ctx, EXIT_PORTAL_BTN.x, EXIT_PORTAL_BTN.y,
    EXIT_PORTAL_BTN.w, EXIT_PORTAL_BTN.h, 4, 'rgba(106, 76, 147, 0.9)');
  drawText(ctx, '⛩ Vibe Jam',
    EXIT_PORTAL_BTN.x + EXIT_PORTAL_BTN.w / 2,
    EXIT_PORTAL_BTN.y + EXIT_PORTAL_BTN.h / 2, {
    color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
  });

  // Return portal — only when we arrived from another game.
  if (portal.ref) {
    fillRoundRect(ctx, RETURN_PORTAL_BTN.x, RETURN_PORTAL_BTN.y,
      RETURN_PORTAL_BTN.w, RETURN_PORTAL_BTN.h, 4, 'rgba(106, 76, 147, 0.9)');
    const label = refLabel() || 'back';
    const trimmed = label.length > 16 ? label.slice(0, 15) + '…' : label;
    drawText(ctx, `← ${trimmed}`,
      RETURN_PORTAL_BTN.x + RETURN_PORTAL_BTN.w / 2,
      RETURN_PORTAL_BTN.y + RETURN_PORTAL_BTN.h / 2, {
      color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
    });
  }
}
