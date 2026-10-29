import { Droplets, Gauge, Landmark, Percent, UserRoundX, Users } from "lucide-react";
import KpiCard from "./KpiCard.jsx";
import { LEAKAGE_LIMIT, MIN_CLAIMS } from "../../Leakage/leakageData.js";
import { FATIGUE_LIMIT } from "../../HcpFatigue/fatigueData.js";
import { GOVT_PLANS_BYPASSED } from "../dashboardData.js";

const formatRate = (value) => `${value.toFixed(1)}%`;

function KpiGrid({ data, rangeLabel, onOpenLeakage, onOpenFatigue }) {
  const { stats, deltas, comparesPrevious, fatigue } = data;

  return (
    <div className="dash-kpis">
      <KpiCard
        icon={Droplets}
        label="Total leakage records"
        value={stats.records}
        delta={deltas.records}
        hint={comparesPrevious ? "vs previous 30 days" : rangeLabel}
        onClick={onOpenLeakage}
      />
      <KpiCard
        icon={Percent}
        label="Leakage rate"
        value={stats.rate}
        format={formatRate}
        delta={deltas.rate}
        hint="Rejected ÷ total claims"
        info="Share of claims rejected at the pharmacy in the selected period."
      />
      <KpiCard
        icon={UserRoundX}
        tone="red"
        label="High-risk HCPs"
        value={stats.highRiskHcps}
        hint={`Leakage ${LEAKAGE_LIMIT}% or more`}
        info={`HCPs with at least one record at or above the ${LEAKAGE_LIMIT}% limit and ${MIN_CLAIMS}+ claims.`}
        onClick={onOpenLeakage}
      />
      <KpiCard
        icon={Gauge}
        tone="orange"
        label="Avg. fatigue index"
        value={fatigue.average}
        hint={`${fatigue.hcpCount.toLocaleString("en-US")} HCPs in scope`}
        onClick={onOpenFatigue}
      />
      <KpiCard icon={Users} tone="orange" label="High-fatigue HCPs" value={fatigue.high} hint={`Index ${FATIGUE_LIMIT} or more`} onClick={onOpenFatigue} />
      <KpiCard
        icon={Landmark}
        tone="navy"
        label="Govt. Plans Bypassed"
        value={GOVT_PLANS_BYPASSED}
        hint="Today's count"
        info="Definition to be confirmed with the business team."
      />
    </div>
  );
}

export default KpiGrid;
