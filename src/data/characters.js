// Character definitions for all six visitors.
// Each entry has language-independent fields (sprites, favoriteRecipe, etc.)
// and a `text` map keyed by locale ('ko' / 'en') with all dialogue.
// `CHARACTERS` is exported as a Proxy that flattens to the active locale,
// so existing consumers keep using `CHARACTERS[key]` unchanged.

import { getLocale } from '../i18n.js';

const DATA = {
  yukionna: {
    sprites: {
      neutral: 'assets/characters/yukionna_1.png',
      happy: 'assets/characters/yukionna_2.png',
      sad: 'assets/characters/yukionna_3.png',
    },
    favoriteRecipe: 'cold_soba',
    favoriteTopping: null,
    arrivalDay: 1,
    text: {
      ko: {
        name: '유키온나',
        introDialogue: [
          '…안녕하세요.',
          '할머니가… 안 계시네요.',
          '그래도 가게는 열렸군요. 다행이에요.',
        ],
        orderLines: {
          explicit: ['차가운 메밀국수, 한 그릇 부탁해요.'],
          regular: ['오늘도 평소 그거로요.'],
          friend: ['오늘은 좀… 시원한 게 그리워요.'],
        },
        tastingLines: [
          { needs: ['cold_dashi'], line: '(차가운 다시를 한 모금 마신다.)' },
          { needs: ['soba'],       line: '(메밀면을 천천히 — 한 입 음미한다.)' },
          { needs: [],             line: '(말없이 한 입 먹어본다.)' },
        ],
        satisfiedLines: {
          low: ['…고마워요.'],
          mid: ['역시 이 집 메밀국수가 최고예요.'],
          high: ['…할머니 손맛이 그대로네요. 눈물이 다 나려고 해요.'],
        },
        unsatisfiedLines: ['…음. 좀 다른 것 같아요.'],
        daySpecific: {
          6: {
            introDialogue: [
              '…폭우 속에 발이 미끄러질 뻔했어요.',
              '오늘 밤은… 다른 분들도 오시겠죠.',
              '먼저 와서, 기다릴게요.',
            ],
            orderLine: '이런 밤엔 차가운 메밀국수가 그리워요.',
          },
        },
      },
      en: {
        name: 'Yukionna',
        introDialogue: [
          '...Hello.',
          'Grandmother... isn’t here, is she.',
          'But the shop is open. I’m... glad.',
        ],
        orderLines: {
          explicit: ['Cold soba noodles, one bowl, please.'],
          regular: ['The usual today, thank you.'],
          friend: ['Tonight I find myself craving... something cool.'],
        },
        tastingLines: [
          { needs: ['cold_dashi'], line: '(She takes a quiet sip of the cold dashi.)' },
          { needs: ['soba'],       line: '(She slowly savors a bite of the soba.)' },
          { needs: [],             line: '(She quietly takes a bite.)' },
        ],
        satisfiedLines: {
          low: ['...Thank you.'],
          mid: ['Your soba truly is the finest.'],
          high: ['...Just like Grandmother’s. I might cry.'],
        },
        unsatisfiedLines: ['...Hm. Something is different.'],
        daySpecific: {
          6: {
            introDialogue: [
              '...I nearly slipped in the storm.',
              'Tonight... others will come too, won’t they.',
              'I’ll wait here, first.',
            ],
            orderLine: 'On a night like this, I crave cold soba.',
          },
        },
      },
    },
  },

  kitsune: {
    sprites: {
      neutral: 'assets/characters/kitsune_1.png',
      happy: 'assets/characters/kitsune_2.png',
      sad: 'assets/characters/kitsune_3.png',
    },
    favoriteRecipe: 'kitsune_udon',
    favoriteTopping: 'aburaage',
    arrivalDay: 2,
    text: {
      ko: {
        name: '키츠네',
        introDialogue: [
          '어이~ 새 주인장!',
          '소문 듣고 왔어. 외상 되지?',
          '…농담이야. 오늘은 현금 있어.',
        ],
        orderLines: {
          explicit: ['키츠네 우동 한 그릇. 유부 듬뿍으로.'],
          regular: ['오늘도 그거. 알지?'],
          friend: ['…오늘은 유부 좀 더 넣어주면 안 될까?'],
        },
        tastingLines: [
          { needs: ['aburaage'], line: '(유부 한 조각을 입에 — 꼬리가 슬쩍 흔들린다.)' },
          { needs: ['udon'],     line: '(코를 킁킁거리며 후루룩— 면을 빨아들인다.)' },
          { needs: [],           line: '(코를 킁킁— 한 입 베어 문다.)' },
        ],
        satisfiedLines: {
          low: ['오, 나쁘지 않은데.'],
          mid: ['그래, 이 맛이지!'],
          high: ['주인장, 이거 진짜… 할머니 맛이야.'],
        },
        unsatisfiedLines: ['이거… 뭐야 이거. 다시 해줘.'],
        daySpecific: {
          6: {
            introDialogue: [
              '이야~ 비 오는 날엔 우동이지!',
              '어이, 유키온나 누님도 벌써 와 있네!',
              '주인장, 오늘은 분주해질 거야~',
            ],
            orderLine: '비 오는 날의 키츠네 우동! 유부 듬뿍!',
          },
        },
      },
      en: {
        name: 'Kitsune',
        introDialogue: [
          'Heeey~ new owner!',
          'Heard the rumors. You take credit, right?',
          '...Joking. Got cash today.',
        ],
        orderLines: {
          explicit: ['Kitsune udon, please. Heavy on the aburaage.'],
          regular: ['The usual. You know it.'],
          friend: ['...Hey, can you slip in extra aburaage?'],
        },
        tastingLines: [
          { needs: ['aburaage'], line: '(He bites into the aburaage — his tail flicks.)' },
          { needs: ['udon'],     line: '(Sniffs at the bowl, then slurps up the noodles.)' },
          { needs: [],           line: '(Sniffs the bowl — then takes a bite.)' },
        ],
        satisfiedLines: {
          low: ['Oh, not bad.'],
          mid: ['Yeah, that’s the taste!'],
          high: ['Owner... this is really Grandmother’s flavor.'],
        },
        unsatisfiedLines: ['What... what is this? Make it again.'],
        daySpecific: {
          6: {
            introDialogue: [
              'Whoo~ rainy nights are for udon!',
              'Hey, Yukionna nee-san is already here!',
              'Owner, it’s gonna be a busy night~',
            ],
            orderLine: 'Kitsune udon for a rainy night! Loaded with aburaage!',
          },
        },
      },
    },
  },

  kappa: {
    sprites: {
      neutral: 'assets/characters/kappa_1.png',
      happy: 'assets/characters/kappa_2.png',
      sad: 'assets/characters/kappa_3.png',
    },
    favoriteRecipe: 'oden_set',
    favoriteTopping: 'daikon',
    arrivalDay: 3,
    text: {
      ko: {
        name: '캇파',
        introDialogue: [
          '꼬르륵… 빨리, 빨리.',
          '접시 마르기 전에 먹어야 해.',
        ],
        orderLines: {
          explicit: ['오뎅 모듬, 무 많이!'],
          regular: ['빨리, 늘 먹던 거.'],
          friend: ['오늘은 무가 유난히 그립네…'],
        },
        tastingLines: [
          { needs: ['daikon'],    line: '(무를 한 입 — 와삭, 만족스러운 식감이다.)' },
          { needs: ['hot_dashi'], line: '(꿀꺽— 큰 한 입에 국물을 들이켠다.)' },
          { needs: [],            line: '(꿀꺽— 한 입에 삼킨다.)' },
        ],
        satisfiedLines: {
          low: ['…살았다.'],
          mid: ['후우, 이제 좀 진정된다.'],
          high: ['주인장, 자네 덕에 오래 살겠어.'],
        },
        unsatisfiedLines: ['아니… 이건 아니야!'],
        daySpecific: {
          6: {
            introDialogue: [
              '비, 비 덕분에! 컨디션 최고다!',
              '오늘은 접시 마를 걱정도 없겠어!',
              '오랜만에 천천히 먹을 수 있겠다.',
            ],
            orderLine: '오뎅 모듬! 오늘은 무 두 배로 부탁해!',
          },
        },
      },
      en: {
        name: 'Kappa',
        introDialogue: [
          'Hungry... fast, fast.',
          'Gotta eat before my plate dries out.',
        ],
        orderLines: {
          explicit: ['Oden assortment, lots of daikon!'],
          regular: ['Quick, the usual.'],
          friend: ['I’m strangely missing daikon today...'],
        },
        tastingLines: [
          { needs: ['daikon'],    line: '(Bites the daikon — a satisfying crunch.)' },
          { needs: ['hot_dashi'], line: '(Gulps the broth in one big swallow.)' },
          { needs: [],            line: '(Gulps it down in one big bite.)' },
        ],
        satisfiedLines: {
          low: ['...Saved.'],
          mid: ['Whew, I’m settled now.'],
          high: ['Owner, you’ll let me live a long life yet.'],
        },
        unsatisfiedLines: ['No... this isn’t right!'],
        daySpecific: {
          6: {
            introDialogue: [
              'The rain— the rain! Peak condition!',
              'No worry of plates drying tonight!',
              'I get to take my time, for once.',
            ],
            orderLine: 'Oden assortment! Double the daikon today!',
          },
        },
      },
    },
  },

  tengu: {
    sprites: {
      neutral: 'assets/characters/tengu_1.png',
      happy: 'assets/characters/tengu_2.png',
      sad: 'assets/characters/tengu_3.png',
    },
    favoriteRecipe: 'sansai_udon',
    favoriteTopping: 'katsuobushi',
    arrivalDay: 4,
    text: {
      ko: {
        name: '텐구',
        introDialogue: [
          '흐음. 듣던 것보다 작은 가게군.',
          '하나 시켜보지. 솜씨를 보겠다.',
        ],
        orderLines: {
          explicit: ['산나물 우동. 가츠오부시 듬뿍.'],
          regular: ['늘 먹던 그것.'],
          friend: ['오늘은… 산속 향기가 그립구먼.'],
        },
        tastingLines: [
          { needs: ['katsuobushi'], line: '(가츠오부시 향을 천천히 들이마시고 — 한 젓가락.)' },
          { needs: [],              line: '(천천히 향을 음미하고 — 한 젓가락 든다.)' },
        ],
        satisfiedLines: {
          low: ['…나쁘지 않다.'],
          mid: ['이 정도면 인정해주지.'],
          high: ['자네… 할머니의 후계자가 맞군.'],
        },
        unsatisfiedLines: ['이게 뭐냐, 이게.'],
        daySpecific: {
          6: {
            introDialogue: [
              '흠. 폭풍 속에 산을 내려온 건 오랜만이군.',
              '다들 한 자리에 모인 광경이라니, 진귀하구먼.',
              '주인장, 자네가 이 인연을 이어받았군.',
            ],
            orderLine: '산나물 우동. 산속의 향이 그립다.',
          },
        },
      },
      en: {
        name: 'Tengu',
        introDialogue: [
          'Hmm. Smaller shop than I’d been told.',
          'I shall order one. Show me your skill.',
        ],
        orderLines: {
          explicit: ['Sansai udon. Plenty of katsuobushi.'],
          regular: ['What I always have.'],
          friend: ['Tonight... I miss the scent of the mountain.'],
        },
        tastingLines: [
          { needs: ['katsuobushi'], line: '(Inhales the katsuobushi aroma slowly, then lifts a bite.)' },
          { needs: [],              line: '(Inhales the aroma slowly, then lifts a bite.)' },
        ],
        satisfiedLines: {
          low: ['...Not bad.'],
          mid: ['I shall grant you this much.'],
          high: ['You... are Grandmother’s true heir.'],
        },
        unsatisfiedLines: ['What is this. What is this.'],
        daySpecific: {
          6: {
            introDialogue: [
              'Hmm. It has been an age since I descended in a storm.',
              'All gathered in one place — a rare sight indeed.',
              'Owner, you have inherited this bond.',
            ],
            orderLine: 'Sansai udon. The mountain’s scent calls to me.',
          },
        },
      },
    },
  },

  nekomata: {
    sprites: {
      neutral: 'assets/characters/nekomata_1.png',
      happy: 'assets/characters/nekomata_2.png',
      sad: 'assets/characters/nekomata_3.png',
    },
    favoriteRecipe: 'katsuo_tofu',
    favoriteTopping: 'katsuobushi',
    arrivalDay: 5,
    text: {
      ko: {
        name: '네코마타',
        introDialogue: [
          '냐… 별로 기대 안 해.',
          '그치만, 가츠오부시 냄새가 나서.',
        ],
        orderLines: {
          explicit: ['가츠오 두부. 가츠오부시 많이.'],
          regular: ['…늘 먹던 거.'],
          friend: ['…오늘은 좀, 위로받고 싶어.'],
        },
        tastingLines: [
          { needs: ['katsuobushi'], line: '(가츠오부시 향에 — 잠시 눈을 감는다.)' },
          { needs: ['tofu'],        line: '(두부를 한 입 — 가만히 우물거린다.)' },
          { needs: [],              line: '(경계하듯 한 입 — 그러고는 가만히 입을 다문다.)' },
        ],
        satisfiedLines: {
          low: ['…나쁘진 않네.'],
          mid: ['…뭐, 그럭저럭이야.'],
          high: ['고마워, 인간. …진짜로.'],
        },
        unsatisfiedLines: ['이게 뭐야. 장난해?'],
        daySpecific: {
          6: {
            introDialogue: [
              '비 싫어… 털 다 젖었잖아.',
              '그치만, 다들 와 있길래…',
              '…그냥, 끼어드는 거야. 별 의미 없어.',
            ],
            orderLine: '…가츠오 두부. 가츠오부시 잔뜩.',
          },
        },
      },
      en: {
        name: 'Nekomata',
        introDialogue: [
          'Mrew... not expecting much.',
          'But the smell of katsuobushi pulled me in.',
        ],
        orderLines: {
          explicit: ['Katsuo tofu. Lots of katsuobushi.'],
          regular: ['...The usual.'],
          friend: ['...I want to be comforted, today.'],
        },
        tastingLines: [
          { needs: ['katsuobushi'], line: '(At the katsuobushi scent — her eyes briefly close.)' },
          { needs: ['tofu'],        line: '(A bite of tofu — she chews it quietly.)' },
          { needs: [],              line: '(Takes a wary bite — then falls silent.)' },
        ],
        satisfiedLines: {
          low: ['...Not awful.'],
          mid: ['...Eh, average, I guess.'],
          high: ['Thanks, human. ...Really.'],
        },
        unsatisfiedLines: ['What is this. Are you joking?'],
        daySpecific: {
          6: {
            introDialogue: [
              'Hate the rain... my fur’s all wet.',
              'But everyone’s here, so...',
              '...I’m just dropping in. No reason.',
            ],
            orderLine: '...Katsuo tofu. Bury it in katsuobushi.',
          },
        },
      },
    },
  },

  grandmother: {
    sprites: {
      neutral: 'assets/characters/grandmother_1.png',
      happy: 'assets/characters/grandmother_2.png',
      sad: 'assets/characters/grandmother_3.png',
    },
    favoriteRecipe: 'tsukimi_udon',
    favoriteTopping: null,
    arrivalDay: 7,
    text: {
      ko: {
        name: '할머니 영혼',
        introDialogue: [
          '…잘 컸구나, 우리 아가.',
          '오늘은 할미가 손님이야.',
          '마지막으로… 그 우동 한 그릇 부탁해도 될까?',
        ],
        orderLines: {
          explicit: ['츠키미 우동. 달이 뜬 우동이란다.'],
          regular: ['…알지? 그것 말이야.'],
          friend: ['…마지막이니까, 정성껏 부탁한다.'],
        },
        tastingLines: [
          { needs: ['nori'], line: '(김의 향을 가만히 — 그리고 한 입. 어깨가 살짝 떨린다.)' },
          { needs: ['udon'], line: '(눈을 감고 — 천천히 한 입.)' },
          { needs: [],       line: '(말없이, 한 입.)' },
        ],
        satisfiedLines: {
          low: ['…고마워, 우리 아가.'],
          mid: ['…할미가 자랑스럽다.'],
          high: ['…이제, 편히 갈 수 있겠구나.'],
        },
        unsatisfiedLines: ['…괜찮아, 다시 한번 해보렴.'],
      },
      en: {
        name: 'Grandmother',
        introDialogue: [
          '...You’ve grown well, my child.',
          'Tonight, I am the customer.',
          'One last bowl of that udon... will you make it?',
        ],
        orderLines: {
          explicit: ['Tsukimi udon. The moon-viewing udon.'],
          regular: ['...You know? That one.'],
          friend: ['...This is the last time. Make it carefully, please.'],
        },
        tastingLines: [
          { needs: ['nori'], line: '(Quietly inhales the nori’s scent — then a bite. Her shoulders tremble.)' },
          { needs: ['udon'], line: '(Closes her eyes — takes a slow bite.)' },
          { needs: [],       line: '(Silently, a bite.)' },
        ],
        satisfiedLines: {
          low: ['...Thank you, my child.'],
          mid: ['...Grandmother is proud.'],
          high: ['...Now I can rest in peace.'],
        },
        unsatisfiedLines: ['...It’s all right. Try once more.'],
      },
    },
  },
};

