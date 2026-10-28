export const SUPER_ADMIN_ID = "r-super-admin";

export const ACTIONS = [
  { key: "read", label: "Read" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "archive", label: "Archive" },
  { key: "export", label: "Export" },
  { key: "run", label: "Run" },
];

export const PERMISSION_GROUPS = [
  { id: "dashboard", label: "Dashboard", actions: ["read", "export"] },
  { id: "leakage", label: "Leakage", actions: ["read", "edit", "export"], territory: ["read", "export"] },
  { id: "fatigue", label: "HCP Fatigue", actions: ["read", "edit", "export"], territory: ["read", "export"] },
  { id: "assistant", label: "Ask CDI", actions: ["read", "run"] },
  {
    id: "upload",
    label: "Data upload",
    children: [
      { id: "upload-manual", label: "Manual upload", actions: ["read", "create", "archive"] },
      { id: "upload-automation", label: "Automation", actions: ["read", "create", "edit", "archive", "run"] },
      { id: "upload-history", label: "Processing history", actions: ["read", "export"] },
    ],
  },
  {
    id: "config",
    label: "Configurations",
    children: [
      { id: "config-thresholds", label: "Thresholds", actions: ["read", "edit"] },
      { id: "config-rules", label: "Risk rules", actions: ["read", "create", "edit", "archive"] },
      { id: "config-notifications", label: "Notifications", actions: ["read", "edit"] },
      { id: "config-integrations", label: "Integrations", actions: ["read", "create", "edit"] },
    ],
  },
  { id: "audit", label: "Audit log", actions: ["read", "export"] },
  {
    id: "admin",
    label: "Admin settings",
    children: [
      { id: "admin-users", label: "User management", actions: ["read", "create", "edit", "archive"] },
      { id: "admin-roles", label: "Role management", actions: ["read", "create", "edit", "archive"] },
      { id: "admin-permissions", label: "Role permissions", actions: ["read", "edit"] },
    ],
  },
];

const MODULES = PERMISSION_GROUPS.flatMap((group) => group.children || [group]);

export const permissionKey = (moduleId, action) => `${moduleId}.${action}`;

export const ALL_PERMISSIONS = MODULES.flatMap((module) =>
  ACTIONS.filter((action) => module.actions.includes(action.key)).map((action) => permissionKey(module.id, action.key))
);

export const PERMISSION_TOTAL = ALL_PERMISSIONS.length;

const PERMISSION_LABELS = Object.fromEntries(
  MODULES.flatMap((module) =>
    ACTIONS.filter((action) => module.actions.includes(action.key)).map((action) => [permissionKey(module.id, action.key), `${module.label} · ${action.label}`])
  )
);

export const permissionLabel = (key) => PERMISSION_LABELS[key] || key;

export const sortPermissions = (keys) => ALL_PERMISSIONS.filter((key) => keys.includes(key));

export const countRoleUsers = (users, role) => users.filter((user) => !user.archived && user.role === role.name).length;

const role = (id, name, type, description, permissions, extra = {}) => ({
  id,
  name,
  type,
  description,
  permissions: sortPermissions(permissions),
  territoryScoped: false,
  archived: false,
  archiveReason: "",
  ...extra,
});

export const initialRoles = [
  role(SUPER_ADMIN_ID, "Super Admin", "system", "Full access to every module, user and setting.", ALL_PERMISSIONS),
  role("r-data-ops", "Data Operations Manager", "system", "Runs data uploads, automation and processing history.", [
    "dashboard.read",
    "dashboard.export",
    "leakage.read",
    "leakage.export",
    "fatigue.read",
    "fatigue.export",
    "assistant.read",
    "upload-manual.read",
    "upload-manual.create",
    "upload-manual.archive",
    "upload-automation.read",
    "upload-automation.create",
    "upload-automation.edit",
    "upload-automation.run",
    "upload-history.read",
    "upload-history.export",
    "audit.read",
    "audit.export",
  ]),
  role("r-config", "Configuration Manager", "system", "Maintains thresholds, risk rules, notifications and integrations.", [
    "dashboard.read",
    "config-thresholds.read",
    "config-thresholds.edit",
    "config-rules.read",
    "config-rules.create",
    "config-rules.edit",
    "config-rules.archive",
    "config-notifications.read",
    "config-notifications.edit",
    "config-integrations.read",
    "config-integrations.create",
    "config-integrations.edit",
    "audit.read",
    "audit.export",
  ]),
  role(
    "r-sales-manager",
    "Sales Manager",
    "system",
    "Reviews leakage and HCP fatigue for their territory.",
    ["dashboard.read", "dashboard.export", "leakage.read", "leakage.export", "fatigue.read", "fatigue.export", "assistant.read", "assistant.run", "audit.read"],
    { territoryScoped: true }
  ),
  role("r-viewer", "Viewer / Business Analyst", "system", "Read-only access to dashboards and reports.", [
    "dashboard.read",
    "dashboard.export",
    "leakage.read",
    "leakage.export",
    "fatigue.read",
    "fatigue.export",
    "assistant.read",
  ]),
  role("r-automation", "Automation Operator", "custom", "Runs and monitors scheduled imports.", [
    "dashboard.read",
    "upload-automation.read",
    "upload-automation.edit",
    "upload-automation.run",
    "upload-history.read",
    "upload-history.export",
  ]),
  role("r-regional-lead", "Regional Sales Lead", "custom", "Oversees sales managers across a region.", []),
  role("r-field-trainee", "Field Sales Trainee", "custom", "Temporary access for new field sales hires.", ["dashboard.read", "leakage.read", "fatigue.read", "assistant.read"], {
    archived: true,
    archiveReason: "Trainee programme paused",
  }),
];
