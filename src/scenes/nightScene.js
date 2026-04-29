import { state, dispatch, SCENES } from '../state.js';
import { CHARACTERS, affinityTier } from '../data/characters.js';
import { evaluateBowl } from '../data/recipes.js';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  clear,
  drawBackground,
  drawSprite,
  drawText,
  fillRoundRect,
} from '../systems/renderer.js';
import { onClick, onKeyDown, pointInRect } from '../systems/input.js';
import { createDialogue } from '../systems/dialogue.js';
import { createKitchen } from '../systems/dragdrop.js';
import { createNotebook } from '../systems/notebook.js';
import { audio } from '../systems/audio.js';
import { tr, getLocale, toggleLocale } from '../i18n.js';

const CHAR_CX = 320;
const CHAR_CY = 110;
const CHAR_SIZE = 150;

// HUD buttons in the top-right corner.
const NOTEBOOK_BTN = { x: LOGICAL_WIDTH - 86, y: 22, w: 78, h: 18 };
const MUTE_BTN     = { x: LOGICAL_WIDTH - 86, y: 44, w: 78, h: 18 };
const LANG_BTN     = { x: LOGICAL_WIDTH - 86, y: 66, w: 78, h: 18 };

const PHASE = {
  ARRIVING: 'arriving',
  INTRO: 'intro',
  ORDERING: 'ordering',
  AWAITING_SERVE: 'awaiting_serve',
  REACTING: 'reacting',
  LEAVING: 'leaving',
};

let phase = PHASE.ARRIVING;
let phaseTime = 0;
let dialogue = null;
let unsubClick = null;
let unsubKey = null;
let kitchen = null;
let notebook = null;
let lastResult = null;

function currentChar() {
  return state.currentCustomer ? CHARACTERS[state.currentCustomer] : null;
}

function dayOverride(c) {
  return c.daySpecific?.[state.day];
}

function startIntro() {
  const c = currentChar();
  if (!c) return;
  phase = PHASE.INTRO;
  phaseTime = 0;
  // Day-specific intro takes precedence (e.g., the day-6 storm ensemble).
  const lines = dayOverride(c)?.introDialogue ?? c.introDialogue;
  dialogue = createDialogue(lines, {
    speaker: c.name,
    onDone: startOrder,
  });
}

function startOrder() {
  const c = currentChar();
  if (!c) return;
  phase = PHASE.ORDERING;
  phaseTime = 0;

  let lines;
  const ovr = dayOverride(c)?.orderLine;
  if (ovr) {
    // Day override is a single line — bypasses affinity tiers since the
    // special night has its own framing.
    lines = [ovr];
  } else {
    const tierKey = affinityTier(state.affinity[state.currentCustomer]).order;
    lines = c.orderLines[tierKey] ?? c.orderLines.explicit;
  }
  dialogue = createDialogue(lines, {
    speaker: c.name,
    onDone: () => {
      dialogue = null;
      enterAwaitingServe();
    },
  });
}

function enterAwaitingServe() {
  phase = PHASE.AWAITING_SERVE;
  phaseTime = 0;
  kitchen = createKitchen({
    onServe: handleServe,
    onClear: () => {},
    isInputBlocked: () => notebook?.isOpen() ?? false,
  });
  kitchen.attach(state.assets);
}

// Pick the most specific tasting line whose required ingredients are all
// present in the served bowl. Falls through to the rule with no needs (the
// generic fallback) if none of the specific rules match.
function pickTastingLine(c, bowl) {
  const rules = c.tastingLines ?? [];
  for (const r of rules) {
    const needs = r.needs ?? [];
    if (needs.every((id) => bowl.includes(id))) return r.line;
  }
  return '(한 입 먹어본다…)';
}

