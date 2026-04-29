// Per-day morning memories. Each entry holds a hotspot position on the
// shop background (logical 640×360 coords) and a short passage in the
// grandmother's voice — the first line in parentheses is the player's
// observation, the rest is grandmother recalling that customer.

import { getLocale } from '../i18n.js';

const DATA = {
  1: {
    hotspot: {
      x: 290, y: 232,
      label: { ko: '카운터 위의 흰 손수건', en: 'A white handkerchief on the counter' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        prologue: [
          '할머니가 돌아가신 지 일주일이 지났다.',
          '이 산골 마을의 작은 소바집을… 나에게 남기셨다.',
          '오늘부터 내가 영업을 한다.',
          '할머니가 어떤 분들과, 어떤 밤들을 보내셨는지…',
          '나는 아무것도 알지 못한다.',
          '…우선 가게를 둘러보자.',
        ],
        lines: [
          '(카운터 위에 작은 흰 손수건이 가지런히 놓여있다.)',
          '이 손님은 늘 늦은 밤에 오셨지.',
          '차가운 메밀국수만, 한 그릇.',
          '말 수가 적었지만… 가끔, 그분 눈물이 메밀에 떨어졌단다.',
        ],
      },
      en: {
        prologue: [
          'A week has passed since Grandmother’s death.',
          'This little soba shop in the mountain village... she left it to me.',
          'From today, I run the place.',
          'What customers Grandmother served, what nights she shared with them...',
          'I know nothing of any of it.',
          '...First, let me look around the shop.',
        ],
        lines: [
          '(A small white handkerchief lies neatly folded on the counter.)',
          'This guest always came late in the night.',
          'Cold soba noodles only, a single bowl.',
          'She spoke little... yet sometimes, her tears fell into the soba.',
        ],
      },
    },
  },
  2: {
    hotspot: {
      x: 345, y: 168,
      label: { ko: '벽에 핀 빛바랜 메모', en: 'A faded note pinned to the wall' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        lines: [
          '(벽에 핀 메모. 잉크가 번져 있다 — "외상 1엔. 키츠네 우동 두 그릇.")',
          '이 손님은 늘 외상이었지만, 결국 다 갚으셨단다.',
          '유부 한 조각만 더 얹어주면…',
          '꼬리를 흔들며 떠나시곤 했지.',
        ],
      },
      en: {
        lines: [
          '(A note pinned to the wall — ink smeared. "Tab: 1 yen. Two bowls of kitsune udon.")',
          'This guest was always running a tab — yet always paid, in the end.',
          'Slip one more piece of aburaage on top...',
          'and he’d leave with his tail wagging.',
        ],
      },
    },
  },
  3: {
    hotspot: {
      x: 438, y: 302,
      label: { ko: '마르지 않는 물 자국', en: 'A stain that never dries' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        lines: [
          '(가게 입구 앞 마룻바닥에 작은 물 자국 — 며칠째 마르지 않는다.)',
          '이 손님은 늘 비 오는 밤에 오신단다.',
          '접시가 마르는 것을 두려워하시지.',
          '오뎅 모듬에 무를 듬뿍 넣으면 가장 좋아하셨다.',
        ],
      },
      en: {
        lines: [
          '(A small water mark on the floor by the entrance — it never quite dries.)',
          'This guest only comes on rainy nights.',
          'He fears his plate drying out.',
          'He loved the oden assortment most, with daikon piled high.',
        ],
      },
    },
  },
  4: {
    hotspot: {
      x: 435, y: 252,
      label: { ko: '의자 위의 검붉은 깃털', en: 'A crimson feather on the chair' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        lines: [
          '(카운터 의자 위에 검붉은 깃털 한 가닥이 떨어져 있다.)',
          '이 분은 산속 깊은 곳에서 오시지.',
          '거만하시지만, 진짜배기는 알아보신단다.',
          '산나물 우동에 가츠오부시 향이 짙으면, 고개를 끄덕이셨지.',
        ],
      },
      en: {
        lines: [
          '(A single crimson feather rests on a counter chair.)',
          'This one comes from deep in the mountains.',
          'Proud, yes — but he knows the real thing.',
          'When the sansai udon was rich with katsuobushi, he would nod.',
        ],
      },
    },
  },
  5: {
    hotspot: {
      x: 515, y: 265,
      label: { ko: '의자 위의 검은 털', en: 'Black fur on the chair' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        lines: [
          '(가장 안쪽 의자에 검은 털이 몇 가닥 묻어있다.)',
          '검은 그림자가 카운터에 앉을 때면…',
          '냉정한 척하셨지만, 가츠오부시 향에는 약하셨지.',
          '두부에 가츠오부시를 가득 얹어드리면, 그제야 마음을 여셨단다.',
        ],
      },
      en: {
        lines: [
          '(A few strands of black fur cling to the innermost chair.)',
          'When that black shadow took its seat at the counter...',
          'She acted cool — yet katsuobushi was her weakness.',
          'Tofu piled with katsuobushi — only then did she open up.',
        ],
      },
    },
  },
  6: {
    hotspot: {
      x: 600, y: 275,
      label: { ko: '우산통의 우산 다섯 자루', en: 'Five umbrellas in the stand' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        lines: [
          '(우산통에 우산이 다섯 자루 — 비가 그치지 않는 밤에만 보이는 자루들.)',
          '오늘 밤은… 다섯 분 모두 오시리라.',
          '비가 오는 밤에는, 다들 따뜻한 곳을 찾으신단다.',
          '할미가 가장 분주했던 밤이지. 너도 정신을 바짝 차려라.',
        ],
      },
      en: {
        lines: [
          '(Five umbrellas stand in the basket — they only appear on nights the rain won’t stop.)',
          'Tonight... all five will come.',
          'On rainy nights, everyone seeks somewhere warm.',
          'My busiest night, this was. Stay sharp.',
        ],
      },
    },
  },
  7: {
    hotspot: {
      x: 80, y: 170,
      label: { ko: '선반 안쪽의 빛바랜 사진', en: 'A faded photo deep in the shelf' },
    },
    speaker: { ko: '할머니의 회상', en: 'Grandmother’s memory' },
    text: {
      ko: {
        lines: [
          '(가장 깊은 선반 안쪽에 빛바랜 사진 한 장 — 할머니와 어린 너.)',
          '마지막 밤이구나, 우리 아가.',
          '오늘은 어떤 단골도 오지 않는단다.',
          '단 한 사람을 빼고는…',
          '츠키미 우동을 부탁한다. 우리 둘 사이의 약속이었거든.',
        ],
      },
      en: {
        lines: [
          '(Deep on the shelf, a faded photo — Grandmother and you, when you were small.)',
          'It is the last night, my child.',
          'No regular will come tonight.',
          'No one... but a single soul.',
          'Tsukimi udon, please. It was the promise between us.',
        ],
      },
    },
  },
};

function localizedHotspot(h) {
  const loc = getLocale();
  return {
    x: h.x,
    y: h.y,
    r: h.r,
    label: h.label[loc] ?? h.label.ko,
  };
}

export function getMemory(day) {
  const m = DATA[day];
  if (!m) return null;
  const loc = getLocale();
  const text = m.text[loc] ?? m.text.ko;
  return {
    hotspot: localizedHotspot(m.hotspot),
    speaker: m.speaker[loc] ?? m.speaker.ko,
    prologue: text.prologue,
    lines: text.lines,
  };
}

// Existing consumers reach into MORNING_MEMORIES[state.day]; preserve that
// surface via a Proxy that resolves the active locale on access.
export const MORNING_MEMORIES = new Proxy({}, {
  get(_, key) {
    const day = Number(key);
    if (!Number.isFinite(day)) return undefined;
    return getMemory(day);
  },
  has(_, key) { return Number(key) in DATA; },
});
