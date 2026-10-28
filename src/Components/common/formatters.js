const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86400000;

const pad = (value) => String(value).padStart(2, "0");

export const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "U";

export const formatTime = (date) => {
  const hours = date.getHours();
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${pad(hours % 12 || 12)}:${pad(date.getMinutes())} ${suffix}`;
};

export const formatShortDate = (date) => `${pad(date.getDate())} ${MONTHS[date.getMonth()]}`;

export const formatLongDate = (date) => `${formatShortDate(date)} ${date.getFullYear()}`;

export const formatRefreshed = (date) => `${formatShortDate(date)}, ${formatTime(date)}`;

export const formatLastActive = (value, now = new Date()) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (now - date < 60000) return "Just now";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / DAY_MS);
  if (diffDays <= 0) return `Today, ${formatTime(date)}`;
  if (diffDays === 1) return `Yesterday, ${formatTime(date)}`;
  return formatLongDate(date);
};

export const pluralize = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export const minutesAgo =(minutes) => new Date(Date.now() - minutes * 60000).toISOString();

export const normalizeUser = (raw = {}, fallbackUsername = "") => {
  const composed = [raw.first_name || raw.firstName, raw.last_name || raw.lastName].filter(Boolean).join(" ");
  const email = raw.email || raw.work_email || "";
  const username = raw.username || raw.user_name || email.split("@")[0] || fallbackUsername;
  const name = raw.name || raw.full_name || raw.fullName || composed || username;

  return {
    id: raw.id || raw._id || username,
    name,
    firstName: name.split(" ")[0],
    email,
    username,
    role: raw.role?.name || raw.role_name || raw.role || "User",
  };
};
