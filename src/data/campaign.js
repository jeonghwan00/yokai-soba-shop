// 7-day campaign — defines who shows up each night and in what order.
// Kept tiny on purpose; harder per-night events (kappa timer, day 6 storm,
// day 7 ending) hook in via scene logic, not via more data fields here.

export const CAMPAIGN = {
  1: { customers: ['yukionna'] },
  2: { customers: ['yukionna', 'kitsune'] },
  3: { customers: ['yukionna', 'kitsune', 'kappa'] },
  4: { customers: ['kappa', 'kitsune', 'tengu'] },
  5: { customers: ['kitsune', 'tengu', 'nekomata'] },
  6: { customers: ['yukionna', 'kitsune', 'kappa', 'tengu', 'nekomata'], rain: true },
  7: { customers: ['grandmother'], ending: true },
};

export const TOTAL_DAYS = 7;
