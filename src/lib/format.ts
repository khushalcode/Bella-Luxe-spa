// Shared client-side formatting helpers + avatar palette.

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  // Date-only strings (YYYY-MM-DD) are formatted from their parts so the
  // result never shifts with the viewer's timezone.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (m) return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return iso
  }
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const h = d.getHours()
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${pad2(h12)}:${pad2(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'}`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const avatarPalette = [
  { bg: '#F5D9DC', fg: '#B8456A' },
  { bg: '#DDF3E8', fg: '#2E9E6E' },
  { bg: '#FCE8CF', fg: '#E08A2E' },
  { bg: '#E8E2DC', fg: '#7A6E66' },
  { bg: '#FBDDE0', fg: '#D9364B' },
  { bg: '#EFE3F4', fg: '#8B5CA6' },
]

export function colorForName(name: string) {
  const idx =
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    avatarPalette.length
  return avatarPalette[idx]
}

export function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
