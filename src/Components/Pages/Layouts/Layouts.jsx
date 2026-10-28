import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Topbar from "../Topbar/Topbar.jsx";
import useMediaQuery from "../../common/useMediaQuery.js";
import { escapeProps } from "../../common/dismissProps.js";
import "./layout.css";

const COLLAPSE_KEY = "cdi_sidebar_collapsed";

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
};

function Layouts() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const compact = collapsed && isDesktop;
  const drawerOpen = mobileOpen && !isDesktop;

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      return;
    }
  }, [collapsed]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  return (
    <div className={`app-shell ${compact ? "is-compact" : ""}`} {...(drawerOpen ? escapeProps(closeMobile) : {})}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar compact={compact} mobileOpen={drawerOpen} onNavigate={closeMobile} />
      {drawerOpen && <div className="app-overlay" onClick={closeMobile} aria-hidden="true" />}
      <div className="app-main">
        <Topbar collapsed={collapsed} onToggleCollapse={toggleCollapse} onOpenMenu={openMobile} />
        <main className="app-content" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layouts;
