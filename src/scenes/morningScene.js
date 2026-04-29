// Morning scene — short calm beat between nights.
// Shows the shop in (a tinted approximation of) daylight, with one pulsing
// hotspot per day. Clicking the hotspot opens a memory passage in the
// grandmother's voice; after the dialogue closes, clicking anywhere ("노렌을
// 건다") transitions to the night service.
//
// The memory hints at the visiting customer's preference, so the player
// goes into the night with a feeling for what to make.

import { state, dispatch, SCENES } from '../state.js';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  clear,
  drawText,
} from '../systems/renderer.js';
import { onClick } from '../systems/input.js';
import { createDialogue } from '../systems/dialogue.js';
import { MORNING_MEMORIES } from '../data/memories.js';
import { CAMPAIGN } from '../data/campaign.js';
import { tr } from '../i18n.js';

const PHASE = {
  PROLOGUE: 'prologue',     // optional pre-browse monologue (day 1 only)
  BROWSING: 'browsing',     // shop visible, hotspot glowing, awaiting click
  RECALLING: 'recalling',   // memory dialogue active
  READY: 'ready',           // memory done, click to start night
};

let unsubClick = null;
let entered = 0;
let phase = PHASE.BROWSING;
let dialogue = null;

function memoryForToday() {
  return MORNING_MEMORIES[state.day];
}

function startRecall() {
  const m = memoryForToday();
  if (!m) {
    // No memory configured — skip directly to night.
    goToNight();
    return;
  }
  phase = PHASE.RECALLING;
  dialogue = createDialogue(m.lines, {
    speaker: m.speaker,
    onDone: () => {
      dialogue = null;
      phase = PHASE.READY;
    },
  });
}

function goToNight() {
  dispatch({ type: 'ENTER_SCENE', scene: SCENES.NIGHT });
  dispatch({
    type: 'NIGHT_START',
    queue: CAMPAIGN[state.day].customers,
  });
}

function handleClick(p) {
  if (dialogue) {
    dialogue.advance();
    return;
  }
  if (phase === PHASE.BROWSING) {
    const m = memoryForToday();
    if (!m) return;
    const dx = p.x - m.hotspot.x;
    const dy = p.y - m.hotspot.y;
    const r = m.hotspot.r ?? 22;
    if (dx * dx + dy * dy <= r * r) {
      startRecall();
    }
    return;
  }
  if (phase === PHASE.READY) {
    goToNight();
  }
}

export function enter() {
  entered = 0;
  dialogue = null;
  unsubClick = onClick(handleClick);

  const m = memoryForToday();
  if (m?.prologue && m.prologue.length > 0) {
    // Day 1 (or any day with a prologue): play the player monologue first.
    phase = PHASE.PROLOGUE;
    dialogue = createDialogue(m.prologue, {
      speaker: null,
      onDone: () => {
        dialogue = null;
        phase = PHASE.BROWSING;
      },
    });
  } else {
    phase = PHASE.BROWSING;
  }
}

export function exit() {
  if (unsubClick) unsubClick();
  unsubClick = null;
  dialogue = null;
}

export function update(dt) {
  entered += dt;
  if (dialogue) dialogue.update(dt);
}

export function render(ctx) {
  // Daylit shop — reuse the night background with a warm wash.
  const bg = state.assets.images?.shop_night;
  if (bg) {
    ctx.drawImage(bg, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    // Warm overlay to suggest morning light through the windows.
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillStyle = 'rgba(255, 230, 180, 0.18)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    ctx.globalCompositeOperation = 'source-over';
    // Subtle blue desaturation in the shadows for "still cool morning" feel.
    ctx.fillStyle = 'rgba(180, 200, 220, 0.06)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  } else {
    clear(ctx, '#1a1a2e');
  }

  // Header strip.
  ctx.fillStyle = 'rgba(10, 10, 15, 0.55)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, 28);
  drawText(ctx, tr(
    `${state.day}일차 아침 — 가게를 둘러본다`,
    `Day ${state.day} morning — look around the shop`
  ), LOGICAL_WIDTH / 2, 14, {
    color: '#f5e6d3', size: 12, align: 'center', baseline: 'middle',
  });

  // During the day-1 prologue, dim the shop further so the monologue
  // feels separate from the regular gameplay.
  if (phase === PHASE.PROLOGUE) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  // Glowing hotspot during browsing — pulses to draw attention. Hidden
  // during prologue/recall/ready so the dialogue isn't fighting for focus.
  const m = memoryForToday();
  if (m && phase === PHASE.BROWSING) {
    const t = entered;
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    const r = (m.hotspot.r ?? 18) + pulse * 6;

    // Outer halo.
    ctx.beginPath();
    ctx.arc(m.hotspot.x, m.hotspot.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 208, 63, ${0.10 + 0.15 * pulse})`;
    ctx.fill();

    // Ring.
    ctx.beginPath();
    ctx.arc(m.hotspot.x, m.hotspot.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(244, 208, 63, ${0.55 + 0.35 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hover label below the hotspot.
    drawText(ctx, m.hotspot.label,
      m.hotspot.x, m.hotspot.y + r + 14, {
      color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
    });

    // Soft prompt at bottom.
    if (Math.floor(entered * 1.4) % 2 === 0) {
      drawText(ctx, tr(
        '— 빛나는 곳을 클릭해보자 —',
        '— Try clicking the glowing spot —'
      ), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16, {
        color: '#d4b896', size: 10, align: 'center', baseline: 'middle',
      });
    }
  }

  if (dialogue) dialogue.render(ctx);

  // Continue prompt after the memory closes.
  if (phase === PHASE.READY && Math.floor(entered * 1.6) % 2 === 0) {
    drawText(ctx, tr(
      '— 노렌을 건다 (클릭) —',
      '— Hang the noren (click) —'
    ), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 24, {
      color: '#f4d03f', size: 12, align: 'center', baseline: 'middle',
    });
  }
}
