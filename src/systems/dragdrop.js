// Kitchen panel — bottom half of the night scene.
// Owns the ingredient/topping grid, the bowl drop area, and the serve/clear
// buttons. Handles drag/drop input itself; emits onServe(bowl) when the
// player confirms.
//
// One-shot factory: createKitchen({ onServe, onClear }). Returns an object
// with attach()/detach()/update()/render(). The host scene calls attach()
// when entering AWAITING_SERVE and detach() when transitioning away.

import {
  LOGICAL_WIDTH,
  drawText,
  fillRoundRect,
} from './renderer.js';
import {
  onDown,
  onMove,
  onUp,
  onKeyDown,
  pointInRect,
} from './input.js';
import {
  INGREDIENT_IDS,
  TOPPING_IDS,
  INGREDIENT_LABELS,
} from '../data/recipes.js';
import { tr } from '../i18n.js';

// Layout (640×360 logical canvas, kitchen owns y >= 222).
const PANEL = { x: 0, y: 222, w: LOGICAL_WIDTH, h: 138 };

const ING_GRID = { x: 12, y: 232, cellW: 36, cellH: 36, gap: 4, cols: 4, rows: 2 };
const TOP_GRID = { x: 12, y: 316, cellW: 36, cellH: 36, gap: 4, cols: 3, rows: 1 };
const BOWL = { x: 180, y: 232, w: 200, h: 110 };
const SERVE_BTN = { x: 400, y: 240, w: 200, h: 38 };
const CLEAR_BTN = { x: 400, y: 290, w: 200, h: 28 };

const MAX_BOWL = 6;

// Pour mini-game: when dashi is dropped, a 2-second auto-fill bar appears
// above the bowl. Tap to stop. Landing inside the inner sweet spot is a
// "perfect" pour (+2 affinity). The wider "good" zone around it still
// counts as decent (+1 affinity). Outside that, no bonus — but no penalty
// either, the serve still goes through normally.
const POUR_DURATION = 2.0;       // seconds to go from empty → overflow
const POUR_SWEET_MIN = 0.62;
const POUR_SWEET_MAX = 0.84;
const POUR_GOOD_MIN  = 0.42;
const POUR_GOOD_MAX  = 0.96;
const POUR_FEEDBACK_MS = 500;
const DASHI_IDS = new Set(['hot_dashi', 'cold_dashi']);

function pourQualityFor(fillPct) {
  if (fillPct >= POUR_SWEET_MIN && fillPct <= POUR_SWEET_MAX) return 'perfect';
  if (fillPct >= POUR_GOOD_MIN  && fillPct <= POUR_GOOD_MAX)  return 'good';
  if (fillPct < POUR_GOOD_MIN) return 'weak';
  return 'overflow';
}

function ingredientRect(idx) {
  const col = idx % ING_GRID.cols;
  const row = Math.floor(idx / ING_GRID.cols);
  return {
    x: ING_GRID.x + col * (ING_GRID.cellW + ING_GRID.gap),
    y: ING_GRID.y + row * (ING_GRID.cellH + ING_GRID.gap),
    w: ING_GRID.cellW,
    h: ING_GRID.cellH,
  };
}

function toppingRect(idx) {
  return {
    x: TOP_GRID.x + idx * (TOP_GRID.cellW + TOP_GRID.gap),
    y: TOP_GRID.y,
    w: TOP_GRID.cellW,
    h: TOP_GRID.cellH,
  };
}

// Draw a cell from a sprite sheet. cols/rows describe the sheet grid.
function drawSheetCell(ctx, sheet, idx, cols, rows, dx, dy, dw, dh) {
  if (!sheet) return;
  const sw = sheet.width / cols;
  const sh = sheet.height / rows;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  ctx.drawImage(sheet, col * sw, row * sh, sw, sh, dx, dy, dw, dh);
}

