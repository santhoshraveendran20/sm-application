import { useState } from "react";
import toast from "react-hot-toast";
import { Info, SlidersHorizontal } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import ConfigShell from "./ConfigShell.jsx";
import { LEAKAGE_LIMIT_MAX, LEAKAGE_LIMIT_MIN, setThresholds, useConfigStore } from "./configData.js";

function Thresholds() {
  const { thresholds } = useConfigStore();
  const [value, setValue] = useState(String(thresholds.leakageLimit));
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const dirty = value !== String(thresholds.leakageLimit);

  const validate = () => {
    if (!/^\d+$/.test(value)) return "Enter a whole number.";
    const number = Number(value);
    if (number < LEAKAGE_LIMIT_MIN || number > LEAKAGE_LIMIT_MAX) {
      return `Enter a value from ${LEAKAGE_LIMIT_MIN} to ${LEAKAGE_LIMIT_MAX}.`;
    }
    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = validate();
    setError(message);
    if (message) {
      toast.error("Check the highlighted field.");
      return;
    }
    setConfirming(true);
  };

  const handleConfirm = () => {
    setThresholds({ leakageLimit: Number(value) });
    setConfirming(false);
    toast.success("Threshold saved. Dashboard, Leakage and HCP Fatigue now use the new value.");
  };

  const handleDiscard = () => {
    setValue(String(thresholds.leakageLimit));
    setError("");
  };

  return (
    <ConfigShell>
      <section className="cf-card cf-narrow" aria-label="Thresholds">
        <h2 className="cf-card-title">
          <SlidersHorizontal size={18} aria-hidden="true" />
          Thresholds
        </h2>
        <p className="cf-card-text">
          Records at or above the leakage limit are flagged on the Dashboard, Leakage and HCP Fatigue, for every user.
        </p>

        <form className="cf-form" onSubmit={handleSubmit} noValidate>
          <div className="field cf-short">
            <label htmlFor="cf-leakage-limit" className="field-label">
              Leakage limit (%) <span className="req">*</span>
            </label>
            <input
              id="cf-leakage-limit"
              className={`input ${error ? "is-invalid" : ""}`}
              inputMode="numeric"
              maxLength={3}
              value={value}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setValue(event.target.value.replace(/\D/g, ""));
                if (error) setError("");
              }}
            />
            {error ? (
              <p className="field-error" role="alert">
                {error}
              </p>
            ) : (
              <p className="field-hint">
                Records at or above this are flagged. Allowed {LEAKAGE_LIMIT_MIN}–{LEAKAGE_LIMIT_MAX}.
              </p>
            )}
          </div>

          <div className="cf-actions">
            <button type="submit" className="btn btn-primary" disabled={!dirty}>
              Review and save
            </button>
            <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={handleDiscard}>
              Discard changes
            </button>
            {dirty && <span className="cf-unsaved">Unsaved change</span>}
          </div>
        </form>
      </section>

      {confirming && (
        <ConfirmModal
          title="Save threshold change?"
          message="This changes which records are flagged for every user."
          note="The change is recorded in the audit log with your name."
          icon={<Info size={20} />}
          confirmLabel="Save change"
          onConfirm={handleConfirm}
          onClose={() => setConfirming(false)}
        >
          <ul className="cf-change-list">
            <li>
              <b>Leakage limit:</b> {thresholds.leakageLimit}% → {value}%
            </li>
          </ul>
        </ConfirmModal>
      )}
    </ConfigShell>
  );
}

export default Thresholds;
