import { useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { dismissProps } from "../dismissProps.js";
import "./datepickerfield.css";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (value) => String(value).padStart(2, "0");

const toKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

const todayKey = () => {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
};

const display = (key) => (key ? `${key.slice(5, 7)}/${key.slice(8, 10)}/${key.slice(0, 4)}` : "");

const parseInput = (text) => {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text);
  if (!match) return null;
  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? toKey(year, month - 1, day) : null;
};

const shiftKey = (key, days) => {
  const date = new Date(`${key}T00:00`);
  date.setDate(date.getDate() + days);
  return toKey(date.getFullYear(), date.getMonth(), date.getDate());
};

const viewOf = (key) => ({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) - 1 });

function DatePickerField({ id, label, value, min, max, onChange, className = "", error }) {
  const fallbackId = useId();
  const fieldId = id || fallbackId;
  const gridRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(display(value));
  const [problem, setProblem] = useState("");
  const [focusKey, setFocusKey] = useState(value || todayKey());
  const [view, setView] = useState(() => viewOf(value || todayKey()));

  useEffect(() => {
    setText(display(value));
    setProblem("");
  }, [value]);

  useEffect(() => {
    if (open) gridRef.current?.querySelector('[tabindex="0"]')?.focus();
  }, [open, focusKey]);

  const allowed = (key) => (!min || key >= min) && (!max || key <= max);

  const rangeHint = min && max ? `Choose a date between ${display(min)} and ${display(max)}.` : "Choose an allowed date.";

  const openPicker = () => {
    const start = value || (max && todayKey() > max ? max : todayKey());
    setFocusKey(start);
    setView(viewOf(start));
    setOpen(true);
  };

  const close = (viaKey) => {
    setOpen(false);
    if (viaKey) triggerRef.current?.focus();
  };

  const choose = (key) => {
    onChange(key);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const commitText = () => {
    if (!text.trim()) {
      setProblem("");
      if (value) onChange("");
      return;
    }
    const key = parseInput(text);
    if (!key) {
      setProblem("Enter a date as MM/DD/YYYY.");
      return;
    }
    if (!allowed(key)) {
      setProblem(rangeHint);
      return;
    }
    setProblem("");
    if (key !== value) onChange(key);
  };

  const moveFocus = (key) => {
    if (!allowed(key)) return;
    setFocusKey(key);
    setView(viewOf(key));
  };

  const handleGridKey = (event) => {
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (steps[event.key]) {
      event.preventDefault();
      moveFocus(shiftKey(focusKey, steps[event.key]));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const date = new Date(`${focusKey}T00:00`);
      date.setMonth(date.getMonth() + (event.key === "PageUp" ? -1 : 1));
      moveFocus(toKey(date.getFullYear(), date.getMonth(), date.getDate()));
    }
  };

  const changeMonth = (step) => {
    const date = new Date(view.year, view.month + step, 1);
    setView({ year: date.getFullYear(), month: date.getMonth() });
  };

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const monthStart = toKey(view.year, view.month, 1);
  const monthEnd = toKey(view.year, view.month, daysInMonth);
  const today = todayKey();
  const message = error || problem;

  return (
    <div className={`field dp-field ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="field-label">
          {label}
        </label>
      )}
      <div className="dp-wrap" {...(open ? dismissProps(close) : {})}>
        <input
          id={fieldId}
          className={`input dp-input ${message ? "is-invalid" : ""}`}
          value={text}
          placeholder="MM/DD/YYYY"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          aria-invalid={message ? true : undefined}
          onChange={(event) => {
            setText(event.target.value);
            if (problem) setProblem("");
          }}
          onBlur={commitText}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitText();
            }
          }}
        />
        <button
          ref={triggerRef}
          type="button"
          className="dp-trigger"
          aria-label={`Choose ${label || "date"}${value ? `, selected ${display(value)}` : ""}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => (open ? close(false) : openPicker())}
        >
          <Calendar size={16} aria-hidden="true" />
        </button>
        {open && (
          <div className="dp-panel" role="dialog" aria-label={`${label || "Date"} calendar`}>
            <div className="dp-head">
              <button type="button" className="dp-nav" onClick={() => changeMonth(-1)} disabled={Boolean(min) && monthStart <= min} aria-label="Previous month">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <strong aria-live="polite">
                {MONTHS[view.month]} {view.year}
              </strong>
              <button type="button" className="dp-nav" onClick={() => changeMonth(1)} disabled={Boolean(max) && monthEnd >= max} aria-label="Next month">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="dp-grid" role="grid" ref={gridRef} onKeyDown={handleGridKey}>
              {WEEKDAYS.map((day) => (
                <span key={day} className="dp-weekday" role="columnheader">
                  {day}
                </span>
              ))}
              {cells.map((day, index) => {
                if (!day) return <span key={`blank-${index}`} />;
                const key = toKey(view.year, view.month, day);
                const selected = key === value;
                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    className={`dp-day ${selected ? "is-selected" : ""} ${key === today ? "is-today" : ""}`}
                    disabled={!allowed(key)}
                    tabIndex={key === focusKey ? 0 : -1}
                    aria-pressed={selected}
                    onClick={() => choose(key)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="dp-foot">
              <button type="button" className="dp-clear" onClick={() => choose("")}>
                <X size={14} aria-hidden="true" />
                Clear
              </button>
              {(min || max) && (
                <span className="dp-range">
                  {min ? display(min).slice(0, 5) : ""}–{max ? display(max) : ""}
                </span>
              )}
              <button type="button" className="dp-today" disabled={!allowed(today)} onClick={() => choose(today)}>
                Today
              </button>
            </div>
          </div>
        )}
      </div>
      {message && (
        <span className="field-error" role="alert">
          {message}
        </span>
      )}
    </div>
  );
}

export default DatePickerField;
