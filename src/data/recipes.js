// 12 recipes from the project brief. `ingredients` is an unordered set —
// the matching logic compares as a sorted multiset.
//
// Recipe names and ingredient labels are localized via i18n. The base
// `RECIPES` array is wrapped in Proxies so `r.name` resolves to the active
// locale at access time, keeping the existing API.

import { getLocale } from '../i18n.js';

const _RECIPES = [
  { id: 'cold_soba',     ingredients: ['soba', 'cold_dashi', 'scallion'],                       price: 600 },
  { id: 'hot_soba',      ingredients: ['soba', 'hot_dashi', 'scallion'],                        price: 600 },
  { id: 'kitsune_udon',  ingredients: ['udon', 'hot_dashi', 'aburaage', 'scallion'],            price: 750 },
  { id: 'kake_udon',     ingredients: ['udon', 'hot_dashi', 'scallion'],                        price: 550 },
  { id: 'kappa_maki',    ingredients: ['daikon', 'nori'],                                       price: 400 },
  { id: 'oden_set',      ingredients: ['tofu', 'daikon', 'hot_dashi'],                          price: 700 },
  { id: 'sansai_udon',   ingredients: ['udon', 'hot_dashi', 'scallion', 'katsuobushi'],         price: 900 },
  { id: 'warm_sake',     ingredients: ['sake', 'hot_dashi'],                                    price: 500 },
  { id: 'katsuo_tofu',   ingredients: ['tofu', 'katsuobushi', 'scallion'],                      price: 650 },
  { id: 'nori_tofu',     ingredients: ['tofu', 'nori', 'scallion'],                             price: 600 },
  { id: 'tsukimi_udon',  ingredients: ['udon', 'hot_dashi', 'tofu', 'nori', 'scallion'],        price: 1200 },
  { id: 'tofu_soup',     ingredients: ['tofu', 'hot_dashi', 'daikon'],                          price: 600 },
];

const RECIPE_NAMES = {
  ko: {
    cold_soba:    '차가운 메밀국수',
    hot_soba:     '따뜻한 메밀국수',
    kitsune_udon: '키츠네 우동',
    kake_udon:    '카케 우동',
    kappa_maki:   '카파마키',
    oden_set:     '오뎅 모듬',
    sansai_udon:  '산나물 우동',
    warm_sake:    '따끈한 청주',
    katsuo_tofu:  '가츠오 두부',
    nori_tofu:    '김두부',
    tsukimi_udon: '츠키미 우동 (비밀)',
    tofu_soup:    '두부탕',
  },
  en: {
    cold_soba:    'Cold Soba',
    hot_soba:     'Hot Soba',
    kitsune_udon: 'Kitsune Udon',
    kake_udon:    'Kake Udon',
    kappa_maki:   'Kappa Maki',
    oden_set:     'Oden Assortment',
    sansai_udon:  'Sansai Udon',
    warm_sake:    'Warm Sake',
    katsuo_tofu:  'Katsuo Tofu',
    nori_tofu:    'Nori Tofu',
    tsukimi_udon: 'Tsukimi Udon (Secret)',
    tofu_soup:    'Tofu Soup',
  },
};

export function recipeName(id) {
  const dict = RECIPE_NAMES[getLocale()] ?? RECIPE_NAMES.ko;
  return dict[id] ?? id;
}

// Each recipe is a Proxy so `r.name` reads the active locale on access.
export const RECIPES = _RECIPES.map((r) => new Proxy(r, {
  get(target, key) {
    if (key === 'name') return recipeName(target.id);
    return target[key];
  },
}));

export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

// Canonical ingredient ids — keep aligned with ingredient_sheet.png ordering.
export const INGREDIENT_IDS = [
  'soba',
  'udon',
  'hot_dashi',
  'cold_dashi',
  'tofu',
  'aburaage',
  'daikon',
  'scallion',
];

export const TOPPING_IDS = ['nori', 'katsuobushi', 'sake'];

const INGREDIENT_LABELS_BY_LOCALE = {
  ko: {
    soba:        '메밀면',
    udon:        '우동면',
    hot_dashi:   '뜨거운 다시',
    cold_dashi:  '차가운 다시',
    tofu:        '두부',
    aburaage:    '유부',
    daikon:      '무',
    scallion:    '파',
    nori:        '김',
    katsuobushi: '가츠오부시',
    sake:        '청주',
  },
  en: {
    soba:        'Soba noodles',
    udon:        'Udon noodles',
    hot_dashi:   'Hot dashi',
    cold_dashi:  'Cold dashi',
    tofu:        'Tofu',
    aburaage:    'Aburaage',
    daikon:      'Daikon',
    scallion:    'Scallion',
    nori:        'Nori',
    katsuobushi: 'Katsuobushi',
    sake:        'Sake',
  },
};

export function ingredientLabel(id) {
  const dict = INGREDIENT_LABELS_BY_LOCALE[getLocale()] ?? INGREDIENT_LABELS_BY_LOCALE.ko;
  return dict[id] ?? id;
}

// Backwards-compat surface for callers that grab a label by id. Resolves
// per-access so locale changes propagate.
export const INGREDIENT_LABELS = new Proxy({}, {
  get(_, key) { return ingredientLabel(key); },
});

// Find the recipe (if any) whose ingredient set exactly equals `bowl`.
// Bowl is treated as a set — duplicates are deduped before compare.
export function findMatchingRecipe(bowl) {
  const bowlKey = [...new Set(bowl)].sort().join(',');
  if (!bowlKey) return null;
  for (const r of RECIPES) {
    const recipeKey = [...r.ingredients].sort().join(',');
    if (recipeKey === bowlKey) return r;
  }
  return null;
}

// Evaluate a serve attempt. Returns:
//   { kind: 'satisfied'|'unsatisfied'|'invalid',
//     recipe: Recipe|null,
//     money:  number,            // amount earned this serve
//     affinity: number,          // signed delta to apply to customer
//     toppingBonus: boolean }    // whether favoriteTopping bonus applied
//
// Note: streak bonus (+10 every 3 satisfied in a row) is applied separately
// in the SERVE_BOWL reducer so that bowl evaluation stays a pure function
// of (bowl, customer).
export function evaluateBowl(bowl, customer) {
  const matched = findMatchingRecipe(bowl);
  const favoriteId = customer?.favoriteRecipe;

  if (matched && matched.id === favoriteId) {
    let affinity = 5;
    let toppingBonus = false;
    if (customer.favoriteTopping && bowl.includes(customer.favoriteTopping)) {
      affinity += 2;
      toppingBonus = true;
    }
    return {
      kind: 'satisfied',
      recipe: matched,
      money: matched.price,
      affinity,
      toppingBonus,
    };
  }
  if (matched) {
    return {
      kind: 'unsatisfied',
      recipe: matched,
      money: matched.price,
      affinity: -3,
      toppingBonus: false,
    };
  }
  return {
    kind: 'invalid',
    recipe: null,
    money: 0,
    affinity: -3,
    toppingBonus: false,
  };
}
