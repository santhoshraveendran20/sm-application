const csvCell = (value) => `"${String(value).replace(/"/g, '""')}"`;

export const downloadCsv = (filename, headers, rows = []) => {
  const lines = rows.map((row) => row.map(csvCell).join(","));
  const csv = [headers.map(csvCell).join(","), ...lines].join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
