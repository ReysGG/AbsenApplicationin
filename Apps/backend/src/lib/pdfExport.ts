/**
 * pdfExport.ts — Generate a PDF buffer from attendance report data using pdfkit.
 *
 * Renders a titled document with a workspace/period header, a tabular layout of
 * the report rows, and a summary footer with the total row count.
 *
 * Mirrors the ReportRow shape used by excelExport.ts.
 *
 * Requirements: 12.4, 12.7, 12.9
 */

import PDFDocument from 'pdfkit'
import type { ReportRow } from './excelExport'

interface PdfMeta {
  title: string
  period: string
  workspaceName?: string
}

/** Column definitions — key + Indonesian label + relative width weight. */
const COLUMNS: { key: keyof ReportRow; label: string; width: number }[] = [
  { key: 'employeeName', label: 'Nama', width: 90 },
  { key: 'employeeCode', label: 'Kode', width: 55 },
  { key: 'departmentName', label: 'Departemen', width: 75 },
  { key: 'date', label: 'Tanggal', width: 60 },
  { key: 'shiftName', label: 'Shift', width: 55 },
  { key: 'checkIn', label: 'Masuk', width: 75 },
  { key: 'checkOut', label: 'Keluar', width: 75 },
  { key: 'status', label: 'Status', width: 50 },
  { key: 'workMode', label: 'Mode', width: 40 },
  { key: 'locationName', label: 'Lokasi', width: 70 },
]

/**
 * Generate a PDF buffer for the given report rows.
 *
 * Uses pdfkit's streaming buffer pattern: collect chunks on `data`, resolve a
 * concatenated Buffer on `end`.
 */
export async function generatePDF(
  rows: ReportRow[],
  meta: PdfMeta,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 36,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // --- Header ---------------------------------------------------------
      doc.fontSize(18).font('Helvetica-Bold').text(meta.title, { align: 'left' })
      doc.moveDown(0.3)

      doc.fontSize(10).font('Helvetica')
      if (meta.workspaceName) {
        doc.text(`Workspace: ${meta.workspaceName}`)
      }
      doc.text(`Periode: ${meta.period}`)
      doc.text(`Dibuat: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`)
      doc.moveDown(0.6)

      // --- Table ----------------------------------------------------------
      const startX = doc.page.margins.left
      const usableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right
      const totalWeight = COLUMNS.reduce((sum, c) => sum + c.width, 0)
      const colWidths = COLUMNS.map((c) => (c.width / totalWeight) * usableWidth)

      const rowHeight = 18
      const cellPadding = 3

      function drawRow(
        values: string[],
        y: number,
        opts: { bold?: boolean } = {},
      ): void {
        doc
          .fontSize(8)
          .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
        let x = startX
        values.forEach((val, i) => {
          const w = colWidths[i]!
          doc.text(val, x + cellPadding, y + cellPadding, {
            width: w - cellPadding * 2,
            height: rowHeight - cellPadding,
            ellipsis: true,
            lineBreak: false,
          })
          x += w
        })
      }

      function drawSeparator(y: number): void {
        doc
          .moveTo(startX, y)
          .lineTo(startX + usableWidth, y)
          .lineWidth(0.5)
          .strokeColor('#999999')
          .stroke()
      }

      let y = doc.y

      // Header row
      drawRow(
        COLUMNS.map((c) => c.label),
        y,
        { bold: true },
      )
      y += rowHeight
      drawSeparator(y - 2)

      const bottomLimit = doc.page.height - doc.page.margins.bottom - rowHeight

      for (const row of rows) {
        if (y > bottomLimit) {
          doc.addPage()
          y = doc.page.margins.top
          drawRow(
            COLUMNS.map((c) => c.label),
            y,
            { bold: true },
          )
          y += rowHeight
          drawSeparator(y - 2)
        }
        drawRow(
          COLUMNS.map((c) => String(row[c.key] ?? '')),
          y,
        )
        y += rowHeight
      }

      // --- Footer ---------------------------------------------------------
      drawSeparator(y + 2)
      doc.moveDown(1)
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Total baris: ${rows.length}`, startX, y + 8)

      doc.end()
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}
