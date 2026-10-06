// Shared status computation helper used by both the seed script
// and the server actions so the membership status is always derived
// deterministically from the endDate.

export type MemberStatus = 'Active' | 'Expiring Soon' | 'Expired'

export function computeStatus(endDate: string): MemberStatus {
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays < 0) return 'Expired'
  if (diffDays <= 30) return 'Expiring Soon'
  return 'Active'
}
