import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Info, RefreshCw, Search, SearchX, X } from "lucide-react";
import MultiSelectField from "../../common/MultiSelectField/MultiSelectField.jsx";
import PaginationComponent from "../../Pagination/PaginationComponent.jsx";
import AppliedFilters from "../UserManagement/AppliedFilters.jsx";
import { pluralize } from "../../common/formatters.js";
import { PRODUCTS, toDateKey } from "../Leakage/leakageData.js";
import { FATIGUE_LIMIT, LEVELS, LEVEL_OPTIONS, MODERATE_FROM, fatigueLevel, initialFatigue } from "./fatigueData.js";
import "./hcpfatigue.css";

const DEFAULT_FILTERS = { search: "", level: [], product: [] };

const DEFAULT_SORT = { key: "fatigue", dir: "desc" };

const COLUMNS = [
  { key: "name", label: "HCP", className: "cell-hcp" },
  { key: "product", label: "Product", className: "cell-product" },
  { key: "campaign", label: "Latest campaign", className: "cell-campaign" },
  { key: "touches", label: "Touches (30d)", className: "cell-touches" },
  { key: "openRate", label: "Email opens", className: "cell-opens" },
  { key: "fatigue", label: "Fatigue", className: "cell-fatigue" },
  { key: "nba", label: "Next-best action", className: "cell-nba" },
];

const CSV_HEADERS = ["HCP", "NPI", "Product", "Latest campaign", "Touches (30d)", "Emails opened", "Emails sent", "Fatigue index", "Next-best action"];

const FATIGUE_TONES = { High: "danger", Moderate: "warning", Low: "neutral" };

const compareValues = (a, b) => (typeof a === "number" ? a - b : String(a).localeCompare(String(b)));

const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

