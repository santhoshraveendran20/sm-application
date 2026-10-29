import { DATE_RANGE, PRODUCTS, STATES, initialLeakage, toDateKey } from "../Leakage/leakageData.js";
import { initialFatigue } from "../HcpFatigue/fatigueData.js";
import { formatShortDate } from "../../common/formatters.js";

export const SOURCES = [
  { id: "auto", label: "Auto", short: "Auto", desc: "Let Ask CDI choose the right data" },
  { id: "commercial", label: "Leakage & fatigue data", short: "Commercial", desc: "Claims, leakage, HCP engagement and fatigue" },
  { id: "memcot", label: "Customer roster checks", short: "memCOT", desc: "Roster validation batches and mismatches" },
  { id: "salesforce", label: "Salesforce CRM", short: "Salesforce", desc: "HCP records and field hand-offs" },
];

export const sourceLabel = (id) => SOURCES.find((item) => item.id === id)?.label || id;

export const SUGGESTIONS = [
  "Which HCPs crossed the leakage limit in the last 30 days?",
  "Show the top 5 states by leakage",
  "Which HCPs have high fatigue, and what should we do?",
  "What is the overall leakage rate for the last 30 days?",
  "Why did the claims import on 19 Oct fail?",
  "Summarise this week’s memCOT roster checks",
];

export const DEFAULT_THRESHOLDS = { leakageLimit: 20, minClaims: 10, fatigueLimit: 70, moderateFrom: 50 };

const windowFrom = (() => {
  const day = new Date(`${DATE_RANGE.max}T00:00`);
  day.setDate(day.getDate() - 29);
  return toDateKey(day);
})();

const recent = initialLeakage.filter((record) => record.date >= windowFrom);

const CITATION = `Leakage records · ${formatShortDate(new Date(`${windowFrom}T00:00`))} – ${formatShortDate(new Date(`${DATE_RANGE.max}T00:00`))}`;

const num = (value) => Number(value).toLocaleString("en-US");

const pct = (value) => `${value.toFixed(1)}%`;

const totals = (records) => {
  const claims = records.reduce((sum, record) => sum + record.claims, 0);
  const rejected = records.reduce((sum, record) => sum + record.rejected, 0);
  return { claims, rejected, rate: claims ? (rejected / claims) * 100 : 0 };
};

const byHcp = (records) =>
  Object.values(
    records.reduce((acc, record) => {
      const hcp = acc[record.npi] || { name: record.hcp, npi: record.npi, state: record.state, claims: 0, rejected: 0 };
      hcp.claims += record.claims;
      hcp.rejected += record.rejected;
      acc[record.npi] = hcp;
      return acc;
    }, {})
  ).map((hcp) => ({ ...hcp, rate: hcp.claims ? (hcp.rejected / hcp.claims) * 100 : 0 }));

const highRisk = (records, thresholds) =>
  byHcp(records)
    .filter((hcp) => hcp.claims >= thresholds.minClaims && hcp.rate >= thresholds.leakageLimit)
    .sort((a, b) => b.rejected - a.rejected);

const findState = (text) => {
  const lower = text.toLowerCase();
  const byName = Object.entries(STATES).find(([, name]) => lower.includes(name.toLowerCase()));
  if (byName) return byName[0];
  return Object.keys(STATES).find((code) => new RegExp(`\\b${code}\\b`).test(text)) || null;
};

const UNKNOWN_STATES = ["alaska", "hawaii", "maine", "vermont", "wyoming", "montana"];

const answer = (source, text, extra = {}) => ({ source, text, citation: CITATION, ...extra });

const memcotAnswer = () =>
  answer(
    "memcot",
    "This week memCOT validated 3 roster batches (18,420 member records). 97.8% matched cleanly. 402 records need review, mostly HIN mismatches and expired DEA numbers.",
    {
      table: {
        columns: ["Batch", "Records", "Matched", "Needs review"],
        rows: [
          ["GPO-2026-W43-A", "7,950", "97.9%", "167"],
          ["GPO-2026-W43-B", "6,310", "98.1%", "120"],
          ["GPO-2026-W43-C", "4,160", "97.2%", "115"],
        ],
      },
      citation: "memCOT validation runs · week of 19 Oct 2026",
    }
  );

