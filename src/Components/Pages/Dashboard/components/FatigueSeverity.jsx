import { Gauge } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { BarChart } from "../../../Charts";

function FatigueSeverity({ bands, high }) {
  return (
    <ChartCard
      icon={Gauge}
      title="HCP fatigue severity"
      description="Number of HCPs per fatigue band"
      actions={<span className={`dash-badge tone-${high ? "danger" : "neutral"}`}>High: {high}</span>}
    >
      <BarChart data={bands} height={190} ariaLabel="HCPs by fatigue band" />
    </ChartCard>
  );
}

export default FatigueSeverity;
