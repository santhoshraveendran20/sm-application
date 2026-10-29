import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, Info, RefreshCw, RotateCcw, Search, SearchX, TriangleAlert, X } from "lucide-react";
import MultiSelectField from "../../common/MultiSelectField/MultiSelectField.jsx";
import IndeterminateCheckbox from "../../common/IndeterminateCheckbox/IndeterminateCheckbox.jsx";
import SwitchField from "../../common/SwitchField/SwitchField.jsx";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal.jsx";
import Modal from "../../common/Modal/Modal.jsx";
import PaginationComponent from "../../Pagination/PaginationComponent.jsx";
import AppliedFilters from "../UserManagement/AppliedFilters.jsx";
import { formatLongDate, pluralize } from "../../common/formatters.js";
import UploadShell from "./UploadShell.jsx";
import { STATUSES, STATUS_TONES, SOURCES, updateJob, useUploadStore } from "./uploadData.js";

const DEFAULT_FILTERS = { search: "", status: [], source: [] };

const DEFAULT_SORT = { key: "started", dir: "desc" };

const COLUMNS = [
  { key: "id", label: "Job", className: "cell-job" },
  { key: "file", label: "File", className: "cell-file" },
  { key: "source", label: "Source", className: "cell-source" },
  { key: "started", label: "Started", className: "cell-started" },
  { key: "imported", label: "Imported", className: "cell-imported" },
  { key: "skipped", label: "Skipped", className: "cell-skipped" },
  { key: "status", label: "Status", className: "cell-status" },
];

const sourceGroup = (source) => (source === "Manual upload" ? "Manual" : "Automated");

const skipped = (item) => item.invalid + item.duplicates;

const sortValue = (item, key) => (key === "skipped" ? skipped(item) : item[key]);

const compareValues = (a, b) => (typeof a === "number" ? a - b : String(a).localeCompare(String(b)));

const formatStarted = (value) => `${formatLongDate(new Date(value))}, ${value.slice(11)}`;

function StatusBadge({ status }) {
  return <span className={`du-badge tone-${STATUS_TONES[status]}`}>{status}</span>;
}

function SortHeader({ column, sort, onSort }) {
  const active = sort.key === column.key;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={column.className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`du-sort ${active ? "is-active" : ""}`} onClick={() => onSort(column.key)}>
        {column.label}
        <Icon size={13} aria-hidden="true" />
      </button>
    </th>
  );
}

