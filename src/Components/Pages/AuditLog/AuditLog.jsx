import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Download, RefreshCw, Search, SearchX, X } from "lucide-react";
import DatePickerField from "../../common/DatePickerField/DatePickerField.jsx";
import MultiSelectField from "../../common/MultiSelectField/MultiSelectField.jsx";
import PaginationComponent from "../../Pagination/PaginationComponent.jsx";
import AppliedFilters from "../UserManagement/AppliedFilters.jsx";
import { formatLongDate } from "../../common/formatters.js";
import { MODULES, RESULTS, initialAuditLog } from "./auditData.js";
import "./auditlog.css";

const DEFAULT_FILTERS = { search: "", module: [], user: [], result: [], from: "", to: "" };

const USER_OPTIONS = [...new Set(initialAuditLog.map((entry) => entry.user.name))].sort((a, b) => a.localeCompare(b));

const CSV_HEADERS = ["Time", "User", "Role", "Module", "Action", "Resource", "Result", "Details"];

const pad = (value) => String(value).padStart(2, "0");

const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatClock = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const formatDateKey = (key) => formatLongDate(new Date(`${key}T00:00`));

const entryNoun = (count) => (count === 1 ? "entry" : "entries");

const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

const downloadCsv = (entries) => {
  const lines = entries.map((entry) => {
    const date = new Date(entry.at);
    return [`${toDateKey(date)} ${formatClock(date)}`, entry.user.name, entry.user.role, entry.module, entry.action, entry.resource, entry.result, entry.details]
      .map(csvCell)
      .join(",");
  });
  const csv = [CSV_HEADERS.map(csvCell).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-log-${toDateKey(new Date())}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

function ResultBadge({ result }) {
  return <span className={`al-result tone-${result === "Failed" ? "danger" : "success"}`}>{result}</span>;
}

function AuditLog() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const today = toDateKey(new Date());

  useEffect(() => {
    if (!refreshing) return undefined;
    const timer = setTimeout(() => setRefreshing(false), 700);
    return () => clearTimeout(timer);
  }, [refreshing]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return initialAuditLog
      .filter((entry) => filters.module.length === 0 || filters.module.includes(entry.module))
      .filter((entry) => filters.user.length === 0 || filters.user.includes(entry.user.name))
      .filter((entry) => filters.result.length === 0 || filters.result.includes(entry.result))
      .filter((entry) => {
        const day = toDateKey(new Date(entry.at));
        return (!filters.from || day >= filters.from) && (!filters.to || day <= filters.to);
      })
      .filter(
        (entry) =>
          !term ||
          [entry.user.name, entry.user.role, entry.module, entry.action, entry.resource, entry.details].some((value) => value.toLowerCase().includes(term))
      )
      .sort((a, b) => {
        const result = new Date(a.at) - new Date(b.at);
        return sortDir === "asc" ? result : -result;
      });
  }, [filters, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Object.values(filters).some((value) => value.length > 0);
  const chipGroups = [
    { key: "module", label: "Module", values: filters.module },
    { key: "user", label: "User", values: filters.user },
    { key: "result", label: "Result", values: filters.result },
    { key: "from", label: "From", values: filters.from ? [formatDateKey(filters.from)] : [] },
    { key: "to", label: "To", values: filters.to ? [formatDateKey(filters.to)] : [] },
  ];

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const updateFilter = (name, value) => updateFilters({ [name]: value });

  const removeFilterValue = (name, value) => {
    updateFilter(name, Array.isArray(filters[name]) ? filters[name].filter((item) => item !== value) : "");
  };

  const toggleSort = () => {
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  const handleExport = () => {
    downloadCsv(filtered);
    toast.success(`Exported ${filtered.length} ${entryNoun(filtered.length)} to CSV.`);
  };

  return (
    <div className="audit-log">
      <div className="al-head">
        <div className="al-head-text">
          <h1 className="page-title">Audit log</h1>
          <p className="page-subtitle">Who did what, when, and the result. Covers every module.</p>
        </div>
        <div className="al-head-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRefreshing(true)}>
            <RefreshCw size={15} className={refreshing ? "spin" : undefined} aria-hidden="true" />
            Refresh
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download size={15} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      <section className="al-card" aria-label="Audit entries">
        <div className="al-filters">
          <div className="field al-search">
            <label htmlFor="al-search" className="field-label">
              Search
            </label>
            <div className="input-wrap">
              <Search className="input-icon" size={16} aria-hidden="true" />
              <input
                id="al-search"
                type="search"
                className="input has-icon has-action"
                placeholder="User, action, resource or detail"
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
              />
              {filters.search && (
                <button type="button" className="input-action" aria-label="Clear search" onClick={() => updateFilter("search", "")}>
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Module</span>
            <MultiSelectField
              id="al-module"
              label="Module"
              options={MODULES}
              value={filters.module}
              onChange={(value) => updateFilter("module", value)}
              allLabel="All modules"
              searchPlaceholder="Search modules"
            />
          </div>
          <div className="field">
            <span className="field-label">User</span>
            <MultiSelectField
              id="al-user"
              label="User"
              options={USER_OPTIONS}
              value={filters.user}
              onChange={(value) => updateFilter("user", value)}
              allLabel="All users"
              searchPlaceholder="Search users"
            />
          </div>
          <div className="field">
            <span className="field-label">Result</span>
            <MultiSelectField
              id="al-result"
              label="Result"
              options={RESULTS}
              value={filters.result}
              onChange={(value) => updateFilter("result", value)}
              allLabel="All results"
              searchable={false}
            />
          </div>
          <DatePickerField className="al-range" id="al-from" label="From" value={filters.from} max={filters.to || today} onChange={(value) => updateFilter("from", value)} />
          <DatePickerField className="al-range" id="al-to" label="To" value={filters.to} min={filters.from || undefined} max={today} onChange={(value) => updateFilter("to", value)} />
        </div>

        {chipGroups.some((group) => group.values.length > 0) && (
          <AppliedFilters
            groups={chipGroups}
            onRemove={removeFilterValue}
            onClear={() => updateFilters({ module: [], user: [], result: [], from: "", to: "" })}
          />
        )}

        <p className="sr-only" aria-live="polite">
          {refreshing ? "Refreshing audit log" : `${filtered.length} ${entryNoun(filtered.length)} found`}
        </p>

        <div className="al-table-wrap">
          <table className="al-table">
            <thead>
              <tr>
                <th className="cell-time" aria-sort={sortDir === "asc" ? "ascending" : "descending"}>
                  <button type="button" className="al-sort" onClick={toggleSort}>
                    Time
                    {sortDir === "asc" ? <ArrowUp size={13} aria-hidden="true" /> : <ArrowDown size={13} aria-hidden="true" />}
                  </button>
                </th>
                <th>User</th>
                <th>Module</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Result</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="al-empty-row">
                  <td colSpan={7}>
                    <div className="al-empty">
                      <span className="al-empty-icon" aria-hidden="true">
                        <SearchX size={22} />
                      </span>
                      <p className="al-empty-title">No activity matches these filters</p>
                      <p className="al-empty-text">Try a different search or date range, or clear the filters to see all activity.</p>
                      {hasFilters && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateFilters(DEFAULT_FILTERS)}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((entry) => {
                  const date = new Date(entry.at);
                  return (
                    <tr key={entry.id}>
                      <td className="cell-time" data-label="Time">
                        <time className="al-time" dateTime={entry.at}>
                          <span className="al-time-day">{formatLongDate(date)}</span>
                          <span className="al-time-clock">{formatClock(date)}</span>
                        </time>
                      </td>
                      <td className="cell-user">
                        <span className="al-user-name">{entry.user.name}</span>
                        <span className="al-user-role">{entry.user.role}</span>
                      </td>
                      <td className="cell-module" data-label="Module">
                        {entry.module}
                      </td>
                      <td className="cell-action" data-label="Action">
                        {entry.action}
                      </td>
                      <td className="cell-resource" data-label="Resource">
                        {entry.resource}
                      </td>
                      <td className="cell-result">
                        <ResultBadge result={entry.result} />
                      </td>
                      <td className="cell-details" data-label="Details">
                        {entry.details || (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">None</span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationComponent
          page={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}

export default AuditLog;