function getLocalizedCharacter(key) {
  const c = DATA[key];
  if (!c) return null;
  const text = c.text[getLocale()] ?? c.text.ko;
  // Compose: shared fields + locale-specific text. Sprites/favorites/etc. on
  // top; text fields fill in name/dialogue.
  return {
    sprites: c.sprites,
    favoriteRecipe: c.favoriteRecipe,
    favoriteTopping: c.favoriteTopping,
    arrivalDay: c.arrivalDay,
    nameEn: c.text.en.name,
    ...text,
  };
}

// Proxy keeps the existing `CHARACTERS[key]` API working while resolving
// the locale at access time. Iteration uses CHARACTER_ORDER below, which
// is locale-independent — Object.keys on the proxy is not relied on.
export const CHARACTERS = new Proxy({}, {
  get(_, key) { return getLocalizedCharacter(key); },
  has(_, key) { return key in DATA; },
});

export const CHARACTER_ORDER = [
  'yukionna',
  'kitsune',
  'kappa',
  'tengu',
  'nekomata',
  'grandmother',
];

// Map an affinity score (0..100) to a tier key used by the dialogue lookups.
export function affinityTier(score) {
  if (score >= 71) return { order: 'friend', satisfied: 'high' };
  if (score >= 31) return { order: 'regular', satisfied: 'mid' };
  return { order: 'explicit', satisfied: 'low' };
}
