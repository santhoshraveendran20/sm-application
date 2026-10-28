import { CloudUpload, Flag, Gauge, Settings2, TriangleAlert } from "lucide-react";
import { minutesAgo } from "../../common/formatters.js";

export const initialNotifications = [
  {
    id: "n1",
    icon: CloudUpload,
    tone: "success",
    title: "Nightly claims file imported",
    text: "claims_daily.csv · 1,236 rows · 4 invalid",
    at: minutesAgo(190),
    unread: true,
  },
  {
    id: "n2",
    icon: Flag,
    tone: "warning",
    title: "18 HCPs crossed the leakage limit",
    text: "Mostly Apixaban and Empagliflozin in TX and FL",
    at: minutesAgo(260),
    unread: true,
  },
  {
    id: "n3",
    icon: Settings2,
    tone: "info",
    title: "Leakage limit changed",
    text: "25% → 20% by Arjun Mehta",
    at: minutesAgo(1490),
    unread: true,
  },
  {
    id: "n4",
    icon: TriangleAlert,
    tone: "danger",
    title: "Import failed: claims_weekly.csv",
    text: "Missing column prescriber_npi · retry also failed",
    at: minutesAgo(60 * 24 * 3 + 30),
    unread: true,
  },
  {
    id: "n5",
    icon: Gauge,
    tone: "orange",
    title: "Fatigue rising for 12 HCPs",
    text: "Average index up 9 points in 4 weeks",
    at: minutesAgo(60 * 24 * 4 + 200),
    unread: true,
  },
];
