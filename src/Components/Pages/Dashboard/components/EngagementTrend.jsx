import { Activity } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { AreaChart } from "../../../Charts";

function EngagementTrend({ data }) {
  return (
    <ChartCard icon={Activity} title="HCP engagement" description="Email open rate per week">
      <AreaChart data={data} height={170} unit="%" color="var(--chart-navy)" ariaLabel="Email open rate per week" />
    </ChartCard>
  );
}

export default EngagementTrend;
