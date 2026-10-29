import { useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import ChartCard from "./ChartCard.jsx";
import { HorizontalBarList } from "../../../Charts";
import { STATES } from "../../Leakage/leakageData.js";

function StateLeakage({ rows, onPick }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => !term || row.key.toLowerCase().includes(term) || STATES[row.key].toLowerCase().includes(term));
  }, [rows, query]);

  const expanded = showAll || query.trim() !== "";
  const visible = expanded ? filtered : filtered.slice(0, 8);

  return (
    <ChartCard
      icon={MapPin}
      title="Leakage records by state"
      description={onPick ? "Click a state to open its leakage records" : "Leakage records per state"}
      className="dash-span-2"
      actions={
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show top 8" : `Show all ${rows.length}`}
        </button>
      }
    >
      <div className="field dash-state-search">
        <label htmlFor="dash-state-search" className="field-label">
          Search states
        </label>
        <div className="input-wrap">
          <Search className="input-icon" size={16} aria-hidden="true" />
          <input
            id="dash-state-search"
            type="search"
            className="input has-icon"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="State name or code"
            autoComplete="off"
          />
          {query && (
            <button type="button" className="input-action" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {visible.length === 0 ? <p className="dash-empty-note">No matching state. Check the spelling or clear the search.</p> : <HorizontalBarList items={visible} onPick={onPick} columns={expanded && visible.length > 8 ? 2 : 1} />}
      {rows.length > 0 && rows.length < 4 && (
        <p className="dash-note">
          Only {rows.length} state{rows.length > 1 ? "s have" : " has"} leakage for these filters. Widen the date range to compare more states.
        </p>
      )}
    </ChartCard>
  );
}

export default StateLeakage;
