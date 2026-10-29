import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, Cloud, Database, FileCog, Mail, PlugZap } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import Modal from "../../common/Modal/Modal.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import { formatLongDate } from "../../common/formatters.js";
import ConfigShell from "./ConfigShell.jsx";
import { INTEGRATION_STATUS_TONES, updateIntegrations, useConfigStore } from "./configData.js";

const ICONS = { sf: Cloud, s3: Database, sfmc: Mail, sp: FileCog };
const ENDPOINT_PATTERN = /^(https:\/\/|s3:\/\/)\S+$/;

const formatSync = (value) => (value ? `${formatLongDate(new Date(value))}, ${value.slice(11)}` : "Never");

function Integrations() {
  const { integrations } = useConfigStore();
  const [showArchived, setShowArchived] = useState(false);
  const [managing, setManaging] = useState(null);
  const [form, setForm] = useState({ endpoint: "", clientId: "", secret: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState("");
  const [archiving, setArchiving] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const archivedCount = integrations.filter((item) => item.archived).length;
  const visible = integrations.filter((item) => showArchived || !item.archived);

  const openManage = (item) => {
    setManaging(item);
    setForm({ endpoint: item.endpoint, clientId: item.clientId, secret: "" });
    setErrors({});
    setBusy("");
  };

  const closeManage = () => {
    clearTimeout(timerRef.current);
    setManaging(null);
    setBusy("");
  };

  const setField = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const handleTest = () => {
    setBusy("test");
    timerRef.current = setTimeout(() => {
      setBusy("");
      if (managing.id === "sp" || !form.endpoint.trim()) {
        toast.error(
          managing.id === "sp"
            ? "SharePoint rejected the credentials (401). Check the client ID and secret."
            : "Enter the endpoint first."
        );
        return;
      }
      toast.success(`${managing.name} responded in 184 ms.`);
    }, 900);
  };

  const handleSave = (event) => {
    event.preventDefault();
    const next = {};
    if (!ENDPOINT_PATTERN.test(form.endpoint.trim())) next.endpoint = "Enter a valid https:// or s3:// address.";
    if (!form.clientId.trim()) next.clientId = "Enter the client ID.";
    if (managing.status !== "Connected" && !form.secret) next.secret = "Enter the client secret.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy("save");
    timerRef.current = setTimeout(() => {
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      updateIntegrations([managing.id], {
        endpoint: form.endpoint.trim(),
        clientId: form.clientId.trim(),
        status: "Connected",
        lastSync: stamp,
      });
      toast.success(`${managing.name} saved. Credentials are stored encrypted.`);
      closeManage();
    }, 700);
  };

  const handleArchive = (reason) => {
    updateIntegrations([archiving.id], { archived: { at: new Date().toISOString(), reason } });
    toast.success(`${archiving.name} archived. It stops syncing; restore it from Show archived.`);
    setArchiving(null);
  };

  const handleRestore = (item) => {
    updateIntegrations([item.id], { archived: null });
    toast.success(`${item.name} restored.`);
  };

  return (
    <ConfigShell>
      <div className="cf-toolbar">
        <SwitchField checked={showArchived} onChange={setShowArchived}>
          Show archived{archivedCount ? ` (${archivedCount})` : ""}
        </SwitchField>
      </div>

      <div className="cf-grid">
        {visible.map((item) => {
          const Icon = ICONS[item.id] || PlugZap;
          const connected = item.status === "Connected";
          return (
            <section key={item.id} className={`cf-card cf-integration ${item.archived ? "is-archived" : ""}`} aria-label={item.name}>
              <div className="cf-int-head">
                <span className="cf-int-icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <div className="cf-int-title">
                  <h2 className="cf-int-name">{item.name}</h2>
                  <p className="cf-card-text">{item.purpose}</p>
                </div>
                {item.archived ? (
                  <span className="cf-badge tone-neutral" title={item.archived.reason || "No reason given"}>
                    Archived
                  </span>
                ) : (
                  <span className={`cf-badge tone-${INTEGRATION_STATUS_TONES[item.status]}`}>{item.status}</span>
                )}
              </div>

              <dl className="cf-int-meta">
                <div>
                  <dt>Last sync</dt>
                  <dd>{formatSync(item.lastSync)}</dd>
                </div>
                <div>
                  <dt>Endpoint</dt>
                  <dd className="cf-mono" title={item.endpoint}>
                    {item.endpoint || "—"}
                  </dd>
                </div>
              </dl>

              <div className="cf-int-actions">
                {!item.archived && (
                  <>
                    <button type="button" className={`btn btn-sm ${connected ? "btn-secondary" : "btn-primary"}`} onClick={() => openManage(item)}>
                      {connected ? "Manage" : "Connect"}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArchiving(item)}>
                      <Archive size={15} aria-hidden="true" />
                      Archive
                    </button>
                  </>
                )}
                {item.archived && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRestore(item)}>
                    <ArchiveRestore size={15} aria-hidden="true" />
                    Restore
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {managing && (
        <Modal
          title={`${managing.status === "Connected" ? "Manage" : "Connect"} ${managing.name}`}
          subtitle="Credentials are encrypted and never shown again after saving."
          onClose={closeManage}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={handleTest} disabled={Boolean(busy)}>
                {busy === "test" ? "Testing…" : "Test connection"}
              </button>
              <button type="submit" form="cf-int-form" className="btn btn-primary" disabled={Boolean(busy)}>
                {busy === "save" ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <form id="cf-int-form" className="cf-form" onSubmit={handleSave} noValidate>
            <div className="field">
              <label htmlFor="cf-int-endpoint" className="field-label">
                Endpoint <span className="req">*</span>
              </label>
              <input
                id="cf-int-endpoint"
                className={`input ${errors.endpoint ? "is-invalid" : ""}`}
                placeholder="https://…"
                value={form.endpoint}
                aria-invalid={Boolean(errors.endpoint)}
                onChange={setField("endpoint")}
              />
              {errors.endpoint && (
                <p className="field-error" role="alert">
                  {errors.endpoint}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="cf-int-client" className="field-label">
                Client ID <span className="req">*</span>
              </label>
              <input
                id="cf-int-client"
                className={`input ${errors.clientId ? "is-invalid" : ""}`}
                value={form.clientId}
                aria-invalid={Boolean(errors.clientId)}
                onChange={setField("clientId")}
              />
              {errors.clientId && (
                <p className="field-error" role="alert">
                  {errors.clientId}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="cf-int-secret" className="field-label">
                Client secret {managing.status !== "Connected" && <span className="req">*</span>}
              </label>
              <input
                id="cf-int-secret"
                type="password"
                autoComplete="new-password"
                className={`input ${errors.secret ? "is-invalid" : ""}`}
                value={form.secret}
                aria-invalid={Boolean(errors.secret)}
                onChange={setField("secret")}
              />
              {errors.secret ? (
                <p className="field-error" role="alert">
                  {errors.secret}
                </p>
              ) : (
                managing.status === "Connected" && <p className="field-hint">Leave blank to keep the current secret</p>
              )}
            </div>
          </form>
        </Modal>
      )}

      {archiving && (
        <ConfirmModal
          title={`Archive ${archiving.name}?`}
          message="Data from this system stops syncing while it is archived. You can restore it at any time with Show archived."
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

export default Integrations;
