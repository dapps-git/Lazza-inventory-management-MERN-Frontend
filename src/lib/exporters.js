// Excel and PDF export for any { columns, rows, totals } table.
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const cellValue = (col, v, forPdf) => {
  if (v === null || v === undefined || v === '') return '';
  if (col.type === 'date') return new Date(v).toLocaleDateString('en-IN');
  if (col.type === 'money') return forPdf ? `Rs ${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : Number(v);
  if (col.type === 'number') return forPdf ? Number(v).toLocaleString('en-IN') : Number(v);
  return String(v);
};

const totalsRow = (columns, totals, forPdf) =>
  totals && Object.keys(totals).length
    ? columns.map((c, i) => (i === 0 ? 'TOTAL' : totals[c.key] !== undefined ? cellValue(c, totals[c.key], forPdf) : ''))
    : null;

export function exportExcel({ title, subtitle, columns, rows, totals }) {
  const body = rows.map((r) => columns.map((c) => cellValue(c, r[c.key], false)));
  const t = totalsRow(columns, totals, false);
  const aoa = [[title], subtitle ? [subtitle] : [], [], columns.map((c) => c.label), ...body, ...(t ? [t] : [])];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(12, c.label.length + 4) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${title.replace(/[^\w]+/g, '_')}.xlsx`);
}

export function exportPdf({ title, subtitle, columns, rows, totals }) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.setTextColor(76, 29, 149);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(100);
  if (subtitle) doc.text(subtitle, 14, 22);
  const t = totalsRow(columns, totals, true);
  autoTable(doc, {
    startY: subtitle ? 27 : 22,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) => columns.map((c) => cellValue(c, r[c.key], true))),
    foot: t ? [t] : undefined,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [76, 29, 149] },
    footStyles: { fillColor: [237, 233, 254], textColor: [46, 16, 101], fontStyle: 'bold' },
    columnStyles: Object.fromEntries(
      columns.map((c, i) => [i, c.type === 'money' || c.type === 'number' ? { halign: 'right' } : {}])
    ),
  });
  doc.save(`${title.replace(/[^\w]+/g, '_')}.pdf`);
}
