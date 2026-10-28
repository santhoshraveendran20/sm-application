import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, Archive, RotateCcw, Search, SearchX, ShieldCheck, UsersRound, X } from "lucide-react";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import { pluralize } from "../../common/formatters.js";
import RoleBadge from "./RoleBadge.jsx";
import RoleFormModal from "./RoleFormModal.jsx";
import { PERMISSION_TOTAL, SUPER_ADMIN_ID, countRoleUsers } from "./roleData.js";
import "./rolemanagement.css";

const createId = () => `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function RoleManagement() {
  const { roles, setRoles, users, setUsers, createRoleOpen, setCreateRoleOpen } = useOutletContext();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState(null);

  const term = query.trim().toLowerCase();
  const archivedCount = roles.filter((role) => role.archived).length;
  const visible = roles
    .filter((role) => showArchived || !role.archived)
    .filter((role) => !term || [role.name, role.description].some((value) => value.toLowerCase().includes(term)))
    .sort((a, b) => Number(a.archived) - Number(b.archived));
  const dialogUserCount = dialog ? countRoleUsers(users, dialog.role) : 0;

  const closeDialog = () => setDialog(null);

  const patchRole = (id, patch) => {
    setRoles((prev) => prev.map((role) => (role.id === id ? { ...role, ...patch } : role)));
  };

  const handleCreate = (values) => {
    setRoles((prev) => [
      ...prev,
      { id: createId(), ...values, type: "custom", permissions: [], territoryScoped: false, archived: false, archiveReason: "" },
    ]);
    setCreateRoleOpen(false);
    toast.success(`${values.name} was created. Set what it can do in Role permissions.`);
  };

  const handleUpdate = (role, values) => {
    patchRole(role.id, values);
    if (values.name !== role.name) {
      setUsers((prev) => prev.map((user) => (user.role === role.name ? { ...user, role: values.name } : user)));
    }
    closeDialog();
    toast.success(`Changes to ${values.name} were saved.`);
  };

  const handleArchive = (role, reason) => {
    patchRole(role.id, { archived: true, archiveReason: reason });
    closeDialog();
    toast.success(`${role.name} was archived.`);
  };

  const handleRestore = (role) => {
    patchRole(role.id, { archived: false, archiveReason: "" });
    toast.success(`${role.name} was restored.`);
  };

  const renderCard = (role) => {
    const userCount = countRoleUsers(users, role);

    return (
      <article key={role.id} className={`rm-card ${role.archived ? "is-archived" : ""}`}>
        <div className="rm-card-head">
          <h3 className="rm-card-title">{role.name}</h3>
          <RoleBadge role={role} />
        </div>
        <p className="rm-card-text">{role.description || "No description yet."}</p>
        <div className="rm-card-meta">
          <span>
            <UsersRound size={15} aria-hidden="true" />
            {pluralize(userCount, "user")}
          </span>
          <span>
            <ShieldCheck size={15} aria-hidden="true" />
            {role.permissions.length} of {PERMISSION_TOTAL} permissions
          </span>
        </div>
        <div className="rm-card-actions">
          {role.archived ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRestore(role)}>
              <RotateCcw size={15} />
              Restore
            </button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ type: "edit", role })}>
                Edit
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/permissions?role=${role.id}`)}>
                Permissions
              </button>
              {role.id !== SUPER_ADMIN_ID && (
                <button
                  type="button"
                  className="icon-btn ghost rm-card-archive"
                  aria-label={`Archive ${role.name}`}
                  title="Archive"
                  onClick={() => setDialog({ type: "archive", role })}
                >
                  <Archive size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <section className="rm" aria-label="Roles">
      <div className="rm-toolbar">
        <div className="input-wrap rm-search">
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
        <p className="rm-count" aria-live="polite">
          {pluralize(visible.length, "role")}
        </p>
        <SwitchField className="rm-archived" checked={showArchived} onChange={setShowArchived}>
          Show archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </SwitchField>
      </div>

      <div className="rm-scroll">
        {visible.length > 0 ? (
          <div className="rm-grid">{visible.map(renderCard)}</div>
        ) : (
          <div className="rm-empty">
            <span className="rm-empty-icon" aria-hidden="true">
              <SearchX size={22} />
            </span>
            <p className="rm-empty-title">No roles match “{query.trim()}”</p>
            <p className="rm-empty-text">Try a different name{showArchived ? "" : ", or turn on Show archived"}.</p>
          </div>
        )}
      </div>

      {createRoleOpen && <RoleFormModal roles={roles} onClose={() => setCreateRoleOpen(false)} onSubmit={handleCreate} />}

      {dialog?.type === "edit" && (
        <RoleFormModal
          role={dialog.role}
          roles={roles}
          userCount={dialogUserCount}
          onClose={closeDialog}
          onSubmit={(values) => handleUpdate(dialog.role, values)}
        />
      )}

      {dialog?.type === "archive" && dialogUserCount > 0 && (
        <ConfirmModal
          icon={<AlertTriangle size={20} />}
          iconTone="warning"
          title={`${dialog.role.name} is still in use`}
          message={`${pluralize(dialogUserCount, "user")} ${dialogUserCount === 1 ? "has" : "have"} this role. Move them to another role in User management, then archive it.`}
          cancelLabel="Close"
          confirmLabel="Open User management"
          onConfirm={() => navigate("/admin/users", { state: { role: dialog.role.name } })}
          onClose={closeDialog}
        />
      )}

      {dialog?.type === "archive" && dialogUserCount === 0 && (
        <ConfirmModal
          icon={<Archive size={20} />}
          iconTone="warning"
          title={`Archive ${dialog.role.name}?`}
          message="No users have this role. Archived roles can't be assigned and are hidden from lists. You can restore it at any time from Show archived."
          confirmLabel="Archive role"
          tone="danger"
          withReason
          reasonPlaceholder="e.g. Merged into Regional Sales Lead"
          onConfirm={(reason) => handleArchive(dialog.role, reason)}
          onClose={closeDialog}
        />
      )}
    </section>
  );
}

export default RoleManagement;
