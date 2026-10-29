import { useSyncExternalStore } from "react";

export const MAX_FILE_MB = 50;

export const FILE_TYPES = ["Claims", "Engagement"];

export const REQUIRED_COLUMNS = {
  Claims: ["claim_date", "prescriber_npi", "product", "pharmacy_ncpdp", "state", "zip", "claims", "rejected"],
  Engagement: ["prescriber_npi", "product", "channel", "sent", "opened", "clicked", "campaign", "event_date"],
};

export const STATUSES = ["Completed", "Completed with warnings", "Failed", "Running"];

export const SOURCES = ["Automated", "Manual"];

export const STATUS_TONES = {
  Completed: "success",
  "Completed with warnings": "warning",
  Failed: "danger",
  Running: "info",
};

export const IMPORT_STEPS = ["Queued", "Validating", "Calculating leakage", "Calculating fatigue", "Completed"];

export const SAMPLE_INVALID_ROWS = [
  ["112", "prescriber_npi", "NPI must be 10 digits", "10000037"],
  ["418", "claim_date", "Date is in the future", "2026-11-02"],
  ["733", "zip", "US ZIP must be 5 digits", "752010"],
  ["1019", "rejected", "Rejected is greater than claims", "14 > 9"],
];

export const detectFileType = (name = "") => (/engag|sfmc/i.test(name) ? "Engagement" : "Claims");

const job = (id, file, type, source, started, duration, rows, imported, invalid, duplicates, status, by, error) => ({
  id,
  file,
  type,
  source,
  started,
  duration,
  rows,
  imported,
  invalid,
  duplicates,
  status,
  by,
  error,
});

const seedJobs = [
  job("JOB-1022-01", "claims_20261022.csv", "Claims", "Automated (S3)", "2026-10-22T02:10", "3m 42s", 1248, 1236, 4, 8, "Completed with warnings", "System"),
  job("JOB-1022-00", "sfmc_engagement_20261021.csv", "Engagement", "Automated (SFMC)", "2026-10-22T01:30", "2m 05s", 3402, 3402, 0, 0, "Completed", "System"),
  job("JOB-1021-01", "claims_20261021.csv", "Claims", "Automated (S3)", "2026-10-21T02:10", "3m 18s", 1190, 1188, 2, 0, "Completed with warnings", "System"),
  job("JOB-1020-02", "pharmacy_cases_50k.csv", "Claims", "Manual upload", "2026-10-20T16:22", "6m 51s", 50000, 7171, 0, 42829, "Completed with warnings", "Meera Iyer"),
  job("JOB-1020-01", "claims_20261020.csv", "Claims", "Automated (S3)", "2026-10-20T02:10", "3m 02s", 1162, 1162, 0, 0, "Completed", "System"),
  job("JOB-1019-01", "claims_20261019.csv", "Claims", "Automated (S3)", "2026-10-19T02:10", "0m 21s", 0, 0, 0, 0, "Failed", "System", 'Missing required column "prescriber_npi". No rows were imported.'),
  job("JOB-1018-01", "claims_20261018.csv", "Claims", "Automated (S3)", "2026-10-18T02:10", "3m 11s", 1104, 1101, 3, 0, "Completed with warnings", "System"),
  job("JOB-1017-01", "claims_20261017.csv", "Claims", "Automated (S3)", "2026-10-17T02:10", "2m 58s", 1087, 1087, 0, 0, "Completed", "System"),
  job("JOB-1016-01", "claims_20261016.csv", "Claims", "Automated (S3)", "2026-10-16T02:10", "3m 05s", 1120, 1120, 0, 0, "Completed", "System"),
  job("JOB-1015-01", "claims_20261015.csv", "Claims", "Automated (S3)", "2026-10-15T02:10", "3m 22s", 1131, 1129, 2, 0, "Completed with warnings", "System"),
  job("JOB-1014-02", "territory_fix_oct.csv", "Claims", "Manual upload", "2026-10-14T11:05", "0m 48s", 312, 312, 0, 0, "Completed", "Meera Iyer"),
];

let state = {
  jobs: seedJobs,
  automation: { enabled: true, source: "s3://client-claims/inbound/" },
};

const listeners = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const useUploadStore = () => useSyncExternalStore(subscribe, () => state);

export const addJob = (next) => emit({ jobs: [next, ...state.jobs] });

export const updateJob = (id, patch) => emit({ jobs: state.jobs.map((item) => (item.id === id ? { ...item, ...patch } : item)) });

export const setAutomation = (patch) => emit({ automation: { ...state.automation, ...patch } });

export const newJobId = (suffix = "") => `JOB-1029-${suffix}${String(Math.floor(Math.random() * 90) + 10)}`;
