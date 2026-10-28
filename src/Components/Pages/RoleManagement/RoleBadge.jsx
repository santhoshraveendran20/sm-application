import "./rolebadge.css";

function RoleBadge({ role }) {
  if (role.archived) return <span className="role-badge tone-archived">Archived</span>;
  return <span className={`role-badge tone-${role.type}`}>{role.type === "system" ? "System" : "Custom"}</span>;
}

export default RoleBadge;
