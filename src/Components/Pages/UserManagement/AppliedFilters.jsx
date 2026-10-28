import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { dismissProps } from "../../common/dismissProps.js";
import "./appliedfilters.css";

const VISIBLE_CHIPS = 4;

function FilterChip({ label, removeLabel, onRemove }) {
  return (
    <span className="af-chip">
      <span className="af-chip-text">{label}</span>
      <button type="button" className="af-chip-remove" aria-label={removeLabel} onClick={onRemove}>
        <X size={12} />
      </button>
    </span>
  );
}

function AppliedFilters({ groups, onRemove, onClear }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useId();
  const activeGroups = groups.filter((group) => group.values.length > 0);
  const chips = activeGroups.flatMap((group) => group.values.map((value) => ({ key: group.key, label: group.label, value })));
  const hiddenCount = chips.length - VISIBLE_CHIPS;

  useEffect(() => {
    if (moreOpen) popoverRef.current?.focus();
  }, [moreOpen]);

  const dismiss = (viaKey) => {
    setMoreOpen(false);
    if (viaKey) moreRef.current?.focus();
  };

  const removeFromPopover = (key, value) => {
    popoverRef.current?.focus();
    onRemove(key, value);
  };

  const removeLabel = (label, value) => `Remove ${label.toLowerCase()} filter ${value}`;

  return (
    <div className="af" {...(moreOpen ? dismissProps(dismiss) : {})}>
      <span className="af-label">Applied</span>
      {chips.slice(0, VISIBLE_CHIPS).map((chip) => (
        <FilterChip
          key={`${chip.key}-${chip.value}`}
          label={`${chip.label}: ${chip.value}`}
          removeLabel={removeLabel(chip.label, chip.value)}
          onRemove={() => onRemove(chip.key, chip.value)}
        />
      ))}
      {hiddenCount > 0 && (
        <button
          ref={moreRef}
          type="button"
          className="af-more"
          aria-expanded={moreOpen}
          aria-controls={moreOpen ? popoverId : undefined}
          onClick={() => setMoreOpen((prev) => !prev)}
        >
          +{hiddenCount} more
        </button>
      )}
      <button type="button" className="af-clear" onClick={onClear}>
        Clear all
      </button>

      {moreOpen && (
        <div className="af-pop" ref={popoverRef} tabIndex={-1} id={popoverId} role="dialog" aria-label="Applied filters">
          <p className="af-pop-title">Applied filters ({chips.length})</p>
          {activeGroups.map((group) => (
            <div key={group.key} className="af-group">
              <p className="af-group-label">{group.label}</p>
              <div className="af-group-chips">
                {group.values.map((value) => (
                  <FilterChip
                    key={value}
                    label={value}
                    removeLabel={removeLabel(group.label, value)}
                    onRemove={() => removeFromPopover(group.key, value)}
                  />
                ))}
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm btn-block af-pop-clear" onClick={onClear}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

export default AppliedFilters;
