import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Info, RefreshCw, Search, SearchX, Settings2, X } from "lucide-react";
import DatePickerField from "../../common/DatePickerField/DatePickerField.jsx";
import MultiSelectField from "../../common/MultiSelectField/MultiSelectField.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import PaginationComponent from "../../Pagination/PaginationComponent.jsx";
import AppliedFilters from "../UserManagement/AppliedFilters.jsx";
import { formatLongDate, pluralize } from "../../common/formatters.js";
import { DATE_RANGE, LEAKAGE_LIMIT, MIN_CLAIMS, PRODUCTS, STATES, STATE_OPTIONS, initialLeakage, stateLabel, toDateKey } from "./leakageData.js";
import "./leakage.css";

const DEFAULT_FILTERS = { search: "", state: [], product: [], from: "", to: "", aboveLimit: false };

const DEFAULT_SORT = { key: "rejected", dir: "desc" };

const COLUMNS = [
  { key: "date", label: "Date", className: "cell-date" },
  { key: "zip", label: "ZIP", className: "cell-zip" },
  { key: "state", label: "State", className: "cell-state" },
  { key: "pharmacyId", label: "Pharmacy ID", className: "cell-pharmacy" },
  { key: "product", label: "Product", className: "cell-product" },
  { key: "hcp", label: "HCP", className: "cell-hcp" },
  { key: "rejected", label: "Rejected / Claims", className: "cell-counts" },
  { key: "pct", label: "Leakage", className: "cell-leak" },
];

const CSV_HEADERS = ["Date", "ZIP", "State", "Pharmacy ID", "Product", "HCP", "NPI", "Rejected", "Claims", "Leakage %"];

const formatCount = (value) => value.toLocaleString("en-US");

const formatPct = (value) => `${value % 1 ? value.toFixed(1) : value}%`;

const formatDateKey = (key) => formatLongDate(new Date(`${key}T00:00`));

const isAboveLimit = (record) => record.claims >= MIN_CLAIMS && record.pct >= LEAKAGE_LIMIT;

const leakTone = (pct) => (pct >= LEAKAGE_LIMIT * 2 ? "danger" : pct >= LEAKAGE_LIMIT ? "warning" : "neutral");

const compareValues = (a, b) => (typeof a === "number" ? a - b : String(a).localeCompare(String(b)));

const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