function handleServe(bowl, pourQualities = {}) {
  const c = currentChar();
  if (!c) return;
  const result = evaluateBowl(bowl, c);

  // "정성껏 따른" 다시 보너스 — graded so a near-miss still earns
  // something. Only applies when the dish itself is correct.
  //   perfect → +2 affinity     good → +1 affinity     other → 0
  if (result.kind === 'satisfied') {
    let perfectCount = 0;
    let goodCount = 0;
    let bonus = 0;
    for (const k of Object.keys(pourQualities)) {
      if (pourQualities[k] === 'perfect') { perfectCount += 1; bonus += 2; }
      else if (pourQualities[k] === 'good') { goodCount += 1; bonus += 1; }
    }
    if (bonus > 0) {
      result.affinity += bonus;
      result.perfectPours = perfectCount;
      result.goodPours = goodCount;
    }
  }

  lastResult = result;

  if (kitchen) { kitchen.detach(); kitchen = null; }

  // Grandmother's day-7 visit is a special moment — her own line ("괜찮아,
  // 다시 한번 해보렴") promises another try. Honour that: on a wrong dish
  // we replay her reaction and re-enter AWAITING_SERVE without applying
  // any money/affinity delta.
  const isGrandmotherRetry =
    state.currentCustomer === 'grandmother' && result.kind !== 'satisfied';

  if (!isGrandmotherRetry) {
    dispatch({ type: 'SERVE_BOWL', result });
  }

  phase = PHASE.REACTING;
  phaseTime = 0;

  // Beat 1 — tasting. Picked from the character's tastingLines so the
  // physical description matches what was actually served.
  const tastingLine = pickTastingLine(c, bowl);
  dialogue = createDialogue([tastingLine], {
    speaker: c.name,
    onDone: () => {
      // Beat 2 — expression flips to happy/sad as the verdict comes.
      dispatch({
        type: 'SET_EXPRESSION',
        expression: result.kind === 'satisfied' ? 'happy' : 'sad',
      });

      // Beat 3 — the actual reaction line, picked by affinity tier.
      const tierKey = affinityTier(state.affinity[state.currentCustomer]).satisfied;
      const lines = result.kind === 'satisfied'
        ? (c.satisfiedLines[tierKey] ?? c.satisfiedLines.low)
        : c.unsatisfiedLines;
      dialogue = createDialogue(lines, {
        speaker: c.name,
        onDone: isGrandmotherRetry ? retryGrandmother : leaveCustomer,
      });
    },
  });
}

function retryGrandmother() {
  // Reset for another attempt — neutral face, fresh kitchen, empty bowl.
  // No state delta was applied, so we just clear the local UI state and
  // re-open the serve window.
  dialogue = null;
  lastResult = null;
  dispatch({ type: 'SET_EXPRESSION', expression: 'neutral' });
  enterAwaitingServe();
}

function leaveCustomer() {
  phase = PHASE.LEAVING;
  phaseTime = 0;
  dialogue = null;
  lastResult = null;
}

function advanceQueueOrEndNight() {
  dispatch({ type: 'NEXT_CUSTOMER' });
  if (state.currentCustomer) {
    phase = PHASE.ARRIVING;
    phaseTime = 0;
  } else if (state.day === 7) {
    // Day 7 has no tally — go straight to the ending sequence.
    dispatch({ type: 'ENTER_SCENE', scene: SCENES.ENDING });
  } else {
    dispatch({ type: 'ENTER_SCENE', scene: SCENES.TALLY });
  }
}

// Master click handler — routes to notebook → dialogue → kitchen in that
// priority order so each layer can claim the click without colliding with
// another. Returns early at every layer.
function handleClick(p) {
  if (notebook?.isOpen()) {
    notebook.close();
    return;
  }
  // The HUD notebook button is always available during NIGHT.
  if (pointInRect(p, NOTEBOOK_BTN)) {
    notebook.toggle();
    return;
  }
  if (pointInRect(p, MUTE_BTN)) {
    audio.toggleMuted();
    return;
  }
  if (pointInRect(p, LANG_BTN)) {
    toggleLocale();
    return;
  }
  if (dialogue) {
    dialogue.advance();
    return;
  }
  if (kitchen) {
    kitchen.handleClick(p);
  }
}

export function enter() {
  phase = PHASE.ARRIVING;
  phaseTime = 0;
  dialogue = null;
  lastResult = null;
  notebook = createNotebook();

  unsubClick = onClick(handleClick);
  unsubKey = onKeyDown((key) => {
    // While pouring, the kitchen owns input — letting R open the notebook
    // would steal the keypress that's meant to capture the pour.
    if (kitchen?.isPouring()) return;
    // 'ㄱ' is the U+3131 jamo produced when Korean IME is on and the user
    // presses R. Accept both so the shortcut works regardless of IME state.
    if (key === 'r' || key === 'ㄱ') notebook.toggle();
  });
}

export function exit() {
  if (unsubClick) unsubClick();
  if (unsubKey) unsubKey();
  unsubClick = null;
  unsubKey = null;
  if (kitchen) { kitchen.detach(); kitchen = null; }
  dialogue = null;
  lastResult = null;
  notebook = null;
}

export function update(dt) {
  phaseTime += dt;

  if (phase === PHASE.ARRIVING && phaseTime >= 0.9) {
    startIntro();
  }
  if (phase === PHASE.LEAVING && phaseTime >= 0.7) {
    advanceQueueOrEndNight();
  }
  if (dialogue) dialogue.update(dt);
  if (kitchen) kitchen.update(dt);
}

