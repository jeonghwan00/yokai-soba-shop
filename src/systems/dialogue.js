// Dialogue runner — typewriter effect for a queue of lines.
//
// Usage from a scene:
//   const d = createDialogue(['line A', 'line B'], { onDone: ... });
//   // each frame:  d.update(dt);  d.render(ctx);
//   // on click:    d.advance();   // skip-to-end-of-line, or jump to next line
//
// Speed: ~36 chars/sec. Click once mid-line to fast-finish; click again to
// move to the next line. After the last line is finished and clicked,
// onDone() fires and `d.finished` becomes true.

import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  fillRoundRect,
  drawText,
} from './renderer.js';
import { audio } from './audio.js';

const CHARS_PER_SEC = 36;
// Play a text blip every N characters revealed. ~36 cps / 3 ≈ 12 blips/s
// which is busy but readable — closer than that turns into a buzz.
const BLIP_EVERY = 3;

// Layout for the dialogue box at the bottom of the canvas.
const BOX_PAD_X = 16;
const BOX_PAD_Y = 8;
const BOX_X = 24;
const BOX_W = LOGICAL_WIDTH - BOX_X * 2;
const BOX_H = 70;
const BOX_Y = LOGICAL_HEIGHT - BOX_H - 14;

export function createDialogue(lines, opts = {}) {
  const {
    speaker = null,
    onDone = () => {},
  } = opts;

  const state = {
    lines: [...lines],
    lineIndex: 0,
    chars: 0,
    lastBlipChar: 0,
    finished: false,

    update(dt) {
      if (state.finished) return;
      const cur = state.lines[state.lineIndex] ?? '';
      if (state.chars < cur.length) {
        state.chars = Math.min(cur.length, state.chars + dt * CHARS_PER_SEC);
        // Blip on every Nth new character revealed. We don't blip on the
        // very last character so the line ending feels quiet.
        const nowChars = Math.floor(state.chars);
        if (nowChars > state.lastBlipChar
            && nowChars % BLIP_EVERY === 0
            && nowChars < cur.length) {
          audio.playSfx('text_blip');
        }
        state.lastBlipChar = nowChars;
      }
    },

    advance() {
      if (state.finished) return;
      const cur = state.lines[state.lineIndex] ?? '';
      if (state.chars < cur.length) {
        // First click: fast-finish the current line.
        state.chars = cur.length;
        return;
      }
      // Second click: next line, or done.
      if (state.lineIndex < state.lines.length - 1) {
        state.lineIndex += 1;
        state.chars = 0;
        state.lastBlipChar = 0;
      } else {
        state.finished = true;
        onDone();
      }
    },

    render(ctx) {
      // Frame: parchment-on-dark with a thin warm border.
      fillRoundRect(ctx, BOX_X, BOX_Y, BOX_W, BOX_H, 6, 'rgba(10, 10, 15, 0.86)');
      ctx.strokeStyle = '#8c7a65';
      ctx.lineWidth = 1;
      ctx.strokeRect(BOX_X + 0.5, BOX_Y + 0.5, BOX_W - 1, BOX_H - 1);

      // Speaker tag in the top-left of the frame.
      if (speaker) {
        fillRoundRect(
          ctx,
          BOX_X + 8,
          BOX_Y - 8,
          Math.min(80, 8 + speaker.length * 12 + 12),
          16,
          4,
          '#5d3a1a'
        );
        drawText(ctx, speaker, BOX_X + 14, BOX_Y - 8 + 8, {
          color: '#f5e6d3',
          size: 10,
          baseline: 'middle',
        });
      }

      // Body text — wrap manually since Canvas2D won't.
      const cur = state.lines[state.lineIndex] ?? '';
      const visible = cur.slice(0, Math.floor(state.chars));
      const maxWidth = BOX_W - BOX_PAD_X * 2;
      const lines = wrapText(ctx, visible, maxWidth, '12px -apple-system, sans-serif');

      ctx.fillStyle = '#f5e6d3';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let y = BOX_Y + BOX_PAD_Y;
      for (const ln of lines) {
        ctx.fillText(ln, BOX_X + BOX_PAD_X, y);
        y += 16;
      }

      // ▼ blinker once the current line is fully revealed.
      const lineDone = Math.floor(state.chars) >= cur.length;
      if (lineDone && (Math.floor(performance.now() / 400) % 2 === 0)) {
        drawText(ctx, '▼', BOX_X + BOX_W - 14, BOX_Y + BOX_H - 12, {
          color: '#f4d03f',
          size: 10,
          align: 'right',
          baseline: 'middle',
        });
      }
    },
  };

  return state;
}

// Word-wrap helper. We measure with the canvas context so widths match the
// font we'll render with. CJK breaks at any character boundary; ASCII at
// spaces. Cheap heuristic that works for our line lengths.
function wrapText(ctx, text, maxWidth, font) {
  const prevFont = ctx.font;
  ctx.font = font;
  const out = [];
  let cur = '';

  const flush = () => {
    if (cur) out.push(cur);
    cur = '';
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth) {
      // Try to break at the last space; otherwise hard-break at this char.
      const lastSpace = cur.lastIndexOf(' ');
      if (lastSpace > 0 && /[a-zA-Z0-9]/.test(ch)) {
        out.push(cur.slice(0, lastSpace));
        cur = cur.slice(lastSpace + 1) + ch;
      } else {
        flush();
        cur = ch;
      }
    } else {
      cur = test;
    }
  }
  flush();
  ctx.font = prevFont;
  return out;
}
