import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExcelColumn {
  header: string;
  accessor: string;
  width?: number;
  format?: 'number' | 'currency' | 'date' | 'text';
}

/**
 * Export data to Excel (.xlsx)
 */
export function exportToExcel({
  data,
  columns,
  sheetName = 'Laporan',
  fileName = 'laporan.xlsx',
  title,
}: {
  data: Record<string, unknown>[];
  columns: ExcelColumn[];
  sheetName?: string;
  fileName?: string;
  title?: string;
}) {
  const wb = XLSX.utils.book_new();

  // Build header row
  const headers = columns.map((c) => c.header);

  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const val = row[col.accessor];
      if (val === null || val === undefined) return '';
      if (col.format === 'currency' && typeof val === 'number') {
        return val;
      }
      if (col.format === 'number' && typeof val === 'number') {
        return val;
      }
      if (col.format === 'date' && typeof val === 'string') {
        return val;
      }
      return String(val);
    })
  );

  // Combine: title (optional) + header + data
  const wsData: (string | number)[][] = [];
  if (title) {
    wsData.push([title]);
    wsData.push([]); // empty row
  }
  wsData.push(headers as (string | number)[]);
  wsData.push(...rows);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = columns.map((col) => ({
    wch: col.width ?? Math.max(col.header.length + 4, 14),
  }));

  // Merge title cell if present
  if (title) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}

/**
 * Export data for thermal printing (58mm / 80mm receipt style)
 */
export function printThermal({
  title,
  headers,
  rows,
  footer,
  storeName,
  storeAddress,
  storePhone,
}: {
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: string[];
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Pop-up diblokir. Izinkan pop-up untuk mencetak.');
    return;
  }

  const colCount = headers.length;
  const colWidth = colCount <= 3 ? 'auto' : colCount <= 5 ? `${Math.floor(100 / colCount)}%` : `${Math.floor(100 / colCount)}%`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cetak Laporan</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 2mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      line-height: 1.4;
      color: #000;
      padding: 4px;
      max-width: 80mm;
      margin: 0 auto;
    }
    .store-name { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 2px; }
    .store-info { font-size: 9px; text-align: center; color: #333; margin-bottom: 4px; }
    .report-title { font-size: 12px; font-weight: bold; text-align: center; margin: 8px 0 4px; text-decoration: underline; }
    .date-info { font-size: 9px; text-align: center; margin-bottom: 8px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 9px; font-weight: bold; text-align: left; padding: 2px 4px; border-bottom: 1px solid #000; }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    td { font-size: 9px; padding: 2px 4px; }
    .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
    .footer { margin-top: 8px; font-size: 9px; text-align: center; }
    .footer-line { font-size: 8px; color: #666; }
    @media print {
      body { max-width: none; }
    }
  </style>
</head>
<body>
  ${storeName ? `<div class="store-name">${storeName}</div>` : ''}
  ${storeAddress || storePhone ? `<div class="store-info">${[storeAddress, storePhone ? `Telp: ${storePhone}` : ''].filter(Boolean).join(' | ')}</div>` : ''}
  ${title ? `<div class="report-title">${title}</div>` : ''}
  <div class="divider"></div>
  <table>
    <thead>
      <tr>${headers.map((h, i) => `<th class="${i >= colCount - 1 ? 'right' : ''}">${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row, ri) =>
            `<tr class="${ri === rows.length - 1 && footer ? 'total-row' : ''}">${row
              .map((cell, ci) => `<td class="${ci >= colCount - 1 ? 'right' : ''}">${cell}</td>`)
              .join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>
  <div class="divider"></div>
  ${footer ? footer.map((f) => `<div class="footer">${f}</div>`).join('') : ''}
  <div class="footer footer-line">Dicetak: ${new Date().toLocaleString('id-ID')}</div>
  <script>window.onload = () => { window.print(); window.close(); }<\/script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Format number as Rupiah text (for Excel display)
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('id-ID');
}
