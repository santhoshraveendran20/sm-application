import {
  Cloud,
  CloudUpload,
  Droplets,
  Gauge,
  LayoutDashboard,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export const SidebarData = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, link: "/dashboard" },
  { id: "leakage", label: "Leakage", icon: Droplets, link: "/leakage" },
  { id: "fatigue", label: "HCP Fatigue", icon: Gauge, link: "/fatigue" },
  {
    id: "upload",
    label: "Data upload",
    icon: CloudUpload,
    base: "/upload",
    children: [
      { id: "upload-manual", label: "Manual upload", link: "/upload/manual" },
      { id: "upload-automation", label: "Automation", link: "/upload/automation" },
      { id: "upload-history", label: "Processing history", link: "/upload/history" },
    ],
  },
  {
    id: "config",
    label: "Configurations",
    icon: SlidersHorizontal,
    base: "/config",
    children: [
      { id: "config-thresholds", label: "Thresholds", link: "/config/thresholds" },
      { id: "config-rules", label: "Risk rules", link: "/config/rules" },
      { id: "config-notifications", label: "Notifications", link: "/config/notifications" },
      { id: "config-integrations", label: "Integrations", link: "/config/integrations" },
    ],
  },
  { id: "salesforce", label: "Salesforce", icon: Cloud, link: "/salesforce", badge: "Soon" },
  { id: "assistant", label: "Ask CDI", icon: MessageSquareText, link: "/assistant" },
  { id: "audit", label: "Audit log", icon: ScrollText, link: "/audit" },
  {
    id: "admin",
    label: "Admin settings",
    icon: ShieldCheck,
    base: "/admin",
    children: [
      { id: "admin-users", label: "User management", link: "/admin/users" },
      { id: "admin-roles", label: "Role management", link: "/admin/roles" },
      { id: "admin-permissions", label: "Role permissions", link: "/admin/permissions" },
    ],
  },
];

export const flatNavItems = SidebarData.flatMap((item) =>
  item.children
    ? item.children.map((child) => ({ ...child, icon: item.icon, parent: item.label }))
    : [item]
);
