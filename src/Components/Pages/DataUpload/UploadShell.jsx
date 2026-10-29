import { NavLink } from "react-router-dom";
import "./dataupload.css";

const TABS = [
  { to: "/upload/manual", label: "Manual upload" },
  { to: "/upload/automation", label: "Automation" },
  { to: "/upload/history", label: "Processing history" },
];

function UploadShell({ actions, children }) {
  return (
    <div className="data-upload">
      <div className="du-head">
        <div className="du-head-text">
          <h1 className="page-title">Data upload</h1>
          <p className="page-subtitle">Upload claims or engagement files, check them, and import the valid rows.</p>
        </div>
        {actions && <div className="du-head-actions">{actions}</div>}
      </div>

      <nav className="du-tabs" aria-label="Data upload sections">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `du-tab ${isActive ? "active" : ""}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="du-panel">{children}</div>
    </div>
  );
}

export default UploadShell;
