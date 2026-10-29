import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Play, Workflow } from "lucide-react";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import { formatLongDate } from "../../common/formatters.js";
import UploadShell from "./UploadShell.jsx";
import { STATUS_TONES, addJob, newJobId, setAutomation, updateJob, useUploadStore } from "./uploadData.js";

const SOURCE_PATTERN = /^(s3:\/\/|https:\/\/)[\w.\-/]+$/i;

const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function Automation() {
  const { jobs, automation } = useUploadStore();
  const [draft, setDraft] = useState(automation);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const automated = jobs.filter((item) => item.source.startsWith("Automated"));
  const lastRun = automated[0];
  const failedRuns = automated.filter((item) => item.status === "Failed").length;
  const dirty = draft.enabled !== automation.enabled || draft.source !== automation.source;

  const handleSave = (event) => {
    event.preventDefault();
    if (!SOURCE_PATTERN.test(draft.source.trim())) {
      setError("Enter an S3 path (s3://bucket/folder/) or a SharePoint URL (https://…).");
      return;
    }
    setError("");
    setAutomation({ enabled: draft.enabled, source: draft.source.trim() });
    toast.success(
      draft.enabled
        ? "Automation settings saved. New files in the source folder will be picked up automatically."
        : "Automation settings saved. Automation is off; use Run now or Manual upload to import files."
    );
  };

  const handleDiscard = () => {
    setDraft(automation);
    setError("");
  };

  const handleRun = () => {
    const id = newJobId("R");
    const now = new Date();
    setRunning(true);
    addJob({
      id,
      file: "claims_20261029_rerun.csv",
      type: "Claims",
      source: "Automated (S3)",
      started: `${toDateKey(now)}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      duration: "—",
      rows: 0,
      imported: 0,
      invalid: 0,
      duplicates: 0,
      status: "Running",
      by: "You",
    });
    toast(`${id} is checking ${automation.source}`);
    timerRef.current = setTimeout(() => {
      updateJob(id, { status: "Completed", rows: 1251, imported: 1251, duration: "2m 48s" });
      toast.success(`${id} imported 1,251 rows.`);
      setRunning(false);
    }, 3000);
  };

  return (
    <UploadShell>
      <section className="du-card du-wide" aria-label="File-drop automation">
        <div className="du-stage-head">
          <h2 className="du-card-title">
            <Workflow size={18} aria-hidden="true" />
            File-drop automation
          </h2>
          <span className={`du-badge tone-${automation.enabled ? "success" : "neutral"}`}>{automation.enabled ? "Active" : "Off"}</span>
        </div>
        <p className="du-card-text">New files in the source folder are picked up and processed automatically.</p>

        <div className="du-auto">
          <form className="du-form" onSubmit={handleSave} noValidate>
            <SwitchField checked={draft.enabled} onChange={(enabled) => setDraft({ ...draft, enabled })}>
              Pick up new files automatically
            </SwitchField>
            <p className="field-hint">When off, files are only processed when someone runs the job or uploads manually.</p>

            <div className="field">
              <label htmlFor="du-source" className="field-label">
                Source folder <span className="req">*</span>
              </label>
              <input
                id="du-source"
                className={`input ${error ? "is-invalid" : ""}`}
                value={draft.source}
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setDraft({ ...draft, source: event.target.value });
                  if (error) setError("");
                }}
              />
              {error ? (
                <p className="field-error" role="alert">
                  {error}
                </p>
              ) : (
                <p className="field-hint">AWS S3 path or SharePoint folder URL</p>
              )}
            </div>

            <div className="du-actions">
              <button type="submit" className="btn btn-primary" disabled={!dirty}>
                Save settings
              </button>
              <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={handleDiscard}>
                Discard changes
              </button>
              {dirty && <span className="du-unsaved">Unsaved changes</span>}
            </div>
          </form>

          <aside className="du-lastrun" aria-label="Last run">
            <h3 className="du-lastrun-title">Last run</h3>
            <dl className="du-dl">
              <div>
                <dt>Started</dt>
                <dd>{lastRun ? `${formatLongDate(new Date(lastRun.started))}, ${lastRun.started.slice(11)}` : "Never"}</dd>
              </div>
              <div>
                <dt>Result</dt>
                <dd>{lastRun ? <span className={`du-badge tone-${STATUS_TONES[lastRun.status]}`}>{lastRun.status}</span> : "—"}</dd>
              </div>
              <div>
                <dt>Rows imported</dt>
                <dd>{lastRun ? lastRun.imported.toLocaleString("en-US") : "—"}</dd>
              </div>
              <div>
                <dt>Failed runs</dt>
                <dd>{failedRuns}</dd>
              </div>
            </dl>
            <button type="button" className="btn btn-primary du-run" onClick={handleRun} disabled={running}>
              <Play size={15} aria-hidden="true" />
              {running ? "Running…" : "Run now"}
            </button>
            <Link to="/upload/history" className="du-link du-lastrun-link">
              View processing history
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>
    </UploadShell>
  );
}

export default Automation;
