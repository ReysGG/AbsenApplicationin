/**
 * excelExport.ts — Generate CSV and XLSX buffers from attendance report data.
 *
 * CSV:  semicolon-delimited with UTF-8 BOM for Indonesian Excel compatibility.
 * XLSX: real binary OOXML workbook via exceljs.
 *
 * Requirements: 12.4, 12.7, 12.9
 */

import ExcelJS from 'exceljs'

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
// XLSX generation (real OOXML workbook via exceljs)
// ---------------------------------------------------------------------------

/**
 * Generate a real .xlsx workbook buffer.
 *
 * One worksheet with a bold header row, data rows mapped from ReportRow[], and
 * auto-ish column widths derived from the longest cell in each column.
 *
 * Requirements: 12.7
 */
export async function generateXLSX(
  rows: ReportRow[],
  sheetName = 'Laporan',
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AttendX'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(sheetName)

  // Define columns from HEADERS
  worksheet.columns = HEADERS.map((h) => ({
    header: h.label,
    key: h.key as string,
  }))

  // Bold header row
  worksheet.getRow(1).font = { bold: true }

  // Data rows
  for (const row of rows) {
    const values: Record<string, string> = {}
    for (const h of HEADERS) {
      values[h.key as string] = String(row[h.key] ?? '')
    }
    worksheet.addRow(values)
  }

  // Auto-ish column widths: max of header label and any cell value, capped.
  HEADERS.forEach((h, idx) => {
    let maxLen = h.label.length
    for (const row of rows) {
      const len = String(row[h.key] ?? '').length
      if (len > maxLen) maxLen = len
    }
    worksheet.getColumn(idx + 1).width = Math.min(Math.max(maxLen + 2, 10), 50)
  })

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer as ArrayBuffer)
}
