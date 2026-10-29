import { NavLink } from "react-router-dom";
import "./configurations.css";

const TABS = [
  { to: "/config/thresholds", label: "Thresholds" },
  { to: "/config/rules", label: "Risk rules" },
  { to: "/config/notifications", label: "Notifications" },
  { to: "/config/integrations", label: "Integrations" },
];

function ConfigShell({ actions, children }) {
  return (
    <div className="config-page">
      <div className="cf-head">
        <div className="cf-head-text">
          <h1 className="page-title">Configurations</h1>
          <p className="page-subtitle">Business thresholds, risk rules, notifications and integrations.</p>
        </div>
        {actions && <div className="cf-head-actions">{actions}</div>}
      </div>

      <nav className="cf-tabs" aria-label="Configuration sections">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `cf-tab ${isActive ? "active" : ""}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="cf-panel">{children}</div>
    </div>
  );
}

export default ConfigShell;
