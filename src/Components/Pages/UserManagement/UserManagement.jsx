import { useMemo, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  KeyRound,
  LockOpen,
  Pencil,
  Power,
  Search,
  SearchX,
  X,
} from "lucide-react";
import MultiSelectField from "../../common/MultiSelectField/MultiSelectField.jsx";
import IndeterminateCheckbox from "../../common/IndeterminateCheckbox/IndeterminateCheckbox.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import PaginationComponent from "../../Pagination/PaginationComponent.jsx";
import UserFormModal from "./UserFormModal.jsx";
import ResetPasswordModal from "./ResetPasswordModal.jsx";
import AppliedFilters from "./AppliedFilters.jsx";
import { STATUSES } from "./mockData.js";
import { formatLastActive, getInitials } from "../../common/formatters.js";
import "./usermanagement.css";

const COLUMNS = [
  { key: "name", label: "User" },
  { key: "username", label: "Username" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "lastActiveAt", label: "Last active" },
];

const STATUS_TONE = {
  Active: "success",
  Invited: "info",
  Locked: "danger",
  Deactivated: "neutral",
};

const DEFAULT_FILTERS = { search: "", role: [], status: [], archived: false };

const fullName = (user) => `${user.firstName} ${user.lastName}`.trim();

const sortValue = (user, key) => {
  if (key === "name") return fullName(user).toLowerCase();
  if (key === "lastActiveAt") return user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
  return String(user[key] || "").toLowerCase();
};