function JobDetails({ item, onClose }) {
  const facts = [
    ["Type", item.type],
    ["Source", item.source],
    ["Started by", item.by],
    ["Started", formatStarted(item.started)],
    ["Duration", item.duration],
  ];
  const counts = [
    ["Rows in file", item.rows, ""],
    ["Imported", item.imported, "tone-success"],
    ["Invalid", item.invalid, "tone-danger"],
    ["Duplicates", item.duplicates, "tone-warning"],
  ];
  return (
    <Modal
      title={item.id}
      subtitle={item.file}
      size="md"
      onClose={onClose}
      footer={
        <>
          {skipped(item) > 0 && (
            <button type="button" className="btn btn-secondary" onClick={() => toast("In the live app this downloads a CSV of the skipped rows.")}>
              <Download size={16} aria-hidden="true" />
              Skipped rows report
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="du-detail">
        <StatusBadge status={item.status} />
        {item.status === "Failed" && (
          <p className="du-callout tone-warning">
            <TriangleAlert size={16} aria-hidden="true" />
            <span>
              <b>Import failed.</b> {item.error}
            </span>
          </p>
        )}
        <dl className="du-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {item.status !== "Failed" && (
          <div className="du-stats">
            {counts.map(([label, value, tone]) => (
              <div key={label} className={`du-stat ${tone}`}>
                <p className="du-stat-value">{value.toLocaleString("en-US")}</p>
                <p className="du-stat-label">{label}</p>
              </div>
            ))}
          </div>
        )}
        {item.duplicates > item.rows * 0.5 && (
          <p className="du-callout">
            <Info size={16} aria-hidden="true" />
            <span>
              Most rows in this file were duplicates ({item.duplicates.toLocaleString("en-US")} of {item.rows.toLocaleString("en-US")}). Check whether the provider resent data that was already imported.
            </span>
          </p>
        )}
      </div>
    </Modal>
  );
}

function ProcessingHistory() {
  const { jobs } = useUploadStore();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const archivedCount = jobs.filter((item) => item.archived).length;

  useEffect(() => {
    if (!refreshing) return undefined;
    const timer = setTimeout(() => setRefreshing(false), 700);
    return () => clearTimeout(timer);
  }, [refreshing]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return jobs
      .filter((item) => showArchived || !item.archived)
      .filter((item) => filters.status.length === 0 || filters.status.includes(item.status))
      .filter((item) => filters.source.length === 0 || filters.source.includes(sourceGroup(item.source)))
      .filter((item) => !term || [item.id, item.file, item.by].some((value) => value.toLowerCase().includes(term)))
      .sort((a, b) => {
        const result = compareValues(sortValue(a, sort.key), sortValue(b, sort.key)) || a.id.localeCompare(b.id);
        return sort.dir === "asc" ? result : -result;
      });
  }, [jobs, filters, sort, showArchived]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Object.values(filters).some((value) => value.length > 0);
  const chipGroups = [
    { key: "search", label: "Search", values: filters.search.trim() ? [`“${filters.search.trim()}”`] : [] },
    { key: "status", label: "Status", values: filters.status },
    { key: "source", label: "Source", values: filters.source },
  ];

  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const updateFilter = (name, value) => updateFilters({ [name]: value });

  const removeFilterValue = (name, value) => {
    const current = filters[name];
    updateFilter(name, Array.isArray(current) ? current.filter((item) => item !== value) : "");
  };

  const toggleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
    setPage(1);
  };

  const selectedJobs = jobs.filter((item) => selectedIds.includes(item.id));
  const archivable = selectedJobs.filter((item) => !item.archived && item.status !== "Running");
  const restorable = selectedJobs.filter((item) => item.archived);
  const pageIds = rows.map((item) => item.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected = !allSelected && pageIds.some((id) => selectedIds.includes(id));

  const toggleAll = () => setSelectedIds((prev) => (allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]));

  const toggleOne = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));

  const handleArchive = (reason) => {
    archiving.forEach((item) => updateJob(item.id, { archived: { at: new Date().toISOString(), reason } }));
    toast.success(
      archiving.length === 1 ? `${archiving[0].id} archived. Imported data stays in the dashboards.` : `${pluralize(archiving.length, "job")} archived. Imported data stays in the dashboards.`
    );
    setSelectedIds([]);
    setArchiving(null);
  };

  const handleRestore = (items) => {
    items.forEach((item) => updateJob(item.id, { archived: null }));
    toast.success(items.length === 1 ? `${items[0].id} restored.` : `${pluralize(items.length, "job")} restored.`);
    setSelectedIds([]);
  };

  const handleRetry = (item) => {
    updateJob(item.id, { status: "Running" });
    toast(`${item.id} restarted.`);
    setTimeout(() => {
      updateJob(item.id, { status: "Failed", error: 'Retry failed: the source file still has no "prescriber_npi" column.' });
      toast.error("Retry failed. The source file itself is missing a column; ask the data provider to resend it.");
    }, 2200);
  };

  return (
    <UploadShell
      actions={
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRefreshing(true)}>
          <RefreshCw size={15} className={refreshing ? "spin" : undefined} aria-hidden="true" />
          Refresh
        </button>
      }
    >
      <section className="du-card du-history" aria-label="Processing history">
        <div className="du-filters">
          <div className="field du-search">
            <label htmlFor="du-search" className="field-label">
              Search
            </label>
            <div className="input-wrap">
              <Search className="input-icon" size={16} aria-hidden="true" />
              <input
                id="du-search"
                type="search"
                className="input has-icon has-action"
                placeholder="Job ID, file name or user"
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
            <span className="field-label">Status</span>
            <MultiSelectField id="du-status" label="Status" options={STATUSES} value={filters.status} onChange={(value) => updateFilter("status", value)} allLabel="All statuses" searchable={false} />
          </div>
          <div className="field">
            <span className="field-label">Source</span>
            <MultiSelectField id="du-source-filter" label="Source" options={SOURCES} value={filters.source} onChange={(value) => updateFilter("source", value)} allLabel="All sources" searchable={false} />
          </div>
          <div className="du-archived-toggle">
            <SwitchField
              checked={showArchived}
              onChange={(value) => {
                setShowArchived(value);
                setSelectedIds([]);
                setPage(1);
              }}
            >
              Show archived{archivedCount > 0 ? ` (${archivedCount})` : ""}
            </SwitchField>
          </div>
        </div>

        {chipGroups.some((group) => group.values.length > 0) && (
          <AppliedFilters groups={chipGroups} onRemove={removeFilterValue} onClear={() => updateFilters(DEFAULT_FILTERS)} />
        )}

        <p className="sr-only" aria-live="polite">
          {refreshing ? "Refreshing processing history" : `${pluralize(filtered.length, "job")} found`}
        </p>

        {selectedJobs.length > 0 && (
          <div className="du-bulk" role="region" aria-label="Bulk actions">
            <div className="du-bulk-info">
              <strong>{pluralize(selectedJobs.length, "job")} selected</strong>
              <button type="button" className="du-link" onClick={() => setSelectedIds([])}>
                Clear selection
              </button>
            </div>
            <div className="du-bulk-actions">
              {restorable.length > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRestore(restorable)}>
                  <ArchiveRestore size={15} aria-hidden="true" />
                  {restorable.length === selectedJobs.length ? "Restore selected" : `Restore ${restorable.length} selected`}
                </button>
              )}
              {archivable.length > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setArchiving(archivable)}>
                  <Archive size={15} aria-hidden="true" />
                  {archivable.length === selectedJobs.length ? "Archive selected" : `Archive ${archivable.length} selected`}
                </button>
              )}
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <label className="checkbox-row du-mobile-select">
            <IndeterminateCheckbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
            <span>Select all on this page</span>
          </label>
        )}

        <div className="du-table-wrap">
          <table className="du-table">
            <thead>
              <tr>
                <th className="cell-check">
                  <IndeterminateCheckbox
                    aria-label="Select all jobs on this page"
                    checked={allSelected}
                    indeterminate={someSelected}
                    disabled={rows.length === 0}
                    onChange={toggleAll}
                  />
                </th>
                {COLUMNS.map((column) => (
                  <SortHeader key={column.key} column={column} sort={sort} onSort={toggleSort} />
                ))}
                <th className="cell-actions">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="du-empty-row">
                  <td colSpan={COLUMNS.length + 2}>
                    <div className="du-empty">
                      <span className="du-empty-icon" aria-hidden="true">
                        <SearchX size={22} />
                      </span>
                      <p className="du-empty-title">{hasFilters ? "No jobs match your filters" : "No jobs yet"}</p>
                      <p className="du-empty-text">{hasFilters ? "Try a different search term, or clear the filters." : "Imports appear here after the first upload or automated run."}</p>
                      {hasFilters && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateFilters(DEFAULT_FILTERS)}>
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className={item.archived ? "is-archived" : undefined}>
                    <td className="cell-check">
                      <input type="checkbox" aria-label={`Select ${item.id}`} checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id)} />
                    </td>
                    <td className="cell-job">
                      <span className="du-mono">{item.id}</span>
                    </td>
                    <td className="cell-file">
                      <span className="du-file-cell">{item.file}</span>
                      <span className="du-sub">
                        {item.type} · {item.duration}
                      </span>
                    </td>
                    <td className="cell-source" data-label="Source">
                      {item.source}
                    </td>
                    <td className="cell-started" data-label="Started">
                      {formatLongDate(new Date(item.started))}
                      <span className="du-sub">{item.started.slice(11)}</span>
                    </td>
                    <td className="cell-imported" data-label="Imported">
                      {item.imported.toLocaleString("en-US")}
                    </td>
                    <td className="cell-skipped" data-label="Skipped">
                      {skipped(item).toLocaleString("en-US")}
                    </td>
                    <td className="cell-status">
                      <span className="du-status-group">
                        <StatusBadge status={item.status} />
                        {item.archived && (
                          <span className="du-badge tone-neutral" title={item.archived.reason ? `Reason: ${item.archived.reason}` : undefined}>
                            Archived
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(item)} aria-label={`View ${item.id}`}>
                        <Eye size={15} aria-hidden="true" />
                        View
                      </button>
                      {!item.archived && item.status !== "Running" && (
                        <button type="button" className="icon-btn ghost" title="Archive" aria-label={`Archive ${item.id}`} onClick={() => setArchiving([item])}>
                          <Archive size={17} />
                        </button>
                      )}
                      {item.archived && (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRestore([item])} aria-label={`Restore ${item.id}`}>
                          <ArchiveRestore size={15} aria-hidden="true" />
                          Restore
                        </button>
                      )}
                      {!item.archived && item.status === "Failed" && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRetry(item)}>
                          <RotateCcw size={15} aria-hidden="true" />
                          Retry
                        </button>
                      )}
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
      </section>

      {archiving && (
        <ConfirmModal
          title={archiving.length === 1 ? `Archive ${archiving[0].id}?` : `Archive ${archiving.length} jobs?`}
          message="Archived jobs are hidden from the list but kept with their history. You can restore them at any time with Show archived."
          note="Archiving hides the job record only. Rows it imported stay in the dashboards."
          icon={<Archive size={20} />}
          confirmLabel="Archive"
          withReason
          onConfirm={handleArchive}
          onClose={() => setArchiving(null)}
        />
      )}

      {selected && <JobDetails item={jobs.find((item) => item.id === selected.id) || selected} onClose={() => setSelected(null)} />}
    </UploadShell>
  );
}

export default ProcessingHistory;
