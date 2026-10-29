import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Droplets } from "lucide-react";
import DashboardFilters from "./components/DashboardFilters.jsx";
import KpiGrid from "./components/KpiGrid.jsx";
import LeakageTrend from "./components/LeakageTrend.jsx";
import LeakageDistribution from "./components/LeakageDistribution.jsx";
import StateLeakage from "./components/StateLeakage.jsx";
import FatigueSeverity from "./components/FatigueSeverity.jsx";
import EngagementTrend from "./components/EngagementTrend.jsx";
import TopHcpTable from "./components/TopHcpTable.jsx";
import RecentActivity from "./components/RecentActivity.jsx";
import { formatRefreshed } from "../../common/formatters.js";
import { DEFAULT_FILTERS, RANGE_OPTIONS, buildDashboard } from "./dashboardData.js";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [refreshedAt] = useState(() => formatRefreshed(new Date()));

  const data = useMemo(() => buildDashboard(filters), [filters]);
  const rangeLabel = RANGE_OPTIONS.find((option) => option.value === filters.range).label;
  const openLeakage = () => navigate("/leakage");
  const openFatigue = () => navigate("/fatigue");

  return (
    <div className="dash">
      <div className="dash-head">
        <div className="dash-head-text">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle dash-refreshed">
            <Clock size={15} aria-hidden="true" />
            Data last refreshed {refreshedAt}
          </p>
        </div>
        <DashboardFilters filters={filters} onChange={setFilters} />
      </div>

      {data.stats.claims === 0 ? (
        <section className="dash-card dash-empty">
          <Droplets size={26} aria-hidden="true" />
          <strong>No leakage data for these filters</strong>
          <span>Try a longer date range, another product or all states.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilters({ ...DEFAULT_FILTERS, range: "84" })}>
            Reset filters
          </button>
        </section>
      ) : (
        <>
          <KpiGrid data={data} rangeLabel={rangeLabel} onOpenLeakage={openLeakage} onOpenFatigue={openFatigue} />

          <div className="dash-grid">
            <LeakageTrend data={data.trend} />
            <LeakageDistribution data={data.bands} />
          </div>

          <div className="dash-grid">
            <StateLeakage rows={data.states} onPick={openLeakage} />
            <div className="dash-stack">
              <FatigueSeverity bands={data.fatigue.bands} high={data.fatigue.high} />
              <EngagementTrend data={data.fatigue.engagement} />
            </div>
          </div>

          <div className="dash-grid is-wide">
            <TopHcpTable rows={data.top} rangeLabel={rangeLabel} onOpen={openLeakage} />
            <RecentActivity />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
