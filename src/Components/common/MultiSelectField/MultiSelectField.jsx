import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import IndeterminateCheckbox from "../IndeterminateCheckbox/IndeterminateCheckbox.jsx";
import { dismissProps } from "../dismissProps.js";
import "./multiselectfield.css";

function MultiSelectField({ id, label, options, value, onChange, allLabel, searchable = true, searchPlaceholder = "Search", className = "" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [query, setQuery] = useState("");
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (open) (searchRef.current || panelRef.current)?.focus();
  }, [open]);

  const dismiss = (viaKey) => {
    setOpen(false);
    if (viaKey) triggerRef.current?.focus();
  };

  const term = query.trim().toLowerCase();
  const visible = options.filter((option) => option.toLowerCase().includes(term));
  const visibleSelected = visible.filter((option) => draft.includes(option));
  const allVisibleSelected = visible.length > 0 && visibleSelected.length === visible.length;
  const display = value.length === 0 || value.length === options.length ? allLabel : value.length === 1 ? value[0] : `${value.length} selected`;

  const toggleOpen = () => {
    if (!open) {
      setDraft(value);
      setQuery("");
    }
    setOpen(!open);
  };

  const toggleOption = (option) => {
    setDraft((prev) => (prev.includes(option) ? prev.filter((item) => item !== option) : options.filter((item) => item === option || prev.includes(item))));
  };

  const toggleVisible = () => {
    setDraft((prev) =>
      allVisibleSelected ? prev.filter((item) => !visible.includes(item)) : options.filter((item) => prev.includes(item) || visible.includes(item)),
    );
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={`multi-select ${open ? "is-open" : ""} ${className}`} {...(open ? dismissProps(dismiss) : {})}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className="input ms-trigger"
        aria-label={`${label}: ${display}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggleOpen}
      >
        <span className="ms-value">{display}</span>
        <ChevronDown className="ms-chevron" size={16} aria-hidden="true" />
      </button>

      {open && (
        <div className="ms-panel" ref={panelRef} tabIndex={-1} id={panelId} role="dialog" aria-label={`${label} filter`}>
          {searchable && (
            <div className="input-wrap ms-search">
              <Search className="input-icon" size={15} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                className="input has-icon"
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          )}

          {visible.length > 0 ? (
            <>
              <label className="ms-option ms-all">
                <IndeterminateCheckbox
                  checked={allVisibleSelected}
                  indeterminate={visibleSelected.length > 0 && !allVisibleSelected}
                  onChange={toggleVisible}
                />
                <span>Select all</span>
              </label>
              <ul className="ms-list">
                {visible.map((option) => {
                  const checked = draft.includes(option);
                  return (
                    <li key={option}>
                      <label className={`ms-option ${checked ? "is-checked" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleOption(option)} />
                        <span>{option}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="ms-empty">No matches</p>
          )}

          <div className="ms-footer">
            <button type="button" className="ms-clear" onClick={() => setDraft([])} disabled={draft.length === 0}>
              Clear
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={apply}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelectField;