const downloadCsv = (rows) => {
  const lines = rows.map((row) =>
    [row.name, row.npi, row.product, row.campaign, row.touches, row.opened, row.sent, row.fatigue, row.nba].map(csvCell).join(",")
  );
  const csv = [CSV_HEADERS.map(csvCell).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `hcp-fatigue-${toDateKey(new Date())}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

function FatigueBadge({ value }) {
  const level = fatigueLevel(value);
  return (
    <span className={`hf-badge tone-${FATIGUE_TONES[level]}`}>
      {value}
      <span className="sr-only">, {level.toLowerCase()} fatigue</span>
    </span>
  );
}

function SortHeader({ column, sort, onSort }) {
  const active = sort.key === column.key;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={column.className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`hf-sort ${active ? "is-active" : ""}`} onClick={() => onSort(column.key)}>
        {column.label}
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

function HcpFatigue() {
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
    return initialFatigue
      .filter((row) => filters.level.length === 0 || filters.level.includes(LEVELS[fatigueLevel(row.fatigue)]))
      .filter((row) => filters.product.length === 0 || filters.product.includes(row.product))
      .filter((row) => !term || [row.name, row.npi, row.product, row.campaign].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => {
        const result = compareValues(a[sort.key], b[sort.key]) || a.id.localeCompare(b.id);
        return sort.dir === "asc" ? result : -result;
      });
  }, [filters, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Object.values(filters).some((value) => value.length > 0);
  const chipGroups = [
    { key: "search", label: "Search", values: filters.search.trim() ? [`“${filters.search.trim()}”`] : [] },
    { key: "level", label: "Fatigue", values: filters.level },
    { key: "product", label: "Product", values: filters.product },
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
    toast.success(`Exported ${pluralize(filtered.length, "row")} to CSV.`);
  };

  return (
    <div className="hcp-fatigue">
      <div className="hf-head">
        <div className="hf-head-text">
          <h1 className="page-title">HCP Fatigue</h1>
          <p className="page-subtitle">One row per HCP and product: how often each HCP is contacted about that product, and how they respond.</p>
        </div>
        <div className="hf-head-actions">
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

      <section className="hf-card" aria-label="HCP fatigue records">
        <div className="hf-filters">
          <div className="field hf-search">
            <label htmlFor="hf-search" className="field-label">
              Search
            </label>
            <div className="input-wrap">
              <Search className="input-icon" size={16} aria-hidden="true" />
              <input
                id="hf-search"
                type="search"
                className="input has-icon has-action"
                placeholder="HCP, NPI, product or campaign"
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
            <span className="field-label">Fatigue level</span>
            <MultiSelectField
              id="hf-level"
              label="Fatigue level"
              options={LEVEL_OPTIONS}
              value={filters.level}
              onChange={(value) => updateFilter("level", value)}
              allLabel="All levels"
              searchable={false}
            />
          </div>
          <div className="field">
            <span className="field-label">Product</span>
            <MultiSelectField
              id="hf-product"
              label="Product"
              options={PRODUCTS}
              value={filters.product}
              onChange={(value) => updateFilter("product", value)}
              allLabel="All products"
              searchPlaceholder="Search products"
            />
          </div>
        </div>

        {chipGroups.some((group) => group.values.length > 0) && (
          <AppliedFilters groups={chipGroups} onRemove={removeFilterValue} onClear={() => updateFilters(DEFAULT_FILTERS)} />
        )}

        {filtered.length > 0 && filtered.length < 5 && (
          <p className="hf-notice">
            <Info size={16} aria-hidden="true" />
            Only {filtered.length} {filtered.length === 1 ? "HCP matches" : "HCPs match"}. Remove a filter to compare more HCPs.
          </p>
        )}

        <p className="sr-only" aria-live="polite">
          {refreshing ? "Refreshing HCP fatigue" : `${pluralize(filtered.length, "row")} found`}
        </p>

        <div className="hf-table-wrap">
          <table className="hf-table">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <SortHeader key={column.key} column={column} sort={sort} onSort={toggleSort} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="hf-empty-row">
                  <td colSpan={COLUMNS.length}>
                    <div className="hf-empty">
                      <span className="hf-empty-icon" aria-hidden="true">
                        <SearchX size={22} />
                      </span>
                      <p className="hf-empty-title">{hasFilters ? "No HCPs match your filters" : "No engagement data yet"}</p>
                      <p className="hf-empty-text">
                        {hasFilters
                          ? "Try a different search term, or clear the filters."
                          : "Fatigue scores appear after the first engagement file (SFMC) is processed."}
                      </p>
                      {hasFilters && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateFilters(DEFAULT_FILTERS)}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="cell-hcp">
                      <span className="hf-hcp-name">{row.name}</span>
                      <span className="hf-hcp-npi">NPI {row.npi}</span>
                    </td>
                    <td className="cell-product" data-label="Product">
                      <span className="hf-badge tone-brand">{row.product}</span>
                    </td>
                    <td className="cell-campaign" data-label="Latest campaign">
                      {row.campaign ? (
                        <span className="hf-campaign" title={row.campaign}>
                          {row.campaign}
                        </span>
                      ) : (
                        <span className="hf-muted">No campaign</span>
                      )}
                    </td>
                    <td className="cell-touches" data-label="Touches (30d)">
                      {row.touches}
                    </td>
                    <td className="cell-opens" data-label="Email opens">
                      {row.opened} of {row.sent}
                    </td>
                    <td className="cell-fatigue">
                      <FatigueBadge value={row.fatigue} />
                    </td>
                    <td className="cell-nba" data-label="Next-best action">
                      {row.nba}
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

        <div className="hf-legend">
          <span className="hf-legend-title">Fatigue index</span>
          <span className="hf-badge tone-neutral">Low · under {MODERATE_FROM}</span>
          <span className="hf-badge tone-warning">
            Moderate · {MODERATE_FROM}–{FATIGUE_LIMIT - 1}
          </span>
          <span className="hf-badge tone-danger">High · {FATIGUE_LIMIT}+</span>
          <span>0–100: higher means more over-contacted.</span>
        </div>
      </section>
    </div>
  );
}

export default HcpFatigue;
