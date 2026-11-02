import React, { useRef, useState } from 'react';
import { downloadReportPdf } from '../utils/exportFiles';

// Snapshot the selected data at click time, before loading the PDF engine/fonts.
// Never substitute a print dialog or an HTML download when PDF creation fails.
export default function ExportPdfButton({ getReport, disabled = false, children = 'Export PDF', ...props }) {
  const [busy, setBusy] = useState(false);
  const exporting = useRef(false);
  const handleExport = async () => {
    if (exporting.current) return;
    exporting.current = true;
    setBusy(true);
    try {
      const report = getReport();
      await downloadReportPdf(report);
    } catch {
      window.alert('The PDF could not be created. Please try again. Your records have not been changed.');
    } finally { exporting.current = false; setBusy(false); }
  };
  return <button {...props} type="button" disabled={disabled || busy} aria-busy={busy} onClick={handleExport}>
    {busy ? 'Preparing PDF…' : children}
  </button>;
}
