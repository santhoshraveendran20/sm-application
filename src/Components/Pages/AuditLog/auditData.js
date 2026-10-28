export const MODULES = ["Dashboard", "Leakage", "HCP Fatigue", "Ask CDI", "Data upload", "Automation", "Configurations", "Admin settings"];

export const RESULTS = ["Success", "Failed"];

const SYSTEM = { name: "System", role: "System" };

const actor = (name, role) => ({ name, role });

const entry = (id, at, user, module, action, resource, result, details = "") => ({ id, at, user, module, action, resource, result, details });

export const initialAuditLog = [
  entry("a-13", "2026-10-22T02:14", SYSTEM, "Automation", "Job completed with warnings", "JOB-1022-01", "Success", "1,236 rows imported · 4 invalid · 8 duplicates"),
  entry("a-12", "2026-10-21T17:41", actor("Arjun Mehta", "Configuration Manager"), "Configurations", "Updated threshold", "Leakage limit", "Success", "25% → 20%"),
  entry("a-11", "2026-10-21T11:20", actor("Priya Raman", "Super Admin"), "Admin settings", "Invited user", "samuel.fisher@srmtech.com", "Success", "Role: Viewer / Business Analyst"),
  entry("a-10", "2026-10-20T16:29", actor("Meera Iyer", "Data Operations Manager"), "Data upload", "Manual upload imported", "JOB-1020-02", "Success", "7,171 rows · 42,829 duplicates skipped"),
  entry("a-09", "2026-10-19T08:05", actor("Kevin Ortiz", "Automation Operator"), "Automation", "Retried job", "JOB-1019-01", "Failed", "Missing column prescriber_npi"),
  entry("a-08", "2026-10-19T02:10", SYSTEM, "Automation", "Job failed", "JOB-1019-01", "Failed", "Missing column prescriber_npi"),
  entry("a-07", "2026-10-17T15:12", actor("Daniel Brooks", "Sales Manager"), "Leakage", "Exported records", "Leakage records", "Success", "1,104 rows · TX, FL"),
  entry("a-06", "2026-10-16T09:44", actor("Arjun Mehta", "Configuration Manager"), "Configurations", "Enabled rule", "High fatigue only", "Success"),
  entry("a-05", "2026-10-15T10:00", actor("Priya Raman", "Super Admin"), "Admin settings", "Changed role permissions", "Viewer / Business Analyst", "Success", "Granted leakage.export"),
  entry("a-04", "2026-10-14T11:06", actor("Meera Iyer", "Data Operations Manager"), "Data upload", "Manual upload imported", "JOB-1014-02", "Success", "312 rows"),
  entry("a-03", "2026-10-13T14:22", actor("Laura Chen", "Viewer / Business Analyst"), "Ask CDI", "Asked a question", "Q3 leakage by territory", "Success", "Answer cited 3 reports"),
  entry("a-02", "2026-10-12T09:30", actor("Thomas Becker", "Sales Manager"), "HCP Fatigue", "Exported records", "Fatigue scores", "Failed", "Missing permission fatigue.export"),
  entry("a-01", "2026-10-10T16:48", actor("Rachel Ward", "Sales Manager"), "Dashboard", "Saved view", "Q4 territory overview", "Success", "Filters: TX, OK"),
];
