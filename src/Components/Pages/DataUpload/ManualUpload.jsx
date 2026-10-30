import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Download, FileText, FileWarning, Info, RotateCcw, TriangleAlert, UploadCloud, X } from "lucide-react";
import UploadShell from "./UploadShell.jsx";
import { downloadCsv } from "./csv.js";
import {
  IMPORT_STEPS,
  MAX_FILE_MB,
  REQUIRED_COLUMNS,
  SAMPLE_INVALID_ROWS,
  addJob,
  detectFileType,
  newJobId,
  updateJob,
} from "./uploadData.js";

const MB = 1048576;

const formatSize = (bytes) => `${(bytes / MB).toFixed(2)} MB`;

const formatCount = (value) => value.toLocaleString("en-US");

const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const nowStamp = () => {
  const now = new Date();
  return `${toDateKey(now)}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const validate = (file) => {
  const total = Math.max(120, Math.round(file.size / 140));
  const duplicates = Math.round(total * 0.006);
  const invalid = 4;
  return { total, duplicates, invalid, valid: total - duplicates - invalid, type: detectFileType(file.name) };
};

function ManualUpload() {
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState("select");
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const reset = () => {
    clearTimeout(timerRef.current);
    setFile(null);
    setPhase("select");
    setResult(null);
    setStep(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const pickFile = (picked) => {
    setError("");
    if (!picked) return;
    if (!/\.csv$/i.test(picked.name)) {
      setError(`"${picked.name}" isn't a CSV file. Export the data as .csv and try again.`);
      return;
    }
    if (picked.size === 0) {
      setError("This file is empty. Check the export and try again.");
      return;
    }
    if (picked.size > MAX_FILE_MB * MB) {
      setError(`This file is ${(picked.size / MB).toFixed(0)} MB. The limit is ${MAX_FILE_MB} MB; split it into smaller files.`);
      return;
    }
    setFile({ name: picked.name, size: picked.size, broken: /error|invalid|broken/i.test(picked.name) });
  };

  const handleValidate = () => {
    setPhase("validating");
    timerRef.current = setTimeout(() => {
      if (file.broken) {
        setPhase("invalid");
        toast.error('Validation failed. Required column "prescriber_npi" is missing.');
        return;
      }
      setResult(validate(file));
      setPhase("review");
    }, 900);
  };

  const handleImport = () => {
    const id = newJobId();
    addJob({
      id,
      file: file.name,
      type: result.type,
      source: "Manual upload",
      started: nowStamp(),
      duration: "—",
      rows: result.total,
      imported: 0,
      invalid: result.invalid,
      duplicates: result.duplicates,
      status: "Running",
      by: "You",
    });
    setPhase("importing");
    setStep(0);
    let current = 0;
    const tick = () => {
      current += 1;
      setStep(current);
      if (current < IMPORT_STEPS.length - 1) {
        timerRef.current = setTimeout(tick, 900);
        return;
      }
      updateJob(id, { status: result.invalid ? "Completed with warnings" : "Completed", imported: result.valid, duration: "0m 06s" });
      setPhase("done");
      toast.success(`${formatCount(result.valid)} rows from ${file.name} are now in the dashboards.`);
    };
    timerRef.current = setTimeout(tick, 900);
  };

  const downloadInvalid = () => {
    downloadCsv(`${file.name.replace(/\.csv$/i, "")}_invalid_rows.csv`, ["row", "column", "problem", "value"], SAMPLE_INVALID_ROWS);
    toast.success(`${result.invalid} invalid rows downloaded, with the problem for each.`);
  };

  const downloadRows = (kind, count) => {
    const columns = REQUIRED_COLUMNS[result.type];
    const rows = Array.from({ length: count }, (_, index) => columns.map((column) => (column === "prescriber_npi" ? String(1000000001 + index) : `${column}_${index + 1}`)));
    downloadCsv(`${file.name.replace(/\.csv$/i, "")}_${kind}_rows.csv`, columns, rows);
    toast.success(`${formatCount(count)} ${kind} rows downloaded.`);
  };

  const downloadTemplate = (type) => downloadCsv(`${type.toLowerCase()}_template.csv`, REQUIRED_COLUMNS[type]);

  const selecting = phase === "select" || phase === "validating";

  return (
    <UploadShell>
      <div className="du-split">
        <section className="du-card" aria-label="Manual upload">
          {selecting && (
            <>
              <h2 className="du-card-title">
                <UploadCloud size={18} aria-hidden="true" />
                Manual upload
              </h2>
              <p className="du-card-text">One CSV file at a time. Files are checked before anything is imported.</p>

              {file ? (
                <div className="du-file">
                  <FileText size={30} className="du-file-icon" aria-hidden="true" />
                  <div className="du-file-info">
                    <p className="du-file-name">{file.name}</p>
                    <p className="du-file-meta">
                      {formatSize(file.size)} · {detectFileType(file.name)} file (detected from its columns)
                    </p>
                  </div>
                  <button type="button" className="icon-btn ghost" aria-label="Remove file" onClick={reset} disabled={phase === "validating"}>
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className={`du-drop ${dragging ? "is-dragging" : ""} ${error ? "has-error" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    pickFile(event.dataTransfer.files[0]);
                  }}
                >
                  <span className="du-drop-icon" aria-hidden="true">
                    <UploadCloud size={24} />
                  </span>
                  <p className="du-drop-title">Drag and drop a CSV file here</p>
                  <p className="du-drop-hint">CSV only · up to {MAX_FILE_MB} MB</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current?.click()}>
                    Browse files
                  </button>
                  <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Choose a CSV file" onChange={(event) => pickFile(event.target.files[0])} />
                </div>
              )}

              {error && (
                <p className="du-error" role="alert">
                  <TriangleAlert size={16} aria-hidden="true" />
                  {error}
                </p>
              )}

              <div className="du-actions">
                <button type="button" className="btn btn-primary" onClick={handleValidate} disabled={!file || phase === "validating"}>
                  {phase === "validating" ? "Validating…" : "Validate file"}
                </button>
                {!file && <span className="du-muted">Choose a file to continue.</span>}
              </div>
            </>
          )}

          {phase === "invalid" && (
            <div className="du-stage">
              <h2 className="du-card-title">
                <FileWarning size={18} aria-hidden="true" />
                This file can't be imported
              </h2>
              <p className="du-card-text">{file.name}</p>
              <p className="du-callout tone-warning">
                <TriangleAlert size={16} aria-hidden="true" />
                <span>
                  <b>Required column "prescriber_npi" is missing.</b> No rows were imported. Ask the data provider to resend the file with all required columns, or fix the header row and upload again.
                </span>
              </p>
              <p className="du-muted">
                Required columns for {detectFileType(file.name).toLowerCase()} files: <code>{REQUIRED_COLUMNS[detectFileType(file.name)].join(", ")}</code>
              </p>
              <div className="du-actions">
                <button type="button" className="btn btn-primary" onClick={reset}>
                  <RotateCcw size={16} aria-hidden="true" />
                  Upload another file
                </button>
              </div>
            </div>
          )}

          {phase === "review" && result && (
            <div className="du-stage">
              <h2 className="du-card-title">
                <CheckCircle2 size={18} aria-hidden="true" />
                Validation results
              </h2>
              <p className="du-card-text">
                {file.name} · {result.type} file
              </p>
              <div className="du-stats">
                <div className="du-stat">
                  <p className="du-stat-value">{formatCount(result.total)}</p>
                  <p className="du-stat-label">Rows in file</p>
                </div>
                <div className="du-stat tone-success">
                  <p className="du-stat-value">{formatCount(result.valid)}</p>
                  <p className="du-stat-label">Valid</p>
                  {result.valid > 0 && (
                    <button type="button" className="icon-btn ghost du-stat-action" aria-label="Download valid rows as CSV" title="Download valid rows (CSV)" onClick={() => downloadRows("valid", result.valid)}>
                      <Download size={16} />
                    </button>
                  )}
                </div>
                <div className="du-stat tone-danger">
                  <p className="du-stat-value">{formatCount(result.invalid)}</p>
                  <p className="du-stat-label">Invalid (skipped)</p>
                  {result.invalid > 0 && (
                    <button type="button" className="icon-btn ghost du-stat-action" aria-label="Download invalid rows as CSV" title="Download invalid rows (CSV)" onClick={downloadInvalid}>
                      <Download size={16} />
                    </button>
                  )}
                </div>
                <div className="du-stat tone-warning">
                  <p className="du-stat-value">{formatCount(result.duplicates)}</p>
                  <p className="du-stat-label">Duplicates (skipped)</p>
                  {result.duplicates > 0 && (
                    <button type="button" className="icon-btn ghost du-stat-action" aria-label="Download duplicate rows as CSV" title="Download duplicate rows (CSV)" onClick={() => downloadRows("duplicate", result.duplicates)}>
                      <Download size={16} />
                    </button>
                  )}
                </div>
              </div>
              <p className="du-callout">
                <Info size={16} aria-hidden="true" />
                <span>
                  A row counts as a <b>duplicate</b> when the same claim date, NPI, product and pharmacy already exist. Duplicates aren't imported again. Download the invalid rows to see the problem on each one.
                </span>
              </p>
              <div className="du-actions">
                <button type="button" className="btn btn-primary" onClick={handleImport}>
                  Import {formatCount(result.valid)} valid rows
                </button>
                <button type="button" className="btn btn-ghost" onClick={reset}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {(phase === "importing" || phase === "done") && result && (
            <div className="du-stage">
              <div className="du-stage-head">
                <h2 className="du-card-title">{phase === "done" ? "Import complete" : "Importing in the background"}</h2>
                <span className={`du-badge tone-${phase === "done" ? "success" : "info"}`}>{phase === "done" ? "Completed" : "Running"}</span>
              </div>
              <p className="du-card-text">{file.name}</p>
              <ol className="du-steps" aria-label="Import progress">
                {IMPORT_STEPS.map((label, index) => {
                  const state = index < step || phase === "done" ? "done" : index === step ? "active" : "todo";
                  return (
                    <li key={label} className={`du-step is-${state}`}>
                      <span className="du-step-bar" aria-hidden="true" />
                      <span className="du-step-label">{label}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="du-card-text" aria-live="polite">
                {phase === "done"
                  ? `${formatCount(result.valid)} rows imported. Dashboards and tables now include this data.`
                  : "You can leave this page; the job keeps running and you'll get a notification when it finishes."}
              </p>
              {phase === "done" && (
                <div className="du-actions">
                  <button type="button" className="btn btn-primary" onClick={reset}>
                    <RotateCcw size={16} aria-hidden="true" />
                    Upload another file
                  </button>
                  <Link to="/upload/history" className="btn btn-secondary">
                    View processing history
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="du-card du-side" aria-label="File requirements">
          <h2 className="du-card-title">
            <Info size={18} aria-hidden="true" />
            File requirements
          </h2>
          <ul className="du-reqs">
            <li>
              <b>Format:</b> CSV, UTF-8, comma-separated, header row first.
            </li>
            <li>
              <b>Size:</b> up to {MAX_FILE_MB} MB per file.
            </li>
            <li>
              <b>File type:</b> detected automatically from the header row.
            </li>
            {Object.entries(REQUIRED_COLUMNS).map(([type, columns]) => (
              <li key={type}>
                <b>{type} file columns:</b>
                <code className="du-code">{columns.join(", ")}</code>
              </li>
            ))}
            <li>
              <b>ZIP codes:</b> 5 digits. <b>NPI:</b> 10 digits.
            </li>
          </ul>
          <div className="du-templates">
            {Object.keys(REQUIRED_COLUMNS).map((type) => (
              <button key={type} type="button" className="btn btn-secondary btn-sm" onClick={() => downloadTemplate(type)}>
                <Download size={15} aria-hidden="true" />
                {type} template
              </button>
            ))}
          </div>
        </aside>
      </div>
    </UploadShell>
  );
}

export default ManualUpload;
