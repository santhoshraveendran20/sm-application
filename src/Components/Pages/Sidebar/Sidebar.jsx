import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { SidebarData } from "./SidebarData.js";
import { dismissProps } from "../../common/dismissProps.js";
import logoWhite from "../../../images/Logo/srmtech-logo-white.png";
import markWhite from "../../../images/Logo/srmtech-mark-white.png";
import "./sidebar.css";

const FLYOUT_ITEM_HEIGHT = 40;
const FLYOUT_CHROME = 64;

const isInGroup = (item, pathname) => Boolean(item.base) && pathname.startsWith(item.base);

function DisabledSubItem({ child, className }) {
  return (
    <span
      role="link"
      aria-disabled="true"
      tabIndex={0}
      title={child.disabled}
      aria-label={`${child.label}, unavailable. ${child.disabled}`}
      className={`${className} is-disabled`}
    >
      <span className="sidebar-sub-label">{child.label}</span>
      {child.phase && <span className="sidebar-phase">Phase {child.phase}</span>}
    </span>
  );
}

function Sidebar({ compact, mobileOpen, onNavigate }) {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(() => SidebarData.filter((item) => isInGroup(item, pathname)).map((item) => item.id));
  const [trackedPath, setTrackedPath] = useState(pathname);
  const [floating, setFloating] = useState(null);
  const flyoutRef = useRef(null);
  const year = new Date().getFullYear();

  if (trackedPath !== pathname) {
    setTrackedPath(pathname);
    setFloating(null);
    const activeGroup = SidebarData.find((item) => isInGroup(item, pathname));
    if (activeGroup && !expanded.includes(activeGroup.id)) {
      setExpanded([activeGroup.id]);
    }
  }

  const flyoutOpen = compact && floating?.type === "flyout";

  useEffect(() => {
    if (flyoutOpen) flyoutRef.current?.focus();
  }, [flyoutOpen]);

  const dismissFlyout = () => setFloating(null);

  const showTooltip = (event, label) => {
    if (!compact || floating?.type === "flyout") return;
    const rect = event.currentTarget.getBoundingClientRect();
    setFloating({ type: "tooltip", label, top: rect.top + rect.height / 2 });
  };

  const hideTooltip = () => {
    setFloating((prev) => (prev?.type === "tooltip" ? null : prev));
  };

  const toggleGroup = (event, item) => {
    if (compact) {
      const rect = event.currentTarget.getBoundingClientRect();
      const height = item.children.length * FLYOUT_ITEM_HEIGHT + FLYOUT_CHROME;
      const top = `max(8px, min(${rect.top}px, calc(100dvh - ${height + 8}px)))`;
      setFloating((prev) => (prev?.type === "flyout" && prev.id === item.id ? null : { type: "flyout", id: item.id, item, top }));
      return;
    }
    setExpanded((prev) => (prev.includes(item.id) ? [] : [item.id]));
  };

  const handleFlyoutNavigate = () => {
    setFloating(null);
    onNavigate();
  };

  return (
    <aside
      className={`sidebar ${compact ? "is-compact" : ""} ${mobileOpen ? "is-open" : ""}`}
      aria-label="Main navigation"
      {...(flyoutOpen ? dismissProps(dismissFlyout) : {})}
    >
      <div className="sidebar-brand">
        {compact ? (
          <img src={markWhite} alt="SRMTech" className="sidebar-mark" />
        ) : (
          <div className="sidebar-brand-full">
            <img src={logoWhite} alt="SRMTech — ideas@work" className="sidebar-logo" />
            <span className="sidebar-product">Commercial Decision Intelligence</span>
          </div>
        )}
        <button type="button" className="sidebar-close" aria-label="Close menu" onClick={onNavigate}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav" id="main-nav" onScroll={() => floating && setFloating(null)}>
        <ul className="sidebar-menu">
          {SidebarData.map((item) => {
            const Icon = item.icon;

            if (!item.children) {
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.link}
                    className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                    aria-label={compact ? item.label : undefined}
                    onClick={onNavigate}
                    onMouseEnter={(event) => showTooltip(event, item.label)}
                    onMouseLeave={hideTooltip}
                    onFocus={(event) => showTooltip(event, item.label)}
                    onBlur={hideTooltip}
                  >
                    <Icon className="sidebar-icon" size={20} aria-hidden="true" />
                    <span className="sidebar-label">{item.label}</span>
                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    {item.badge && <span className="sidebar-dot" aria-hidden="true" />}
                  </NavLink>
                </li>
              );
            }

            const groupActive = isInGroup(item, pathname);
            const open = !compact && expanded.includes(item.id);
            const flyoutActive = flyoutOpen && floating.id === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sidebar-link sidebar-group ${groupActive ? "active-group" : ""} ${open || flyoutActive ? "open" : ""}`}
                  aria-expanded={compact ? flyoutActive : open}
                  aria-controls={`nav-group-${item.id}`}
                  aria-label={compact ? item.label : undefined}
                  onClick={(event) => toggleGroup(event, item)}
                  onMouseEnter={(event) => showTooltip(event, item.label)}
                  onMouseLeave={hideTooltip}
                  onFocus={(event) => showTooltip(event, item.label)}
                  onBlur={hideTooltip}
                >
                  <Icon className="sidebar-icon" size={20} aria-hidden="true" />
                  <span className="sidebar-label">{item.label}</span>
                  {compact ? (
                    <ChevronRight className="sidebar-caret" size={12} aria-hidden="true" />
                  ) : (
                    <ChevronDown className="sidebar-chevron" size={16} aria-hidden="true" />
                  )}
                </button>
                {open && (
                  <ul className="sidebar-submenu" id={`nav-group-${item.id}`}>
                    {item.children.map((child) => (
                      <li key={child.id}>
                        {child.disabled ? (
                          <DisabledSubItem child={child} className="sidebar-sublink" />
                        ) : (
                          <NavLink
                            to={child.link}
                            className={({ isActive }) => `sidebar-sublink ${isActive ? "active" : ""}`}
                            onClick={onNavigate}
                          >
                            {child.label}
                          </NavLink>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {compact ? (
          <span>© {year}</span>
        ) : (
          <>
            <span>© {year} SRM Technologies. All rights reserved.</span>
          </>
        )}
      </div>

      {compact && floating?.type === "tooltip" && (
        <div className="sidebar-tooltip" role="tooltip" style={{ top: floating.top }}>
          {floating.label}
        </div>
      )}

      {flyoutOpen && (
        <div className="sidebar-flyout" ref={flyoutRef} tabIndex={-1} id={`nav-group-${floating.item.id}`} style={{ top: floating.top }}>
          <p className="sidebar-flyout-title">{floating.item.label}</p>
          <ul>
            {floating.item.children.map((child) => (
              <li key={child.id}>
                {child.disabled ? (
                  <DisabledSubItem child={child} className="sidebar-flyout-link" />
                ) : (
                  <NavLink
                    to={child.link}
                    className={({ isActive }) => `sidebar-flyout-link ${isActive ? "active" : ""}`}
                    onClick={handleFlyoutNavigate}
                  >
                    {child.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