const createId = () => `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function StatusBadge({ user }) {
  if (user.archived) {
    return (
      <span className="um-badge tone-archived" title={user.archiveReason || undefined}>
        <Archive size={12} aria-hidden="true" />
        Archived
      </span>
    );
  }

  return (
    <span className={`um-badge tone-${STATUS_TONE[user.status]}`}>
      <span className="um-badge-dot" aria-hidden="true" />
      {user.status}
    </span>
  );
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown size={13} className="sort-icon" aria-hidden="true" />;
  return direction === "asc" ? (
    <ArrowUp size={13} className="sort-icon active" aria-hidden="true" />
  ) : (
    <ArrowDown size={13} className="sort-icon active" aria-hidden="true" />
  );
}

function ActionButton({ icon, label, title, tone = "default", onClick }) {
  const Icon = icon;
  return (
    <button type="button" className={`um-action tone-${tone}`} aria-label={label} title={title} onClick={onClick}>
      <Icon size={17} />
    </button>
  );
}

function UserManagement() {
  const { users, setUsers, roles, addUserOpen, setAddUserOpen } = useOutletContext();
  const currentUser = useSelector((state) => state.auth.user);
  const roleOptions = roles.filter((role) => !role.archived).map((role) => role.name);
  const { state: locationState } = useLocation();
  const [filters, setFilters] = useState(() => (locationState?.role ? { ...DEFAULT_FILTERS, role: [locationState.role] } : DEFAULT_FILTERS));
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState([]);
  const [dialog, setDialog] = useState(null);

  const isSelf = (user) => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase();
    const username = currentUser.username?.toLowerCase();
    return (Boolean(email) && user.email.toLowerCase() === email) || (Boolean(username) && user.username === username);
  };

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return users
      .filter((user) => filters.archived || !user.archived)
      .filter((user) => filters.role.length === 0 || filters.role.includes(user.role))
      .filter((user) => filters.status.length === 0 || filters.status.includes(user.status))
      .filter((user) => !term || [fullName(user), user.username, user.email, user.role].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => {
        const first = sortValue(a, sort.key);
        const second = sortValue(b, sort.key);
        const result = first < second ? -1 : first > second ? 1 : 0;
        return sort.direction === "asc" ? result : -result;
      });
  }, [users, filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rowIds = rows.map((user) => user.id);
  const selectedOnPage = rowIds.filter((id) => selected.includes(id));
  const allSelected = rowIds.length > 0 && selectedOnPage.length === rowIds.length;
  const someSelected = selectedOnPage.length > 0 && !allSelected;
  const selectedUsers = users.filter((user) => selected.includes(user.id));
  const archivable = selectedUsers.filter((user) => !user.archived && !isSelf(user));
  const restorable = selectedUsers.filter((user) => user.archived);
  const hasFilters = Boolean(filters.search) || filters.role.length > 0 || filters.status.length > 0 || filters.archived;

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
    setSelected([]);
  };

  const updateFilter = (name, value) => updateFilters({ [name]: value });

  const removeFilterValue = (name, value) => updateFilter(name, filters[name].filter((item) => item !== value));

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelected([]);
  };

  const handleSort = (key) => {
    setSort((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
    setPage(1);
  };

  const toggleAll = () => {
    setSelected((prev) => (allSelected ? prev.filter((id) => !rowIds.includes(id)) : [...new Set([...prev, ...rowIds])]));
  };

  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const patchUsers = (ids, patch) => {
    setUsers((prev) => prev.map((user) => (ids.includes(user.id) ? { ...user, ...patch } : user)));
  };

  const closeDialog = () => setDialog(null);

  const handleCreate = (values) => {
    const { requireReset, sendEmail, ...details } = values;
    const newUser = {
      id: createId(),
      ...details,
      status: "Invited",
      lastActiveAt: null,
      archived: false,
      archiveReason: "",
      requireReset,
    };
    setUsers((prev) => [newUser, ...prev]);
    setAddUserOpen(false);
    toast.success(
      sendEmail
        ? `${fullName(newUser)} was added. Sign-in details were emailed to ${newUser.email}.`
        : `${fullName(newUser)} was added with the username ${newUser.username}.`
    );
  };

  const handleUpdate = (user, values) => {
    const { firstName, lastName, email, phone, jobTitle, role } = values;
    patchUsers([user.id], { firstName, lastName, email, phone, jobTitle, role });
    closeDialog();
    toast.success(`Changes to ${firstName} ${lastName} were saved.`);
  };

  const handleReset = (user, result) => {
    if (result.method === "link") {
      toast.success(`Reset link sent to ${user.email}. It expires in 30 minutes.`);
    } else {
      if (user.status === "Locked") patchUsers([user.id], { status: "Active" });
      toast.success(
        result.requireReset
          ? `Temporary password set. ${user.firstName} must choose a new one at next sign-in.`
          : `New password set for ${fullName(user)}.`
      );
    }
    closeDialog();
  };

  const handleStatus = (user, status) => {
    patchUsers([user.id], { status });
    closeDialog();
    toast.success(status === "Deactivated" ? `${fullName(user)} was deactivated and signed out.` : `${fullName(user)} can sign in again.`);
  };

  const handleUnlock = (user) => {
    patchUsers([user.id], { status: "Active" });
    toast.success(`${fullName(user)} was unlocked.`);
  };

  const handleArchive = (targets, reason) => {
    const ids = targets.map((user) => user.id);
    patchUsers(ids, { archived: true, archiveReason: reason });
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    closeDialog();
    toast.success(targets.length === 1 ? `${fullName(targets[0])} was archived.` : `${targets.length} users were archived.`);
  };

  const handleRestore = (targets) => {
    const ids = targets.map((user) => user.id);
    patchUsers(ids, { archived: false, archiveReason: "" });
    setSelected((prev) => prev.filter((id) => !ids.includes(id)));
    toast.success(targets.length === 1 ? `${fullName(targets[0])} was restored.` : `${targets.length} users were restored.`);
  };

  const renderActions = (user) => {
    const name = fullName(user);

    if (user.archived) {
      return <ActionButton icon={ArchiveRestore} label={`Restore ${name}`} title="Restore" onClick={() => handleRestore([user])} />;
    }

    const self = isSelf(user);

    return (
      <>
        <ActionButton icon={Pencil} label={`Edit ${name}`} title="Edit" onClick={() => setDialog({ type: "edit", user })} />
        {user.status !== "Deactivated" && (
          <ActionButton icon={KeyRound} label={`Reset password for ${name}`} title="Reset password" onClick={() => setDialog({ type: "reset", user })} />
        )}
        {user.status === "Locked" && (
          <ActionButton icon={LockOpen} tone="warning" label={`Unlock ${name}`} title="Unlock" onClick={() => handleUnlock(user)} />
        )}
        {!self &&
          (user.status === "Deactivated" ? (
            <ActionButton icon={Power} tone="success" label={`Reactivate ${name}`} title="Reactivate" onClick={() => setDialog({ type: "activate", user })} />
          ) : (
            <ActionButton icon={Power} tone="danger" label={`Deactivate ${name}`} title="Deactivate" onClick={() => setDialog({ type: "deactivate", user })} />
          ))}
        {!self && <ActionButton icon={Archive} label={`Archive ${name}`} title="Archive" onClick={() => setDialog({ type: "archive", users: [user] })} />}
      </>
    );
  };

  return (
    <section className="um-card" aria-label="Users">
      <div className="um-filters">
        <div className="field um-search">
          <label htmlFor="um-search" className="field-label">
            Search
          </label>
          <div className="input-wrap">
            <Search className="input-icon" size={16} aria-hidden="true" />
            <input
              id="um-search"
              type="search"
              className="input has-icon has-action"
              placeholder="Search name, email, username or role"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
            />
            {filters.search && (
              <button type="button" className="input-action" aria-label="Clear search" onClick={() => updateFilter("search", "")}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
        <div className="field">
          <span className="field-label">Role</span>
          <MultiSelectField
            id="um-role"
            label="Role"
            options={roleOptions}
            value={filters.role}
            onChange={(value) => updateFilter("role", value)}
            allLabel="All roles"
            searchPlaceholder="Search roles"
          />
        </div>
        <div className="field">
          <span className="field-label">Status</span>
          <MultiSelectField
            id="um-status"
            label="Status"
            options={STATUSES}
            value={filters.status}
            onChange={(value) => updateFilter("status", value)}
            allLabel="All statuses"
            searchable={false}
          />
        </div>
        <SwitchField checked={filters.archived} onChange={(checked) => updateFilter("archived", checked)}>
          Show archived
        </SwitchField>
      </div>

      {(filters.role.length > 0 || filters.status.length > 0) && (
        <AppliedFilters
          groups={[
            { key: "role", label: "Role", values: filters.role },
            { key: "status", label: "Status", values: filters.status },
          ]}
          onRemove={removeFilterValue}
          onClear={() => updateFilters({ role: [], status: [] })}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "user" : "users"} found
      </p>

      {selected.length > 0 && (
        <div className="um-bulk" role="region" aria-label="Bulk actions">
          <div className="um-bulk-info">
            <strong>
              {selected.length} {selected.length === 1 ? "user" : "users"} selected
            </strong>
            <button type="button" className="um-bulk-clear" onClick={() => setSelected([])}>
              Clear selection
            </button>
          </div>
          <div className="um-bulk-actions">
            {restorable.length > 0 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRestore(restorable)}>
                <ArchiveRestore size={15} />
                {restorable.length === selected.length ? "Restore selected" : `Restore ${restorable.length} selected`}
              </button>
            )}
            {archivable.length > 0 && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ type: "archive", users: archivable })}>
                <Archive size={15} />
                {archivable.length === selected.length ? "Archive selected" : `Archive ${archivable.length} selected`}
              </button>
            )}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <label className="checkbox-row um-mobile-select">
          <IndeterminateCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
          <span>Select all on this page</span>
        </label>
      )}

      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th className="cell-check">
                <IndeterminateCheckbox
                  aria-label="Select all users on this page"
                  checked={allSelected}
                  indeterminate={someSelected}
                  disabled={rows.length === 0}
                  onChange={toggleAll}
                />
              </th>
              {COLUMNS.map((column) => {
                const active = sort.key === column.key;
                return (
                  <th key={column.key} aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}>
                    <button type="button" className={`sort-btn ${active ? "active" : ""}`} onClick={() => handleSort(column.key)}>
                      {column.label}
                      <SortIcon active={active} direction={sort.direction} />
                    </button>
                  </th>
                );
              })}
              <th className="cell-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="um-empty-row">
                <td colSpan={COLUMNS.length + 2}>
                  <div className="um-empty">
                    <span className="um-empty-icon" aria-hidden="true">
                      <SearchX size={22} />
                    </span>
                    <p className="um-empty-title">No users match these filters</p>
                    <p className="um-empty-text">Try a different search, or clear the filters to see everyone.</p>
                    {hasFilters && (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((user) => {
                const name = fullName(user);
                const isSelected = selected.includes(user.id);
                return (
                  <tr key={user.id} className={`${isSelected ? "is-selected" : ""} ${user.archived ? "is-archived" : ""}`}>
                    <td className="cell-check">
                      <input type="checkbox" aria-label={`Select ${name}`} checked={isSelected} onChange={() => toggleOne(user.id)} />
                    </td>
                    <td className="cell-user">
                      <div className="um-user">
                        <span className="um-avatar" aria-hidden="true">
                          {getInitials(name)}
                        </span>
                        <span className="um-user-text">
                          <span className="um-user-name">
                            {name}
                            {isSelf(user) && <span className="um-you">You</span>}
                          </span>
                          <span className="um-user-email">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="cell-username" data-label="Username">
                      <span className="um-mono">{user.username}</span>
                    </td>
                    <td className="cell-role" data-label="Role">
                      {user.role}
                    </td>
                    <td className="cell-status">
                      <StatusBadge user={user} />
                    </td>
                    <td className="cell-last" data-label="Last active">
                      {formatLastActive(user.lastActiveAt)}
                    </td>
                    <td className="cell-actions">
                      <div className="um-actions">{renderActions(user)}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationComponent
        page={currentPage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      {addUserOpen && <UserFormModal mode="add" users={users} roleOptions={roleOptions} onClose={() => setAddUserOpen(false)} onSubmit={handleCreate} />}

      {dialog?.type === "edit" && (
        <UserFormModal
          mode="edit"
          user={dialog.user}
          users={users}
          roleOptions={roleOptions}
          onClose={closeDialog}
          onSubmit={(values) => handleUpdate(dialog.user, values)}
        />
      )}

      {dialog?.type === "reset" && (
        <ResetPasswordModal user={dialog.user} onClose={closeDialog} onSubmit={(result) => handleReset(dialog.user, result)} />
      )}

      {dialog?.type === "deactivate" && (
        <ConfirmModal
          title={`Deactivate ${fullName(dialog.user)}?`}
          message="They will be signed out right away and can no longer sign in. Their history stays in the audit log."
          confirmLabel="Deactivate"
          tone="danger"
          onConfirm={() => handleStatus(dialog.user, "Deactivated")}
          onClose={closeDialog}
        />
      )}

      {dialog?.type === "activate" && (
        <ConfirmModal
          title={`Reactivate ${fullName(dialog.user)}?`}
          message={`${dialog.user.firstName} will be able to sign in again with their existing username and password.`}
          confirmLabel="Reactivate"
          tone="success"
          onConfirm={() => handleStatus(dialog.user, "Active")}
          onClose={closeDialog}
        />
      )}

      {dialog?.type === "archive" && (
        <ConfirmModal
          title={dialog.users.length === 1 ? `Archive ${fullName(dialog.users[0])}?` : `Archive ${dialog.users.length} users?`}
          message="Archived users are hidden from lists but kept with their history. You can restore them at any time with Show archived."
          note="Use Archive when someone has left. To pause access temporarily, use Deactivate instead."
          confirmLabel="Archive"
          withReason
          onConfirm={(reason) => handleArchive(dialog.users, reason)}
          onClose={closeDialog}
        />
      )}
    </section>
  );
}

export default UserManagement;
