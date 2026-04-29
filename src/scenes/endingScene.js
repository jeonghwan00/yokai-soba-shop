// Day 7 ending sequence.
// Plays four narrative beats over a slowly warming backdrop (loss → warmth
// → continuation → callback), then shows the run summary. The summary
// gives each customer an "after that night..." line scaled to their final
// affinity tier, and the closing line echoes day 1's "노렌을 걸었다" so
// the seven nights end where they began.

import { state, dispatch, SCENES } from '../state.js';
import { CHARACTERS, CHARACTER_ORDER } from '../data/characters.js';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  clear,
  drawText,
  fillRoundRect,
} from '../systems/renderer.js';
import { onClick } from '../systems/input.js';
import { tr } from '../i18n.js';

// Timeline (seconds since enter) — each beat fades in/out within its window.
const BEATS = [
  { from: 0.6,  to: 4.5,
    ko: '할머니가 떠나셨다.',
    en: 'Grandmother is gone.',
    color: '#f5e6d3' },
  { from: 5.0,  to: 9.0,
    ko: '달이 진다. 가게엔 온기만 남았다.',
    en: 'The moon sets. Only warmth remains in the shop.',
    color: '#f5e6d3' },
  { from: 9.5,  to: 13.5,
    ko: '다음 날 밤에도, 노렌을 걸었다.',
    en: 'The next night, I hung the noren again.',
    color: '#f5e6d3' },
  { from: 14.0, to: 18.0,
    ko: '할머니가 그랬듯이.',
    en: 'Just as Grandmother always did.',
    color: '#f4d03f' },
];
const BEATS_END = 18.5;

// Per-character outro lines by affinity tier — read on the stats screen.
// `key` matches CHARACTER_ORDER. Tiers: high (71+), mid (31-70), low (1-30).
const OUTROS = {
  yukionna: {
    high: { ko: '그날 이후로도, 그분은 늘 카운터 끝자리에 앉으셨다.',
            en: 'From that night on, she always took the corner seat.' },
    mid:  { ko: '차가운 메밀국수만큼은, 늘 같은 그릇이다.',
            en: 'Cold soba noodles — always the same bowl.' },
    low:  { ko: '가끔, 비 오는 밤에 들르신다.',
            en: 'Now and then, on rainy nights, she drops by.' },
  },
  kitsune: {
    high: { ko: '외상 메모는 어느 날 사라졌다. 다 갚으셨나 보다.',
            en: 'The IOU note vanished one day. He must have paid it all.' },
    mid:  { ko: '오늘도 "유부 듬뿍"을 외친다.',
            en: 'He still shouts "extra aburaage" the moment he sits down.' },
    low:  { ko: '현금을 들고 들르신다. 가끔.',
            en: 'He shows up with cash. Once in a while.' },
  },
  kappa: {
    high: { ko: '비가 올 때마다, 그 자리에 앉아 무를 드신다.',
            en: 'Every rainy night, he claims that seat and eats his daikon.' },
    mid:  { ko: '오뎅 모듬은 그분의 자리다.',
            en: 'The oden assortment is his standing order.' },
    low:  { ko: '급한 발걸음으로 들렀다 가신다.',
            en: 'He drops in — always in a hurry.' },
  },
  tengu: {
    high: { ko: '산속에서 내려와 우동 한 그릇 — 자네는 인정받았다.',
            en: 'Down from the mountain for a bowl of udon — he has acknowledged you.' },
    mid:  { ko: '가끔, 거만하게 평가하러 오신다.',
            en: 'Now and then, he comes — proudly — to judge.' },
    low:  { ko: '스쳐 지나가신다.',
            en: 'He passes through, briefly.' },
  },
  nekomata: {
    high: { ko: '검은 그림자가 종종 카운터에 앉는다. 가츠오부시 향에 끌려서.',
            en: 'A black shadow often sits at the counter — drawn by katsuobushi.' },
    mid:  { ko: '츤하지만, 자주 오신다.',
            en: 'Aloof, but she comes often.' },
    low:  { ko: '냄새 따라 들르신다. 가끔.',
            en: 'She drops by following a scent. Once in a while.' },
  },
  grandmother: {
    // Grandmother only appears once — any non-zero affinity gets a single
    // memorial line regardless of tier.
    high: { ko: '마지막 한 그릇은 — 너만의 기억으로 남는다.',
            en: 'That last bowl — remains your own memory.' },
    mid:  { ko: '마지막 한 그릇은 — 너만의 기억으로 남는다.',
            en: 'That last bowl — remains your own memory.' },
    low:  { ko: '마지막 한 그릇은 — 너만의 기억으로 남는다.',
            en: 'That last bowl — remains your own memory.' },
  },
};

let unsubClick = null;
let entered = 0;
let skipToStats = false;

export function enter() {
  entered = 0;
  skipToStats = false;
  unsubClick = onClick(() => {
    if (!skipToStats && entered < BEATS_END) {
      // First click skips past the slow beats.
      skipToStats = true;
      return;
    }
    // Subsequent click on the stats screen returns to title.
    dispatch({ type: 'ENTER_SCENE', scene: SCENES.TITLE });
  });
}

