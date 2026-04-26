import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel<T extends Record<string, any>>(rows: T[], filename = "export.xlsx", sheetName = "Dados") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportToPDF<T extends Record<string, any>>(
  rows: T[],
  filename = "export.pdf",
  options?: { title?: string; columns?: { header: string; key: keyof T }[] },
) {
  const doc = new jsPDF({ orientation: "landscape" });
  if (options?.title) {
    doc.setFontSize(14);
    doc.text(options.title, 14, 16);
  }
  const cols = options?.columns ?? Object.keys(rows[0] ?? {}).map((k) => ({ header: k, key: k as keyof T }));
  autoTable(doc, {
    startY: options?.title ? 22 : 14,
    head: [cols.map((c) => c.header)],
    body: rows.map((r) => cols.map((c) => String(r[c.key] ?? ""))),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [38, 38, 50], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });
  doc.save(filename);
}
