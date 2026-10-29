import { useState } from "react";
import toast from "react-hot-toast";
import { BellRing } from "lucide-react";
import { NOTIFICATION_EVENTS, setNotifications, useConfigStore } from "./configData.js";
import ConfigShell from "./ConfigShell.jsx";

function Notifications() {
  const { notifications } = useConfigStore();
  const [draft, setDraft] = useState(notifications);
  const [error, setError] = useState("");

  const dirty = JSON.stringify(draft) !== JSON.stringify(notifications);

  const update = (patch) => {
    setDraft({ ...draft, ...patch });
    setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!draft.channelInApp && NOTIFICATION_EVENTS.some((item) => draft[item.key])) {
      setError("Turn on in-app notifications, or no one will be told about the events above.");
      return;
    }
    setNotifications(draft);
    toast.success("Notification settings saved.");
  };

  const handleDiscard = () => {
    setDraft(notifications);
    setError("");
  };

  return (
    <ConfigShell>
      <section className="cf-card cf-medium" aria-label="Notifications">
        <h2 className="cf-card-title">
          <BellRing size={18} aria-hidden="true" />
          Notifications
        </h2>
        <p className="cf-card-text">Which events show in the bell icon for people who can see them.</p>

        <form className="cf-form" onSubmit={handleSave} noValidate>
          <fieldset className="cf-fieldset">
            <legend className="field-label">Notify when</legend>
            {NOTIFICATION_EVENTS.map((item) => (
              <label key={item.key} className="cf-check">
                <input type="checkbox" checked={draft[item.key]} onChange={(event) => update({ [item.key]: event.target.checked })} />
                <span>
                  <span className="cf-check-label">{item.label}</span>
                  <span className="cf-check-desc">{item.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <fieldset className="cf-fieldset">
            <legend className="field-label">Channels</legend>
            <label className="cf-check">
              <input type="checkbox" checked={draft.channelInApp} onChange={(event) => update({ channelInApp: event.target.checked })} />
              <span>
                <span className="cf-check-label">In-app (bell icon)</span>
                <span className="cf-check-desc">Shown to every user whose role can see the related page</span>
              </span>
            </label>
          </fieldset>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}

          <div className="cf-actions">
            <button type="submit" className="btn btn-primary" disabled={!dirty}>
              Save settings
            </button>
            <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={handleDiscard}>
              Discard changes
            </button>
            {dirty && <span className="cf-unsaved">Unsaved changes</span>}
          </div>
        </form>
      </section>
    </ConfigShell>
  );
}

export default Notifications;
