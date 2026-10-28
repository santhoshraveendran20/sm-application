import { useCallback, useEffect, useRef, useState } from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useMsal } from "@azure/msal-react";
import { Bell, ChevronDown, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from "lucide-react";
import { logout } from "../../redux/features/auth.jsx";
import { useTheme } from "../../../Themecontext.jsx";
import { dismissProps } from "../../common/dismissProps.js";
import { formatRefreshed, getInitials } from "../../common/formatters.js";
import NotificationPanel from "../Notifications/NotificationPanel.jsx";
import { initialNotifications } from "../Notifications/notificationData.js";
import "./topbar.css";

function Topbar({ collapsed, onToggleCollapse, onOpenMenu }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const matches = useMatches();
  const { instance } = useMsal();
  const { theme, toggleTheme } = useTheme();
  const { user, method } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [refreshedAt] = useState(() => formatRefreshed(new Date()));
  const profileBtnRef = useRef(null);
  const menuRef = useRef(null);
  const bellRef = useRef(null);

  const crumbs = [...matches].reverse().find((match) => match.handle?.crumbs)?.handle.crumbs || [];
  const unread = notifications.filter((item) => item.unread).length;
  const name = user?.name || "User";
  const role = user?.role || "User";

  useEffect(() => {
    if (menuOpen) menuRef.current?.focus();
  }, [menuOpen]);

  const dismissMenu = (viaKey) => {
    setMenuOpen(false);
    if (viaKey) profileBtnRef.current?.focus();
  };

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    bellRef.current?.focus();
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logout());

    if (method === "sso") {
      instance.clearCache({ account: instance.getActiveAccount() || undefined }).catch(() => undefined);
    }

    navigate("/", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="icon-btn topbar-menu" aria-label="Open menu" aria-controls="main-nav" onClick={onOpenMenu}>
          <Menu size={20} />
        </button>
        <button
          type="button"
          className="icon-btn topbar-collapse"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-controls="main-nav"
          aria-expanded={!collapsed}
          onClick={onToggleCollapse}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <nav aria-label="Breadcrumb" className="breadcrumb">
          <ol>
            {crumbs.map((crumb, index) => {
              const current = index === crumbs.length - 1;
              return (
                <li key={crumb} className={current ? "current" : ""} aria-current={current ? "page" : undefined}>
                  {crumb}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="topbar-right">
        <span className="refresh-pill">
          <span className="refresh-dot" aria-hidden="true" />
          Data refreshed {refreshedAt}
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button
          type="button"
          ref={bellRef}
          className="icon-btn"
          aria-label={`Notifications, ${unread} unread`}
          title="Notifications"
          onClick={() => setPanelOpen(true)}
        >
          <Bell size={19} />
          {unread > 0 && <span className="topbar-badge">{unread}</span>}
        </button>

        <div className="profile" {...(menuOpen ? dismissProps(dismissMenu) : {})}>
          <button
            type="button"
            ref={profileBtnRef}
            className={`profile-btn ${menuOpen ? "open" : ""}`}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="profile-avatar" aria-hidden="true">
              {getInitials(name)}
            </span>
            <span className="profile-meta">
              <span className="profile-name">{name}</span>
              <span className="profile-role">{role}</span>
            </span>
            <ChevronDown size={16} className="profile-chevron" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="profile-menu" role="menu" ref={menuRef} tabIndex={-1}>
              <div className="profile-menu-head">
                <p className="profile-menu-name">{name}</p>
                {user?.email && <p className="profile-menu-email">{user.email}</p>}
                <p className="profile-menu-role">{role}</p>
                <p className="profile-menu-method">{method === "sso" ? "Signed in with Microsoft" : "Signed in with username and password"}</p>
              </div>
              <button type="button" role="menuitem" className="profile-menu-item danger" onClick={handleLogout}>
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <NotificationPanel notifications={notifications} onClose={closePanel} onMarkRead={markRead} onMarkAllRead={markAllRead} />
      )}
    </header>
  );
}

export default Topbar;