const salesforceAnswer = (thresholds) => {
  const flagged = highRisk(recent, thresholds).length;
  const done = Math.round(flagged * 0.71);
  return answer(
    "salesforce",
    `${flagged} high-risk HCPs were handed off to Salesforce in the last 30 days as rep follow-up tasks. 71% of those tasks are completed; the rest are open with their reps.`,
    {
      table: {
        columns: ["Status", "Tasks"],
        rows: [
          ["Completed", num(done)],
          ["Open", num(flagged - done)],
        ],
      },
      citation: "Salesforce CRM · HCP hand-off tasks",
      links: [{ label: "Open Leakage", to: "/leakage" }],
    }
  );
};

const importAnswer = (jobs, source) => {
  const failed = jobs.filter((job) => job.status === "Failed");
  if (!failed.length) return { source, noData: true, text: "There are no failed imports. Every recent file was processed." };
  const first = failed[0];
  const reason = first.error ? `${first.error.charAt(0).toLowerCase()}${first.error.slice(1)}` : "of an unknown error.";
  return answer(source, `${failed.length} import${failed.length > 1 ? "s" : ""} failed recently. ${first.file} failed because ${reason} Ask the data provider to resend the file with that column, then retry the job.`, {
    table: { columns: ["Job", "File", "Started", "Reason"], rows: failed.map((job) => [job.id, job.file, job.started.replace("T", " "), job.error || "—"]) },
    citation: "Processing history",
    links: [{ label: "Open Processing history", to: "/upload/history" }],
  });
};

const fatigueAnswer = (thresholds, source) => {
  const high = initialFatigue.filter((row) => row.fatigue >= thresholds.fatigueLimit).sort((a, b) => b.fatigue - a.fatigue);
  const moderate = initialFatigue.filter((row) => row.fatigue >= thresholds.moderateFrom && row.fatigue < thresholds.fatigueLimit).length;
  const low = initialFatigue.length - high.length - moderate;
  return answer(
    source,
    `${high.length} HCP-product rows have high fatigue (index ${thresholds.fatigueLimit} or more) and ${moderate} are moderate. For the most over-contacted, pause digital outreach for 14 days and switch to a rep visit or webinar invite.`,
    {
      chart: {
        label: "Rows by fatigue level",
        tones: ["neutral", "warning", "danger"],
        data: [
          { label: `Low (<${thresholds.moderateFrom})`, value: low },
          { label: "Moderate", value: moderate },
          { label: `High (${thresholds.fatigueLimit}+)`, value: high.length },
        ],
      },
      table: {
        columns: ["HCP", "Product", "Fatigue", "Next-best action"],
        rows: high.slice(0, 5).map((row) => [row.name, row.product, String(row.fatigue), row.nba]),
      },
      citation: "HCP engagement (SFMC) · last 30 days",
      links: [{ label: "Open HCP Fatigue", to: "/fatigue" }],
    }
  );
};

const stateAnswer = (source) => {
  const counts = recent.reduce((acc, record) => ({ ...acc, [record.state]: (acc[record.state] || 0) + 1 }), {});
  const total = recent.length || 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const [top, second, third] = ranked;
  return answer(
    source,
    `${STATES[top[0]]} has the most leakage records in the last 30 days (${num(top[1])}, ${((top[1] / total) * 100).toFixed(1)}% of the total), followed by ${STATES[second[0]]} and ${STATES[third[0]]}.`,
    {
      chart: { label: "Leakage records by state, top 5", tones: [], data: ranked.map(([code, value]) => ({ label: code, value })) },
      table: {
        columns: ["State", "Leakage records", "Share"],
        rows: ranked.map(([code, value]) => [`${code} · ${STATES[code]}`, num(value), `${((value / total) * 100).toFixed(1)}%`]),
      },
      links: [{ label: "Open Leakage", to: "/leakage" }],
    }
  );
};

