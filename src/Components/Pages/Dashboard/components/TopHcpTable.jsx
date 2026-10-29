import { ArrowRight, Flag, UserRoundX } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { LEAKAGE_LIMIT } from "../../Leakage/leakageData.js";
import { FATIGUE_LIMIT, MODERATE_FROM } from "../../HcpFatigue/fatigueData.js";

const formatCount = (value) => value.toLocaleString("en-US");

const formatPct = (value) => `${value % 1 ? value.toFixed(1) : value}%`;

const leakTone = (pct) => (pct >= LEAKAGE_LIMIT * 2 ? "danger" : pct >= LEAKAGE_LIMIT ? "warning" : "neutral");

const fatigueTone = (index) => (index >= FATIGUE_LIMIT ? "danger" : index >= MODERATE_FROM ? "warning" : "neutral");

function TopHcpTable({ rows, rangeLabel, onOpen }) {
  return (
    <ChartCard
      icon={UserRoundX}
      title="HCPs requiring attention"
      description={`Most rejected claims above the ${LEAKAGE_LIMIT}% limit · ${rangeLabel.toLowerCase()}`}
      className="dash-span-3"
      actions={
        onOpen && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onOpen}>
            View all
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        )
      }
    >
      {rows.length === 0 ? (
        <div className="dash-empty">
          <Flag size={22} aria-hidden="true" />
          <strong>No HCPs above the limit</strong>
          <span>Nothing needs attention for these filters.</span>
        </div>
      ) : (
        <div className="dash-table-wrap" tabIndex={0} role="region" aria-label="HCPs requiring attention">
          <table className="dash-table">
            <thead>
              <tr>
                <th>HCP</th>
                <th>State</th>
                <th>Top product</th>
                <th className="is-right">Rejected / Claims</th>
                <th className="is-right">Leakage</th>
                <th className="is-right">Fatigue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.npi} className={onOpen ? "is-clickable" : ""} onClick={onOpen}>
                  <td>
                    <strong>{row.hcp}</strong>
                    <span className="dash-sub">NPI {row.npi}</span>
                  </td>
                  <td>{row.state}</td>
                  <td>{row.topProduct}</td>
                  <td className="is-right">
                    {formatCount(row.rejected)} / {formatCount(row.claims)}
                  </td>
                  <td className="is-right">
                    <span className={`dash-badge tone-${leakTone(row.rate)}`}>{formatPct(row.rate)}</span>
                  </td>
                  <td className="is-right">
                    <span className={`dash-badge tone-${fatigueTone(row.fatigue)}`}>{Math.round(row.fatigue)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ChartCard>
  );
}

export default TopHcpTable;
