import { Activity } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { AreaChart } from "../../../Charts";
import { LEAKAGE_LIMIT } from "../../Leakage/leakageData.js";

function LeakageTrend({ data }) {
  return (
    <ChartCard
      icon={Activity}
      title="Leakage over time"
      description={`Records at or above the ${LEAKAGE_LIMIT}% limit, per week (last 12 weeks)`}
      className="dash-span-2"
    >
      <AreaChart data={data} ariaLabel="Records above the leakage limit per week" />
    </ChartCard>
  );
}

export default LeakageTrend;