const scopedAnswer = (state, product, thresholds, source) => {
  const scoped = recent.filter((record) => (!state || record.state === state) && (!product || record.product === product));
  const scope = [product, state && STATES[state]].filter(Boolean).join(" in ");
  const summary = totals(scoped);
  if (!summary.claims) return { source, noData: true, text: `I didn’t find claims for ${scope} in the last 30 days.` };
  const flagged = highRisk(scoped, thresholds).length;
  const top = byHcp(scoped).sort((a, b) => b.rejected - a.rejected).slice(0, 5);
  return answer(
    source,
    `For ${scope}, ${num(summary.rejected)} of ${num(summary.claims)} claims were rejected in the last 30 days — a leakage rate of ${pct(summary.rate)}. ${flagged} HCP${flagged === 1 ? " is" : "s are"} at or above the ${thresholds.leakageLimit}% limit.`,
    {
      table: { columns: ["HCP", "Rejected / Claims", "Leakage"], rows: top.map((hcp) => [hcp.name, `${num(hcp.rejected)} / ${num(hcp.claims)}`, pct(hcp.rate)]) },
      links: [{ label: "Open Leakage", to: "/leakage" }],
    }
  );
};

const hcpAnswer = (thresholds, source) => {
  const list = highRisk(recent, thresholds);
  if (!list.length) return { source, noData: true, text: `No HCP crossed the ${thresholds.leakageLimit}% limit in the last 30 days.` };
  return answer(source, `${list.length} HCPs crossed the ${thresholds.leakageLimit}% leakage limit in the last 30 days (with at least ${thresholds.minClaims} claims). These 5 have the most rejected claims:`, {
    table: {
      columns: ["HCP", "State", "Rejected / Claims", "Leakage"],
      rows: list.slice(0, 5).map((hcp) => [hcp.name, hcp.state, `${num(hcp.rejected)} / ${num(hcp.claims)}`, pct(hcp.rate)]),
    },
    links: [{ label: "Open all high-risk records in Leakage", to: "/leakage" }],
  });
};

const rateAnswer = (thresholds, source) => {
  const summary = totals(recent);
  return answer(
    source,
    `The leakage rate for the last 30 days is ${pct(summary.rate)} (${num(summary.rejected)} rejected of ${num(summary.claims)} claims). ${highRisk(recent, thresholds).length} HCPs are at or above the ${thresholds.leakageLimit}% limit.`,
    { links: [{ label: "Open Dashboard", to: "/dashboard" }] }
  );
};

export function askCdi(question, { thresholds = DEFAULT_THRESHOLDS, jobs = [], source = "auto" } = {}) {
  const lower = question.toLowerCase();

  if (source === "memcot" || (source === "auto" && /memcot|roster|\bhin\b|\bdea\b|\bgpo\b/.test(lower))) return memcotAnswer();
  if (source === "salesforce" || (source === "auto" && /salesforce|crm|hand-?off|sfdc|field rep/.test(lower))) return salesforceAnswer(thresholds);

  if (/import|upload|job|fail|pipeline|file/.test(lower)) return importAnswer(jobs, "commercial");
  if (/fatigue|over-?contact|next.?best|engagement|email open|saturat/.test(lower)) return fatigueAnswer(thresholds, "commercial");

  const missing = UNKNOWN_STATES.find((name) => lower.includes(name));
  if (missing) {
    return {
      source: "commercial",
      noData: true,
      text: `I didn’t find any leakage records for ${missing.charAt(0).toUpperCase()}${missing.slice(1)} in the last 30 days. The sample data covers ${Object.keys(STATES).length} states. Try Texas, Florida or Michigan.`,
    };
  }

  const state = findState(question);
  const product = PRODUCTS.find((name) => lower.includes(name.toLowerCase()));
  if (state || product) return scopedAnswer(state, product, thresholds, "commercial");
  if (/state|where|region|geograph|map/.test(lower)) return stateAnswer("commercial");
  if (/hcp|doctor|prescriber|crossed|above|over the limit|high.?risk/.test(lower)) return hcpAnswer(thresholds, "commercial");
  if (/rate|overall|summary|summar|how much|total|leak/.test(lower)) return rateAnswer(thresholds, "commercial");

  return {
    source: "commercial",
    noData: true,
    unknown: true,
    text: "I’m not sure how to answer that yet. I can help with leakage by HCP, product or state, HCP fatigue and next-best actions, data imports, memCOT roster checks and Salesforce hand-offs. Try one of the suggestions below.",
  };
}
