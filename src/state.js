// Single game state object + reducer pattern.
// All scene transitions and gameplay events go through dispatch() so we
// have one place to log/inspect what changed. Keeps render code pure
// (read-only) and avoids "where did this state mutation come from".

import { CHARACTER_ORDER } from './data/characters.js';

export const SCENES = {
  BOOT: 'boot',          // assets loading
  TITLE: 'title',        // title screen, click to start
  MORNING: 'morning',    // pre-night memory beat
  NIGHT: 'night',        // main gameplay, customers visit
  TALLY: 'tally',        // end-of-day summary
  ENDING: 'ending',      // day 7 grandmother sequence
};

function makeInitialState() {
  return {
    scene: SCENES.BOOT,
    day: 1,
    money: 0,

    // Per-character affinity (0..100) and recipe streak counter for the
    // "할머니 손맛" 3-in-a-row bonus.
    affinity: Object.fromEntries(CHARACTER_ORDER.map((k) => [k, 0])),
    streak: Object.fromEntries(CHARACTER_ORDER.map((k) => [k, 0])),

    // Active customer queue for the night, plus index into it.
    queue: [],
    queueIndex: 0,
    currentCustomer: null,    // character key or null
    currentExpression: 'neutral',

    // Per-day running totals, reset on NIGHT_START.
    nightSales: 0,
    nightAffinityDelta: Object.fromEntries(CHARACTER_ORDER.map((k) => [k, 0])),

    // Loaded asset bag — populated once from main.js after loadAssets().
    assets: { images: {}, audio: {} },
  };
}

export const state = makeInitialState();

// Tiny dispatcher. Each action is `{ type, ...payload }`. Reducers mutate
// `state` in place — we don't need immutability for a single-screen game.
const reducers = {
  ASSETS_LOADED(s, { assets }) {
    s.assets = assets;
    s.scene = SCENES.TITLE;
  },

  START_GAME(s) {
    s.scene = SCENES.MORNING;
    s.day = 1;
    s.money = 0;
    for (const k of CHARACTER_ORDER) {
      s.affinity[k] = 0;
      s.streak[k] = 0;
    }
  },

  // Used by the tally screen to roll over to the next day. Sets the day and
  // moves the active scene to MORNING; the morning scene then dispatches
  // NIGHT_START on click to begin service.
  ADVANCE_DAY(s, { day }) {
    s.day = day;
    s.scene = SCENES.MORNING;
  },

  NIGHT_START(s, { day, queue }) {
    if (day !== undefined) s.day = day;
    s.queue = queue;
    s.queueIndex = 0;
    s.currentCustomer = queue[0] ?? null;
    s.currentExpression = 'neutral';
    s.nightSales = 0;
    for (const k of CHARACTER_ORDER) s.nightAffinityDelta[k] = 0;
  },

  SET_EXPRESSION(s, { expression }) {
    s.currentExpression = expression;
  },

  // Apply a serve evaluation result. Streak bonus (+10 every 3 in a row of
  // the same satisfied recipe) is applied here so the reducer is the single
  // source of truth for affinity/money/streak deltas.
  SERVE_BOWL(s, { result }) {
    const k = s.currentCustomer;
    if (!k) return;
    s.nightSales += result.money;
    s.money += result.money;

    let aff = result.affinity;
    if (result.kind === 'satisfied') {
      s.streak[k] = (s.streak[k] || 0) + 1;
      if (s.streak[k] >= 3) {
        aff += 10;             // 할머니 손맛 보너스
        s.streak[k] = 0;
      }
    } else {
      s.streak[k] = 0;
    }
    // Expression change is handled separately by the scene so it can be
    // delayed until after the tasting beat — keeps SERVE_BOWL focused on
    // money/affinity/streak math.

    s.affinity[k] = Math.max(0, Math.min(100, s.affinity[k] + aff));
    s.nightAffinityDelta[k] = (s.nightAffinityDelta[k] || 0) + aff;
  },

  // Advance to the next customer in the queue. Sets currentCustomer to null
  // when the queue is exhausted; the scene is responsible for transitioning.
  NEXT_CUSTOMER(s) {
    s.queueIndex += 1;
    if (s.queueIndex < s.queue.length) {
      s.currentCustomer = s.queue[s.queueIndex];
      s.currentExpression = 'neutral';
    } else {
      s.currentCustomer = null;
      s.currentExpression = 'neutral';
    }
  },

  ENTER_SCENE(s, { scene }) {
    s.scene = scene;
  },
};

export function dispatch(action) {
  const r = reducers[action.type];
  if (!r) {
    console.warn('[state] unknown action', action);
    return;
  }
  r(state, action);
}
