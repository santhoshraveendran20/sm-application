import { minutesAgo } from "../../common/formatters.js";

export const STATUSES = ["Active", "Invited", "Locked", "Deactivated"];

const DAY = 60 * 24;

const user = (id, firstName, lastName, role, status, lastActiveAt, extra = {}) => {
  const username = `${firstName}.${lastName}`.toLowerCase();
  return {
    id,
    firstName,
    lastName,
    username,
    email: `${username}@srmtech.com`,
    phone: "",
    jobTitle: "",
    role,
    status,
    lastActiveAt,
    archived: false,
    archiveReason: "",
    ...extra,
  };
};

export const initialUsers = [
  user("u-01", "Arjun", "Mehta", "Configuration Manager", "Active", minutesAgo(DAY + 120), { jobTitle: "Configuration Lead" }),
  user("u-02", "Daniel", "Brooks", "Sales Manager", "Active", minutesAgo(48), { phone: "+1 312 555 0182" }),
  user("u-03", "Grace", "Hughes", "Sales Manager", "Deactivated", minutesAgo(DAY * 56)),
  user("u-04", "Kevin", "Ortiz", "Automation Operator", "Active", minutesAgo(310)),
  user("u-05", "Laura", "Chen", "Viewer / Business Analyst", "Active", minutesAgo(DAY + 390), { jobTitle: "Business Analyst" }),
  user("u-06", "Meera", "Iyer", "Data Operations Manager", "Active", minutesAgo(130)),
  user("u-07", "Priya", "Raman", "Super Admin", "Active", minutesAgo(12), { jobTitle: "Platform Owner" }),
  user("u-08", "Rachel", "Ward", "Sales Manager", "Active", minutesAgo(DAY * 8)),
  user("u-09", "Samuel", "Fisher", "Viewer / Business Analyst", "Invited", null),
  user("u-10", "Thomas", "Becker", "Sales Manager", "Locked", minutesAgo(200)),
  user("u-11", "Nisha", "Kapoor", "Data Operations Manager", "Active", minutesAgo(DAY * 2 + 90)),
  user("u-12", "Oliver", "Grant", "Sales Manager", "Deactivated", minutesAgo(DAY * 70), {
    archived: true,
    archiveReason: "Left the company",
  }),
  user("u-13", "Hannah", "Cole", "Viewer / Business Analyst", "Deactivated", minutesAgo(DAY * 120), {
    archived: true,
    archiveReason: "Contract ended",
  }),
];
