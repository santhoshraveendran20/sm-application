import { DATE_RANGE, LEAKAGE_LIMIT, MIN_CLAIMS, PRODUCTS, initialLeakage, toDateKey } from "../Leakage/leakageData.js";

export const FATIGUE_LIMIT = 70;

export const MODERATE_FROM = 50;

export const LEVELS = {
  High: `High (${FATIGUE_LIMIT}+)`,
  Moderate: `Moderate (${MODERATE_FROM}–${FATIGUE_LIMIT - 1})`,
  Low: `Low (under ${MODERATE_FROM})`,
};

export const LEVEL_OPTIONS = Object.values(LEVELS);

export const fatigueLevel = (index) => (index >= FATIGUE_LIMIT ? "High" : index >= MODERATE_FROM ? "Moderate" : "Low");

const CAMPAIGNS = {
  Apixaban: "Apixaban Stroke Prevention Q4",
  Atorvastatin: "Atorvastatin Lipid Targets",
  Ciprofloxacin: "Ciprofloxacin Stewardship Update",
  Desloratadine: "Desloratadine Allergy Season",
  Domperidone: "Domperidone GI Awareness",
  Empagliflozin: "Empagliflozin Cardio-Renal Series",
  Haloperidol: "Haloperidol Dosing Webinar",
  Memantine: "Memantine Caregiver Program",
  Rosuvastatin: "Rosuvastatin HCP Wave 2",
  Simvastatin: "Simvastatin Formulary Update",
};

const random = (() => {
  let seed = 20261029;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
})();

const between = (min, max) => min + Math.floor(random() * (max - min + 1));

const recentFrom = new Date(`${DATE_RANGE.max}T00:00`);
recentFrom.setDate(recentFrom.getDate() - 29);

const RECENT_FROM = toDateKey(recentFrom);

const recentTotals = initialLeakage
  .filter((record) => record.date >= RECENT_FROM)
  .reduce((totals, record) => {
    const key = `${record.npi}|${record.product}`;
    const total = totals[key] || { claims: 0, rejected: 0 };
    totals[key] = { claims: total.claims + record.claims, rejected: total.rejected + record.rejected };
    return totals;
  }, {});

const isLeakageAboveLimit = (npi, product) => {
  const total = recentTotals[`${npi}|${product}`];
  return Boolean(total) && total.claims >= MIN_CLAIMS && (total.rejected / total.claims) * 100 >= LEAKAGE_LIMIT;
};

const nextBestAction = (fatigue, aboveLimit) => {
  if (fatigue >= FATIGUE_LIMIT) return aboveLimit ? "Rep visit; pause email 14 days" : "Pause digital outreach 14 days";
  return aboveLimit ? "Include in Salesforce hand-off" : "Maintain current cadence";
};

const hcps = Object.values(
  initialLeakage.reduce((acc, record) => {
    const hcp = acc[record.npi] || { name: record.hcp, npi: record.npi, products: new Set() };
    hcp.products.add(record.product);
    acc[record.npi] = hcp;
    return acc;
  }, {})
).sort((a, b) => a.name.localeCompare(b.name));

export const initialFatigue = hcps.flatMap((hcp, hcpIndex) =>
  PRODUCTS.filter((product) => hcp.products.has(product)).map((product, productIndex) => {
    const aboveLimit = isLeakageAboveLimit(hcp.npi, product);
    const overContacted = productIndex === 0 && (hcpIndex % 7 === 3 || (aboveLimit && random() < 0.5));
    const fatigue = overContacted ? between(70, 91) : random() < 0.22 ? between(50, 69) : between(15, 49);
    const sent = between(2, 9) + (overContacted ? 8 : 0);
    const touches = sent + between(0, 4) + (overContacted ? 5 : 0) + between(0, 4) + between(0, 4) + between(0, 2);
    const opened = Math.min(sent, Math.round(sent * (1 - fatigue / 100) * (0.6 + random() * 0.5)));
    return {
      id: `${hcp.npi}-${product}`,
      npi: hcp.npi,
      name: hcp.name,
      product,
      campaign: random() < 0.06 ? "" : CAMPAIGNS[product],
      touches,
      sent,
      opened,
      openRate: opened / sent,
      fatigue,
      nba: nextBestAction(fatigue, aboveLimit),
    };
  })
);
