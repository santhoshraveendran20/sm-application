import { Cloud, ListChecks, RefreshCw, Send } from "lucide-react";
import "./salesforce.css";

const PLANNED = [
  {
    icon: Send,
    title: "HCP hand-off",
    text: "Send flagged HCPs from Leakage and HCP Fatigue to Salesforce as rep tasks.",
  },
  {
    icon: RefreshCw,
    title: "Sync status",
    text: "See what was sent, when, and whether Salesforce accepted it, with retry.",
  },
  {
    icon: ListChecks,
    title: "Task outcomes",
    text: "Track whether reps visited and what happened next.",
  },
];

function Salesforce() {
  return (
    <div className="salesforce-page">
      <div className="sf-head">
        <div className="sf-head-text">
          <h1 className="page-title">Salesforce</h1>
          <p className="page-subtitle">Connect leakage and fatigue insights to the field team in Salesforce CRM.</p>
        </div>
        <span className="sf-soon">Coming soon</span>
      </div>

      <section className="sf-card" aria-label="Salesforce module">
        <div className="sf-hero">
          <span className="sf-hero-icon" aria-hidden="true">
            <Cloud size={32} />
          </span>
          <h2 className="sf-hero-title">This module is being designed</h2>
          <p className="sf-hero-text">
            The Salesforce workspace will be added once the requirements are confirmed. Here&apos;s what&apos;s planned so far.
          </p>
        </div>

        <ul className="sf-planned">
          {PLANNED.map(({ icon: Icon, title, text }) => (
            <li key={title} className="sf-tile">
              <Icon size={20} aria-hidden="true" />
              <p className="sf-tile-title">{title}</p>
              <p className="sf-tile-text">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default Salesforce;