const downloadCsv = (records) => {
  const lines = records.map((record) =>
    [record.date, record.zip, record.state, record.pharmacyId, record.product, record.hcp, record.npi, record.rejected, record.claims, record.pct].map(csvCell).join(",")
  );
  const csv = [CSV_HEADERS.map(csvCell).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `leakage-records-${toDateKey(new Date())}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

function LeakBadge({ pct }) {
  return <span className={`lk-badge tone-${leakTone(pct)}`}>{formatPct(pct)}</span>;
}

function SortHeader({ column, sort, onSort }) {
  const active = sort.key === column.key;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={column.className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`lk-sort ${active ? "is-active" : ""}`} onClick={() => onSort(column.key)}>
        {column.label}
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

function Leakage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!refreshing) return undefined;
    const timer = setTimeout(() => setRefreshing(false), 700);
    return () => clearTimeout(timer);
  }, [refreshing]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return initialLeakage
      .filter((record) => filters.state.length === 0 || filters.state.includes(stateLabel(record.state)))
      .filter((record) => filters.product.length === 0 || filters.product.includes(record.product))
      .filter((record) => (!filters.from || record.date >= filters.from) && (!filters.to || record.date <= filters.to))
      .filter((record) => !filters.aboveLimit || isAboveLimit(record))
      .filter(
        (record) =>
          !term ||
          [record.zip, record.state, STATES[record.state], record.product, record.hcp, record.npi, record.pharmacyId].some((value) => value.toLowerCase().includes(term))
      )
      .sort((a, b) => {
        const result = compareValues(a[sort.key], b[sort.key]) || a.id.localeCompare(b.id);
        return sort.dir === "asc" ? result : -result;
      });
  }, [filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Object.values(filters).some((value) => value === true || value.length > 0);
  const chipGroups = [
    { key: "search", label: "Search", values: filters.search.trim() ? [`“${filters.search.trim()}”`] : [] },
    { key: "state", label: "State", values: filters.state },
    { key: "product", label: "Product", values: filters.product },
    { key: "from", label: "From", values: filters.from ? [formatDateKey(filters.from)] : [] },
    { key: "to", label: "To", values: filters.to ? [formatDateKey(filters.to)] : [] },
    { key: "aboveLimit", label: "Leakage", values: filters.aboveLimit ? [`Above ${LEAKAGE_LIMIT}% limit`] : [] },
  ];

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const updateFilter = (name, value) => updateFilters({ [name]: value });

  const removeFilterValue = (name, value) => {
    const current = filters[name];
    updateFilter(name, Array.isArray(current) ? current.filter((item) => item !== value) : DEFAULT_FILTERS[name]);
  };

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
    setPage(1);
  };

  const handleExport = () => {
    downloadCsv(filtered);
    toast.success(`Exported ${pluralize(filtered.length, "record")} to CSV.`);
  };

  return (
    <div className="leakage">
      <div className="lk-head">
        <div className="lk-head-text">
          <h1 className="page-title">Leakage</h1>
          <p className="page-subtitle">Rejected pharmacy claims by HCP, product, pharmacy and state.</p>
          <div className="lk-limit">
            <span className="lk-limit-label">Leakage limit</span>
            <strong className="lk-limit-value">{LEAKAGE_LIMIT}%</strong>
            <Link to="/config/thresholds" className="lk-limit-link">
              <Settings2 size={15} aria-hidden="true" />
              Configure
            </Link>
          </div>
        </div>
        <div className="lk-head-actions">
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

      <section className="lk-card" aria-label="Leakage records">
        <div className="lk-filters">
          <div className="field lk-search">
            <label htmlFor="lk-search" className="field-label">
              Search
            </label>
            <div className="input-wrap">
              <Search className="input-icon" size={16} aria-hidden="true" />
              <input
                id="lk-search"
                type="search"
                className="input has-icon has-action"
                placeholder="ZIP, state, product, HCP, NPI or pharmacy"
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
            <span className="field-label">State</span>
            <MultiSelectField
              id="lk-state"
              label="State"
              options={STATE_OPTIONS}
              value={filters.state}
              onChange={(value) => updateFilter("state", value)}
              allLabel="All states"
              searchPlaceholder="Search states"
            />
          </div>
          <div className="field">
            <span className="field-label">Product</span>
            <MultiSelectField
              id="lk-product"
              label="Product"
              options={PRODUCTS}
              value={filters.product}
              onChange={(value) => updateFilter("product", value)}
              allLabel="All products"
              searchPlaceholder="Search products"
            />
          </div>
          <DatePickerField
            className="lk-range"
            id="lk-from"
            label="From"
            value={filters.from}
            min={DATE_RANGE.min}
            max={filters.to || DATE_RANGE.max}
            onChange={(value) => updateFilter("from", value)}
          />
          <DatePickerField
            className="lk-range"
            id="lk-to"
            label="To"
            value={filters.to}
            min={filters.from || DATE_RANGE.min}
            max={DATE_RANGE.max}
            onChange={(value) => updateFilter("to", value)}
          />
          <div className="lk-toggle">
            <SwitchField checked={filters.aboveLimit} onChange={(value) => updateFilter("aboveLimit", value)}>
              Above limit only
            </SwitchField>
          </div>
        </div>

        {chipGroups.some((group) => group.values.length > 0) && (
          <AppliedFilters groups={chipGroups} onRemove={removeFilterValue} onClear={() => updateFilters(DEFAULT_FILTERS)} />
        )}

        {filtered.length > 0 && filtered.length < 5 && (
          <p className="lk-notice">
            <Info size={16} aria-hidden="true" />
            Only {filtered.length} {filtered.length === 1 ? "record matches" : "records match"}. Widen the date range or remove a filter for a fuller picture.
          </p>
        )}

        <p className="sr-only" aria-live="polite">
          {refreshing ? "Refreshing leakage records" : `${pluralize(filtered.length, "record")} found`}
        </p>

        <div className="lk-table-wrap">
          <table className="lk-table">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <SortHeader key={column.key} column={column} sort={sort} onSort={toggleSort} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="lk-empty-row">
                  <td colSpan={COLUMNS.length}>
                    <div className="lk-empty">
                      <span className="lk-empty-icon" aria-hidden="true">
                        <SearchX size={22} />
                      </span>
                      <p className="lk-empty-title">No records match your filters</p>
                      <p className="lk-empty-text">Try a different search term, widen the date range, or clear the filters.</p>
                      {hasFilters && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateFilters(DEFAULT_FILTERS)}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((record) => (
                  <tr key={record.id}>
                    <td className="cell-date" data-label="Date">
                      <time dateTime={record.date}>{formatDateKey(record.date)}</time>
                    </td>
                    <td className="cell-zip" data-label="ZIP">
                      <span className="lk-mono">{record.zip}</span>
                    </td>
                    <td className="cell-state" data-label="State">
                      <span title={STATES[record.state]}>{record.state}</span>
                    </td>
                    <td className="cell-pharmacy" data-label="Pharmacy ID">
                      <span className="lk-mono">{record.pharmacyId}</span>
                    </td>
                    <td className="cell-product" data-label="Product">
                      {record.product}
                    </td>
                    <td className="cell-hcp">
                      <span className="lk-hcp-name">{record.hcp}</span>
                      <span className="lk-hcp-npi">NPI {record.npi}</span>
                    </td>
                    <td className="cell-counts" data-label="Rejected / Claims">
                      <span className="lk-counts">
                        <span>
                          {formatCount(record.rejected)} / {formatCount(record.claims)}
                        </span>
                        {record.claims < MIN_CLAIMS && <span className="lk-badge tone-neutral">Low volume</span>}
                      </span>
                    </td>
                    <td className="cell-leak">
                      <LeakBadge pct={record.pct} />
                    </td>
                  </tr>
                ))
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

        <div className="lk-legend">
          <span className="lk-legend-title">Legend</span>
          <span className="lk-badge tone-neutral">Below {LEAKAGE_LIMIT}%</span>
          <span className="lk-badge tone-warning">
            {LEAKAGE_LIMIT}–{LEAKAGE_LIMIT * 2 - 1}%
          </span>
          <span className="lk-badge tone-danger">{LEAKAGE_LIMIT * 2}% and above</span>
          <span className="lk-legend-item">
            <span className="lk-badge tone-neutral">Low volume</span>
            under {MIN_CLAIMS} claims
          </span>
        </div>
      </section>
    </div>
  );
}

export default Leakage;
