import { ChevronLeft, ChevronRight } from "lucide-react";
import SelectField from "../common/SelectField/SelectField.jsx";
import "./pagination.css";

const buildPages = (page, pageCount) => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push("gap-start");
  for (let value = start; value <= end; value += 1) pages.push(value);
  if (end < pageCount - 1) pages.push("gap-end");
  pages.push(pageCount);
  return pages;
};

function PaginationComponent({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50] }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="pagination">
      <p className="pagination-summary">
        Showing{" "}
        <strong>
          {start}–{end}
        </strong>{" "}
        of <strong>{total}</strong>
      </p>
      <div className="pagination-controls">
        <label className="pagination-size">
          <span>Rows per page</span>
          <SelectField className="compact" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
        </label>
        <nav className="pagination-pages" aria-label="Pagination">
          <button type="button" className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>
          {buildPages(page, pageCount).map((item) =>
            typeof item === "string" ? (
              <span key={item} className="page-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`page-num ${item === page ? "active" : ""}`}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            )
          )}
          <button type="button" className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default PaginationComponent;
