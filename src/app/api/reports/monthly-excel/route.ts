import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { monthLabel } from '@/lib/dates'

/**
 * GET /api/reports/monthly-excel?month=YYYY-MM
 *
 * Streams back an Excel-compatible spreadsheet (.xls) of all daily
 * entries for the requested month. Excel and LibreOffice open this
 * file natively. We use the HTML-table-as-xls trick so we don't need
 * the `xlsx` package — the file is a single sheet XML that Excel
 * reads without warnings.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid month. Use YYYY-MM.' }, { status: 400 })
  }

  const [y, m] = month.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || m < 1 || m > 12) {
    return NextResponse.json({ error: 'Invalid month.' }, { status: 400 })
  }

  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const rows = await db.dailyEntry.findMany({
    where: {
      entryDate: {
        gte: start.toISOString().slice(0, 10),
        lte: end.toISOString().slice(0, 10),
      },
    },
    orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
  })

  const label = monthLabel(month)
  const totalRevenue = rows.reduce((s, r) => s + r.amount, 0)
  const totalCash = rows.filter((r) => r.paymentMode === 'Cash').reduce((s, r) => s + r.amount, 0)
  const totalUPI = rows.filter((r) => r.paymentMode === 'UPI').reduce((s, r) => s + r.amount, 0)
  const totalCard = rows.filter((r) => r.paymentMode === 'Card').reduce((s, r) => s + r.amount, 0)
  const uniqueMembers = new Set(rows.filter((r) => r.memberCode).map((r) => r.memberCode)).size
  const walkIns = rows.filter((r) => !r.memberCode).length

  // Build an Excel-compatible HTML table.
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
  const thStyle =
    'background:#2D1B30;color:#fff;padding:8px 10px;font-weight:bold;border:1px solid #ccc;text-align:left;font-size:12px;'
  const tdStyle = 'padding:6px 10px;border:1px solid #ddd;font-size:11px;text-align:left;'
  const tdNumStyle = 'padding:6px 10px;border:1px solid #ddd;font-size:11px;text-align:right;'
  const tdTotalStyle =
    'padding:6px 10px;border:1px solid #ddd;font-size:11px;text-align:right;font-weight:bold;background:#FBE4E2;color:#3D1F2B;'
  const sectionStyle = 'font-size:14px;font-weight:bold;color:#2D1B30;padding:6px 0;'
  const metaStyle = 'font-size:11px;color:#666;padding:2px 0;'

  const header = `
    <tr>
      <th style="${thStyle}">#</th>
      <th style="${thStyle}">Date</th>
      <th style="${thStyle}">Member Code</th>
      <th style="${thStyle}">Member Name</th>
      <th style="${thStyle}">Phone</th>
      <th style="${thStyle}">Service</th>
      <th style="${thStyle}">Therapist</th>
      <th style="${thStyle}">Payment Mode</th>
      <th style="${thStyle}">Amount (INR)</th>
      <th style="${thStyle}">Notes</th>
    </tr>`

  const body = rows
    .map((r, i) => {
      return `
      <tr>
        <td style="${tdStyle}">${i + 1}</td>
        <td style="${tdStyle}">${esc(r.entryDate)}</td>
        <td style="${tdStyle}">${esc(r.memberCode ?? 'Walk-in')}</td>
        <td style="${tdStyle}">${esc(r.memberName)}</td>
        <td style="${tdStyle}">${esc(r.phone ?? '')}</td>
        <td style="${tdStyle}">${esc(r.serviceName)}</td>
        <td style="${tdStyle}">${esc(r.therapistName ?? '')}</td>
        <td style="${tdStyle}">${esc(r.paymentMode)}</td>
        <td style="${tdNumStyle}">${r.amount.toLocaleString('en-IN')}</td>
        <td style="${tdStyle}">${esc(r.notes ?? '')}</td>
      </tr>`
    })
    .join('')

  const totalsRow = `
    <tr>
      <td style="${tdTotalStyle}" colspan="8">TOTAL</td>
      <td style="${tdTotalStyle}">${totalRevenue.toLocaleString('en-IN')}</td>
      <td style="${tdTotalStyle}">${rows.length} entries</td>
    </tr>`

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]>
<xml>
  <x:ExcelWorkbook>
    <x:ExcelWorksheets>
      <x:ExcelWorksheet>
        <x:Name>${label}</x:Name>
        <x:WorksheetOptions>
          <x:DisplayGridlines/>
        </x:WorksheetOptions>
      </x:ExcelWorksheet>
    </x:ExcelWorksheets>
  </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  .summary-block { margin-top: 14px; padding: 10px; background: #F8F1E9; border: 1px solid #E6D9CE; border-radius: 6px; }
  .summary-block h2 { margin: 0 0 8px 0; font-size: 14px; color: #3D1F2B; }
  .summary-grid { display: table; width: 100%; margin-top: 6px; }
  .summary-cell { display: table-cell; padding: 4px 12px 4px 0; font-size: 11px; color: #333; }
  .summary-cell strong { color: #2D1B30; }
  table { border-collapse: collapse; width: 100%; }
</style>
</head>
<body>
  <div style="font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;">
    <div style="${sectionStyle}">Bella Luxe Day Spa — Monthly Daily Entries Report</div>
    <div style="${metaStyle}">Month: ${label}</div>
    <div style="${metaStyle}">Generated on: ${new Date().toLocaleString('en-GB')}</div>

    <table cellspacing="0" cellpadding="0">
      <thead>${header}</thead>
      <tbody>
        ${body || `<tr><td colspan="10" style="padding:14px;border:1px solid #ddd;text-align:center;color:#999;">No entries for this month.</td></tr>`}
        ${totalsRow}
      </tbody>
    </table>

    <div class="summary-block">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="summary-cell">Total Entries: <strong>${rows.length}</strong></div>
        <div class="summary-cell">Total Revenue: <strong>Rs. ${totalRevenue.toLocaleString('en-IN')}</strong></div>
        <div class="summary-cell">Unique Members: <strong>${uniqueMembers}</strong></div>
        <div class="summary-cell">Walk-ins: <strong>${walkIns}</strong></div>
      </div>
      <div class="summary-grid">
        <div class="summary-cell">Cash Total: <strong>Rs. ${totalCash.toLocaleString('en-IN')}</strong></div>
        <div class="summary-cell">UPI Total: <strong>Rs. ${totalUPI.toLocaleString('en-IN')}</strong></div>
        <div class="summary-cell">Card Total: <strong>Rs. ${totalCard.toLocaleString('en-IN')}</strong></div>
      </div>
    </div>

    <p style="margin-top:18px;font-size:10px;color:#999;">
      This report was auto-generated by Bella Luxe Day Spa CRM. Please review and file for accounting records.
    </p>
  </div>
</body>
</html>`

  const filename = `bella-luxe-daily-entries-${month}.xls`
  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed. Use GET.' }, { status: 405 })
}
