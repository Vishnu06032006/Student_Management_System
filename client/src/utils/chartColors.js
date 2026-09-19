// Validated reference palette (dataviz skill) - fixed slot order is the
// CVD-safety mechanism, so colors are looked up by category identity below,
// never by an item's position in whatever order the API happened to return.
export const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

// Fixed per-domain assignments so the same category always renders the same
// color across reloads, regardless of the order the backend aggregation
// returns rows in.
const FIXED_MAPS = {
  attendance: { PRESENT: STATUS.good, LATE: STATUS.warning, EXCUSED: CATEGORICAL[0], ABSENT: STATUS.critical, ON_DUTY: CATEGORICAL[6] },
  resultStatus: { PASS: STATUS.good, FAIL: STATUS.critical },
  gender: { MALE: CATEGORICAL[0], FEMALE: CATEGORICAL[4], OTHER: CATEGORICAL[2] },
};

export function colorFor(domain, key, fallbackIndex = 0) {
  return FIXED_MAPS[domain]?.[key] || CATEGORICAL[fallbackIndex % CATEGORICAL.length];
}

// For domains with no fixed semantic mapping (e.g. department names, class
// names) - sort keys alphabetically first so the slot a category gets is at
// least stable across reloads, even though it isn't semantically fixed.
export function colorForSorted(key, allKeysSorted) {
  const index = allKeysSorted.indexOf(key);
  return CATEGORICAL[index % CATEGORICAL.length];
}
