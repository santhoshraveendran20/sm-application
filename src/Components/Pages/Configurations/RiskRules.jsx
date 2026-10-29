import { useState } from "react";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, Pencil, Plus, ShieldAlert } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import Modal from "../../common/Modal/Modal.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import ConfigShell from "./ConfigShell.jsx";
import { addRule, nextRuleId, updateRules, useConfigStore } from "./configData.js";

const EMPTY_FORM = { name: "", condition: "", action: "" };

function RiskRules() {
  const { rules } = useConfigStore();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [archiving, setArchiving] = useState(null);

  const archivedCount = rules.filter((rule) => rule.archived).length;
  const visible = rules.filter((rule) => showArchived || !rule.archived);

  const openForm = (rule) => {
    setEditing(rule || "new");
    setForm(rule ? { name: rule.name, condition: rule.condition, action: rule.action } : EMPTY_FORM);
    setErrors({});
  };

  const closeForm = () => setEditing(null);

  const handleSave = (event) => {
    event.preventDefault();
    const next = {};
    const name = form.name.trim();
    if (name.length < 3) next.name = "Enter a rule name (at least 3 characters).";
    else if (rules.some((rule) => rule.name.toLowerCase() === name.toLowerCase() && rule.id !== editing?.id)) {
      next.name = "A rule with this name already exists.";
    }
    if (form.condition.trim().length < 10) next.condition = "Describe when this rule applies (at least 10 characters).";
    if (form.action.trim().length < 5) next.action = "Describe what should happen (at least 5 characters).";
    setErrors(next);
    if (Object.keys(next).length) return;

    const values = { name, condition: form.condition.trim(), action: form.action.trim() };
    if (editing === "new") {
      addRule({ id: nextRuleId(), ...values, enabled: false, archived: null });
      toast.success("Rule created. It is off until you switch it on.");
    } else {
      updateRules([editing.id], values);
      toast.success("Rule updated.");
    }
    closeForm();
  };

  const handleToggle = (rule, enabled) => {
    updateRules([rule.id], { enabled });
    toast.success(`${rule.name} is now ${enabled ? "on" : "off"}.`);
  };

  const handleArchive = (reason) => {
    updateRules([archiving.id], {
      enabled: false,
      archived: { at: new Date().toISOString(), reason },
    });
    toast.success("Rule archived. It no longer applies; restore it from Show archived.");
    setArchiving(null);
  };

  const handleRestore = (rule) => {
    updateRules([rule.id], { archived: null });
    toast.success(`${rule.name} restored. It stays off until you switch it on.`);
  };

  const setField = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  return (
    <ConfigShell
      actions={
        <button type="button" className="btn btn-primary" onClick={() => openForm(null)}>
          <Plus size={16} aria-hidden="true" />
          Add rule
        </button>
      }
    >
      <section className="cf-card" aria-label="Risk rules">
        <div className="cf-row-head">
          <div>
            <h2 className="cf-card-title">
              <ShieldAlert size={18} aria-hidden="true" />
              Risk rules
            </h2>
            <p className="cf-card-text">Rules decide the next-best action shown on HCP Fatigue. Rules that are off are skipped.</p>
          </div>
          <SwitchField checked={showArchived} onChange={setShowArchived}>
            Show archived{archivedCount ? ` (${archivedCount})` : ""}
          </SwitchField>
        </div>

        {visible.length === 0 ? (
          <p className="cf-empty">No rules yet. Add one to start recommending actions.</p>
        ) : (
          <ul className="cf-rules">
            {visible.map((rule) => (
              <li key={rule.id} className={`cf-rule ${rule.archived ? "is-archived" : ""}`}>
                <div className="cf-rule-main">
                  <div className="cf-rule-top">
                    <h3 className="cf-rule-name">{rule.name}</h3>
                    {rule.archived ? (
                      <span className="cf-badge tone-neutral" title={rule.archived.reason || "No reason given"}>
                        Archived
                      </span>
                    ) : (
                      <span className={`cf-badge tone-${rule.enabled ? "success" : "neutral"}`}>{rule.enabled ? "On" : "Off"}</span>
                    )}
                  </div>
                  <dl className="cf-rule-detail">
                    <div>
                      <dt>When</dt>
                      <dd>{rule.condition}</dd>
                    </div>
                    <div>
                      <dt>Then</dt>
                      <dd>{rule.action}</dd>
                    </div>
                  </dl>
                </div>

                <div className="cf-rule-actions">
                  {!rule.archived && (
                    <>
                      <SwitchField checked={rule.enabled} onChange={(enabled) => handleToggle(rule, enabled)}>
                        <span className="sr-only">Turn {rule.name} on or off</span>
                      </SwitchField>
                      <button type="button" className="icon-btn ghost" aria-label={`Edit ${rule.name}`} title="Edit" onClick={() => openForm(rule)}>
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="icon-btn ghost" aria-label={`Archive ${rule.name}`} title="Archive" onClick={() => setArchiving(rule)}>
                        <Archive size={16} />
                      </button>
                    </>
                  )}
                  {rule.archived && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRestore(rule)}>
                      <ArchiveRestore size={15} aria-hidden="true" />
                      Restore
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <Modal
          title={editing === "new" ? "Add rule" : "Edit rule"}
          subtitle="Fields marked * are required."
          onClose={closeForm}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>
                Cancel
              </button>
              <button type="submit" form="cf-rule-form" className="btn btn-primary">
                {editing === "new" ? "Create rule" : "Save changes"}
              </button>
            </>
          }
        >
          <form id="cf-rule-form" className="cf-form" onSubmit={handleSave} noValidate>
            {[
              ["name", "Rule name", "e.g. Low engagement", false],
              ["condition", "When", "Describe the condition", true],
              ["action", "Then", "Describe the recommended action", true],
            ].map(([key, label, placeholder, multiline]) => (
              <div key={key} className="field">
                <label htmlFor={`cf-rule-${key}`} className="field-label">
                  {label} <span className="req">*</span>
                </label>
                {multiline ? (
                  <textarea
                    id={`cf-rule-${key}`}
                    className={`input ${errors[key] ? "is-invalid" : ""}`}
                    rows={3}
                    maxLength={200}
                    value={form[key]}
                    placeholder={placeholder}
                    aria-invalid={Boolean(errors[key])}
                    onChange={setField(key)}
                  />
                ) : (
                  <input
                    id={`cf-rule-${key}`}
                    className={`input ${errors[key] ? "is-invalid" : ""}`}
                    maxLength={60}
                    value={form[key]}
                    placeholder={placeholder}
                    aria-invalid={Boolean(errors[key])}
                    onChange={setField(key)}
                  />
                )}
                {errors[key] && (
                  <p className="field-error" role="alert">
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </form>
        </Modal>
      )}

      {archiving && (
        <ConfirmModal
          title={`Archive ${archiving.name}?`}
          message="Archived rules are hidden and no longer applied. You can restore them at any time with Show archived."
          icon={<Archive size={20} />}
          confirmLabel="Archive"
          withReason
          onConfirm={handleArchive}
          onClose={() => setArchiving(null)}
        />
      )}
    </ConfigShell>
  );
}

export default RiskRules;
