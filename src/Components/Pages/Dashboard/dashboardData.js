import { DATE_RANGE, LEAKAGE_LIMIT, MIN_CLAIMS, STATES, initialLeakage, toDateKey } from "../Leakage/leakageData.js";
import { FATIGUE_LIMIT, MODERATE_FROM, initialFatigue } from "../HcpFatigue/fatigueData.js";
import { formatShortDate } from "../../common/formatters.js";

export const GOVT_PLANS_BYPASSED = 1135;

export const WEEKS = 12;

export const RANGE_OPTIONS = [
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "84", label: "Last 12 weeks", days: 84 },
];

export const DEFAULT_FILTERS = { range: "30", product: [], state: [] };

const DAY_MS = 86400000;

const END = DATE_RANGE.max;

const addDays = (key, days) => {
  const date = new Date(`${key}T00:00`);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const WINDOW_START = addDays(END, -(WEEKS * 7 - 1));

const dayIndex = (key) => Math.round((new Date(`${key}T00:00`) - new Date(`${WINDOW_START}T00:00`)) / DAY_MS);

const WEEK_LABELS = Array.from({ length: WEEKS }, (_, index) => formatShortDate(new Date(`${addDays(WINDOW_START, index * 7)}T00:00`)));

const ENGAGEMENT_WAVE = [-3, -1, 2, 0, -2, 3, 1, -1, 2, 4, 1, -2];

const npiState = initialLeakage.reduce((map, record) => ({ ...map, [record.npi]: record.state }), {});

export const stateCode = (label) => label.split(" ")[0];

export const isAboveLimit = (record) => record.claims >= MIN_CLAIMS && record.pct >= LEAKAGE_LIMIT;

const matches = (filters, product, state) =>
  (filters.product.length === 0 || filters.product.includes(product)) && (filters.state.length === 0 || filters.state.map(stateCode).includes(state));

const summarize = (records) => {
  const claims = records.reduce((sum, record) => sum + record.claims, 0);
  const rejected = records.reduce((sum, record) => sum + record.rejected, 0);
  const risky = new Set(records.filter(isAboveLimit).map((record) => record.npi));
  return { records: records.length, claims, rejected, rate: claims ? (rejected / claims) * 100 : 0, highRiskHcps: risky.size };
};

const delta = (current, previous) => (previous ? { value: ((current - previous) / previous) * 100, good: current <= previous } : null);

const buildTrend = (records) => {
  const buckets = Array(WEEKS).fill(0);
  records.forEach((record) => {
    const week = Math.floor(dayIndex(record.date) / 7);
    if (week >= 0 && week < WEEKS && isAboveLimit(record)) buckets[week] += 1;
  });
  return buckets.map((value, index) => ({ label: WEEK_LABELS[index], value }));
};

const buildBands = (records) => {
  const counts = [0, 0, 0];
  records.forEach((record) => {
    if (record.rejected <= 0) return;
    counts[record.pct < LEAKAGE_LIMIT ? 0 : record.pct < LEAKAGE_LIMIT * 2 ? 1 : 2] += 1;
  });
  const labels = [`Below ${LEAKAGE_LIMIT}%`, `${LEAKAGE_LIMIT}–${LEAKAGE_LIMIT * 2 - 1}%`, `${LEAKAGE_LIMIT * 2}% and above`];
  const colors = ["var(--chart-low)", "var(--chart-mid)", "var(--chart-high)"];
  return counts.map((value, index) => ({ label: labels[index], value, color: colors[index] }));
};

const buildStates = (records) => {
  const counts = records.reduce((map, record) => ({ ...map, [record.state]: (map[record.state] || 0) + 1 }), {});
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  return Object.entries(counts)
    .map(([key, value]) => ({ key, value, share: (value / total) * 100, title: STATES[key] }))
    .sort((a, b) => b.value - a.value);
};

const buildFatigue = (filters) => {
  const rows = initialFatigue.filter((row) => matches(filters, row.product, npiState[row.npi]));
  const byHcp = rows.reduce((map, row) => ({ ...map, [row.npi]: Math.max(map[row.npi] || 0, row.fatigue) }), {});
  const scores = Object.values(byHcp);
  const high = scores.filter((score) => score >= FATIGUE_LIMIT).length;
  const moderate = scores.filter((score) => score >= MODERATE_FROM && score < FATIGUE_LIMIT).length;
  const openRate = rows.length ? (rows.reduce((sum, row) => sum + row.openRate, 0) / rows.length) * 100 : 0;
  return {
    hcpCount: scores.length,
    average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
    bands: [
      { label: `Low (<${MODERATE_FROM})`, value: scores.length - high - moderate, color: "var(--chart-low)" },
      { label: `Moderate (${MODERATE_FROM}–${FATIGUE_LIMIT - 1})`, value: moderate, color: "var(--chart-mid)" },
      { label: `High (${FATIGUE_LIMIT}+)`, value: high, color: "var(--chart-high)" },
    ],
    high,
    engagement: WEEK_LABELS.map((label, index) => ({ label, value: Math.max(0, Math.min(100, Math.round(openRate + ENGAGEMENT_WAVE[index]))) })),
  };
};

const fatigueByNpi = initialFatigue.reduce((map, row) => ({ ...map, [row.npi]: Math.max(map[row.npi] || 0, row.fatigue) }), {});

const buildTopHcps = (records) => {
  const grouped = records.reduce((map, record) => {
    const entry = map[record.npi] || { npi: record.npi, hcp: record.hcp, state: record.state, claims: 0, rejected: 0, products: {} };
    entry.claims += record.claims;
    entry.rejected += record.rejected;
    entry.products[record.product] = (entry.products[record.product] || 0) + record.rejected;
    return { ...map, [record.npi]: entry };
  }, {});
  return Object.values(grouped)
    .map((entry) => ({
      ...entry,
      rate: (entry.rejected / entry.claims) * 100,
      topProduct: Object.entries(entry.products).sort((a, b) => b[1] - a[1])[0][0],
      fatigue: fatigueByNpi[entry.npi] || 0,
    }))
    .filter((entry) => entry.claims >= MIN_CLAIMS && entry.rate >= LEAKAGE_LIMIT)
    .sort((a, b) => b.rejected - a.rejected)
    .slice(0, 5);
};

export const buildDashboard = (filters) => {
  const days = Number(filters.range);
  const from = addDays(END, 1 - days);
  const scoped = initialLeakage.filter((record) => matches(filters, record.product, record.state));
  const current = scoped.filter((record) => record.date >= from && record.date <= END);
  const previous = days === 30 ? scoped.filter((record) => record.date >= addDays(from, -30) && record.date < from) : [];
  const stats = summarize(current);
  const previousStats = previous.length ? summarize(previous) : null;
  const fatigue = buildFatigue(filters);

  return {
    stats,
    deltas: previousStats ? { records: delta(stats.records, previousStats.records), rate: delta(stats.rate, previousStats.rate) } : {},
    comparesPrevious: Boolean(previousStats),
    trend: buildTrend(scoped),
    bands: buildBands(current),
    states: buildStates(current),
    fatigue,
    top: buildTopHcps(current),
  };
};
