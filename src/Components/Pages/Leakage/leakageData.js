export const LEAKAGE_LIMIT = 20;

export const MIN_CLAIMS = 10;

export const STATES = {
  AZ: "Arizona",
  CA: "California",
  FL: "Florida",
  GA: "Georgia",
  IL: "Illinois",
  MA: "Massachusetts",
  MI: "Michigan",
  NC: "North Carolina",
  NY: "New York",
  OH: "Ohio",
  PA: "Pennsylvania",
  TX: "Texas",
};

export const PRODUCTS = ["Apixaban", "Atorvastatin", "Ciprofloxacin", "Desloratadine", "Domperidone", "Empagliflozin", "Haloperidol", "Memantine", "Rosuvastatin", "Simvastatin"];

const STATE_ZIPS = {
  AZ: ["85004", "85701"],
  CA: ["90012", "94103", "92101"],
  FL: ["33101", "32801", "33602"],
  GA: ["30303", "30601"],
  IL: ["60601", "62701"],
  MA: ["02108"],
  MI: ["48226", "49503"],
  NC: ["28202", "27601"],
  NY: ["10001", "11201", "14604"],
  OH: ["43215", "44113"],
  PA: ["19103", "15222"],
  TX: ["75201", "77002", "78701", "78205"],
};

const STATE_WEIGHTS = { TX: 8, FL: 6, CA: 5, MI: 5, NC: 5, IL: 4, GA: 4, NY: 4, PA: 4, OH: 3, AZ: 1, MA: 1 };

const FIRST_NAMES = ["Nancy", "Rachel", "Sandra", "Linda", "Michelle", "Daniel", "Kevin", "James", "Maria", "Robert", "Priya", "Susan", "Angela", "Laura", "Brian", "Steven", "Karen", "Anthony", "Mark", "Paul", "Jason", "Emily", "Ryan", "Olivia", "Eric", "Grace", "Samuel", "Hannah"];

const LAST_NAMES = ["Ward", "Bennett", "Coleman", "Fisher", "Foster", "Chen", "Morris", "Patel", "Nguyen", "Carter", "Brooks", "Ramirez", "Hughes", "Price", "Reyes", "Sanders", "Shah", "Kim", "Torres", "Bishop", "Grant", "Webb", "Hayes", "Mendoza", "Porter", "Russell", "Lowe", "Ellis", "Vargas"];

const INITIALS = ["A", "B", "C", "D", "J", "K", "M", "P", "R", "S", "T"];

const START_DATE = new Date(2026, 6, 30);

const DAY_SPAN = 84;

const random = (() => {
  let seed = 20261022;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
})();

const between = (min, max) => min + Math.floor(random() * (max - min + 1));

const pick = (list) => list[Math.floor(random() * list.length)];

const pad = (value) => String(value).padStart(2, "0");

export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const stateLabel = (code) => `${code} · ${STATES[code]}`;

const STATE_POOL = Object.entries(STATE_WEIGHTS).flatMap(([code, weight]) => Array(weight).fill(code));

const pharmacyId = () => `NCPDP-${between(1000, 9999)}`;

const hcps = Array.from({ length: 72 }, (_, index) => {
  const state = pick(STATE_POOL);
  const middle = index % 6 === 0 ? ` ${pick(INITIALS)}.` : "";
  return {
    name: `Dr. ${FIRST_NAMES[index % FIRST_NAMES.length]}${middle} ${LAST_NAMES[(index * 7) % LAST_NAMES.length]}`,
    npi: `1${between(100000000, 999999999)}`,
    state,
    zip: pick(STATE_ZIPS[state]),
    pharmacies: [pharmacyId(), pharmacyId()],
    products: [...new Set([pick(PRODUCTS), pick(PRODUCTS), pick(PRODUCTS)])],
    risk: index % 4 === 0 ? 0.42 + random() * 0.5 : index % 3 === 0 ? 0.18 + random() * 0.14 : 0.03 + random() * 0.15,
  };
});

export const initialLeakage = Array.from({ length: 360 }, (_, index) => {
  const hcp = pick(hcps);
  const day = new Date(START_DATE);
  day.setDate(START_DATE.getDate() + between(0, DAY_SPAN - 1));
  const claims = random() < 0.1 ? between(2, MIN_CLAIMS - 1) : between(12, 180);
  const rejected = Math.min(claims, Math.max(1, Math.round(claims * hcp.risk * (0.7 + random() * 0.6))));
  return {
    id: `lk-${String(index + 1).padStart(3, "0")}`,
    date: toDateKey(day),
    zip: hcp.zip,
    state: hcp.state,
    pharmacyId: pick(hcp.pharmacies),
    product: pick(hcp.products),
    hcp: hcp.name,
    npi: hcp.npi,
    claims,
    rejected,
    pct: Math.round((rejected / claims) * 1000) / 10,
  };
});

const dateKeys = initialLeakage.map((record) => record.date).sort();

export const DATE_RANGE = { min: dateKeys[0], max: dateKeys[dateKeys.length - 1] };

export const STATE_OPTIONS = [...new Set(initialLeakage.map((record) => record.state))].sort().map(stateLabel);