export function drawIngredientById(ctx, assets, id, dx, dy, dw, dh) {
  const ingIdx = INGREDIENT_IDS.indexOf(id);
  if (ingIdx >= 0) {
    drawSheetCell(ctx, assets.images?.ingredient_sheet, ingIdx, 4, 2, dx, dy, dw, dh);
    return;
  }
  const topIdx = TOPPING_IDS.indexOf(id);
  if (topIdx >= 0) {
    drawSheetCell(ctx, assets.images?.topping_sheet, topIdx, 3, 1, dx, dy, dw, dh);
    return;
  }
}

export function createKitchen({ onServe, onClear, isInputBlocked } = {}) {
  let bowl = [];
  let drag = null; // { id, x, y } | null
  let unsubs = [];
  let assets = null;
  let hoverId = null; // id of the cell currently under the cursor (for tooltip)
  let suppressNextClick = false; // set true after a drop, so the synthetic
                                 // click event doesn't fire button actions

  // Pour state. While `pour` is non-null, all other interactions are
  // disabled and the only meaningful input is "stop the pour".
  //   { dashiId, startTime, capturedFill, quality, feedbackUntil }
  let pour = null;
  // Tracks one quality string per dashi id added to the bowl ('perfect' |
  // 'weak' | 'overflow'). Used at serve time to grant a small bonus.
  const pourQualities = {};

  const blocked = () => Boolean(isInputBlocked && isInputBlocked());

  function isPouring() {
    return pour !== null;
  }

  function currentPourFill() {
    if (!pour) return 0;
    if (pour.capturedFill !== null) return pour.capturedFill;
    const elapsed = (performance.now() - pour.startTime) / 1000;
    return Math.min(1, elapsed / POUR_DURATION);
  }

  function startPour(dashiId) {
    pour = {
      dashiId,
      startTime: performance.now(),
      capturedFill: null,
      quality: null,
      feedbackUntil: 0,
    };
  }

  function capturePour() {
    if (!pour || pour.capturedFill !== null) return;
    const fill = currentPourFill();
    pour.capturedFill = fill;
    pour.quality = pourQualityFor(fill);
    pour.feedbackUntil = performance.now() + POUR_FEEDBACK_MS;
  }

  function finalizePour() {
    if (!pour) return;
    if (bowl.length < MAX_BOWL && !bowl.includes(pour.dashiId)) {
      bowl.push(pour.dashiId);
      pourQualities[pour.dashiId] = pour.quality;
    }
    pour = null;
  }

  function pickAt(point) {
    for (let i = 0; i < INGREDIENT_IDS.length; i++) {
      if (pointInRect(point, ingredientRect(i))) return INGREDIENT_IDS[i];
    }
    for (let i = 0; i < TOPPING_IDS.length; i++) {
      if (pointInRect(point, toppingRect(i))) return TOPPING_IDS[i];
    }
    return null;
  }

  function attach(loadedAssets) {
    assets = loadedAssets;
    bowl = [];
    drag = null;

    unsubs.push(onDown((p) => {
      if (blocked() || pour) return;
      const id = pickAt(p);
      if (id) drag = { id, x: p.x, y: p.y };
    }));

    unsubs.push(onMove((p) => {
      if (blocked() || pour) { hoverId = null; return; }
      if (drag) {
        drag.x = p.x;
        drag.y = p.y;
      }
      hoverId = pickAt(p);
    }));

    unsubs.push(onUp((p) => {
      if (!drag) return;
      if (pointInRect(p, BOWL)) {
        const id = drag.id;
        if (bowl.length < MAX_BOWL && !bowl.includes(id)) {
          if (DASHI_IDS.has(id)) {
            // Dashi triggers the pour mini-game instead of being added directly.
            startPour(id);
          } else {
            bowl.push(id);
          }
        }
      }
      // Browser fires a synthetic `click` after mousedown+mouseup on the
      // same element (the canvas). If a drag was active, we suppress that
      // click so it doesn't fall through to a button (serve/clear).
      suppressNextClick = true;
      drag = null;
    }));

    // Any keypress while pouring stops the pour at the current fill.
    unsubs.push(onKeyDown(() => {
      if (pour && pour.capturedFill === null) capturePour();
    }));
  }

  // Routed by the host scene's master click handler. Returns true if the
  // click hit a kitchen button, so the caller knows it was consumed.
  function handleClick(p) {
    // Drop on bowl produces mouseup → startPour → synthetic click. We must
    // eat that click first, otherwise it would instantly capture the pour
    // at ~0% before the bar even starts filling.
    if (suppressNextClick) {
      suppressNextClick = false;
      return true;
    }
    // Pour mode steals ALL clicks — both during filling (to capture) and
    // during the feedback window (so a hasty Serve doesn't fire before the
    // dashi has actually been committed to the bowl).
    if (pour) {
      if (pour.capturedFill === null) capturePour();
      return true;
    }
    if (pointInRect(p, SERVE_BTN)) {
      if (bowl.length === 0) return true;
      // Pass per-dashi pour qualities so the host can compute a bonus.
      onServe?.([...bowl], { ...pourQualities });
      return true;
    }
    if (pointInRect(p, CLEAR_BTN)) {
      bowl = [];
      for (const k of Object.keys(pourQualities)) delete pourQualities[k];
      onClear?.();
      return true;
    }
    return false;
  }

  function detach() {
    for (const u of unsubs) u();
    unsubs = [];
    drag = null;
  }

  function update(_dt) {
    if (!pour) return;
    if (pour.capturedFill === null) {
      // Auto-stop at full overflow if the player never tapped.
      if (currentPourFill() >= 1.0) capturePour();
    } else if (performance.now() >= pour.feedbackUntil) {
      // Feedback window elapsed — commit the dashi to the bowl.
      finalizePour();
    }
  }

  function render(ctx) {
    if (!assets) return;

    // Panel band — semi-transparent dark over the lower half.
    ctx.fillStyle = 'rgba(10, 10, 15, 0.55)';
    ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    ctx.strokeStyle = 'rgba(140, 122, 101, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, PANEL.y + 0.5);
    ctx.lineTo(PANEL.w, PANEL.y + 0.5);
    ctx.stroke();

    // Ingredient grid.
    for (let i = 0; i < INGREDIENT_IDS.length; i++) {
      const r = ingredientRect(i);
      const id = INGREDIENT_IDS[i];
      const inBowl = bowl.includes(id);
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, 4,
        inBowl ? 'rgba(244, 208, 63, 0.25)' : 'rgba(26, 26, 46, 0.7)');
      drawIngredientById(ctx, assets, id, r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    }

    // Topping grid.
    for (let i = 0; i < TOPPING_IDS.length; i++) {
      const r = toppingRect(i);
      const id = TOPPING_IDS[i];
      const inBowl = bowl.includes(id);
      fillRoundRect(ctx, r.x, r.y, r.w, r.h, 4,
        inBowl ? 'rgba(244, 208, 63, 0.25)' : 'rgba(26, 26, 46, 0.7)');
      drawIngredientById(ctx, assets, id, r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    }

    // Bowl area: drawn as a top-down ellipse so ingredients feel like they
    // sit IN a bowl rather than float in a checklist. Hot dashi fills with
    // amber broth + steam; cold dashi fills with a cool blue.
    drawText(ctx, tr('그릇', 'Bowl'), BOWL.x + 8, BOWL.y + 6,
      { color: '#8c7a65', size: 9 });

    const cx = BOWL.x + BOWL.w / 2;
    const cy = BOWL.y + 70;
    const rimRx = 90;
    const rimRy = 30;
    const innerRx = 80;
    const innerRy = 24;

    // Drop shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 6, rimRx, rimRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim (lacquer).
    ctx.fillStyle = '#3a2410';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rimRx, rimRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight on the rim — thin lighter ring so the rim reads as 3D.
    ctx.strokeStyle = 'rgba(212, 184, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rimRx - 1, rimRy - 1, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Interior depth.
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, innerRx, innerRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Liquid layer if dashi present.
    const hasHot = bowl.includes('hot_dashi');
    const hasCold = bowl.includes('cold_dashi');
    if (hasHot || hasCold) {
      const liquidColor = hasHot ? '#8b6f47' : '#4a6b8a';
      ctx.fillStyle = liquidColor;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 2, innerRx - 3, innerRy - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Subtle highlight on the liquid surface.
      ctx.fillStyle = hasHot ? 'rgba(244, 208, 63, 0.18)' : 'rgba(184, 212, 227, 0.22)';
      ctx.beginPath();
      ctx.ellipse(cx - innerRx * 0.25, cy - innerRy * 0.55, innerRx * 0.45, innerRy * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Solid ingredients — clustered on the bowl surface. Position by index
    // angle around the center so layout is stable per-ingredient-set.
    const solids = bowl.filter((id) => id !== 'hot_dashi' && id !== 'cold_dashi');
    if (solids.length > 0) {
      const itemSize = solids.length <= 2 ? 28 : (solids.length <= 4 ? 24 : 20);
      const ringR = solids.length === 1 ? 0
                  : solids.length === 2 ? 14
                  : solids.length === 3 ? 16
                                        : 20;
      for (let i = 0; i < solids.length; i++) {
        let dx = 0, dy = 0;
        if (solids.length > 1) {
          const angle = (i / solids.length) * Math.PI * 2 - Math.PI / 2;
          dx = Math.cos(angle) * ringR;
          dy = Math.sin(angle) * ringR * 0.55; // squashed for top-down look
        }
        drawIngredientById(ctx, assets, solids[i],
          cx + dx - itemSize / 2,
          cy + dy - itemSize / 2 - 2,
          itemSize, itemSize);
      }
    }

    // Steam wisps if hot dashi is in the bowl.
    if (hasHot) {
      const t = performance.now() / 1000;
      for (let i = 0; i < 3; i++) {
        const phase = ((t * 0.55) + i * 0.33) % 1;
        const dy = phase * 30;
        const sway = Math.sin(t * 2.4 + i * 1.7) * 3;
        const alpha = (1 - phase) * 0.55;
        if (alpha < 0.05) continue;
        ctx.fillStyle = `rgba(245, 230, 211, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(cx + sway + (i - 1) * 10, cy - 22 - dy, 3.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Empty hint — placed inside the bowl rim.
    if (bowl.length === 0) {
      drawText(ctx, tr('여기에 재료를 끌어다 놓아', 'Drag ingredients here'),
        cx, cy, { color: '#8c7a65', size: 10, align: 'center', baseline: 'middle' });
    }

    // Serve button — pulses if bowl is non-empty.
    const serveActive = bowl.length > 0;
    fillRoundRect(ctx, SERVE_BTN.x, SERVE_BTN.y, SERVE_BTN.w, SERVE_BTN.h, 6,
      serveActive ? '#c44e2c' : '#5d3a1a');
    drawText(ctx, tr('서빙', 'Serve'),
      SERVE_BTN.x + SERVE_BTN.w / 2, SERVE_BTN.y + SERVE_BTN.h / 2,
      { color: '#f5e6d3', size: 14, align: 'center', baseline: 'middle' });

    // Clear button.
    fillRoundRect(ctx, CLEAR_BTN.x, CLEAR_BTN.y, CLEAR_BTN.w, CLEAR_BTN.h, 6, '#34495e');
    drawText(ctx, tr('비우기', 'Clear'),
      CLEAR_BTN.x + CLEAR_BTN.w / 2, CLEAR_BTN.y + CLEAR_BTN.h / 2,
      { color: '#f5e6d3', size: 11, align: 'center', baseline: 'middle' });

    // Hover label below buttons.
    if (hoverId && !drag) {
      drawText(ctx, INGREDIENT_LABELS[hoverId] ?? hoverId,
        SERVE_BTN.x + SERVE_BTN.w / 2, CLEAR_BTN.y + CLEAR_BTN.h + 12,
        { color: '#f4d03f', size: 10, align: 'center', baseline: 'middle' });
    }

    // Drag preview — float the sprite under the cursor.
    if (drag) {
      ctx.globalAlpha = 0.85;
      drawIngredientById(ctx, assets, drag.id, drag.x - 18, drag.y - 18, 36, 36);
      ctx.globalAlpha = 1;
    }

    // Pour mini-game UI — drawn LAST so it sits above bowl/buttons.
    if (pour) renderPourBar(ctx, cx, BOWL.y - 14);
  }

  function renderPourBar(ctx, anchorX, anchorY) {
    const barW = 200;
    const barH = 14;
    const x = anchorX - barW / 2;
    const y = anchorY;

    // Backdrop (dim panel) so the bar is readable over the bowl.
    fillRoundRect(ctx, x - 8, y - 22, barW + 16, barH + 38, 6, 'rgba(10, 10, 15, 0.78)');

    // "정성껏 따르세요" / "Pour carefully" prompt above the bar.
    drawText(ctx, tr('정성껏 따르세요 — 클릭/스페이스로 멈추기',
                     'Pour carefully — click or press space to stop'),
      anchorX, y - 12, {
      color: '#f5e6d3', size: 9, align: 'center', baseline: 'middle',
    });

    // Bar background.
    fillRoundRect(ctx, x, y, barW, barH, 4, '#1a1a2e');

    // Wider "good" zone — softer gold, lower opacity. Player who's close
    // but not centred still gets credit.
    const goodX = x + barW * POUR_GOOD_MIN;
    const goodW = barW * (POUR_GOOD_MAX - POUR_GOOD_MIN);
    ctx.fillStyle = 'rgba(244, 208, 63, 0.18)';
    ctx.fillRect(goodX, y + 1, goodW, barH - 2);

    // Inner sweet-spot zone — bright gold, the "perfect pour" target.
    const sweetX = x + barW * POUR_SWEET_MIN;
    const sweetW = barW * (POUR_SWEET_MAX - POUR_SWEET_MIN);
    ctx.fillStyle = 'rgba(244, 208, 63, 0.5)';
    ctx.fillRect(sweetX, y + 1, sweetW, barH - 2);

    // Fill bar — colored by dashi type.
    const fill = currentPourFill();
    const fillColor = pour.dashiId === 'hot_dashi' ? '#c44e2c' : '#6FA8DC';
    ctx.fillStyle = fillColor;
    ctx.fillRect(x + 1, y + 1, Math.max(0, (barW - 2) * fill), barH - 2);

    // Border.
    ctx.strokeStyle = '#8c7a65';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, barH - 1);

    // Marker — vertical line at the captured fill position.
    if (pour.capturedFill !== null) {
      const mx = x + barW * pour.capturedFill;
      ctx.strokeStyle = '#f5e6d3';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, y - 2);
      ctx.lineTo(mx, y + barH + 2);
      ctx.stroke();

      // Quality feedback below the bar.
      let text, color;
      if (pour.quality === 'perfect') {
        text = tr('정성껏!', 'Perfect!');
        color = '#f4d03f';
      } else if (pour.quality === 'good') {
        text = tr('잘 따랐어', 'Decent pour');
        color = '#d4b896';
      } else if (pour.quality === 'weak') {
        text = tr('조금 부족해', 'A touch weak');
        color = '#8c7a65';
      } else {
        text = tr('조금 넘쳤어', 'A touch too much');
        color = '#8c7a65';
      }
      drawText(ctx, text, anchorX, y + barH + 10, {
        color, size: 11, align: 'center', baseline: 'middle',
      });
    }
  }

  return {
    attach,
    detach,
    update,
    render,
    handleClick,
    isPouring,
    getBowl: () => [...bowl],
    clearBowl: () => { bowl = []; },
  };
}
