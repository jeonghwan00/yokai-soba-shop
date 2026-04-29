// Recipe notebook overlay.
// Toggled with the R key (or via a HUD button). When open, dims the
// background and shows a leather-bound parchment book rendered entirely in
// code (the generated PNG had pre-rendered gibberish text that conflicted
// with our own layout — easier to draw the book than fight the asset).

import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  drawText,
  fillRoundRect,
} from './renderer.js';
import { RECIPES } from '../data/recipes.js';
import { drawIngredientById } from './dragdrop.js';
import { tr } from '../i18n.js';

// Notebook page rect (matches the recipe_notebook.png size, centered).
const PAGE = {
  x: (LOGICAL_WIDTH - 512) / 2,   // 64
  y: (LOGICAL_HEIGHT - 288) / 2,  // 36
  w: 512,
  h: 288,
};

// Card grid inside the page.
const COLS = 2;
const CARD_W = 220;
const CARD_H = 30;
const COL_GAP = 14;
const ROW_GAP = 4;
const GRID_X = PAGE.x + 18;
const GRID_Y = PAGE.y + 50;

export function createNotebook() {
  let open = false;

  function toggle() { open = !open; }
  function close() { open = false; }
  function isOpen() { return open; }

  function render(ctx, assets) {
    if (!open) return;

    // Dim backdrop.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    // Drop shadow under the page.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(PAGE.x + 4, PAGE.y + 6, PAGE.w, PAGE.h);

    // Leather edge.
    fillRoundRect(ctx, PAGE.x, PAGE.y, PAGE.w, PAGE.h, 6, '#3a2410');

    // Parchment interior.
    fillRoundRect(ctx, PAGE.x + 8, PAGE.y + 8, PAGE.w - 16, PAGE.h - 16, 3, '#f5e6d3');

    // Center binding line — visual "two pages of a book" cue.
    ctx.strokeStyle = 'rgba(58, 36, 16, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAGE.x + PAGE.w / 2, PAGE.y + 14);
    ctx.lineTo(PAGE.x + PAGE.w / 2, PAGE.y + PAGE.h - 14);
    ctx.stroke();

    // Title and subtitle.
    drawText(ctx, tr('할머니의 레시피', 'Grandmother’s Recipes'),
      PAGE.x + PAGE.w / 2, PAGE.y + 18, {
      color: '#3a2410', size: 14, align: 'center', baseline: 'middle',
    });
    drawText(ctx, tr(
      '— 재료를 그릇에 담아 서빙하세요 —',
      '— Drop ingredients into the bowl, then serve —'
    ), PAGE.x + PAGE.w / 2, PAGE.y + 34, {
      color: '#8c7a65', size: 9, align: 'center', baseline: 'middle',
    });

    // Recipe cards: 2 columns, 6 rows.
    for (let i = 0; i < RECIPES.length; i++) {
      const r = RECIPES[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = GRID_X + col * (CARD_W + COL_GAP);
      const y = GRID_Y + row * (CARD_H + ROW_GAP);

      // Card name.
      drawText(ctx, r.name, x + 6, y + CARD_H / 2 - 6, {
        color: '#3a2410', size: 10, baseline: 'middle',
      });
      drawText(ctx, tr(`${r.price}원`, `₩${r.price}`),
        x + 6, y + CARD_H / 2 + 6, {
        color: '#8c7a65', size: 8, baseline: 'middle',
      });

      // Ingredient icons inline.
      const iconSize = 18;
      const iconGap = 2;
      const totalIcons = r.ingredients.length;
      const totalIconW = totalIcons * iconSize + (totalIcons - 1) * iconGap;
      let ix = x + CARD_W - totalIconW - 6;
      const iy = y + (CARD_H - iconSize) / 2;
      for (const ing of r.ingredients) {
        drawIngredientById(ctx, assets, ing, ix, iy, iconSize, iconSize);
        ix += iconSize + iconGap;
      }
    }

    // Footer.
    drawText(ctx, tr('— R · 클릭으로 닫기 —', '— R · Click to close —'),
      PAGE.x + PAGE.w / 2, PAGE.y + PAGE.h - 14, {
      color: '#8c7a65', size: 9, align: 'center', baseline: 'middle',
    });
  }

  return { toggle, close, isOpen, render };
}
