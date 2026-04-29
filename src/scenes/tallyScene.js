import { state, dispatch, SCENES } from '../state.js';
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js';
import { TOTAL_DAYS } from '../data/campaign.js';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  fillRoundRect,
  drawText,
  clear,
} from '../systems/renderer.js';
import { onClick } from '../systems/input.js';
import { tr } from '../i18n.js';

let unsubClick = null;
let entered = 0;

export function enter() {
  entered = 0;
  unsubClick = onClick(() => {
    if (state.day < TOTAL_DAYS) {
      // Roll over to the next day's morning. The morning scene plays the
      // memory beat and then triggers NIGHT_START on the player's click.
      dispatch({ type: 'ADVANCE_DAY', day: state.day + 1 });
    } else {
      // (Day 7 actually skips TALLY — handled in nightScene — but keep
      // this branch as a safety net.)
      dispatch({ type: 'ENTER_SCENE', scene: SCENES.ENDING });
    }
  });
}

export function exit() {
  if (unsubClick) unsubClick();
  unsubClick = null;
}

export function update(dt) {
  entered += dt;
}

export function render(ctx) {
  clear(ctx, '#0a0a0f');

  // Title.
  drawText(ctx, tr(`${state.day}일차 마감`, `End of Day ${state.day}`),
    LOGICAL_WIDTH / 2, 40, {
    color: '#f5e6d3', size: 22, align: 'center', baseline: 'middle',
  });

  // Sales.
  drawText(ctx, tr(
    `오늘 매출 ${state.nightSales}원`,
    `Tonight's sales: ₩${state.nightSales}`
  ), LOGICAL_WIDTH / 2, 78, {
    color: '#f4d03f', size: 14, align: 'center', baseline: 'middle',
  });
  drawText(ctx, tr(
    `누적 매출 ${state.money}원`,
    `Total: ₩${state.money}`
  ), LOGICAL_WIDTH / 2, 96, {
    color: '#8c7a65', size: 11, align: 'center', baseline: 'middle',
  });

  // Per-character affinity changes today.
  const startY = 130;
  const rowH = 22;
  let row = 0;
  for (const key of CHARACTER_ORDER) {
    const delta = state.nightAffinityDelta[key] ?? 0;
    if (delta === 0) continue; // hide characters who didn't show today
    const c = CHARACTERS[key];
    const y = startY + row * rowH;
    fillRoundRect(ctx, 120, y, LOGICAL_WIDTH - 240, rowH - 4, 4, 'rgba(26, 26, 46, 0.7)');
    drawText(ctx, c.name, 132, y + (rowH - 4) / 2, {
      color: '#f5e6d3', size: 12, baseline: 'middle',
    });
    const sign = delta > 0 ? '+' : '';
    drawText(ctx, tr(
      `호감도 ${sign}${delta} (현재 ${state.affinity[key]})`,
      `Affinity ${sign}${delta} (now ${state.affinity[key]})`
    ), LOGICAL_WIDTH - 132, y + (rowH - 4) / 2, {
      color: delta > 0 ? '#6BA368' : '#E74C3C',
      size: 11,
      align: 'right',
      baseline: 'middle',
    });
    row++;
  }

  // Click prompt.
  const prompt = state.day < TOTAL_DAYS
    ? tr('— 클릭해서 다음 날 아침으로 —', '— Click for the next morning —')
    : tr('— 클릭해서 마지막 밤으로 —',     '— Click for the final night —');
  if (Math.floor(entered * 1.6) % 2 === 0) {
    drawText(ctx, prompt, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 40, {
      color: '#f4d03f', size: 12, align: 'center', baseline: 'middle',
    });
  }
}
