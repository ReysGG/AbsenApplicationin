/**
 * excelExport.ts — Generate CSV and XLSX buffers from attendance report data.
 *
 * Pure Node.js implementation — no external library dependencies.
 *
 * CSV:  semicolon-delimited with UTF-8 BOM for Indonesian Excel compatibility.
 * XLSX: for v1, identical to CSV but with xlsx mime type (Excel opens CSVs natively).
 *
 * Requirements: 12.4, 12.7, 12.9
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportRow {
  employeeName: string
  employeeCode: string
  departmentName: string
  date: string
  shiftName: string
  checkIn: string
  checkOut: string
  status: string
  workMode: string
  locationName: string
  notes: string
}

/** Column header definitions for the report (Indonesian labels per spec) */
const HEADERS: { key: keyof ReportRow; label: string }[] = [
  { key: 'employeeName',   label: 'Nama Karyawan' },
  { key: 'employeeCode',   label: 'Kode Karyawan' },
  { key: 'departmentName', label: 'Departemen' },
  { key: 'date',           label: 'Tanggal' },
  { key: 'shiftName',      label: 'Shift' },
  { key: 'checkIn',        label: 'Check-in' },
  { key: 'checkOut',       label: 'Check-out' },
  { key: 'status',         label: 'Status' },
  { key: 'workMode',       label: 'Mode Kerja' },
  { key: 'locationName',   label: 'Lokasi' },
  { key: 'notes',          label: 'Catatan' },
]

// ---------------------------------------------------------------------------
// CSV generation
// ---------------------------------------------------------------------------

/**
 * Generate a CSV buffer (semicolon-delimited, UTF-8 BOM).
 *
 * Semicolon separator is used for Indonesian Excel compatibility.
 * Fields containing semicolons, double-quotes, or newlines are wrapped in
 * double-quotes. Internal double-quotes are escaped by doubling ("").
 *
 * Requirements: 12.7
 */
export function generateCSV(rows: ReportRow[]): Buffer {
  const SEP = ';'
  const BOM = '\uFEFF'

  /**
   * Escape a single field value per RFC-4180 with semicolon as separator.
   */
  function escapeField(value: string): string {
    const needsQuoting =
      value.includes(SEP) ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r')
    if (!needsQuoting) return value
    // Escape internal double-quotes by doubling
    return `"${value.replace(/"/g, '""')}"`
  }

  const lines: string[] = []

  // Header row
  lines.push(HEADERS.map((h) => escapeField(h.label)).join(SEP))

  // Data rows
  for (const row of rows) {
    const fields = HEADERS.map((h) => escapeField(String(row[h.key] ?? '')))
    lines.push(fields.join(SEP))
  }

  const content = BOM + lines.join('\r\n')
  return Buffer.from(content, 'utf-8')
}

// ---------------------------------------------------------------------------
// XLSX generation (v1: CSV-as-XLSX — Excel opens CSVs natively)
// ---------------------------------------------------------------------------

/**
 * Generate a minimal XLSX buffer.
 *
 * For v1, this returns the same content as generateCSV but is presented with
 * the XLSX MIME type. Excel opens semicolon-delimited CSVs natively.
 *
 * A future version can replace this with a real binary OOXML writer without
 * changing the public interface.
 *
 * Requirements: 12.7
 */
export async function generateXLSX(
  rows: ReportRow[],
  _sheetName = 'Laporan',
): Promise<Buffer> {
  return generateCSV(rows)
}