export function exit() {
  if (unsubClick) unsubClick();
  unsubClick = null;
}

export function update(dt) {
  entered += dt;
}

// Linear fade-in for the first 0.7s of a beat, hold, fade-out for the
// last 0.7s. Returns alpha 0..1.
function beatAlpha(t, beat) {
  if (t < beat.from || t > beat.to) return 0;
  const inT = t - beat.from;
  const outT = beat.to - t;
  return Math.min(1, Math.min(inT, outT) / 0.7);
}

function tierFor(aff) {
  if (aff >= 71) return 'high';
  if (aff >= 31) return 'mid';
  return 'low';
}

function tierLabelFor(aff) {
  if (aff >= 71) return tr('친구', 'Friend');
  if (aff >= 31) return tr('단골', 'Regular');
  return tr('낯선 손님', 'Stranger');
}

function tierColorFor(aff) {
  if (aff >= 71) return '#f4d03f';
  if (aff >= 31) return '#6BA368';
  return '#8c7a65';
}

function renderBeats(ctx) {
  // Background warms slowly across the four beats — black at the start,
  // a faint amber-brown by the time we get to "할머니가 그랬듯이".
  const t = Math.min(1, entered / BEATS_END);
  const r = Math.round(t * 22);
  const g = Math.round(t * 14);
  const b = Math.round(t * 8);
  clear(ctx, `rgb(${r}, ${g}, ${b})`);

  for (const b of BEATS) {
    const a = beatAlpha(entered, b);
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    drawText(ctx, tr(b.ko, b.en), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, {
      color: b.color, size: 16, align: 'center', baseline: 'middle',
    });
    ctx.globalAlpha = 1;
  }

  // Click-to-skip hint, blinks after the first beat starts.
  if (entered > 1.5 && Math.floor(entered * 1.6) % 2 === 0) {
    drawText(ctx, tr('— 클릭으로 건너뛰기 —', '— Click to skip —'),
      LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 24, {
      color: '#5d3a1a', size: 9, align: 'center', baseline: 'middle',
    });
  }
}

function renderStats(ctx) {
  // Warm dim background — same color we ended the beats on.
  clear(ctx, '#1a0e08');

  // Title.
  drawText(ctx, tr('그 후로도, 매일 밤', 'And every night since'),
    LOGICAL_WIDTH / 2, 28, {
    color: '#f5e6d3', size: 16, align: 'center', baseline: 'middle',
  });

  // Per-character cards: name + tier badge + outro line.
  // Each card is two-row tall — name on top, outro below in muted color.
  const cardX = 60;
  const cardW = LOGICAL_WIDTH - 120;
  const cardH = 36;
  const gap = 4;
  const startY = 56;
  let row = 0;
  for (const key of CHARACTER_ORDER) {
    const aff = state.affinity[key] ?? 0;
    if (aff <= 0) continue;
    const c = CHARACTERS[key];
    const y = startY + row * (cardH + gap);
    fillRoundRect(ctx, cardX, y, cardW, cardH, 5, 'rgba(26, 14, 8, 0.85)');

    // Name (top row).
    drawText(ctx, c.name, cardX + 12, y + 12, {
      color: '#f5e6d3', size: 12, baseline: 'middle',
    });
    // Tier badge (top row, right).
    drawText(ctx, `${tierLabelFor(aff)} · ${aff}`,
      cardX + cardW - 12, y + 12, {
      color: tierColorFor(aff), size: 11, align: 'right', baseline: 'middle',
    });

    // Outro line (bottom row).
    const outro = OUTROS[key]?.[tierFor(aff)];
    if (outro) {
      drawText(ctx, tr(outro.ko, outro.en),
        cardX + 12, y + 26, {
        color: '#d4b896', size: 10, baseline: 'middle',
      });
    }
    row++;
  }

  // Total sales — small, low-prominence near the bottom.
  drawText(ctx, tr(`누적 매출 ${state.money}원`, `Total: ₩${state.money}`),
    LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 60, {
    color: '#5d3a1a', size: 10, align: 'center', baseline: 'middle',
  });

  // Closing refrain — bookends the day-1 prologue's "…노렌을 걸었다".
  drawText(ctx, tr(
    '할머니가 그랬듯이, 이제 내가 노렌을 건다.',
    'Just as Grandmother did, now I hang the noren.'
  ), LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 40, {
    color: '#f5e6d3', size: 11, align: 'center', baseline: 'middle',
  });

  if (Math.floor(entered * 1.6) % 2 === 0) {
    drawText(ctx, tr('— 클릭해서 처음으로 —', '— Click to return to title —'),
      LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 18, {
      color: '#f4d03f', size: 10, align: 'center', baseline: 'middle',
    });
  }
}

export function render(ctx) {
  if (skipToStats || entered >= BEATS_END) {
    renderStats(ctx);
  } else {
    renderBeats(ctx);
  }
}
