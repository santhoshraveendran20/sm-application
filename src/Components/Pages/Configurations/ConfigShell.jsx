import { NavLink } from "react-router-dom";
import "./configurations.css";

const TABS = [
  { to: "/config/thresholds", label: "Thresholds" },
  { to: "/config/rules", label: "Risk rules", phase: 2, disabled: "Coming in the next phase" },
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
        {TABS.map((tab) =>
          tab.disabled ? (
            <span
              key={tab.to}
              role="link"
              aria-disabled="true"
              tabIndex={0}
              title={tab.disabled}
              aria-label={`${tab.label}, unavailable. ${tab.disabled}`}
              className="cf-tab is-disabled"
            >
              {tab.label}
              {tab.phase && <span className="cf-tab-phase">Phase {tab.phase}</span>}
            </span>
          ) : (
            <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `cf-tab ${isActive ? "active" : ""}`}>
              {tab.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="cf-panel">{children}</div>
    </div>
  );
}

export default ConfigShell;
