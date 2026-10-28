import { useLocation, useMatches } from "react-router-dom";
import { useSelector } from "react-redux";
import "./comingsoon.css";

function ComingSoon() {
  const { pathname } = useLocation();
  const matches = useMatches();
  const user = useSelector((state) => state.auth.user);
  const crumbs = [...matches].reverse().find((match) => match.handle?.crumbs)?.handle.crumbs || [];
  const title = crumbs[crumbs.length - 1] || "This page";
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="coming-soon">
      <header className="cs-head">
        <h1 className="page-title">{isDashboard ? `Welcome, ${user?.firstName || "there"}` : title}</h1>
        <p className="page-subtitle">
          {isDashboard ? "Leakage and HCP fatigue at a glance will live here." : crumbs.length > 1 ? crumbs[0] : "Commercial Decision Intelligence"}
        </p>
      </header>
    </div>
  );
}

export default ComingSoon;
