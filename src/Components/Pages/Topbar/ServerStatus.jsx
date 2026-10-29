import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { dismissProps } from "../../common/dismissProps.js";
import { formatTime } from "../../common/formatters.js";
import useServerHealth from "./useServerHealth.js";

const STATES = {
  checking: { label: "Checking server…", text: "Checking the connection to the server." },
  available: { label: "Server available", text: "The server is responding. Data and changes are up to date." },
  reconnecting: { label: "Reconnecting…", text: "The last check failed. Trying again in a few seconds." },
  unavailable: {
    label: "Server unavailable",
    text: "We can’t reach the server. Your changes won’t be saved until it’s back. We’ll keep trying every 15 seconds.",
  },
};

const time = (date) => (date ? formatTime(date) : "—");

function ServerStatus() {
  const { status, lastChecked, lastOk, check } = useServerHealth();
  const [open, setOpen] = useState(false);
  const current = STATES[status];

  return (
    <div className="server-status" {...(open ? dismissProps(setOpen) : {})}>
      <button
        type="button"
        className={`server-pill tone-${status}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`Last checked ${time(lastChecked)}`}
        onClick={() => setOpen(!open)}
      >
        <i aria-hidden="true" />
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="server-panel" role="dialog" aria-label="Server status">
          <p className={`server-panel-title tone-${status}`}>
            <i aria-hidden="true" />
            {current.label}
          </p>
          <p className="server-panel-text">{current.text}</p>
          <dl className="server-panel-meta">
            <div>
              <dt>Last checked</dt>
              <dd>{time(lastChecked)}</dd>
            </div>
            <div>
              <dt>Last available</dt>
              <dd>{time(lastOk)}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn-secondary btn-sm" onClick={check}>
            <RefreshCw size={14} aria-hidden="true" />
            Check now
          </button>
        </div>
      )}
    </div>
  );
}

export default ServerStatus;
