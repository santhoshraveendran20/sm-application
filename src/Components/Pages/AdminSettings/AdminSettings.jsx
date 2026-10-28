import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Plus, UserPlus } from "lucide-react";
import { initialUsers } from "../UserManagement/mockData.js";
import { initialRoles } from "../RoleManagement/roleData.js";
import "./adminsettings.css";

const tabs = [
  { to: "/admin/users", label: "User management" },
  { to: "/admin/roles", label: "Role management" },
  { to: "/admin/permissions", label: "Role permissions" },
];

function AdminSettings() {
  const { pathname } = useLocation();
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const onUsersTab = pathname.startsWith("/admin/users");
  const onRolesTab = pathname.startsWith("/admin/roles");

  return (
    <div className="admin-settings">
      <div className="admin-head">
        <div className="admin-head-text">
          <h1 className="page-title">Admin settings</h1>
          <p className="page-subtitle">Users, roles and what each role can do.</p>
        </div>
        {onUsersTab && (
          <button type="button" className="btn btn-primary admin-add" onClick={() => setAddUserOpen(true)}>
            <UserPlus size={18} />
            Add user
          </button>
        )}
        {onRolesTab && (
          <button type="button" className="btn btn-primary admin-add" onClick={() => setCreateRoleOpen(true)}>
            <Plus size={18} />
            Create role
          </button>
        )}
      </div>

      <nav className="admin-tabs" aria-label="Admin settings sections">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `admin-tab ${isActive ? "active" : ""}`}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-panel">
        <Outlet context={{ users, setUsers, roles, setRoles, addUserOpen, setAddUserOpen, createRoleOpen, setCreateRoleOpen }} />
      </div>
    </div>
  );
}

export default AdminSettings;