export function render(ctx) {
  const bgKey = state.day === 6 ? 'shop_rain' : 'shop_night';
  const bg = state.assets.images?.[bgKey];
  if (bg) drawBackground(ctx, bg);
  else clear(ctx, '#0a0a0f');

  if (state.currentCustomer) {
    const spriteKey = `${state.currentCustomer}_${state.currentExpression}`;
    const sprite = state.assets.images?.[spriteKey];
    let alpha = 1;
    if (phase === PHASE.ARRIVING) alpha = Math.min(1, phaseTime / 0.9);
    else if (phase === PHASE.LEAVING) alpha = Math.max(0, 1 - phaseTime / 0.7);
    ctx.globalAlpha = alpha;
    drawSprite(ctx, sprite, CHAR_CX, CHAR_CY, CHAR_SIZE, CHAR_SIZE);
    ctx.globalAlpha = 1;
  }

  // HUD: day + sales.
  drawText(ctx, tr(`${state.day}일차`, `Day ${state.day}`),
    12, 8, { color: '#f5e6d3', size: 11 });
  drawText(ctx, tr(`매출 ${state.nightSales}원`, `Sales: ₩${state.nightSales}`),
    LOGICAL_WIDTH - 12, 8, { color: '#f5e6d3', size: 11, align: 'right' });

  // Notebook button.
  fillRoundRect(ctx, NOTEBOOK_BTN.x, NOTEBOOK_BTN.y, NOTEBOOK_BTN.w, NOTEBOOK_BTN.h, 4,
    'rgba(93, 58, 26, 0.85)');
  drawText(ctx, tr('[R] 레시피', '[R] Recipes'),
    NOTEBOOK_BTN.x + NOTEBOOK_BTN.w / 2,
    NOTEBOOK_BTN.y + NOTEBOOK_BTN.h / 2, {
    color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
  });

  // Mute toggle.
  fillRoundRect(ctx, MUTE_BTN.x, MUTE_BTN.y, MUTE_BTN.w, MUTE_BTN.h, 4,
    'rgba(52, 73, 94, 0.85)');
  const muteLabel = audio.isMuted()
    ? tr('[M] 음소거 ON', '[M] Mute ON')
    : tr('[M] 음소거 OFF', '[M] Mute OFF');
  drawText(ctx, muteLabel,
    MUTE_BTN.x + MUTE_BTN.w / 2,
    MUTE_BTN.y + MUTE_BTN.h / 2, {
    color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
  });

  // Language toggle (shows the language you'd switch TO).
  fillRoundRect(ctx, LANG_BTN.x, LANG_BTN.y, LANG_BTN.w, LANG_BTN.h, 4,
    'rgba(93, 58, 26, 0.85)');
  drawText(ctx, getLocale() === 'ko' ? 'English' : '한국어',
    LANG_BTN.x + LANG_BTN.w / 2,
    LANG_BTN.y + LANG_BTN.h / 2, {
    color: '#f5e6d3', size: 10, align: 'center', baseline: 'middle',
  });

  // Kitchen panel — only during the serve window.
  if (phase === PHASE.AWAITING_SERVE && kitchen) {
    kitchen.render(ctx);
  }

  // Result toast.
  if (phase === PHASE.REACTING && lastResult) {
    const r = lastResult;
    const name = r.recipe ? r.recipe.name : tr('알 수 없는 요리', 'Unknown dish');
    const sign = r.kind === 'satisfied' ? '+' : '';
    const moneyTxt = r.money > 0
      ? tr(` · +${r.money}원`, ` · +₩${r.money}`)
      : '';
    const affTxt = tr(` · 호감도 ${sign}${r.affinity}`, ` · Affinity ${sign}${r.affinity}`);
    const perfectTxt = r.perfectPours
      ? tr(` · 정성껏!`, ` · Perfect pour!`)
      : (r.goodPours ? tr(` · 잘 따랐어`, ` · Decent pour`) : '');
    drawText(ctx, `${name}${moneyTxt}${affTxt}${perfectTxt}`, LOGICAL_WIDTH / 2, 195, {
      color: r.kind === 'satisfied' ? '#f4d03f' : '#e89b5a',
      size: 11,
      align: 'center',
      baseline: 'middle',
    });
  }

  if (dialogue) dialogue.render(ctx);

  // Notebook is the topmost layer when open.
  if (notebook) notebook.render(ctx, state.assets);
}
