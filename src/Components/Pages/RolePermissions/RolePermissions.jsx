import { Fragment, useCallback, useId, useState } from "react";
import { useBeforeUnload, useBlocker, useLocation, useOutletContext, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, Check, Info, Search, ShieldCheck, X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import { pluralize } from "../../common/formatters.js";
import RoleBadge from "../RoleManagement/RoleBadge.jsx";
import {
  ACTIONS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_TOTAL,
  SUPER_ADMIN_ID,
  countRoleUsers,
  permissionKey,
  permissionLabel,
  sortPermissions,
} from "../RoleManagement/roleData.js";
import "./rolepermissions.css";

function RolePermissions() {
  const { roles, setRoles, users } = useOutletContext();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [draft, setDraft] = useState(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const titleId = useId();

  const role = roles.find((item) => item.id === searchParams.get("role")) || roles.find((item) => !item.archived) || roles[0];
  const locked = role.id === SUPER_ADMIN_ID || role.archived;
  const saved = role.permissions;
  const granted = !locked && draft?.roleId === role.id ? draft.keys : saved;
  const changes = ALL_PERMISSIONS.filter((key) => granted.includes(key) !== saved.includes(key)).map((key) => ({ key, added: granted.includes(key) }));
  const addedCount = changes.filter((change) => change.added).length;
  const removedCount = changes.length - addedCount;
  const dirty = changes.length > 0;
  const userCount = countRoleUsers(users, role);

  const term = query.trim().toLowerCase();
  const archivedCount = roles.filter((item) => item.archived).length;
  const listed = roles
    .filter((item) => showArchived || !item.archived || item.id === role.id)
    .filter((item) => !term || item.name.toLowerCase().includes(term))
    .sort((a, b) => Number(a.archived) - Number(b.archived));

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search)
  );
  const blockedTarget = blocker.state === "blocked" ? blocker.location : null;
  const nextRole =
    blockedTarget && blockedTarget.pathname === pathname ? roles.find((item) => item.id === new URLSearchParams(blockedTarget.search).get("role")) : null;

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!dirty) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [dirty]
    )
  );

  const selectRole = (id) => {
    if (id !== role.id) setSearchParams({ role: id });
  };

  const updateGranted = (keys) => setDraft({ roleId: role.id, keys: sortPermissions(keys) });

  const toggle = (key) => updateGranted(granted.includes(key) ? granted.filter((item) => item !== key) : [...granted, key]);

  const handleSave = () => {
    setRoles((prev) => prev.map((item) => (item.id === role.id ? { ...item, permissions: granted } : item)));
    setDraft(null);
    setConfirmSave(false);
    toast.success(`Permissions for ${role.name} were saved.`);
  };

  const handleDiscardAndContinue = () => {
    setDraft(null);
    blocker.proceed();
  };

  const changeSummary = [
    addedCount > 0 && `${pluralize(addedCount, "permission")} added`,
    removedCount > 0 && `${addedCount > 0 ? removedCount : pluralize(removedCount, "permission")} removed`,
  ]
    .filter(Boolean)
    .join(", ");

  const impact = userCount > 0 ? `Changes apply to ${pluralize(userCount, "user")}.` : "No users have this role yet.";

  const renderRow = (module, nested) => (
    <tr key={module.id} className={nested ? "is-nested" : ""}>
      <th scope="row" className="rp-module">
        {module.label}
      </th>
      {ACTIONS.map((action) => {
        if (!module.actions.includes(action.key)) {
          return (
            <td key={action.key} className="rp-cell">
              <span className="rp-na" aria-hidden="true">
                —
              </span>
              <span className="sr-only">Not available</span>
            </td>
          );
        }

        const key = permissionKey(module.id, action.key);
        const checked = granted.includes(key);
        const changed = checked !== saved.includes(key);
        const limited = checked && role.territoryScoped && module.territory?.includes(action.key);

        return (
          <td key={action.key} className={`rp-cell ${changed ? (checked ? "is-added" : "is-removed") : ""}`}>
            <span className="rp-check">
              <input
                type="checkbox"
                checked={checked}
                disabled={locked}
                onChange={() => toggle(key)}
                aria-label={`${module.label}: ${action.label}${limited ? ", limited to own territory" : ""}`}
              />
              {limited && (
                <span className="rp-limited" title="Limited to own territory" aria-hidden="true">
                  L
                </span>
              )}
            </span>
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="rp">
      <aside className="rp-roles" aria-label="Roles">
        <div className="input-wrap rp-search">
          <Search className="input-icon" size={16} aria-hidden="true" />
          <input
            type="search"
            className="input has-icon has-action"
            placeholder="Search roles"
            aria-label="Search roles"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" className="input-action" aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={15} />
            </button>
          )}
        </div>
        <SwitchField className="rp-archived" checked={showArchived} onChange={setShowArchived}>
          Show archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </SwitchField>
        {listed.length > 0 ? (
          <ul className="rp-role-list">
            {listed.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`rp-role ${item.id === role.id ? "is-active" : ""} ${item.archived ? "is-archived" : ""}`}
                  aria-current={item.id === role.id ? "true" : undefined}
                  onClick={() => selectRole(item.id)}
                >
                  <span className="rp-role-name">{item.name}</span>
                  <span className="rp-role-meta">
                    {item.archived ? "Archived" : pluralize(countRoleUsers(users, item), "user")} · {pluralize(item.permissions.length, "permission")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rp-empty">No roles match “{query.trim()}”.</p>
        )}
      </aside>

      <section className="rp-panel" aria-labelledby={titleId}>
        <header className="rp-head">
          <div className="rp-head-text">
            <div className="rp-title-row">
              <h2 id={titleId} className="rp-title">
                {role.name}
              </h2>
              <RoleBadge role={role} />
            </div>
            <p className="rp-subtitle">
              {granted.length} of {PERMISSION_TOTAL} permissions on · {pluralize(userCount, "user")}
            </p>
          </div>
          {!locked && (
            <div className="rp-head-actions">
              <button type="button" className="btn btn-secondary btn-sm" disabled={granted.length === PERMISSION_TOTAL} onClick={() => updateGranted(ALL_PERMISSIONS)}>
                Select all
              </button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={granted.length === 0} onClick={() => updateGranted([])}>
                Clear
              </button>
            </div>
          )}
        </header>

        {locked && (
          <p className="rp-locked">
            <Info size={16} aria-hidden="true" />
            <span>
              {role.archived
                ? "This role is archived. Restore it in Role management to change its permissions."
                : "Super Admin always has full access. These permissions can't be changed."}
            </span>
          </p>
        )}

        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">Module</th>
                {ACTIONS.map((action) => (
                  <th key={action.key} scope="col">
                    {action.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) =>
                group.children ? (
                  <Fragment key={group.id}>
                    <tr className="rp-group-row">
                      <th colSpan={ACTIONS.length + 1}>{group.label}</th>
                    </tr>
                    {group.children.map((module) => renderRow(module, true))}
                  </Fragment>
                ) : (
                  renderRow(group, false)
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="rp-legend">
          <span className="rp-legend-item">
            <span className="rp-legend-check" aria-hidden="true">
              <Check size={11} strokeWidth={3} />
            </span>
            Allowed
          </span>
          <span className="rp-legend-item">
            <span className="rp-legend-check" aria-hidden="true">
              <Check size={11} strokeWidth={3} />
            </span>
            <span className="rp-limited" aria-hidden="true">
              L
            </span>
            Limited to own territory
          </span>
          <span className="rp-legend-item">
            <span className="rp-na" aria-hidden="true">
              —
            </span>
            Not available for this module
          </span>
        </div>

        {dirty && (
          <div className="rp-unsaved" role="region" aria-label="Unsaved changes">
            <div>
              <strong>{pluralize(changes.length, "unsaved change")}</strong>
              <p>
                {changeSummary}. {impact}
              </p>
            </div>
            <div className="rp-unsaved-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDraft(null)}>
                Discard
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setConfirmSave(true)}>
                Save permissions
              </button>
            </div>
          </div>
        )}
      </section>

      {confirmSave && (
        <ConfirmModal
          icon={<ShieldCheck size={20} />}
          iconTone="info"
          title={`Save changes to ${role.name}?`}
          message={
            userCount > 0
              ? `These changes apply to ${pluralize(userCount, "user")} the next time they load a page.`
              : "No users have this role yet, so nobody is affected right away."
          }
          confirmLabel="Save permissions"
          onConfirm={handleSave}
          onClose={() => setConfirmSave(false)}
        >
          <ul className="rp-change-list">
            {changes.map((change) => (
              <li key={change.key}>
                <span className={`rp-change-tag ${change.added ? "is-added" : "is-removed"}`}>{change.added ? "Added" : "Removed"}</span>
                <span>{permissionLabel(change.key)}</span>
              </li>
            ))}
          </ul>
        </ConfirmModal>
      )}

      {blockedTarget && (
        <ConfirmModal
          icon={<AlertTriangle size={20} />}
          iconTone="warning"
          title="Discard unsaved changes?"
          message={`You have ${pluralize(changes.length, "unsaved change")} for ${role.name}. If you ${
            nextRole ? `switch to ${nextRole.name}` : "leave this page"
          } now, they'll be lost.`}
          cancelLabel="Keep editing"
          confirmLabel="Discard changes"
          tone="danger"
          onConfirm={handleDiscardAndContinue}
          onClose={() => blocker.reset()}
        />
      )}
    </div>
  );
}

export default RolePermissions;
