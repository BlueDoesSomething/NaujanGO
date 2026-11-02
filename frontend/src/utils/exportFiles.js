// Explicit columns keep exports stable and avoid dumping private API fields.
export const escapeExportHtml = value => String(value ?? '').replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export const exportFilename = (title, extension) => {
  const stem = String(title || 'export').normalize('NFKC').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .slice(0, 100).replace(/[. ]+$/g, '') || 'export';
  return `${/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(stem) ? `export-${stem}` : stem}.${extension}`;
};

export const csvCell = value => {
  let text = value == null ? '' : String(value).replace(/\u0000/g, '');
  // Quoting alone does not prevent spreadsheet formula execution. Numbers
  // remain numeric; untrusted text beginning with formula/control markers is
  // deliberately prefixed with an apostrophe for safe spreadsheet opening.
  if (typeof value !== 'number' && /^[\s\uFEFF]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const reportCsv = ({ columns, rows }) => {
  if (!Array.isArray(columns) || !columns.length || !Array.isArray(rows)) throw new Error('Invalid export report');
  return '\uFEFF' + [columns.map(column => csvCell(column.label)).join(','),
    ...rows.map(row => columns.map(column => csvCell(row[column.key])).join(','))].join('\r\n') + '\r\n';
};

export const downloadExportFile = (content, filename, mime, doc = document) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = doc.createElement('a');
  link.href = url; link.download = filename;
  doc.body.appendChild(link);
  try { link.click(); } finally {
    link.remove();
    // Do not revoke in the same tick as click: Safari may not have read it yet.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export const downloadReportCsv = report => downloadExportFile(reportCsv(report),
  exportFilename(report.filename || report.title, 'csv'), 'text/csv;charset=utf-8');

const tableHtml = report => {
  const columns = report.printColumns || report.columns;
  return `<section><h2>${escapeExportHtml(report.title)}</h2>
    ${report.notes ? `<p class="note">${escapeExportHtml(report.notes)}</p>` : ''}
    <table><colgroup>${columns.map(column => `<col${Number.isFinite(column.width) && column.width > 0 && column.width <= 100 ? ` style="width:${column.width}%"` : ''}>`).join('')}</colgroup>
    <thead><tr>${columns.map(column => `<th scope="col">${escapeExportHtml(column.label)}</th>`).join('')}</tr></thead>
    <tbody>${report.rows.length ? report.rows.map(row => `<tr>${columns.map(column => `<td>${escapeExportHtml(row[column.key])}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columns.length}">No records in this selection.</td></tr>`}</tbody></table></section>`;
};

export const printableReportHtml = (report, generatedAt = new Date()) => {
  const sections = report.sections || [report];
  const landscape = report.landscape ?? sections.some(section => (section.printColumns || section.columns).length > 7);
  const generated = generatedAt.toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
    <title>${escapeExportHtml(report.title)} — NaujanGO</title><style>
    @page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 14mm; }
    * { box-sizing: border-box; } body { margin: 0; color: #17251d; background: white; font: 10pt/1.45 Arial, sans-serif; }
    header { border-bottom: 2px solid #166534; padding-bottom: 10px; margin-bottom: 16px; }
    .brand { color: #166534; font-size: 12pt; font-weight: bold; } h1 { margin: 4px 0; font-size: 20pt; }
    h2 { margin: 18px 0 8px; font-size: 13pt; break-after: avoid; } p { white-space: pre-wrap; overflow-wrap: anywhere; }
    .note, footer { color: #475569; font-size: 9pt; } .summary { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 6px 20px; }
    .summary div { overflow-wrap: anywhere; } table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { text-align: left; vertical-align: top; border: 1px solid #cbd5e1; padding: 6px; overflow-wrap: anywhere; white-space: pre-wrap; }
    th { background: #edf5ef; color: #164b29; font-weight: bold; } thead { display: table-header-group; }
    tr { break-inside: avoid; } footer { border-top: 1px solid #cbd5e1; margin-top: 18px; padding-top: 8px; }
    @media screen { body { max-width: ${landscape ? '1100' : '800'}px; margin: 24px auto; padding: 16px; } }
    @media print { body { width: 100%; } th { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style></head><body><header><div class="brand">NaujanGO</div><h1>${escapeExportHtml(report.title)}</h1>
    ${report.subtitle ? `<p>${escapeExportHtml(report.subtitle)}</p>` : ''}
    <div class="summary">${(report.summary || []).map(([label, value]) => `<div><strong>${escapeExportHtml(label)}:</strong> ${escapeExportHtml(value)}</div>`).join('')}</div></header>
    ${sections.map(tableHtml).join('')}<footer>Generated ${escapeExportHtml(generated)} PHT. ${escapeExportHtml(report.footer || 'Snapshot of the selected data. Printing or exporting does not change stored records.')}</footer></body></html>`;
};

// Print an isolated, text/table-only document rather than the application UI.
// No maps, navigation, chat widgets, buttons, credentials or third-party assets.
export const printReport = report => new Promise((resolve, reject) => {
  const frame = document.createElement('iframe');
  frame.title = `Print ${report.title}`; frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('sandbox', 'allow-same-origin allow-modals');
  Object.assign(frame.style, { position: 'fixed', width: '0', height: '0', border: '0', bottom: '0', right: '0' });
  let timer;
  const cleanup = () => { clearTimeout(timer); frame.remove(); };
  const fail = () => { cleanup(); reject(new Error('The print document could not be loaded')); };
  frame.onerror = fail;
  frame.onload = () => {
    clearTimeout(timer);
    try {
      frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
      timer = setTimeout(cleanup, 180000);
      frame.contentWindow.focus(); frame.contentWindow.print(); resolve(true);
    } catch (error) { cleanup(); reject(error); }
  };
  frame.srcdoc = printableReportHtml(report);
  timer = setTimeout(fail, 15000);
  document.body.appendChild(frame);
});

export const printReportWithFeedback = report => printReport(report).catch(() => {
  window.alert('Printing is unavailable in this browser. You can still export the CSV file.');
});

export const shareSavedTrip = async ({ id, name, origin = window.location.origin, nav = navigator }) => {
  if (!id) return 'unsaved';
  const url = new URL(`/itinerary/${encodeURIComponent(id)}`, origin).toString();
  if (nav.share) {
    try { await nav.share({ title: name || 'NaujanGO itinerary', text: 'Saved itinerary link; existing access permissions still apply.', url }); return 'shared'; }
    catch (error) { if (error.name === 'AbortError') return 'cancelled'; }
  }
  if (!nav.clipboard?.writeText) return 'unavailable';
  await nav.clipboard.writeText(url);
  return 'copied';
};
