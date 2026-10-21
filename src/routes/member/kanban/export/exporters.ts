import { todayIso } from '../../equipment/helpers';
import { COLUMNS, DIFFICULTY_META, priorityLabel } from '../helpers';
import type { KanbanTask, TaskStatus } from '../types';

export interface ExportRow {
  title: string;
  status: string;
  priority: string;
  difficulty: string;
  assignee: string;
  dueDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportGroup {
  status: TaskStatus;
  label: string;
  rows: ExportRow[];
}

function dateOnly(ts: KanbanTask['createdAt']): string {
  return ts ? ts.toDate().toISOString().slice(0, 10) : '';
}

// Group tasks by column in board order, keeping each column's display order.
export function groupForExport(
  tasks: KanbanTask[],
  includeComplete: boolean,
): ExportGroup[] {
  return COLUMNS.filter((c) => includeComplete || c.status !== 'complete')
    .map((col) => ({
      status: col.status,
      label: col.label,
      rows: tasks
        .filter((t) => t.status === col.status)
        .map((t) => ({
          title: t.title,
          status: col.label,
          priority: priorityLabel(t.priority),
          difficulty: DIFFICULTY_META[t.difficulty]?.label ?? t.difficulty,
          assignee: t.assigneeName,
          dueDate: t.dueDate,
          description: t.description,
          createdAt: dateOnly(t.createdAt),
          updatedAt: dateOnly(t.updatedAt),
        })),
    }))
    .filter((g) => g.rows.length > 0);
}

const CSV_HEADERS = [
  'Title',
  'Status',
  'Priority',
  'Difficulty',
  'Assignee',
  'Due',
  'Description',
  'Created',
  'Updated',
];

// Guard against spreadsheet formula injection, then apply RFC 4180 quoting.
function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

export function toCsv(groups: ExportGroup[]): string {
  const lines = [CSV_HEADERS.map(csvCell).join(',')];
  for (const group of groups) {
    for (const r of group.rows) {
      lines.push(
        [
          r.title,
          r.status,
          r.priority,
          r.difficulty,
          r.assignee,
          r.dueDate,
          r.description,
          r.createdAt,
          r.updatedAt,
        ]
          .map(csvCell)
          .join(','),
      );
    }
  }
  return '\uFEFF' + lines.join('\r\n');
}

// Full-fidelity, re-importable snapshot.
export function toJson(groups: ExportGroup[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      columns: groups.map((g) => ({
        status: g.status,
        label: g.label,
        tasks: g.rows,
      })),
    },
    null,
    2,
  );
}

function mdInline(value: string): string {
  return value.replace(/\r?\n/g, ' ');
}

export function toMarkdown(groups: ExportGroup[]): string {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const parts = [
    '# Kanban Board',
    '',
    `Generated ${todayIso()} · ${total} tasks`,
  ];
  for (const group of groups) {
    parts.push('', `## ${group.label} (${group.rows.length})`, '');
    for (const r of group.rows) {
      const meta = [
        r.assignee && `Assignee: ${mdInline(r.assignee)}`,
        r.dueDate && `Due: ${r.dueDate}`,
        `Difficulty: ${r.difficulty}`,
      ].filter(Boolean);
      parts.push(`- **[${r.priority}] ${mdInline(r.title) || 'Untitled task'}**`);
      parts.push(`  ${meta.join(' · ')}`);
      if (r.description.trim()) {
        for (const line of r.description.trim().split(/\r?\n/)) {
          parts.push(`  > ${line}`);
        }
      }
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
  .generated { margin: 0 0 16px; color: #555; }
  h2 { margin: 18px 0 8px; font-size: 15px; break-after: avoid; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th, td { border: 1px solid #d4d4d4; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  tr { break-inside: avoid; }
  tbody tr:nth-child(even) { background: #f7f7f7; }
  .desc { white-space: pre-wrap; }
`;

const PDF_HEADERS = ['Title', 'Priority', 'Difficulty', 'Assignee', 'Due', 'Description'];

export function toPrintableHtml(groups: ExportGroup[]): string {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const headerRow = `<tr>${PDF_HEADERS.map((h) => `<th>${h}</th>`).join('')}</tr>`;
  const sections = groups
    .map((g) => {
      const body = g.rows
        .map(
          (r) =>
            `<tr><td>${escapeHtml(r.title)}</td><td>${escapeHtml(r.priority)}</td><td>${escapeHtml(r.difficulty)}</td><td>${escapeHtml(r.assignee)}</td><td>${escapeHtml(r.dueDate)}</td><td class="desc">${escapeHtml(r.description)}</td></tr>`,
        )
        .join('');
      return `<h2>${escapeHtml(g.label)} (${g.rows.length})</h2>
<table><thead>${headerRow}</thead><tbody>${body}</tbody></table>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Kanban Board</title>
<style>${PRINT_STYLE}</style>
</head>
<body>
<h1>Kanban Board</h1>
<p class="generated">Generated ${escapeHtml(todayIso())} · ${total} tasks</p>
${sections}
</body>
</html>`;
}
