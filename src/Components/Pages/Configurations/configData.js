import { useSyncExternalStore } from "react";

export const LEAKAGE_LIMIT_MIN = 5;
export const LEAKAGE_LIMIT_MAX = 50;

export const NOTIFICATION_EVENTS = [
  { key: "importFailed", label: "An import fails", description: "Nightly or manual imports that end with an error" },
  { key: "limitCrossed", label: "HCPs cross the leakage limit", description: "Daily summary of newly flagged HCPs" },
];

export const INTEGRATION_STATUS_TONES = {
  Connected: "success",
  "Not connected": "neutral",
};

const initialState = {
  thresholds: { leakageLimit: 20, minClaims: 10, fatigueLimit: 70, moderateFrom: 50 },
  rules: [
    {
      id: "r1",
      name: "Leakage above limit",
      condition: "HCP + product leakage % is at or above the limit, with at least the minimum claims",
      action: "Flag record and include in Salesforce hand-off",
      enabled: true,
      archived: null,
    },
    {
      id: "r2",
      name: "High fatigue and leakage",
      condition: "Leakage above limit and fatigue at or above the fatigue limit",
      action: "Recommend rep visit; pause email for 14 days",
      enabled: true,
      archived: null,
    },
    {
      id: "r3",
      name: "High fatigue only",
      condition: "Fatigue at or above the fatigue limit, leakage below limit",
      action: "Recommend pausing digital outreach for 14 days",
      enabled: true,
      archived: null,
    },
    {
      id: "r4",
      name: "Low engagement",
      condition: "Email open rate below 15% over 30 days",
      action: "Recommend webinar invite instead of email",
      enabled: false,
      archived: null,
    },
  ],
  notifications: { importFailed: true, limitCrossed: true, channelInApp: true },
  integrations: [
    {
      id: "sf",
      name: "Salesforce CRM",
      purpose: "HCP hand-off to field reps",
      status: "Connected",
      lastSync: "2026-10-29T09:40",
      endpoint: "https://srmtech.my.salesforce.com",
      clientId: "cdi-prod-7781",
      archived: null,
    },
    {
      id: "s3",
      name: "AWS S3",
      purpose: "Nightly claims files",
      status: "Connected",
      lastSync: "2026-10-29T02:10",
      endpoint: "s3://client-claims/inbound/",
      clientId: "cdi-prod-7781",
      archived: null,
    },
    {
      id: "sfmc",
      name: "Salesforce Marketing Cloud",
      purpose: "HCP engagement data",
      status: "Connected",
      lastSync: "2026-10-29T01:30",
      endpoint: "https://mc.exacttarget.com",
      clientId: "cdi-prod-7781",
      archived: null,
    },
    {
      id: "sp",
      name: "SharePoint",
      purpose: "Alternate file drop",
      status: "Not connected",
      lastSync: "",
      endpoint: "",
      clientId: "",
      archived: null,
    },
  ],
};

let state = initialState;
const listeners = new Set();

const emit = (next) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useConfigStore = () => useSyncExternalStore(subscribe, () => state);

export const setThresholds = (patch) => emit({ ...state, thresholds: { ...state.thresholds, ...patch } });

export const setNotifications = (patch) => emit({ ...state, notifications: { ...state.notifications, ...patch } });

const mapById = (list, ids, patch) => list.map((item) => (ids.includes(item.id) ? { ...item, ...patch } : item));

export const addRule = (rule) => emit({ ...state, rules: [...state.rules, rule] });

export const updateRules = (ids, patch) => emit({ ...state, rules: mapById(state.rules, ids, patch) });

export const updateIntegrations = (ids, patch) => emit({ ...state, integrations: mapById(state.integrations, ids, patch) });

export const nextRuleId = () => `r${Date.now().toString(36)}`;
