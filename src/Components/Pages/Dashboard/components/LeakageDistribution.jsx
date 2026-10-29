import { Percent } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { BarChart } from "../../../Charts";

function LeakageDistribution({ data }) {
  return (
    <ChartCard icon={Percent} title="Leakage distribution" description="Leakage records by % band (follows the configured limit)">
      <BarChart data={data} ariaLabel="Leakage records by percentage band" />
    </ChartCard>
  );
}

export default LeakageDistribution;
