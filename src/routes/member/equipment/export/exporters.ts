import { todayIso } from '../helpers';
import type { ExportRow, ExportSummary } from './flatten';

const CSV_HEADERS = [
  'Asset ID',
  'Name',
  'Category',
  'Group',
  'Status',
  'Total',
  'Available',
  'Checked Out',
  'In Service',
  'Holders',
  'Location',
  'Notes',
];

// Guard against spreadsheet formula injection, then apply RFC 4180 quoting.
function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

export function toCsv(rows: ExportRow[]): string {
  const lines = [CSV_HEADERS.map(csvCell).join(',')];
  for (const row of rows) {
    const cells = [
      row.assetId,
      row.name,
      row.category,
      row.groupName,
      row.status,
      String(row.quantity),
      String(row.available),
      String(row.checkedOut),
      String(row.serviceQuantity),
      row.holders.join('; '),
      row.location,
      row.notes,
    ];
    lines.push(cells.map(csvCell).join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

function mdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

// Preserve item order while collecting shared groups; ungrouped items go last.
function groupRows(rows: ExportRow[]): Array<{ name: string; rows: ExportRow[] }> {
  const groups: Array<{ name: string; rows: ExportRow[] }> = [];
  const index = new Map<string, number>();
  const ungrouped: ExportRow[] = [];
  for (const row of rows) {
    if (!row.groupName) {
      ungrouped.push(row);
      continue;
    }
    const existing = index.get(row.groupName);
    if (existing === undefined) {
      index.set(row.groupName, groups.length);
      groups.push({ name: row.groupName, rows: [row] });
    } else {
      groups[existing].rows.push(row);
    }
  }
  if (ungrouped.length > 0) groups.push({ name: 'Ungrouped', rows: ungrouped });
  return groups;
}

const MD_HEADERS = [
  'Asset ID',
  'Name',
  'Category',
  'Status',
  'Total',
  'Available',
  'Checked Out',
  'In Service',
  'Holders',
  'Location',
  'Notes',
];

export function toMarkdown(rows: ExportRow[], summary: ExportSummary): string {
  const parts: string[] = [
    '# Equipment Inventory',
    '',
    `Generated ${todayIso()}`,
    '',
    `Total units ${summary.total} · Available ${summary.available} · Checked out ${summary.checkedOut} · In service ${summary.service} · Items ${summary.itemCount}`,
  ];

  const headerLine = `| ${MD_HEADERS.join(' | ')} |`;
  const dividerLine = `| ${MD_HEADERS.map(() => '---').join(' | ')} |`;

  for (const group of groupRows(rows)) {
    parts.push('', `## ${group.name}`, '', headerLine, dividerLine);
    for (const row of group.rows) {
      const cells = [
        row.assetId,
        row.name,
        row.category,
        row.status,
        String(row.quantity),
        String(row.available),
        String(row.checkedOut),
        String(row.serviceQuantity),
        row.holders.join('<br>'),
        row.location,
        row.notes,
      ];
      parts.push(`| ${cells.map(mdCell).join(' | ')} |`);
    }
  }

  return parts.join('\n') + '\n';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Notes are dropped from the PDF table to keep the 11 columns readable in
// landscape; they remain in the CSV and Markdown exports.
const PDF_HEADERS = [
  'Asset ID',
  'Name',
  'Category',
  'Status',
  'Total',
  'Available',
  'Checked Out',
  'In Service',
  'Holders',
  'Location',
];

const PRINT_STYLE = `
  * { box-sizing: border-box; }
  @page { size: landscape; margin: 12mm; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    font-size: 12px;
  }
  h1 { margin: 0 0 4px; font-size: 22px; }
  .generated { margin: 0 0 16px; color: #555; font-size: 12px; }
  .cards { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .card {
    border: 1px solid #d4d4d4;
    border-radius: 8px;
    padding: 10px 14px;
    min-width: 110px;
  }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
  .card .value { font-size: 20px; font-weight: 600; }
  h2 { margin: 18px 0 8px; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th, td { border: 1px solid #d4d4d4; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  tr { break-inside: avoid; }
  tbody tr:nth-child(even) { background: #f7f7f7; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
`;

function pdfRow(row: ExportRow): string {
  const cells = [
    `<td>${escapeHtml(row.assetId)}</td>`,
    `<td>${escapeHtml(row.name)}</td>`,
    `<td>${escapeHtml(row.category)}</td>`,
    `<td>${escapeHtml(row.status)}</td>`,
    `<td class="num">${row.quantity}</td>`,
    `<td class="num">${row.available}</td>`,
    `<td class="num">${row.checkedOut}</td>`,
    `<td class="num">${row.serviceQuantity}</td>`,
    `<td>${row.holders.map(escapeHtml).join('<br>')}</td>`,
    `<td>${escapeHtml(row.location)}</td>`,
  ];
  return `<tr>${cells.join('')}</tr>`;
}

export function toPrintableHtml(
  rows: ExportRow[],
  summary: ExportSummary,
): string {
  const cards = [
    { label: 'Total units', value: summary.total },
    { label: 'Available', value: summary.available },
    { label: 'Checked out', value: summary.checkedOut },
    { label: 'In service', value: summary.service },
    { label: 'Items', value: summary.itemCount },
  ]
    .map(
      (c) =>
        `<div class="card"><div class="label">${escapeHtml(c.label)}</div><div class="value">${c.value}</div></div>`,
    )
    .join('');

  const headerRow = `<tr>${PDF_HEADERS.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;

  const body = groupRows(rows)
    .map((group) => {
      const groupHeader = `<tr><td colspan="${PDF_HEADERS.length}"><strong>${escapeHtml(group.name)}</strong></td></tr>`;
      return groupHeader + group.rows.map(pdfRow).join('');
    })
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Equipment Inventory</title>
<style>${PRINT_STYLE}</style>
</head>
<body>
<h1>Equipment Inventory</h1>
<p class="generated">Generated ${escapeHtml(todayIso())}</p>
<div class="cards">${cards}</div>
<table>
<thead>${headerRow}</thead>
<tbody>${body}</tbody>
</table>
</body>
</html>`;
}
